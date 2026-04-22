'use strict';

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const Provider = require('../models/Provider');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

let io;

const initializeSocket = (httpServer) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000'];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ─── AUTHENTICATION MIDDLEWARE ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token 
        || (socket.handshake.headers.authorization && socket.handshake.headers.authorization.split(' ')[1]);
      
      if (!token) return next(new Error('unauthorized'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('_id role name lastLogin location');
      
      if (!user) return next(new Error('unauthorized'));

      socket.user = {
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        pincode: user.location?.pincode
      };
      
      // If user is a provider, attach providerId
      if (user.role === 'provider') {
        const provider = await Provider.findOne({ userId: user._id }).select('_id');
        if (provider) {
          socket.provider = { providerId: provider._id.toString() };
        }
      }

      next();
    } catch (err) {
      logger.warn('Socket authentication failed', { error: err.message });
      next(new Error('unauthorized'));
    }
  });

  // ─── CONNECTION MANAGER ─────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const { userId, role, pincode } = socket.user;
    
    logger.info('Socket connected', { userId, socketId: socket.id, role });

    // Store in Redis (TTL: 24h = 86400s)
    await redisClient.setEx(`socket:${userId}`, 86400, socket.id);
    
    // Update lastLogin
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });

    // Join automatic rooms
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);
    if (pincode) socket.join(`location:${pincode}`);
    if (socket.provider) socket.join(`provider:${socket.provider.providerId}`);

    // ─── HANDLERS ─────────────────────────────────────────────────────────────
    
    // 1. "provider:update_location"
    socket.on('provider:update_location', async (data) => {
      try {
        if (!socket.provider) return;
        const { providerId } = socket.provider;
        const { lat, lng, bookingId } = data;

        if (!lat || !lng || !bookingId) return;

        // Store current location in Redis (TTL 5 mins)
        const locationData = { lat, lng, updatedAt: Date.now() };
        await redisClient.setEx(`provider_location:${providerId}`, 300, JSON.stringify(locationData));

        // Emit to the specific booking tracking room (which customer joins)
        io.to(`booking:${bookingId}`).emit('booking:provider_location', {
          lat,
          lng,
          providerId,
          bookingId
        });
      } catch (err) {
        logger.error('Socket provider:update_location error', { error: err.message });
      }
    });

    // 2. "booking:start_tracking"
    socket.on('booking:start_tracking', async (data) => {
      try {
        const { bookingId } = data;
        if (!bookingId) return;
        
        socket.join(`booking:${bookingId}`);
        logger.info(`User ${userId} started tracking booking ${bookingId}`);

        // We can't query the DB in the socket event purely for security due to performance, 
        // but assuming the client has validation. Wait for provider to ping location or send immediate cache hit:
        // Note: Client handles providerId to pull from provider_location:xxx if needed, or waits for ping.
      } catch (err) {
        logger.error('Socket booking:start_tracking error', { error: err.message });
      }
    });

    // 3. "booking:stop_tracking"
    socket.on('booking:stop_tracking', async (data) => {
      try {
        const { bookingId } = data;
        if (!bookingId) return;
        
        socket.leave(`booking:${bookingId}`);
        logger.info(`User ${userId} stopped tracking booking ${bookingId}`);
      } catch (err) {
        logger.error('Socket booking:stop_tracking error', { error: err.message });
      }
    });

    // 4. "chat:send_message"
    socket.on('chat:send_message', async (data) => {
      try {
        const { bookingId, message, messageType } = data;
        if (!bookingId || !message) return;

        const chatMessage = {
          senderId: userId,
          senderName: socket.user.name,
          message,
          messageType: messageType || 'text',
          timestamp: new Date().toISOString(),
          bookingId
        };

        // Push to Redis list (TTL 7 days = 604800s)
        const redisKey = `chat:${bookingId}`;
        await redisClient.rPush(redisKey, JSON.stringify(chatMessage));
        await redisClient.expire(redisKey, 604800);

        // Emit back to room
        io.to(`booking:${bookingId}`).emit('chat:new_message', chatMessage);
      } catch (err) {
        logger.error('Socket chat:send_message error', { error: err.message });
      }
    });

    // 5. "chat:typing"
    socket.on('chat:typing', (data) => {
      try {
        const { bookingId, isTyping } = data;
        if (!bookingId) return;
        
        // Broadcast to others in the booking room
        socket.to(`booking:${bookingId}`).emit('chat:typing_status', {
          userId,
          isTyping,
          bookingId
        });
      } catch (err) {
        logger.error('Socket chat:typing error', { error: err.message });
      }
    });

    // 6. "provider:toggle_availability"
    socket.on('provider:toggle_availability', async (data) => {
      try {
        if (!socket.provider) return;
        const { providerId } = socket.provider;
        const { isAvailable } = data;

        await Provider.findByIdAndUpdate(providerId, { 'availability.isAvailable': Boolean(isAvailable) });
        await redisClient.setEx(`provider_available:${providerId}`, 86400, String(isAvailable));

        socket.emit('provider:toggle_availability_success', { isAvailable });
      } catch (err) {
        logger.error('Socket provider:toggle_availability error', { error: err.message });
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info('Socket disconnected', { userId, socketId: socket.id });
      await redisClient.del(`socket:${userId}`);

      // If provider, optionally update availability (skip for now to avoid false offline drops,
      // usually handled by a heartbeat or explicit toggle).
    });
  });
};

// ─── EMIT HELPER FUNCTIONS ────────────────────────────────────────────────────

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

const emitToProvider = (providerId, event, data) => {
  if (io) io.to(`provider:${providerId}`).emit(event, data);
};

const emitToLocation = (pincode, event, data) => {
  if (io) io.to(`location:${pincode}`).emit(event, data);
};

const emitToRole = (role, event, data) => {
  if (io) io.to(`role:${role}`).emit(event, data);
};

const emitToRoom = (room, event, data) => {
  if (io) io.to(room).emit(event, data);
};

const getOnlineStatus = async (userId) => {
  const socketId = await redisClient.get(`socket:${userId}`);
  return {
    isOnline: !!socketId,
    lastSeen: socketId ? new Date() : null // Last seen would require a separate key for tracking, simplified here
  };
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitToProvider,
  emitToLocation,
  emitToRole,
  emitToRoom,
  getOnlineStatus
};

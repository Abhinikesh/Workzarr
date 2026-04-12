const Redis = require('ioredis');

const redisURI = process.env.REDIS_URI || 'redis://localhost:6379';

const redisClient = new Redis(redisURI, {
  retryStrategy(times) {
    // Retry connection logic
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('end', () => {
  console.log('Redis Client Disconnected');
});

module.exports = redisClient;

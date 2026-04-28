const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  },
  history: [{
    value: mongoose.Schema.Types.Mixed,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Methods
settingsSchema.statics.getConfig = async function(key = 'platform_config') {
  let config = await this.findOne({ key });
  if (!config) {
    // Default initial config
    config = await this.create({
      key,
      value: {
        commission: { default: 0.10, premium: 0.08, newProvider: 0.05 },
        subscription: { premiumMonthly: 499, premiumQuarterly: 1299, premiumYearly: 4799 },
        payout: { minimumAmount: 100, processingDays: 1, maxPerDay: 1 },
        booking: { maxRadius: 50, defaultRadius: 10, cancellationWindow: 30, noShowTimeout: 120 },
        app: { maintenanceMode: false, maintenanceMessage: "", androidVersion: "1.0.0", iosVersion: "1.0.0", forceUpdate: false }
      }
    });
  }
  return config;
};

settingsSchema.statics.updateConfig = async function(updates, adminId, key = 'platform_config') {
  const config = await this.getConfig(key);
  
  // Keep last 10 history records
  const historyEntry = {
    value: config.value,
    updatedBy: config.updatedBy,
    updatedAt: config.updatedAt
  };
  
  config.history.unshift(historyEntry);
  if (config.history.length > 10) {
    config.history.pop();
  }
  
  // Deep merge updates
  const deepMerge = (target, source) => {
    for (const k in source) {
      if (source[k] instanceof Object && !Array.isArray(source[k])) {
        if (!target[k]) Object.assign(target, { [k]: {} });
        deepMerge(target[k], source[k]);
      } else {
        target[k] = source[k];
      }
    }
  };
  
  const newValue = JSON.parse(JSON.stringify(config.value));
  deepMerge(newValue, updates);
  
  config.value = newValue;
  config.updatedBy = adminId;
  config.version += 1;
  config.markModified('value');
  
  await config.save();
  return config;
};

module.exports = mongoose.model('Settings', settingsSchema);

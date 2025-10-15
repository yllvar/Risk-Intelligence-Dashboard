const axios = require('axios');
const { DateTime } = require('luxon');
const { db } = require('./db');

const DUNE_API_KEY = process.env.DUNE_API_KEY || 'QDnHUtIaEHaUjckNAVenmtshMJUtEWsZ';
const BASE_URL = 'https://api.dune.com/api/v1';
const REFRESH_INTERVALS = {
  health: 12 * 3600 * 1000, // 12 hours
  prices: 4 * 3600 * 1000,  // 4 hours
  whales: 24 * 3600 * 1000  // Daily
};

// Free public query IDs
const QUERY_IDS = {
  health: 3899,  // Ethereum TVL
  prices: 3900,  // ETH price
  whales: 3901   // Whale movements
};

class DuneClient {
  constructor() {
    this.rateLimit = {
      remaining: 60,
      resetAt: DateTime.now()
    };
  }

  async executeQuery(queryId, parameters = {}) {
    const url = `${BASE_URL}/query/${queryId}/execute`;
    
    try {
      const response = await axios.post(url, parameters, {
        headers: { 'X-Dune-API-Key': DUNE_API_KEY }
      });
      
      this.updateRateLimit(response.headers);
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 5;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.executeQuery(queryId, parameters);
      }
      throw error;
    }
  }

  async duneQuery(queryId, params = {}) {
    const url = `https://api.dune.com/api/v1/query/${queryId}/results`;
    try {
      const response = await axios.get(url, {
        headers: { 'X-Dune-API-Key': DUNE_API_KEY },
        params
      });
      return response.data;
    } catch (error) {
      console.error('Dune API error:', error);
      throw error;
    }
  }

  async cacheData(data) {
    const validateData = (data) => {
      const required = ['tvl', 'liquidity_depth', 'last_updated'];
      if (!required.every(field => data[field])) {
        throw new Error('Incomplete data from Dune');
      }
      
      const ageHours = DateTime.now().diff(
        DateTime.fromISO(data.last_updated), 'hours'
      ).hours;
      
      return ageHours <= 24;
    };

    if (!validateData(data)) {
      throw new Error('Invalid data, not cached');
    }
    
    const now = DateTime.now().toISO();
    db.run(
      `INSERT OR REPLACE INTO protocol_data VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.protocol,
        data.tvl,
        data.liquidity_depth,
        data.treasury_balance,
        data.price_volatility,
        JSON.stringify(data.whale_activity),
        now,
        0
      ]
    );
  }

  async getCachedData(protocol) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM protocol_data WHERE protocol = ?',
        [protocol],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async refreshHealthData() {
    try {
      const [health, prices, whales] = await Promise.all([
        this.duneQuery(123456),
        this.duneQuery(123457),
        this.duneQuery(123458)
      ]);
      
      const combined = {
        ...health,
        price_volatility: prices['7d_volatility'], 
        whale_activity: whales,
        last_updated: DateTime.now().toISO()
      };
      
      await this.cacheData(combined);
    } catch (error) {
      console.error('Refresh failed:', error);
      // Mark existing data as stale
      db.run('UPDATE protocol_data SET stale = 1');
    }
  }

  async getProtocolData(protocol) {
    try {
      // First try to get cached data
      const cached = await this.getCachedData(protocol);
      
      if (!cached) {
        throw new Error('No cached data available');
      }

      // Parse whale_activity if it exists
      const whaleActivity = cached.whale_activity 
        ? typeof cached.whale_activity === 'string' 
          ? JSON.parse(cached.whale_activity) 
          : cached.whale_activity
        : [];

      return {
        tvl: cached.tvl || 0,
        liquidity_depth: cached.liquidity_depth || 0,
        price_volatility: cached.price_volatility || 0,
        whale_activity: whaleActivity,
        last_updated: cached.last_updated || DateTime.now().toISO(),
        stale: false
      };
    } catch (error) {
      console.warn('Using fallback data:', error.message);
      return {
        tvl: 0,
        liquidity_depth: 0,
        price_volatility: 0,
        whale_activity: [],
        last_updated: DateTime.now().toISO(),
        stale: true
      };
    }
  }

  updateRateLimit(headers) {
    this.rateLimit = {
      remaining: parseInt(headers['x-ratelimit-remaining']),
      resetAt: DateTime.fromHTTP(headers['x-ratelimit-reset'])
    };
  }
}

module.exports = new DuneClient();

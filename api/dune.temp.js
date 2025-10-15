const axios = require('axios');
const { DateTime } = require('luxon');
const { db } = require('./db');

// Free public query IDs
const QUERY_IDS = {
  health: 3899,  // Ethereum TVL
  prices: 3900,  // ETH price
  whales: 3901   // Whale movements
};

const DUNE_API_KEY = process.env.DUNE_API_KEY;
const BASE_URL = 'https://api.dune.com/api/v1';

class DuneClient {
  async getProtocolData(protocol) {
    try {
      // Try with free queries first
      const [health, prices] = await Promise.all([
        this.duneQuery(QUERY_IDS.health),
        this.duneQuery(QUERY_IDS.prices)
      ]);
      
      return {
        tvl: health.tvl,
        liquidity_depth: health.liquidity,
        price_volatility: prices.volatility,
        last_updated: DateTime.now().toISO()
      };
    } catch (error) {
      console.warn('Using cached data due to API failure');
      const cached = await this.getCachedData(protocol);
      return { ...cached, stale: true };
    }
  }
  
  async duneQuery(queryId, params = {}) {
    const url = `${BASE_URL}/query/${queryId}/results`;
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
}

module.exports = new DuneClient();

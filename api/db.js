const sqlite3 = require('sqlite3').verbose();
const { DateTime } = require('luxon');

const db = new sqlite3.Database('./risk-data.db', (err) => {
  if (err) console.error('Database opening error:', err);
});

// Initialize schema
const initDb = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS protocol_data (
      protocol TEXT PRIMARY KEY,
      tvl REAL,
      liquidity_depth REAL,
      treasury_balance REAL,
      price_volatility REAL,
      whale_activity TEXT,
      last_updated TEXT,
      stale BOOLEAN DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS risk_metrics (
      protocol TEXT PRIMARY KEY,
      tvl_volatility REAL,
      liquidity_gini REAL,
      treasury_stablecoin_ratio REAL,
      dependence REAL,
      composite_r_score REAL,
      last_updated TEXT
    )`);
  });
};

const CACHE_TTL_HOURS = 12;

async function getCachedData(protocol) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT tvl, liquidity_depth, treasury_balance, price_volatility, whale_activity, last_updated FROM protocol_data WHERE protocol = ?', 
      [protocol],
      (err, row) => {
        if (err) return reject(err);
        
        if (!row || DateTime.fromISO(row.last_updated).diffNow('hours').hours > CACHE_TTL_HOURS) {
          return resolve(null);
        }
        
        resolve({
          tvl: row.tvl,
          liquidity_depth: row.liquidity_depth,
          treasury_balance: row.treasury_balance,
          price_volatility: row.price_volatility,
          whale_activity: row.whale_activity ? JSON.parse(row.whale_activity) : []
        });
      }
    );
  });
}

async function getRiskMetrics(protocol) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT tvl_volatility, liquidity_gini, treasury_stablecoin_ratio, dependence, composite_r_score, last_updated FROM risk_metrics WHERE protocol = ?',
      [protocol],
      (err, row) => {
        if (err) return reject(err);

        if (!row || !row.last_updated || DateTime.fromISO(row.last_updated).diffNow('hours').hours > CACHE_TTL_HOURS) {
          return resolve(null);
        }

        resolve({
          tvl_volatility: row.tvl_volatility,
          liquidity_gini: row.liquidity_gini,
          treasury_stablecoin_ratio: row.treasury_stablecoin_ratio,
          dependence: row.dependence,
          composite_r_score: row.composite_r_score,
          last_updated: row.last_updated
        });
      }
    );
  });
}

async function cacheData(protocol, data) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO protocol_data (protocol, tvl, liquidity_depth, treasury_balance, price_volatility, whale_activity, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [protocol, data.tvl, data.liquidity_depth, data.treasury_balance, data.price_volatility, JSON.stringify(data.whale_activity), DateTime.now().toISO()],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

async function cacheRiskMetrics(protocol, metrics) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO risk_metrics (protocol, tvl_volatility, liquidity_gini, treasury_stablecoin_ratio, dependence, composite_r_score, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        protocol,
        metrics.tvl_volatility,
        metrics.liquidity_gini,
        metrics.treasury_stablecoin_ratio,
        metrics.dependence,
        metrics.composite_r_score,
        DateTime.now().toISO()
      ],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

async function insertSampleData() {
  const sampleData = {
    protocol: 'ethereum',
    tvl: 45000000000,
    liquidity_depth: 1200000000,
    treasury_balance: 350000000,
    price_volatility: 0.045,
    whale_activity: [
      { address: '0x123...', value: 2500, token: 'ETH' },
      { address: '0x456...', value: 1800, token: 'ETH' }
    ],
    last_updated: DateTime.now().toISO()
  };
  
  await cacheData(sampleData.protocol, sampleData);

  const sampleMetrics = {
    tvl_volatility: 0.12,
    liquidity_gini: 0.58,
    treasury_stablecoin_ratio: 0.64,
    dependence: 0.42,
    composite_r_score: 0.58,
    last_updated: DateTime.now().toISO()
  };

  await cacheRiskMetrics(sampleData.protocol, sampleMetrics);
}

module.exports = { db, initDb, getCachedData, getRiskMetrics, cacheData, cacheRiskMetrics, insertSampleData };

const sqlite3 = require('sqlite3').verbose();
const { DateTime } = require('luxon');

const db = new sqlite3.Database('./risk-data.db', (err) => {
  if (err) console.error('Database opening error:', err);
});

// Initialize schema
const initDb = () => {
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
          whale_activity: row.whale_activity
        });
      }
    );
  });
}

async function cacheData(protocol, data) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO protocol_data (protocol, tvl, liquidity_depth, treasury_balance, price_volatility, whale_activity, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [protocol, data.tvl, data.liquidity_depth, data.treasury_balance, data.price_volatility, data.whale_activity, DateTime.now().toISO()],
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
    whale_activity: JSON.stringify([
      { address: '0x123...', value: 2500, token: 'ETH' },
      { address: '0x456...', value: 1800, token: 'ETH' }
    ]),
    last_updated: DateTime.now().toISO()
  };
  
  await cacheData(sampleData.protocol, sampleData);
}

module.exports = { db, initDb, getCachedData, cacheData, insertSampleData };

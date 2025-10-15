const express = require('express');
const dune = require('./dune');
const { getCachedData, cacheData, initDb } = require('./db');

const app = express();
const PORT = 3001;

// Initialize database
initDb();

// Top 5 DeFi protocols
const PROTOCOLS = ['aave', 'uniswap', 'curve', 'compound', 'makerdao'];

// Risk metric calculations
const calculateRiskMetrics = (rawData) => {
  return {
    liquidityRisk: rawData.tvl_concentration,
    marketRisk: rawData.price_volatility,
    treasuryHealth: rawData.treasury_trend
  };
};

// Schedule refreshes
setInterval(() => {
  PROTOCOLS.forEach(protocol => {
    getCachedData(protocol).then(data => {
      if (!data || new Date().getTime() - new Date(data.lastUpdated).getTime() > 4 * 3600 * 1000) {
        Promise.all([
          dune.executeQuery(123456), // TVL & liquidity
          dune.executeQuery(123457), // Price volatility
          dune.executeQuery(123458)  // Treasury
        ]).then(queryResults => {
          const newData = {
            ...queryResults[0],
            ...queryResults[1],
            ...queryResults[2],
            lastUpdated: new Date().toISOString()
          };
          cacheData(protocol, newData);
        }).catch(console.error);
      }
    });
  });
}, 4 * 3600 * 1000); // Refresh every 4 hours

app.get('/api/risk-data', async (req, res) => {
  try {
    const protocol = req.query.protocol?.toLowerCase();
    if (!PROTOCOLS.includes(protocol)) {
      return res.status(400).json({ error: 'Invalid protocol' });
    }

    // Check cache first
    let data = await getCachedData(protocol);
    
    if (!data) {
      // Fetch from Dune if cache is stale
      const queryResults = await Promise.all([
        dune.executeQuery(123456), // TVL & liquidity
        dune.executeQuery(123457), // Price volatility
        dune.executeQuery(123458)  // Treasury
      ]);
      
      data = {
        ...queryResults[0],
        ...queryResults[1],
        ...queryResults[2],
        lastUpdated: new Date().toISOString()
      };
      
      await cacheData(protocol, data);
    }
    
    res.json({
      protocol,
      metrics: calculateRiskMetrics(data),
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch risk data' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

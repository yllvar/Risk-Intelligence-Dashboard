import { db } from './db';
import DuneClient from './dune';

const calculateGini = (values) => {
  if (!values?.length) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  if (sum === 0) return 0;
  
  let giniSum = 0;
  sorted.forEach((x, i) => {
    giniSum += x * (2 * (i + 1) - n - 1);
  });
  
  return giniSum / (n * sum);
};

export default async function handler(req, res) {
  try {
    const protocol = req.query.protocol?.toLowerCase();
    
    if (!protocol) {
      return res.status(400).json({ error: 'Protocol parameter required' });
    }

    // Try cached metrics first
    const cached = await db.getRiskMetrics(protocol);
    if (cached) {
      return res.json({
        tvl_volatility: cached.tvl_volatility,
        liquidity_gini: cached.liquidity_gini,
        treasury_stablecoin_ratio: cached.treasury_stablecoin_ratio,
        composite_r_score: calculateCompositeScore(cached),
        last_updated: cached.last_updated
      });
    }

    // Fetch fresh data if cache is stale
    const [tvlData, liquidityData, treasuryData] = await Promise.all([
      DuneClient.duneQuery(123456, { protocol }), // TVL volatility
      DuneClient.duneQuery(123457, { protocol }), // Liquidity distribution
      DuneClient.duneQuery(123458, { protocol })  // Treasury composition
    ]);

    // Calculate metrics
    const metrics = {
      tvl_volatility: tvlData?.volatility_7d || 0,
      liquidity_gini: calculateGini(liquidityData?.distribution),
      treasury_stablecoin_ratio: treasuryData?.stablecoin_ratio || 0,
      dependence: 0.25 // TODO: Implement dependence calculation
    };

    // Cache and return
    await db.cacheRiskMetrics(protocol, metrics);
    
    res.json({
      ...metrics,
      composite_r_score: calculateCompositeScore(metrics),
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Risk metrics error:', error);
    res.status(500).json({ error: 'Failed to compute risk metrics' });
  }
}

function calculateCompositeScore(metrics) {
  return (
    0.3 * metrics.tvl_volatility +
    0.25 * metrics.liquidity_gini +
    0.2 * metrics.treasury_stablecoin_ratio +
    0.25 * metrics.dependence
  );
}

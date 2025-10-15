import { useState, useEffect } from 'react';
import DataFreshnessIndicator from '../components/DataFreshnessIndicator';
import { MetricCard, RScoreCard } from '../components/MetricCard';
import VolatilityChart from '../components/VolatilityChart';
import WhaleActivityList from '../components/WhaleActivityList';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/protocol-data');
      const json = await response.json();
      console.log('API Response:', json);
      setData(json);
      cacheData(json);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      const cached = getCachedData();
      if (cached) {
        console.log('Using cached data:', cached);
        setData({ ...cached, stale: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefresh > 3600000) {
      setLastRefresh(now);
      fetchData();
    } else {
      alert('Please wait at least 1 hour between refreshes');
    }
  };

  const cacheData = (data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastData', JSON.stringify(data));
    }
  };

  const getCachedData = () => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('lastData');
      return cached ? { 
        ...JSON.parse(cached), 
        whale_activity: JSON.parse(cached.whale_activity || '[]') 
      } : null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <DataFreshnessIndicator timestamp={data?.last_updated} />
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 bg-white rounded-xl shadow-sm animate-pulse h-32"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="TVL" 
              value={data?.tvl} 
              delta={data?.tvl_change_24h}
              stale={data?.stale}
            />
            <MetricCard 
              title="Liquidity Depth" 
              value={data?.liquidity_depth}
              stale={data?.stale}
            />
            <MetricCard 
              title="Treasury" 
              value={data?.treasury_balance}
              stale={data?.stale}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VolatilityChart data={data?.price_volatility} />
          <WhaleActivityList activities={data?.whale_activity} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <RScoreCard 
            score={data?.composite_r_score} 
            stale={data?.stale} 
          />
        </div>

        <button 
          onClick={handleRefresh}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center"
          disabled={isLoading}
        >
          <svg 
            className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}

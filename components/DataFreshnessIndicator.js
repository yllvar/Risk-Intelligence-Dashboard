import { useState } from 'react';

export default function DataFreshnessIndicator({ timestamp }) {
  const [now] = useState(new Date());
  const lastUpdated = timestamp ? new Date(timestamp) : null;
  const hoursOld = lastUpdated ? Math.floor((now - lastUpdated) / 3600000) : null;

  if (!lastUpdated) return (
    <div className="p-3 rounded-lg bg-gray-100 flex items-center">
      <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
      <span>Loading latest data...</span>
    </div>
  );

  return (
    <div className={`p-3 rounded-lg flex items-center ${
      hoursOld > 24 ? 'bg-amber-100 text-amber-900' : 
      hoursOld > 6 ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'
    }`}>
      <div className={`h-2 w-2 rounded-full mr-2 ${
        hoursOld > 24 ? 'bg-amber-600' : 
        hoursOld > 6 ? 'bg-blue-600' : 'bg-green-600'
      }`}></div>
      <span className="font-medium">
        {hoursOld > 24 ? 'Data may be outdated' : 
         hoursOld > 6 ? 'Data is recent' : 'Data is fresh'}
      </span>
      <span className="mx-1">•</span>
      <span className="text-sm">
        Last updated: {lastUpdated.toLocaleString()}
      </span>
      {hoursOld > 24 && (
        <span className="ml-2 text-sm">
          (Refresh failed - showing cached version)
        </span>
      )}
    </div>
  );
}

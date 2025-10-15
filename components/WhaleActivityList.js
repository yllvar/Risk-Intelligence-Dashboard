export default function WhaleActivityList({ activities = [] }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Whale Activity</h3>
      {activities.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {activities.map((activity, i) => {
            const wallet = activity?.wallet || 'unknown';
            const positionChange = activity?.position_change || 0;
            const protocol = activity?.protocol || 'unknown';
            const lastActivity = activity?.last_activity || Date.now();
            
            return (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    positionChange > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {wallet.length > 10 
                        ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` 
                        : wallet}
                    </p>
                    <p className="text-xs text-gray-500">
                      {positionChange > 0 ? 'Added' : 'Removed'} ${Math.abs(positionChange).toLocaleString()} to {protocol}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(lastActivity).toLocaleTimeString()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 mb-2">No recent whale activity</p>
          <p className="text-xs text-gray-400">Check back later for updates</p>
        </div>
      )}
    </div>
  );
}

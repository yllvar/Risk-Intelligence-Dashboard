export default function WhaleActivityList({ activities = [] }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Whale Activity</h3>
      {activities.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {activities.map((activity, i) => (
            <li key={i} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  activity.position_change > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.wallet.slice(0, 6)}...{activity.wallet.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.position_change > 0 ? 'Added' : 'Removed'} ${Math.abs(activity.position_change).toLocaleString()} to {activity.protocol}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(activity.last_activity).toLocaleTimeString()}
                </span>
              </div>
            </li>
          ))}
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

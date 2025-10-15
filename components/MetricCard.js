export default function MetricCard({ title, value, delta, stale = false }) {
  return (
    <div className={`p-6 rounded-xl shadow-sm transition-all ${stale ? 'bg-gray-100' : 'bg-white hover:shadow-md'}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="flex items-end justify-between">
        <p className={`text-2xl font-semibold ${stale ? 'text-gray-600' : 'text-gray-900'}`}>
          {value || '--'}
        </p>
        {delta && (
          <span className={`text-sm px-2 py-1 rounded-full ${delta > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      {stale && (
        <p className="mt-2 text-xs text-amber-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Cached data
        </p>
      )}
    </div>
  );
}

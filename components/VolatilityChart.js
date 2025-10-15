export default function VolatilityChart({ data }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Price Volatility</h3>
        {data && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            parseFloat(data) > 15 ? 'bg-red-100 text-red-800' :
            parseFloat(data) > 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
          }`}>
            {data}
          </span>
        )}
      </div>
      
      {data ? (
        <div className="h-40 flex items-end justify-center space-x-2">
          {/* Generate a simple bar chart */}
          {[7, 14, 30].map((days, i) => {
            const height = Math.min(100, Math.abs(parseFloat(data)) * (i + 1));
            return (
              <div key={days} className="flex flex-col items-center">
                <div 
                  className={`w-8 rounded-t ${
                    parseFloat(data) > 15 ? 'bg-red-500' :
                    parseFloat(data) > 5 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{days}d</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-gray-500">
          No volatility data available
        </div>
      )}
    </div>
  );
}

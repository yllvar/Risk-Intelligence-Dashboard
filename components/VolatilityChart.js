import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';

const SAMPLE_SERIES = {
  sevenDay: [
    { date: '2025-09-25', value: 43500000000 },
    { date: '2025-09-26', value: 43850000000 },
    { date: '2025-09-27', value: 43200000000 },
    { date: '2025-09-28', value: 42800000000 },
    { date: '2025-09-29', value: 43150000000 },
    { date: '2025-09-30', value: 43620000000 },
    { date: '2025-10-01', value: 43980000000 }
  ],
  thirtyDay: [
    { date: '2025-09-05', value: 41000000000 },
    { date: '2025-09-10', value: 41250000000 },
    { date: '2025-09-15', value: 41800000000 },
    { date: '2025-09-20', value: 42050000000 },
    { date: '2025-09-25', value: 42500000000 },
    { date: '2025-09-30', value: 43000000000 },
    { date: '2025-10-01', value: 43400000000 }
  ]
};

export default function VolatilityChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const series = useMemo(() => {
    if (data?.sevenDay?.length && data?.thirtyDay?.length) {
      return data;
    }
    return SAMPLE_SERIES;
  }, [data]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const labels = Array.from(
      new Set([...series.sevenDay, ...series.thirtyDay].map(point => point.date))
    ).sort((a, b) => new Date(a) - new Date(b));

    if (!labels.length) return;

    const sevenDayMap = new Map(series.sevenDay.map(point => [point.date, point.value]));
    const thirtyDayMap = new Map(series.thirtyDay.map(point => [point.date, point.value]));

    const dataset7d = labels.map(label => sevenDayMap.get(label) ?? null);
    const dataset30d = labels.map(label => thirtyDayMap.get(label) ?? null);

    const ctx = canvasRef.current.getContext('2d');

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '7D TVL',
            data: dataset7d,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#2563eb'
          },
          {
            label: '30D TVL',
            data: dataset30d,
            borderColor: '#94a3b8',
            backgroundColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#94a3b8'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => {
                if (!value && value !== 0) return value;
                if (Math.abs(value) >= 1000000000) {
                  return `$${(value / 1000000000).toFixed(1)}B`;
                }
                if (Math.abs(value) >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                }
                return `$${value}`;
              }
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.15)'
            }
          },
          x: {
            ticks: {
              maxTicksLimit: 6
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                return `${context.dataset.label}: $${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
              }
            }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [series]);

  const hasData = series.sevenDay.length && series.thirtyDay.length;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">TVL Volatility</h3>
        {hasData && (
          <span className="text-xs font-medium text-gray-500">Showing 7D vs 30D</span>
        )}
      </div>

      <div className="relative h-64">
        {hasData ? (
          <canvas ref={canvasRef} role="img" aria-label="TVL volatility chart" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            No volatility data available
          </div>
        )}
      </div>
    </div>
  );
}

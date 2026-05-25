import { useState, useMemo } from 'react';
import type { Order } from '../../types/app';
import { TrendingUp, ChevronDown } from 'lucide-react';

interface RevenueChartProps {
  orders: Order[];
}

interface MonthData {
  month: string;
  shortMonth: string;
  revenue: number;
  orderCount: number;
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const SHORT_MONTHS = [
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
  'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
];

export default function RevenueChart({ orders }: RevenueChartProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Available years from order data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    orders.forEach((o) => {
      if (o.createdAt) {
        years.add(new Date(o.createdAt).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, currentYear]);

  // Monthly data aggregation
  const monthlyData: MonthData[] = useMemo(() => {
    const data: MonthData[] = MONTH_NAMES.map((month, idx) => ({
      month,
      shortMonth: SHORT_MONTHS[idx],
      revenue: 0,
      orderCount: 0,
    }));

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const d = new Date(order.createdAt);
      if (d.getFullYear() !== selectedYear) return;
      const monthIdx = d.getMonth();
      data[monthIdx].revenue += order.totalAmount || 0;
      data[monthIdx].orderCount += 1;
    });

    return data;
  }, [orders, selectedYear]);

  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);
  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = monthlyData.reduce((s, d) => s + d.orderCount, 0);
  const avgRevenue = totalOrders > 0 ? totalRevenue / 12 : 0;

  // Chart dimensions
  const chartWidth = 800;
  const chartHeight = 320;
  const paddingLeft = 80;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 50;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Scale functions
  const xScale = (idx: number) => paddingLeft + (idx + 0.5) * (innerWidth / 12);
  const yScale = (val: number) => paddingTop + innerHeight - (val / maxRevenue) * innerHeight;
  const barWidth = innerWidth / 12 * 0.6;

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: yScale(maxRevenue * pct),
    value: maxRevenue * pct,
  }));

  // Line chart path
  const linePath = monthlyData
    .map((d, i) => {
      const x = xScale(i);
      const y = yScale(d.revenue);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Area path
  const areaPath = `${linePath} L ${xScale(11)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toLocaleString();
  };

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Biểu đồ doanh thu</h3>
            <p className="text-xs text-slate-400">Thống kê doanh thu theo tháng</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Chart type toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Bar
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                chartType === 'line'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Line
            </button>
          </div>

          {/* Year selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-xs font-medium text-slate-400">Tổng doanh thu</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">{totalRevenue.toLocaleString()} ₫</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Tổng đơn hàng</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">{totalOrders}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Trung bình/tháng</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">{Math.round(avgRevenue).toLocaleString()} ₫</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full"
            style={{ minWidth: 600 }}
          >
            {/* Grid lines */}
            {gridLines.map((line, i) => (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={line.y}
                  x2={chartWidth - paddingRight}
                  y2={line.y}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  strokeDasharray={i === 0 ? '0' : '4,4'}
                />
                <text
                  x={paddingLeft - 10}
                  y={line.y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize={11}
                  fontFamily="Inter, sans-serif"
                >
                  {formatCurrency(line.value)}
                </text>
              </g>
            ))}

            {/* Bar chart */}
            {chartType === 'bar' && monthlyData.map((d, i) => {
              const x = xScale(i) - barWidth / 2;
              const barHeight = (d.revenue / maxRevenue) * innerHeight;
              const y = yScale(d.revenue);
              const isHovered = hoveredBar === i;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    fill={`url(#barGrad${isHovered ? 'Hover' : ''})`}
                    className="transition-all duration-200"
                    style={{
                      filter: isHovered ? 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))' : 'none',
                      transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                      transformOrigin: `${x + barWidth / 2}px ${yScale(0)}px`,
                    }}
                  />

                  {/* X-axis label */}
                  <text
                    x={xScale(i)}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fill={isHovered ? '#1e40af' : '#94a3b8'}
                    fontSize={11}
                    fontWeight={isHovered ? 700 : 500}
                    fontFamily="Inter, sans-serif"
                  >
                    {d.shortMonth}
                  </text>

                  {/* Tooltip */}
                  {isHovered && d.revenue > 0 && (
                    <g>
                      <rect
                        x={xScale(i) - 60}
                        y={y - 50}
                        width={120}
                        height={40}
                        rx={8}
                        fill="#1e293b"
                        fillOpacity={0.95}
                      />
                      <text
                        x={xScale(i)}
                        y={y - 34}
                        textAnchor="middle"
                        fill="white"
                        fontSize={11}
                        fontWeight={600}
                        fontFamily="Inter, sans-serif"
                      >
                        {d.revenue.toLocaleString()} ₫
                      </text>
                      <text
                        x={xScale(i)}
                        y={y - 18}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={10}
                        fontFamily="Inter, sans-serif"
                      >
                        {d.orderCount} đơn hàng
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Line chart */}
            {chartType === 'line' && (
              <g>
                {/* Area fill */}
                <path d={areaPath} fill="url(#areaGrad)" opacity={0.3} />
                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dots */}
                {monthlyData.map((d, i) => (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <circle
                      cx={xScale(i)}
                      cy={yScale(d.revenue)}
                      r={hoveredBar === i ? 7 : 4}
                      fill={hoveredBar === i ? '#3b82f6' : 'white'}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      className="transition-all duration-200"
                      style={{ cursor: 'pointer' }}
                    />
                    {/* X label */}
                    <text
                      x={xScale(i)}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      fill={hoveredBar === i ? '#1e40af' : '#94a3b8'}
                      fontSize={11}
                      fontWeight={hoveredBar === i ? 700 : 500}
                      fontFamily="Inter, sans-serif"
                    >
                      {d.shortMonth}
                    </text>
                    {/* Tooltip */}
                    {hoveredBar === i && d.revenue > 0 && (
                      <g>
                        <rect
                          x={xScale(i) - 60}
                          y={yScale(d.revenue) - 50}
                          width={120}
                          height={40}
                          rx={8}
                          fill="#1e293b"
                          fillOpacity={0.95}
                        />
                        <text
                          x={xScale(i)}
                          y={yScale(d.revenue) - 34}
                          textAnchor="middle"
                          fill="white"
                          fontSize={11}
                          fontWeight={600}
                          fontFamily="Inter, sans-serif"
                        >
                          {d.revenue.toLocaleString()} ₫
                        </text>
                        <text
                          x={xScale(i)}
                          y={yScale(d.revenue) - 18}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize={10}
                          fontFamily="Inter, sans-serif"
                        >
                          {d.orderCount} đơn hàng
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </g>
            )}

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

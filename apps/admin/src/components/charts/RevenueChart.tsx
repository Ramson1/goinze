'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNaira } from '@/lib/utils';
import type { RevenuePoint } from '@/lib/api';

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `₦${(Number(value) / 1_000_000).toFixed(0)}M`}
          />
          <Tooltip formatter={(value) => formatNaira(Number(value))} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#0f766e"
            strokeWidth={2}
            fill="url(#revFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

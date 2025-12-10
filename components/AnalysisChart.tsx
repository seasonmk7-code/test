import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalculationResult } from '../types';

interface Props {
  data: CalculationResult[];
  label: string;
}

const AnalysisChart: React.FC<Props> = ({ data, label }) => {
  // Sample data to avoid overcrowding the chart
  const chartData = data.map(d => ({
    qty: d.quantity,
    totalProfit: Math.round(d.jointTotalProfitUSD),
    domesticProfit: Math.round(d.domesticTotalProfitUSD),
    foreignProfit: Math.round(d.foreignTotalProfitUSD),
  }));

  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-600 mb-4 text-center">{label} - 数量 vs 利润趋势</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="qty" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val}`} />
          <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Profit']}
          />
          <Legend />
          <Line type="monotone" dataKey="totalProfit" name="总联合利润" stroke="#0f172a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="domesticProfit" name="国内利润" stroke="#22c55e" strokeWidth={1} dot={false} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="foreignProfit" name="国外利润" stroke="#6366f1" strokeWidth={1} dot={false} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalysisChart;

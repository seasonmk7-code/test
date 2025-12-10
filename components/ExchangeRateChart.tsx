import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Inputs, ProductType } from '../types';
import { calculateScenario } from '../utils/calculations';

interface Props {
  inputs: Inputs;
  bestSteelQ: number;
  bestPvQ: number;
  bestCarQ: number;
}

const ExchangeRateChart: React.FC<Props> = ({ inputs, bestSteelQ, bestPvQ, bestCarQ }) => {
  const data = useMemo(() => {
    const baseRate = inputs.exchangeRate;
    const variations = [-0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5];
    
    return variations.map(diff => {
      const rate = baseRate + diff;
      if (rate <= 0) return null;

      const simInputs = { ...inputs, exchangeRate: rate };
      
      // Calculate profits for the fixed best Quantity found earlier
      const steel = calculateScenario(bestSteelQ, ProductType.STEEL, simInputs);
      const pv = calculateScenario(bestPvQ, ProductType.PV, simInputs);
      const car = calculateScenario(bestCarQ, ProductType.CAR, simInputs);

      return {
        rate: rate.toFixed(2),
        steelProfit: Math.round(steel.jointTotalProfitUSD),
        pvProfit: Math.round(pv.jointTotalProfitUSD),
        carProfit: Math.round(car.jointTotalProfitUSD),
      };
    }).filter(Boolean);
  }, [inputs, bestSteelQ, bestPvQ, bestCarQ]);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
       <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
         <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
         汇率敏感度预测 (Exchange Rate Sensitivity)
       </h3>
       <p className="text-sm text-slate-500 mb-6">
         预测当汇率发生变化时，当前推荐数量下的总利润波动情况。
       </p>
       <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="rate" stroke="#64748b" label={{ value: '汇率 (CNY/USD)', position: 'insideBottom', offset: -5 }} />
            <YAxis stroke="#64748b" tickFormatter={(v) => `$${v/1000}k`} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="steelProfit" name="钢铁利润 (Steel)" stroke="#0891b2" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
            <Line type="monotone" dataKey="pvProfit" name="光伏利润 (PV)" stroke="#d97706" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
            <Line type="monotone" dataKey="carProfit" name="汽车利润 (Car)" stroke="#e11d48" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
          </LineChart>
        </ResponsiveContainer>
       </div>
    </div>
  );
};

export default ExchangeRateChart;

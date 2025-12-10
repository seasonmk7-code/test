import React from 'react';
import { CalculationResult, ProductType } from '../types';
import { TrendingUp, Package, Ship, DollarSign } from 'lucide-react';

interface Props {
  type: ProductType;
  result: CalculationResult | null;
}

const ResultCard: React.FC<Props> = ({ type, result }) => {
  if (!result) return <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-400">数据不足</div>;

  const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtRMB = (n: number) => `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = (n: number) => n.toLocaleString('en-US');

  const titleColor = type === ProductType.CAR ? 'text-rose-600' : type === ProductType.PV ? 'text-amber-600' : 'text-cyan-600';
  const bgColor = type === ProductType.CAR ? 'bg-rose-50' : type === ProductType.PV ? 'bg-amber-50' : 'bg-cyan-50';
  const borderColor = type === ProductType.CAR ? 'border-rose-200' : type === ProductType.PV ? 'border-amber-200' : 'border-cyan-200';

  const typeName = type === ProductType.CAR ? '汽车 (Car)' : type === ProductType.PV ? '光伏 (PV)' : '钢铁 (Steel)';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-4 border-b border-black/5 flex justify-between items-center">
        <h3 className={`font-bold text-lg ${titleColor}`}>{typeName}</h3>
        <span className="text-xs font-medium px-2 py-1 bg-white rounded-full border border-black/5 text-slate-500">
           推荐买入量: {fmtNum(result.quantity)}
        </span>
      </div>
      
      <div className="p-4 space-y-4 text-sm">
        {/* Key Profit Metrics */}
        <div className="bg-white/60 p-3 rounded-lg border border-black/5">
           <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
              <TrendingUp className="w-4 h-4" /> 利润分析
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">国内总利润</p>
                <p className="font-bold text-green-600">{fmtUSD(result.domesticTotalProfitUSD)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">国外总利润</p>
                <p className="font-bold text-indigo-600">{fmtUSD(result.foreignTotalProfitUSD)}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-dashed border-slate-300">
                 <p className="text-xs text-slate-500 text-center">总联合利润 (Joint Profit)</p>
                 <p className="font-black text-xl text-center text-slate-800">{fmtUSD(result.jointTotalProfitUSD)}</p>
              </div>
           </div>
        </div>

        {/* Logistics */}
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/40 p-2 rounded">
                <p className="text-xs text-slate-500 flex items-center gap-1"><Package className="w-3 h-3"/> 箱子/柜子</p>
                <p className="font-medium text-slate-700">{result.containerCount} 个 ({result.containerType})</p>
                <p className="text-[10px] text-slate-400">装载率: {result.containerUtilization.toFixed(1)}%</p>
            </div>
            <div className="bg-white/40 p-2 rounded">
                <p className="text-xs text-slate-500 flex items-center gap-1"><Ship className="w-3 h-3"/> 总运费</p>
                <p className="font-medium text-slate-700">{fmtUSD(result.totalFreightUSD)}</p>
            </div>
        </div>

        {/* Price Breakdown Details */}
        <div className="space-y-1 pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">单价详情 (Unit Metrics)</p>
            <div className="flex justify-between">
                <span className="text-slate-600">国内买入价 (Discounted)</span>
                <span className="font-mono text-slate-800">{fmtRMB(result.unitPriceRMB)}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-slate-600">国内 FOB</span>
                <span className="font-mono text-slate-800">{fmtUSD(result.FOB_USD)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-600">保险费 I</span>
                <span className="font-mono text-slate-800">{fmtUSD(result.I_USD)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-600">单件运费 F</span>
                <span className="font-mono text-slate-800">{fmtUSD(result.F_USD)}</span>
            </div>
             <div className="flex justify-between border-t border-black/5 pt-1 mt-1">
                <span className="text-slate-600 font-medium">国外实际成本</span>
                <span className="font-mono font-bold text-rose-600">{fmtUSD(result.foreignActualCostUSD)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;

import React from 'react';
import { CalculationResult, ProductType } from '../types';
import { TrendingUp, Package, Ship } from 'lucide-react';

interface Props {
  type: ProductType;
  result: CalculationResult | null;
  recommendedQuantity: number;
  onQuantityChange: (val: number | null) => void;
  isManual: boolean;
  exchangeRate: number;
}

const ResultCard: React.FC<Props> = ({ type, result, recommendedQuantity, onQuantityChange, isManual, exchangeRate }) => {
  const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtRMB = (n: number) => `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = (n: number) => n.toLocaleString('en-US');

  const titleColor = type === ProductType.CAR ? 'text-rose-600' : type === ProductType.PV ? 'text-amber-600' : 'text-cyan-600';
  const bgColor = type === ProductType.CAR ? 'bg-rose-50' : type === ProductType.PV ? 'bg-amber-50' : 'bg-cyan-50';
  const borderColor = type === ProductType.CAR ? 'border-rose-200' : type === ProductType.PV ? 'border-amber-200' : 'border-cyan-200';

  const typeName = type === ProductType.CAR ? '汽车 (Car)' : type === ProductType.PV ? '光伏 (PV)' : '钢铁 (Steel)';

  // Fallback for display if result is null (though App ensures it shouldn't be for valid inputs)
  const displayQuantity = result ? result.quantity : recommendedQuantity;

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-4 border-b border-black/5 flex justify-between items-start">
        <h3 className={`font-bold text-lg ${titleColor} mt-1`}>{typeName}</h3>
        
        <div className="flex flex-col items-end gap-1">
           <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">买入量:</label>
              <input
                type="number"
                min="1"
                className={`w-24 text-right text-sm font-bold border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80 transition-colors ${
                    isManual ? 'border-indigo-400 text-indigo-700' : 'border-slate-300 text-slate-700'
                }`}
                value={displayQuantity}
                onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onQuantityChange(isNaN(val) ? 0 : val);
                }}
              />
           </div>
           {isManual ? (
               <button
                 onClick={() => onQuantityChange(null)}
                 className="text-[10px] text-indigo-600 hover:text-indigo-800 underline transition-colors"
                 title="点击恢复到系统计算的最优推荐值"
               >
                 恢复推荐值 ({fmtNum(recommendedQuantity)})
               </button>
           ) : (
               <span className="text-[10px] text-slate-400">当前为系统推荐最优值</span>
           )}
        </div>
      </div>
      
      {!result ? (
        <div className="p-6 text-center text-slate-400">无法计算结果</div>
      ) : (
        <div className="p-4 space-y-4 text-sm">
          {/* Key Profit Metrics */}
          <div className="bg-white/60 p-3 rounded-lg border border-black/5">
             <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
                <TrendingUp className="w-4 h-4" /> 利润分析
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">国内总利润</p>
                  <div className="flex flex-col">
                    <span className="font-bold text-green-600">{fmtUSD(result.domesticTotalProfitUSD)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ≈ {fmtRMB(result.domesticTotalProfitUSD * exchangeRate)}
                    </span>
                  </div>
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
      )}
    </div>
  );
};

export default ResultCard;
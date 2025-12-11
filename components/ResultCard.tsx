import React, { useState } from 'react';
import { CalculationResult, ProductType, Inputs } from '../types';
import { TrendingUp, Package, Info, Search, Crown, ArrowUpRight, Container, DollarSign, Tag } from 'lucide-react';
import CalculationDetailModal from './CalculationDetailModal';
import { findDominantMargin } from '../utils/calculations';

interface Props {
  type: ProductType;
  result: CalculationResult | null;
  recommendedQuantity: number;
  onQuantityChange: (val: number | null) => void;
  isManual: boolean;
  inputs: Inputs;
}

const ResultCard: React.FC<Props> = ({ type, result, recommendedQuantity, onQuantityChange, isManual, inputs }) => {
  const [showModal, setShowModal] = useState(false);

  const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtRMB = (n: number) => `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = (n: number) => n.toLocaleString('en-US');

  // Theme Config
  const theme = {
      [ProductType.CAR]: {
          bg: 'bg-gradient-to-br from-rose-50 to-white',
          border: 'border-rose-200',
          title: 'text-rose-700',
          bar: 'bg-rose-500',
          accent: 'ring-rose-200',
          iconBg: 'bg-rose-100'
      },
      [ProductType.PV]: {
          bg: 'bg-gradient-to-br from-amber-50 to-white',
          border: 'border-amber-200',
          title: 'text-amber-700',
          bar: 'bg-amber-500',
          accent: 'ring-amber-200',
          iconBg: 'bg-amber-100'
      },
      [ProductType.STEEL]: {
          bg: 'bg-gradient-to-br from-cyan-50 to-white',
          border: 'border-cyan-200',
          title: 'text-cyan-700',
          bar: 'bg-cyan-500',
          accent: 'ring-cyan-200',
          iconBg: 'bg-cyan-100'
      }
  }[type];

  const typeName = type === ProductType.CAR ? '汽车 (Car)' : type === ProductType.PV ? '光伏 (PV)' : '钢铁 (Steel)';
  const displayQuantity = result ? result.quantity : recommendedQuantity;

  // Dominance Strategy Logic
  const isDominant = result && result.domesticTotalProfitUSD > (result.foreignTotalProfitUSD * 1.1);
  const dominantSuggestion = (!isDominant && result) 
      ? findDominantMargin(result.quantity, type, inputs) 
      : null;

  return (
    <>
    <div className={`relative rounded-2xl border ${theme.border} ${theme.bg} shadow-lg shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-xl group`}>
      
      {/* Interactive Overlay for Details */}
      <div 
        className="absolute top-4 right-4 z-10 cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors"
        onClick={() => setShowModal(true)}
        title="点击查看详细计算过程"
      >
        <Search className="w-5 h-5 opacity-50 hover:opacity-100" />
      </div>

      <div className="p-5 border-b border-black/5 flex justify-between items-start">
        <div>
            <h3 className={`font-black text-xl ${theme.title} tracking-tight`}>{typeName}</h3>
            {isDominant && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200">
                    <Crown className="w-3 h-3" /> 国内主导 (Seller Dominant)
                </span>
            )}
        </div>
        
        <div className="flex flex-col items-end gap-1 mt-6 mr-6">
           <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Qty:</label>
              <input
                type="number"
                min="1"
                className={`w-24 text-right text-lg font-bold border-b-2 border-transparent bg-transparent focus:border-indigo-500 outline-none transition-all ${
                    isManual ? 'text-indigo-600 border-indigo-200' : 'text-slate-800 hover:border-slate-300'
                }`}
                value={displayQuantity}
                onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onQuantityChange(isNaN(val) ? 0 : val);
                }}
              />
           </div>
           {isManual && (
               <button
                 onClick={() => onQuantityChange(null)}
                 className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
               >
                 ↺ 重置推荐 ({fmtNum(recommendedQuantity)})
               </button>
           )}
        </div>
      </div>
      
      {!result ? (
        <div className="p-8 text-center text-slate-400 font-medium">输入数据以计算结果</div>
      ) : (
        <div className="p-5 space-y-4">
          {/* Key Profit Metrics */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm ring-1 ring-black/5">
             <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-sm uppercase tracking-wide">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> 利润分布 (Profit)
             </div>
             
             <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">国内 (Domestic)</p>
                  <div className="flex flex-col">
                    <span className={`font-black text-2xl ${isDominant ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {fmtUSD(result.domesticTotalProfitUSD)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {fmtRMB(result.domesticTotalProfitUSD * inputs.exchangeRate)}
                    </span>
                  </div>
                </div>
                
                {/* VS Badge */}
                <div className="text-[10px] font-bold text-slate-300 mb-4">VS</div>

                <div className="flex-1 text-right">
                  <p className="text-xs text-slate-500 mb-1">国外 (Foreign)</p>
                  <p className="font-bold text-lg text-slate-600">{fmtUSD(result.foreignTotalProfitUSD)}</p>
                </div>
             </div>

             {/* Total Joint Profit */}
             <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-xs font-semibold text-slate-500">总联合利润 (Joint Total)</span>
                 <span className="font-black text-slate-900 text-lg">{fmtUSD(result.jointTotalProfitUSD)}</span>
             </div>
          </div>
          
          {/* FOB Price Display (NEW) */}
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${theme.iconBg} ${theme.border} border`}>
                    <DollarSign className={`w-4 h-4 ${theme.title}`} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">FOB 单价 (Unit Price)</span>
             </div>
             <span className={`text-2xl font-black ${theme.title}`}>{fmtUSD(result.FOB_USD)}</span>
          </div>
        
          {/* Smart Suggestion for Dominance */}
          {dominantSuggestion && !isDominant && (
             <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-start gap-2">
                 <div className="p-1 bg-indigo-100 rounded text-indigo-600 mt-0.5">
                     <ArrowUpRight className="w-4 h-4" />
                 </div>
                 <div>
                     <p className="text-xs font-bold text-indigo-900">报价优化建议 (Strategy)</p>
                     <p className="text-[11px] text-indigo-700/80 leading-relaxed">
                         若想国内利润比国外高10%，建议将利润率 <strong>k</strong> 调整为 <span className="font-bold text-indigo-600 text-sm">{dominantSuggestion.requiredK.toFixed(2)}</span>。
                         <br/>
                         预期国内利润: <strong>{fmtUSD(dominantSuggestion.domesticProfit)}</strong>
                     </p>
                 </div>
             </div>
          )}

          {/* Logistics */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-slate-200/60">
                 <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">货柜 (Containers)</span>
                    <div className="flex items-baseline gap-1">
                        <Container className="w-3 h-3 text-slate-400"/>
                        <span className="text-sm font-bold text-slate-700">{result.containerCount}</span>
                        <span className="text-[10px] text-slate-500 font-medium">x {result.containerType}</span>
                    </div>
                 </div>
                 <div className="text-right">
                     <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">运费 (Freight)</span>
                     <span className="text-sm font-bold text-indigo-600">{fmtUSD(result.totalFreightUSD)}</span>
                 </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400"/>
                      <span className="text-xs font-semibold text-slate-600">货柜利用率 (Fill Rate)</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{result.containerUtilization.toFixed(1)}%</span>
              </div>
              
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full ${theme.bar} shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-700 ease-out`} 
                    style={{ width: `${Math.min(result.containerUtilization, 100)}%` }}
                  ></div>
              </div>

              {result.spareCapacity > 0 && (
                <div className="flex items-center justify-between text-[10px] bg-white p-1.5 rounded border border-slate-200 text-slate-500">
                    <span>剩余空间可装: <strong>{result.spareCapacity}</strong> 件</span>
                    <button 
                         onClick={() => onQuantityChange(result.quantity + result.spareCapacity)}
                         className="text-indigo-600 hover:text-indigo-800 font-bold underline"
                    >
                        填满货柜
                    </button>
                </div>
              )}
          </div>
          
          {/* Action Footer */}
          <button 
            onClick={() => setShowModal(true)}
            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
             <Search className="w-3 h-3" /> 查看完整计算公式 (View Breakdown)
          </button>
        </div>
      )}
    </div>

    {/* Calculation Detail Modal */}
    <CalculationDetailModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        result={result} 
        inputs={inputs}
        type={type}
    />
    </>
  );
};

export default ResultCard;
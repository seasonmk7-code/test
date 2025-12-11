import React from 'react';
import { CalculationResult, Inputs, ProductType } from '../types';
import { X, Calculator, ArrowRight, TrendingUp, Anchor, DollarSign, Package } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult | null;
  inputs: Inputs;
  type: ProductType;
}

const CalculationDetailModal: React.FC<Props> = ({ isOpen, onClose, result, inputs, type }) => {
  if (!isOpen || !result) return null;

  const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtRMB = (n: number) => `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Product specific coloring
  const colorTheme = type === ProductType.CAR 
    ? { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'bg-rose-100' }
    : type === ProductType.PV 
      ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100' }
      : { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'bg-cyan-100' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${colorTheme.border} ${colorTheme.bg} flex justify-between items-center`}>
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorTheme.icon}`}>
                  <Calculator className={`w-5 h-5 ${colorTheme.text}`} />
              </div>
              <div>
                  <h3 className={`text-lg font-bold ${colorTheme.text}`}>利润计算全过程详解</h3>
                  <p className="text-xs text-slate-500">Step-by-step Profit Calculation Breakdown</p>
              </div>
           </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition">
              <X className="w-6 h-6" />
           </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            
            {/* Step 1: Domestic Cost */}
            <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    1. 国内采购与成本 (Domestic Cost)
                </h4>
                <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 border border-slate-100">
                    <div className="flex justify-between">
                        <span className="text-slate-500">基础单价 (Base Price):</span>
                        <span className="font-mono">
                           {type === ProductType.STEEL ? inputs.priceSteel : type === ProductType.PV ? inputs.pricePV : inputs.priceCar} RMB
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">数量折扣 (Qty Discount):</span>
                        <span className="font-mono text-green-600">
                           {((1 - (result.unitPriceRMB / (type === ProductType.STEEL ? inputs.priceSteel : type === ProductType.PV ? inputs.pricePV : inputs.priceCar))) * 100).toFixed(0)}% OFF
                        </span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-slate-200 pt-1">
                        <span className="text-slate-700 font-medium">实际单价 x:</span>
                        <span className="font-mono font-bold">{fmtRMB(result.unitPriceRMB)}</span>
                    </div>
                    <div className="text-slate-400 italic pt-1 text-[10px]">
                        Formula: Total Cost RMB = (Qty {result.quantity} × {fmtRMB(result.unitPriceRMB)}) + Misc Fees ¥9000
                    </div>
                </div>
            </div>

            {/* Step 2: FOB Calculation */}
            <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-400 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-3 h-3"/> 2. 卖家报价构成 (FOB Price)
                </h4>
                <div className="bg-indigo-50/50 p-3 rounded-lg text-xs space-y-2 border border-indigo-100">
                     <p className="text-slate-600">
                         FOB = (Cost + Profit) / Exchange Rate
                     </p>
                     <div className="flex items-center gap-2 flex-wrap font-mono text-indigo-800 bg-white/60 p-2 rounded">
                        <span>( {fmtRMB(result.unitPriceRMB + result.avgMiscRMB)}</span>
                        <span>×</span>
                        <span>(1 + {inputs.margin})</span>
                        <span>)</span>
                        <span>÷</span>
                        <span>{inputs.exchangeRate}</span>
                        <ArrowRight className="w-3 h-3 mx-1"/>
                        <span className="font-bold text-base">{fmtUSD(result.FOB_USD)}</span>
                     </div>
                </div>
            </div>

            {/* Step 3: Logistics */}
            <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-400 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                    <Anchor className="w-3 h-3"/> 3. 物流与运费 (Logistics)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                     <div className="bg-blue-50 p-2 rounded border border-blue-100">
                        <span className="block text-slate-500 mb-1">Total Volume</span>
                        <span className="font-mono font-bold text-slate-700">{result.quantity} items → {Math.ceil(result.quantity * (type === ProductType.CAR ? 54.67/1 : 54.67/(type===ProductType.STEEL?105:406)))} boxes</span>
                     </div>
                     <div className="bg-blue-50 p-2 rounded border border-blue-100">
                         <span className="block text-slate-500 mb-1">Containers ({result.containerType})</span>
                         <span className="font-mono font-bold text-slate-700">{result.containerCount} x ${inputs.freightCostUSD}</span>
                     </div>
                     <div className="col-span-2 bg-blue-100/50 p-2 rounded text-center border border-blue-200 text-blue-800 font-semibold">
                         Unit Freight (F) = {fmtUSD(result.F_USD)} / item
                     </div>
                </div>
            </div>

            {/* Step 4: Final Breakdown */}
            <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3"/> 4. 最终利润分配 (Profit Split)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Domestic */}
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 bg-emerald-200 rounded-bl-lg">
                            <span className="text-[10px] font-bold text-emerald-800 px-1">SELLER</span>
                        </div>
                        <div className="space-y-1 text-xs mt-2">
                             <div className="flex justify-between">
                                 <span>Revenue (FOB):</span>
                                 <span className="font-mono">{fmtUSD(result.FOB_USD)}</span>
                             </div>
                             <div className="flex justify-between text-rose-500">
                                 <span>- Cost (N):</span>
                                 <span className="font-mono">-{fmtUSD(result.N_USD)}</span>
                             </div>
                             <div className="flex justify-between text-slate-400 text-[10px]">
                                 <span>* Tax/Overhead Factor:</span>
                                 <span>x 0.8</span>
                             </div>
                             <div className="pt-2 mt-1 border-t border-emerald-200">
                                 <span className="block text-center text-emerald-600 font-bold text-lg">
                                     {fmtUSD(result.domesticUnitProfitUSD)} <span className="text-[10px] font-normal text-slate-500">/unit</span>
                                 </span>
                                 <span className="block text-center text-emerald-800 font-black text-xl bg-emerald-100/50 rounded py-1 mt-1">
                                     Total: {fmtUSD(result.domesticTotalProfitUSD)}
                                 </span>
                             </div>
                        </div>
                    </div>

                    {/* Foreign */}
                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-1 bg-indigo-200 rounded-bl-lg">
                            <span className="text-[10px] font-bold text-indigo-800 px-1">BUYER</span>
                        </div>
                         <div className="space-y-1 text-xs mt-2">
                             <div className="flex justify-between">
                                 <span>Sell Price (r):</span>
                                 <span className="font-mono">{fmtUSD((result.foreignTotalProfitUSD / result.quantity / 0.8) + result.foreignActualCostUSD)}</span>
                             </div>
                             <div className="flex justify-between text-rose-500">
                                 <span>- Landed Cost:</span>
                                 <span className="font-mono">-{fmtUSD(result.foreignActualCostUSD)}</span>
                             </div>
                             <div className="text-[10px] text-slate-400 pl-2 border-l-2 border-slate-300 my-1">
                                 (FOB*1.25 + Insurance + Freight)
                             </div>
                             <div className="pt-2 mt-1 border-t border-indigo-200">
                                 <span className="block text-center text-indigo-600 font-bold text-lg">
                                     {fmtUSD(result.foreignUnitProfitUSD)} <span className="text-[10px] font-normal text-slate-500">/unit</span>
                                 </span>
                                 <span className="block text-center text-indigo-800 font-black text-xl bg-indigo-100/50 rounded py-1 mt-1">
                                     Total: {fmtUSD(result.foreignTotalProfitUSD)}
                                 </span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition shadow-lg shadow-slate-300/50"
            >
                Close Breakdown
            </button>
        </div>
      </div>
    </div>
  );
};

export default CalculationDetailModal;
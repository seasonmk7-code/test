import React, { useState, useEffect } from 'react';
import { Inputs, ProductType, CalculationResult } from '../types';
import { calculateForeignMetrics, calculateTargetFOB } from '../utils/calculations';
import { Briefcase, ArrowRight, Target, RefreshCw, Calculator, Container, Anchor, ShieldCheck } from 'lucide-react';

interface Props {
  inputs: Inputs;
  results: {
    steel: CalculationResult | null;
    pv: CalculationResult | null;
    car: CalculationResult | null;
  };
}

const ForeignBuyerPanel: React.FC<Props> = ({ inputs, results }) => {
  // State to hold local edits for "What-if" analysis
  // We initialize these with the calculated values from the main app
  const [localState, setLocalState] = useState<Record<ProductType, { fob: number; qty: number; desiredMargin: number }>>({
    [ProductType.STEEL]: { fob: 0, qty: 0, desiredMargin: 0.15 },
    [ProductType.PV]: { fob: 0, qty: 0, desiredMargin: 0.20 },
    [ProductType.CAR]: { fob: 0, qty: 0, desiredMargin: 0.10 },
  });

  // Sync effect: When main results change (e.g. user optimizes in main app), update our local defaults
  // ONLY if the local values are empty or zero (to prevent overwriting user's active experiments)
  useEffect(() => {
    const sync = (type: ProductType, res: CalculationResult | null) => {
      if (!res) return;
      setLocalState(prev => {
        if (prev[type].fob === 0 && prev[type].qty === 0) {
           return {
             ...prev,
             [type]: { 
                fob: parseFloat(res.FOB_USD.toFixed(2)), 
                qty: res.quantity,
                // Initialize desired margin to the calculated actual margin so the counter-offer starts "neutral"
                desiredMargin: 0.15 // Default fallback
             }
           };
        }
        return prev;
      });
    };

    sync(ProductType.STEEL, results.steel);
    sync(ProductType.PV, results.pv);
    sync(ProductType.CAR, results.car);
  }, [results.steel, results.pv, results.car]);

  const updateState = (type: ProductType, field: 'fob' | 'qty' | 'desiredMargin', value: number) => {
    setLocalState(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleSync = (type: ProductType) => {
    const res = type === ProductType.STEEL ? results.steel : type === ProductType.PV ? results.pv : results.car;
    if (res) {
        // Recalculate the actual margin for this result to set as default desired
        const metrics = calculateForeignMetrics(res.FOB_USD, res.quantity, type, inputs);
        updateState(type, 'fob', parseFloat(res.FOB_USD.toFixed(2)));
        updateState(type, 'qty', res.quantity);
        updateState(type, 'desiredMargin', parseFloat(metrics.margin.toFixed(3)));
    }
  };

  const renderCard = (type: ProductType, label: string, colorClass: string, sellPrice: number) => {
    const { fob, qty, desiredMargin } = localState[type];
    
    // 1. Calculate Metrics based on inputs
    const metrics = calculateForeignMetrics(fob, qty, type, inputs);
    
    // 2. Calculate Counter-Offer
    const targetFOB = calculateTargetFOB(desiredMargin, sellPrice, metrics.F_USD);
    
    const fmtUSD = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg relative overflow-hidden group flex flex-col h-full">
         {/* Background accent */}
         <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-10 rounded-bl-full pointer-events-none group-hover:opacity-20 transition-opacity`}></div>

         <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2 relative z-10">
            <h3 className="font-bold text-white text-lg">{label}</h3>
            <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-600">
               Sell Price: <span className="text-white font-mono">${sellPrice}</span>
            </span>
         </div>

         {/* SECTION A: Current Quote Analysis */}
         <div className="mb-4 space-y-3 relative z-10 flex-grow">
            <div className="flex items-center justify-between">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                 <Calculator className="w-3 h-3" /> 现有报价分析 (Analysis)
               </h4>
               <button onClick={() => handleSync(type)} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <RefreshCw className="w-3 h-3" /> 重置
               </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-2">
               <div>
                  <label className="block text-[10px] text-slate-400 mb-1">卖家 FOB 报价 ($)</label>
                  <input 
                    type="number" 
                    value={fob}
                    onChange={(e) => updateState(type, 'fob', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded px-2 py-1 focus:border-indigo-500 outline-none"
                  />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-400 mb-1">采购数量 (Qty)</label>
                  <input 
                    type="number" 
                    value={qty}
                    onChange={(e) => updateState(type, 'qty', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded px-2 py-1 focus:border-indigo-500 outline-none"
                  />
               </div>
            </div>

            {/* Detailed Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block flex items-center gap-1"><Container className="w-3 h-3"/> 所需货柜</span>
                    <span className="text-slate-300 font-mono font-bold">{metrics.containerCount} 个</span>
                </div>
                 <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block flex items-center gap-1"><Anchor className="w-3 h-3"/> 总运费</span>
                    <span className="text-slate-300 font-mono">{fmtUSD(metrics.totalFreightUSD)}</span>
                </div>
                 <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block">单件运费 (Unit Freight)</span>
                    <span className="text-slate-300 font-mono">{fmtUSD(metrics.unitFreightUSD)}</span>
                </div>
                 <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> 保险费 (Unit)</span>
                    <span className="text-slate-300 font-mono">{fmtUSD(metrics.insuranceUSD)}</span>
                </div>
            </div>

            {/* Cost & Profit Summary */}
            <div className="bg-slate-900/60 rounded p-3 text-sm space-y-2 border border-slate-700/50 mt-2">
               <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">实际落地成本 (Landed Cost)</span>
                  <span className="text-slate-300 font-mono text-xs">{fmtUSD(metrics.unitCost)}</span>
               </div>
               <div className="flex justify-between border-t border-slate-700/50 pt-2">
                  <span className="text-slate-400 font-medium">预估总利润 (Profit)</span>
                  <span className={`font-mono font-bold ${metrics.totalProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${metrics.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
               </div>
               <div className="flex justify-between">
                   <span className="text-slate-400 font-medium">当前利润率 (Margin)</span>
                   <span className={`font-bold ${metrics.margin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {(metrics.margin * 100).toFixed(1)}%
                   </span>
               </div>
            </div>
         </div>

         {/* SECTION B: Counter Offer Strategy */}
         <div className="bg-indigo-900/20 rounded-lg p-3 border border-indigo-500/30 relative z-10 mt-auto">
            <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-indigo-100">还价策略 (Counter-Offer)</span>
            </div>
            
            <div className="flex items-center justify-between mb-2">
                 <label className="text-xs text-indigo-200">期望利润率</label>
                 <div className="flex items-center gap-1 bg-indigo-900/50 rounded px-2 py-0.5 border border-indigo-500/30">
                    <input 
                        type="number" 
                        step="1"
                        value={(desiredMargin * 100).toFixed(0)} 
                        onChange={(e) => updateState(type, 'desiredMargin', parseFloat(e.target.value) / 100)}
                        className="w-10 text-right bg-transparent text-white text-sm font-bold focus:outline-none"
                    />
                    <span className="text-xs text-indigo-300 font-bold">%</span>
                 </div>
            </div>

            <div className="flex items-center justify-between bg-indigo-600 rounded p-2 shadow-md">
                <div className="text-indigo-200 text-xs font-medium">推荐还价 (Target FOB)</div>
                <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-white" />
                    <span className="font-black text-lg text-white">{fmtUSD(targetFOB)}</span>
                </div>
            </div>
            {targetFOB <= 0 && (
                <p className="text-[10px] text-red-400 mt-1 text-center">无法达成该利润率 (Costs too high)</p>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden mt-8 mb-8">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50">
        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
            <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">国外买家 - 逆向利润估算与还价</h2>
            <p className="text-slate-400 text-sm">Foreign Buyer Mode: Logistics Analysis, Reverse Profit Estimation & Counter-Offer Strategy</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCard(ProductType.STEEL, '钢铁 (Steel)', 'bg-cyan-500', inputs.sellPriceSteelUSD)}
        {renderCard(ProductType.PV, '光伏 (PV)', 'bg-amber-500', inputs.sellPricePVUSD)}
        {renderCard(ProductType.CAR, '汽车 (Car)', 'bg-rose-500', inputs.sellPriceCarUSD)}
      </div>
      
      <div className="px-6 pb-6 text-center opacity-60">
        <p className="text-[10px] text-slate-500">
            Note: Calculations assume Standard Import Tariff (25%), Insurance (3.3%), and Tax/Overhead factor (0.8). Margin is calculated on Sales Price.
        </p>
      </div>
    </div>
  );
};

export default ForeignBuyerPanel;
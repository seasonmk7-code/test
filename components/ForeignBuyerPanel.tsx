import React, { useState, useEffect } from 'react';
import { Inputs, ProductType, CalculationResult } from '../types';
import { calculateForeignMetrics, calculateTargetFOB, calculateDomesticProfitAtFOB } from '../utils/calculations';
import { Briefcase, ArrowRight, Target, RefreshCw, Calculator, Container, Anchor, ShieldCheck, HandCoins, Search } from 'lucide-react';
import CalculationDetailModal from './CalculationDetailModal';

interface Props {
  inputs: Inputs;
  results: {
    steel: CalculationResult | null;
    pv: CalculationResult | null;
    car: CalculationResult | null;
  };
}

const ForeignBuyerPanel: React.FC<Props> = ({ inputs, results }) => {
  const [localState, setLocalState] = useState<Record<ProductType, { fob: number; qty: number; desiredMargin: number }>>({
    [ProductType.STEEL]: { fob: 0, qty: 0, desiredMargin: 0.15 },
    [ProductType.PV]: { fob: 0, qty: 0, desiredMargin: 0.20 },
    [ProductType.CAR]: { fob: 0, qty: 0, desiredMargin: 0.10 },
  });
  
  // Modal State
  const [modalType, setModalType] = useState<ProductType | null>(null);

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
                desiredMargin: 0.15
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
        const metrics = calculateForeignMetrics(res.FOB_USD, res.quantity, type, inputs);
        updateState(type, 'fob', parseFloat(res.FOB_USD.toFixed(2)));
        updateState(type, 'qty', res.quantity);
        updateState(type, 'desiredMargin', parseFloat(metrics.margin.toFixed(3)));
    }
  };

  // Helper to construct a temporary result object for the modal based on "What-if" values
  const getTempResultForModal = (type: ProductType): CalculationResult | null => {
      const { fob, qty } = localState[type];
      const metrics = calculateForeignMetrics(fob, qty, type, inputs);
      const domesticProfit = calculateDomesticProfitAtFOB(fob, qty, type, inputs);
      
      // We construct a mock result just enough for the modal to render cost breakdowns
      // Note: Some reverse engineering of RMB cost is needed if we want it perfect, 
      // but for "Foreign Buyer" view, we mainly care about the USD breakdown which we have.
      // However, to reuse the modal, we need to pass a compatible object.
      
      // Let's approximate the internal calculation to make the modal work seamlessly
      // This is a bit of a hack to reuse the component, but effective for UX consistency
      const avgMiscRMB = 9000 / qty;
      const x = (fob * inputs.exchangeRate) / (1 + inputs.margin) - avgMiscRMB; // Reverse engineer Unit Price RMB
      
      return {
          quantity: qty,
          unitPriceRMB: x > 0 ? x : 0, // Approximate
          containerCount: metrics.containerCount,
          containerType: '40ft', // Simplified
          containerUtilization: 0, // Not needed for profit modal
          spareCapacity: 0,
          totalFreightUSD: metrics.totalFreightUSD,
          avgMiscRMB: avgMiscRMB,
          N_USD: ((x + avgMiscRMB) / inputs.exchangeRate),
          FOB_USD: fob,
          CFR_USD: fob + metrics.unitFreightUSD,
          CIF_USD: fob + metrics.unitFreightUSD + metrics.insuranceUSD,
          I_USD: metrics.insuranceUSD,
          F_USD: metrics.unitFreightUSD,
          foreignActualCostUSD: metrics.unitCost,
          domesticUnitProfitUSD: (domesticProfit / qty),
          domesticTotalProfitUSD: domesticProfit,
          foreignUnitProfitUSD: metrics.unitProfit,
          foreignTotalProfitUSD: metrics.totalProfit,
          jointTotalProfitUSD: domesticProfit + metrics.totalProfit,
          domesticTotalCostRMB: 0
      } as CalculationResult;
  };

  const renderCard = (type: ProductType, label: string, colorClass: string, sellPrice: number) => {
    const { fob, qty, desiredMargin } = localState[type];
    const metrics = calculateForeignMetrics(fob, qty, type, inputs);
    const domesticProfitUSD = calculateDomesticProfitAtFOB(fob, qty, type, inputs);
    const targetFOB = calculateTargetFOB(desiredMargin, sellPrice, metrics.F_USD);
    
    const fmtUSD = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtRMB = (n: number) => `¥${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    return (
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg relative overflow-hidden group flex flex-col h-full transition-all hover:shadow-2xl hover:border-slate-600">
         <div className={`absolute top-0 right-0 w-40 h-40 ${colorClass} opacity-[0.08] rounded-bl-[100px] pointer-events-none group-hover:opacity-[0.15] transition-opacity`}></div>

         <div className="flex justify-between items-center mb-5 border-b border-slate-700 pb-3 relative z-10">
            <h3 className="font-bold text-white text-lg tracking-wide">{label}</h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-600">
               Ref Price: <span className="text-white">${sellPrice}</span>
            </span>
         </div>

         {/* SECTION A: Current Quote Analysis */}
         <div className="mb-4 space-y-3 relative z-10 flex-grow">
            <div className="flex items-center justify-between">
               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                 <Calculator className="w-3 h-3" /> 模拟参数 (Parameters)
               </h4>
               <button onClick={() => handleSync(type)} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Sync Optimal
               </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-2">
               <div>
                  <label className="block text-[10px] text-slate-400 mb-1">卖家 FOB 报价 ($)</label>
                  <input 
                    type="number" 
                    value={fob}
                    onChange={(e) => updateState(type, 'fob', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-600 text-white font-mono text-sm rounded px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-400 mb-1">采购数量 (Qty)</label>
                  <input 
                    type="number" 
                    value={qty}
                    onChange={(e) => updateState(type, 'qty', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-600 text-white font-mono text-sm rounded px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
               </div>
            </div>

            {/* Logistics Info (New) */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 px-1 mb-2">
               <div className="flex items-center gap-1">
                   <Container className="w-3 h-3 text-slate-600"/> 
                   <span>Cnt: <span className="text-slate-300 font-mono">{metrics.containerCount}</span></span>
               </div>
               <div className="flex items-center gap-1 justify-end">
                   <Anchor className="w-3 h-3 text-slate-600"/>
                   <span>Frt: <span className="text-slate-300 font-mono">{fmtUSD(metrics.totalFreightUSD)}</span></span>
               </div>
            </div>

            {/* Profit Simulation */}
            <div className="bg-slate-900/60 rounded-lg p-4 text-sm space-y-3 border border-slate-700 mt-2 shadow-inner relative">
               {/* Click to view detail */}
               <button 
                  onClick={() => setModalType(type)}
                  className="absolute top-2 right-2 text-slate-600 hover:text-white transition-colors"
                  title="View Calculation Breakdown"
               >
                 <Search className="w-4 h-4"/>
               </button>

               <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                  <HandCoins className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">双边利润模拟 (Profit Sim)</span>
               </div>
               
               {/* Foreign */}
               <div className="flex justify-between items-center group/item">
                  <span className="text-indigo-300 text-xs font-medium">🌍 买家 (Foreign)</span>
                  <div className="flex flex-col items-end">
                      <span className={`font-mono font-bold text-lg ${metrics.totalProfit > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                          {fmtUSD(metrics.totalProfit)}
                      </span>
                      <span className="text-[10px] text-slate-500">Margin: {(metrics.margin * 100).toFixed(1)}%</span>
                  </div>
               </div>

               {/* Domestic */}
               <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                   <span className="text-emerald-300 text-xs font-medium">🇨🇳 卖家 (Domestic)</span>
                   <div className="flex flex-col items-end">
                       <span className={`font-mono font-bold text-lg ${domesticProfitUSD > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {fmtUSD(domesticProfitUSD)}
                       </span>
                       <span className="text-[10px] text-emerald-600/70">
                           ≈ {fmtRMB(domesticProfitUSD * inputs.exchangeRate)}
                       </span>
                   </div>
               </div>
            </div>
         </div>

         {/* SECTION B: Counter Offer Strategy */}
         <div className="bg-indigo-950/30 rounded-lg p-3 border border-indigo-500/20 relative z-10 mt-auto">
            <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-bold text-indigo-200 uppercase">Target Margin</span>
                 </div>
                 <div className="flex items-center gap-1 bg-slate-900 rounded px-2 py-0.5 border border-slate-700">
                    <input 
                        type="number" 
                        step="1"
                        value={(desiredMargin * 100).toFixed(0)} 
                        onChange={(e) => updateState(type, 'desiredMargin', parseFloat(e.target.value) / 100)}
                        className="w-8 text-right bg-transparent text-white text-xs font-bold focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">%</span>
                 </div>
            </div>

            <button 
                 className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded p-2 transition-all shadow-md group/btn" 
                 onClick={() => updateState(type, 'fob', parseFloat(targetFOB.toFixed(2)))}
            >
                <div className="text-indigo-100 text-xs font-medium">Apply Recommendation</div>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-white group-hover/btn:scale-110 transition-transform">{fmtUSD(targetFOB)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-200" />
                </div>
            </button>
            {targetFOB <= 0 && (
                <p className="text-[9px] text-rose-400 mt-1 text-center opacity-80">Target unreachable with current costs</p>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden mt-12 mb-12 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>

      <div className="relative p-8 border-b border-slate-800/80 flex flex-col md:flex-row items-start md:items-center gap-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Briefcase className="w-8 h-8 text-white" />
        </div>
        <div>
            <h2 className="text-2xl font-black text-white tracking-tight">国外买家模拟器 (Buyer Sandbox)</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                逆向推演国内卖家利润，制定双赢还价策略。实时计算运费、关税及隐藏成本。
                <br/>
                <span className="text-indigo-400/80 text-xs">Simulate reverse profit margins and optimize counter-offers.</span>
            </p>
        </div>
      </div>

      <div className="relative p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {renderCard(ProductType.STEEL, '钢铁 (Steel)', 'bg-cyan-500', inputs.sellPriceSteelUSD)}
        {renderCard(ProductType.PV, '光伏 (PV)', 'bg-amber-500', inputs.sellPricePVUSD)}
        {renderCard(ProductType.CAR, '汽车 (Car)', 'bg-rose-500', inputs.sellPriceCarUSD)}
      </div>

      {modalType && (
        <CalculationDetailModal 
            isOpen={!!modalType}
            onClose={() => setModalType(null)}
            result={getTempResultForModal(modalType)}
            inputs={inputs}
            type={modalType}
        />
      )}
    </div>
  );
};

export default ForeignBuyerPanel;
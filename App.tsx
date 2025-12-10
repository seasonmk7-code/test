import React, { useState, useMemo } from 'react';
import { Inputs, Destination, ProductType } from './types';
import InputSection from './components/InputSection';
import ResultCard from './components/ResultCard';
import AnalysisChart from './components/AnalysisChart';
import GeminiAdvisor from './components/GeminiAdvisor';
import ExchangeRateChart from './components/ExchangeRateChart';
import { findOptimalQuantity } from './utils/calculations';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>({
    priceSteel: 3500, // Default estimate
    pricePV: 600,     // Default estimate
    priceCar: 85000,  // Default estimate
    exchangeRate: 7.1,
    freightCostUSD: 5000,
    balance: 500,     // 500 * 10k = 5,000,000
    reserve: 50,      // 50 * 10k = 500,000
    margin: 0.2,      // 20%
    sellPriceSteelUSD: 650, 
    sellPricePVUSD: 110,
    sellPriceCarUSD: 16000,
    destination: Destination.LA_NY,
  });

  // Perform Calculations Automatically
  const results = useMemo(() => {
    return {
      steel: findOptimalQuantity(ProductType.STEEL, inputs),
      pv: findOptimalQuantity(ProductType.PV, inputs),
      car: findOptimalQuantity(ProductType.CAR, inputs),
    };
  }, [inputs]);

  return (
    <div className="min-h-screen bg-slate-50 relative pb-12">
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 opacity-[0.03] select-none overflow-hidden">
        <div className="transform -rotate-12 text-9xl font-black text-slate-900 whitespace-nowrap">
          Tuki大王 Tuki大王 Tuki大王
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            全球贸易利润优化系统
          </h1>
          <p className="text-slate-500 text-lg">
            Global Trade Logistics & Profit Optimization System
          </p>
        </header>

        <InputSection inputs={inputs} setInputs={setInputs} />

        {/* Top Level Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ResultCard type={ProductType.STEEL} result={results.steel?.optimal || null} />
          <ResultCard type={ProductType.PV} result={results.pv?.optimal || null} />
          <ResultCard type={ProductType.CAR} result={results.car?.optimal || null} />
        </div>

        {/* AI Advisor Section */}
        <div className="mb-8">
           <GeminiAdvisor 
             results={{
               steel: results.steel?.optimal || null,
               pv: results.pv?.optimal || null,
               car: results.car?.optimal || null
             }}
           />
        </div>

        {/* Charts & Deep Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1">
             <AnalysisChart data={results.steel?.dataPoints || []} label="钢铁 (Steel)" />
           </div>
           <div className="lg:col-span-1">
             <AnalysisChart data={results.pv?.dataPoints || []} label="光伏 (PV)" />
           </div>
           <div className="lg:col-span-1">
             <AnalysisChart data={results.car?.dataPoints || []} label="汽车 (Car)" />
           </div>
        </div>
        
        <ExchangeRateChart 
          inputs={inputs} 
          bestSteelQ={results.steel?.optimal?.quantity || 1}
          bestPvQ={results.pv?.optimal?.quantity || 1}
          bestCarQ={results.car?.optimal?.quantity || 1}
        />

        {/* Detailed Logic Explanation Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-400">
           <p className="text-center">
             System optimized for maximum joint profit. Calculations include tiered purchasing discounts, container utilization (20ft/40ft), CIF/FOB breakdown, and real-time exchange rate simulation.
           </p>
           <p className="text-center font-mono mt-2 text-slate-300">
             Designed by Tuki大王
           </p>
        </div>
      </div>
    </div>
  );
};

export default App;

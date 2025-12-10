import React from 'react';
import { Inputs, Destination, ProductType } from '../types';
import { Calculator, DollarSign, Truck, Anchor } from 'lucide-react';

interface Props {
  inputs: Inputs;
  setInputs: React.Dispatch<React.SetStateAction<Inputs>>;
}

const InputSection: React.FC<Props> = ({ inputs, setInputs }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name === 'destination' ? value : parseFloat(value) || 0
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <Calculator className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800">基础参数输入</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Financials */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> 资金设定
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">余额 e (万元)</label>
            <input type="number" name="balance" value={inputs.balance} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">预留款 g (万元)</label>
            <input type="number" name="reserve" value={inputs.reserve} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">汇率 c (CNY/USD)</label>
            <input type="number" step="0.01" name="exchangeRate" value={inputs.exchangeRate} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
        </div>

        {/* Logistics */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-600 flex items-center gap-2">
            <Anchor className="w-4 h-4" /> 物流参数
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">单柜运费 d (USD)</label>
            <input type="number" name="freightCostUSD" value={inputs.freightCostUSD} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">利润率 k (如 0.2)</label>
            <input type="number" step="0.01" name="margin" value={inputs.margin} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">目的地 (柜型)</label>
            <select name="destination" value={inputs.destination} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white">
              <option value={Destination.LA_NY}>洛杉矶/纽约 (20尺柜)</option>
              <option value={Destination.MIA_SEA}>迈阿密/西雅图 (40尺柜)</option>
            </select>
          </div>
        </div>

        {/* Purchase Prices */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-600 flex items-center gap-2">
            <Truck className="w-4 h-4" /> 国内买入价 (RMB)
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">钢铁单价</label>
            <input type="number" name="priceSteel" value={inputs.priceSteel} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">光伏单价</label>
            <input type="number" name="pricePV" value={inputs.pricePV} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">汽车单价</label>
            <input type="number" name="priceCar" value={inputs.priceCar} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
        </div>

        {/* Sell Prices */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> 国外卖出价 (USD)
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">钢铁 r</label>
            <input type="number" name="sellPriceSteelUSD" value={inputs.sellPriceSteelUSD} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">光伏 r</label>
            <input type="number" name="sellPricePVUSD" value={inputs.sellPricePVUSD} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">汽车 r</label>
            <input type="number" name="sellPriceCarUSD" value={inputs.sellPriceCarUSD} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputSection;

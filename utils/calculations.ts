import { Inputs, ProductType, Destination, CalculationResult } from '../types';

// Constants
const MISC_FEE_RMB = 9000;
const VOL_20FT = 33; // m3
const VOL_40FT = 67; // m3

// Carton 1 Dimensions (meters) -> 5.5 * 2.8 * 3.55 = 54.67 m3
// This seems very large for a "carton", but following prompt constraints strictly.
const CARTON1_VOL = 5.5 * 2.8 * 3.55; 

// Capacities per Carton 1
const CAP_STEEL_C1 = 105;
const CAP_PV_C1 = 406;
const CAP_CAR_C1 = 1;

/**
 * Get discounted price based on quantity and type
 */
const getDiscountedPrice = (type: ProductType, basePrice: number, q: number): number => {
  let multiplier = 1.0;
  
  if (type === ProductType.STEEL) {
    // Annual > 800 (0.75), Forwarder > 500 (0.8), Batch > 400 (0.9)
    // Priority usually goes to lowest price
    if (q > 800) multiplier = 0.75;
    else if (q > 500) multiplier = 0.8;
    else if (q > 400) multiplier = 0.9;
  } else if (type === ProductType.PV) {
    // Annual > 2000 (0.7), Proxy > 1200 (0.8), Batch > 600 (0.9)
    if (q > 2000) multiplier = 0.7;
    else if (q > 1200) multiplier = 0.8;
    else if (q > 600) multiplier = 0.9;
  } else if (type === ProductType.CAR) {
    // Annual > 30 (0.8), Proxy > 20 (0.85), Batch > 10 (0.9)
    if (q > 30) multiplier = 0.8;
    else if (q > 20) multiplier = 0.85;
    else if (q > 10) multiplier = 0.9;
  }
  
  return basePrice * multiplier;
};

export const calculateScenario = (
  q: number,
  type: ProductType,
  inputs: Inputs
): CalculationResult => {
  const {
    priceSteel, pricePV, priceCar,
    exchangeRate: c,
    freightCostUSD: d,
    margin: k,
    sellPriceSteelUSD, sellPricePVUSD, sellPriceCarUSD,
    destination
  } = inputs;

  // 1. Determine Base Price & Sell Price
  let basePrice = 0;
  let r = 0;
  let itemsPerBox = 0;

  if (type === ProductType.STEEL) {
    basePrice = priceSteel;
    r = sellPriceSteelUSD;
    itemsPerBox = CAP_STEEL_C1;
  } else if (type === ProductType.PV) {
    basePrice = pricePV;
    r = sellPricePVUSD;
    itemsPerBox = CAP_PV_C1;
  } else {
    basePrice = priceCar;
    r = sellPriceCarUSD;
    itemsPerBox = CAP_CAR_C1;
  }

  // 2. Discounted Price
  const x = getDiscountedPrice(type, basePrice, q);

  // 3. Logistics
  // Boxes needed. Prompt: "Req Boxes = Q / items_per_box". 
  // We assume integer boxes needed.
  const numBoxes = Math.ceil(q / itemsPerBox);
  
  // Total Volume
  const totalVolume = numBoxes * CARTON1_VOL;

  // Container sizing
  const isLargeDest = destination === Destination.MIA_SEA;
  const containerVol = isLargeDest ? VOL_40FT : VOL_20FT;
  
  // Container Count (m). Prompt: "Directly use total volume / container volume (take integer)"
  // Usually shipping requires ceiling, otherwise you leave goods behind.
  const m = Math.ceil(totalVolume / containerVol);

  // Utilization
  const usedVol = totalVolume;
  const availVol = m * containerVol;
  const containerUtilization = (usedVol / availVol) * 100;

  // 4. Costs
  const totalFreightUSD = m * d; // Formula: Total Freight = m * d (assuming d is USD)
  const Qmax = q; // The current quantity we are calculating for

  // Average Misc (RMB)
  const avgMiscRMB = MISC_FEE_RMB / Qmax;

  // Domestic Unit Freight F (USD)
  const F_USD = totalFreightUSD / Qmax;

  // N (Domestic Cost USD approx) = (x + avgMisc) / c
  const N_USD = (x + avgMiscRMB) / c;

  // FOB (USD) = ((x + avgMisc) * (1 + k)) / c
  const FOB_USD = ((x + avgMiscRMB) * (1 + k)) / c;

  // I (Insurance USD) = FOB * 0.033
  const I_USD = FOB_USD * 0.033;

  // CFR (USD) = FOB + F
  const CFR_USD = FOB_USD + F_USD;

  // CIF (USD) = CFR / 0.967
  const CIF_USD = CFR_USD / 0.967;

  // Foreign Actual Price (USD) = FOB * (1 + 0.25) + I + F
  const foreignActualCostUSD = (FOB_USD * 1.25) + I_USD + F_USD;

  // 5. Profits
  // Domestic Unit Profit = (FOB - N) * 0.8
  const domesticUnitProfitUSD = (FOB_USD - N_USD) * 0.8;
  const domesticTotalProfitUSD = domesticUnitProfitUSD * Qmax;

  // Foreign Unit Profit = (r - foreignActualPrice) * 0.8
  const foreignUnitProfitUSD = (r - foreignActualCostUSD) * 0.8;
  const foreignTotalProfitUSD = foreignUnitProfitUSD * Qmax;

  // Total Joint Profit
  const jointTotalProfitUSD = domesticTotalProfitUSD + foreignTotalProfitUSD;
  
  // Domestic Total Cost (RMB) used for budget check
  const domesticTotalCostRMB = q * x + MISC_FEE_RMB; // Simplified check: Goods cost + fixed misc

  return {
    quantity: q,
    unitPriceRMB: x,
    containerCount: m,
    containerType: isLargeDest ? '40ft' : '20ft',
    containerUtilization,
    totalFreightUSD,
    avgMiscRMB,
    N_USD,
    FOB_USD,
    CFR_USD,
    CIF_USD,
    I_USD,
    F_USD,
    foreignActualCostUSD,
    domesticUnitProfitUSD,
    domesticTotalProfitUSD,
    foreignUnitProfitUSD,
    foreignTotalProfitUSD,
    jointTotalProfitUSD,
    domesticTotalCostRMB
  };
};

export const findOptimalQuantity = (type: ProductType, inputs: Inputs) => {
  const { balance, reserve, priceSteel, pricePV, priceCar } = inputs;
  
  // Total Budget RMB
  const budgetRMB = (balance - reserve) * 10000;
  
  // Base price for max Q estimate
  let basePrice = 0;
  if (type === ProductType.STEEL) basePrice = priceSteel;
  else if (type === ProductType.PV) basePrice = pricePV;
  else basePrice = priceCar;

  if (basePrice <= 0) return null;

  // Rough Max Q (use base price, actual max Q might be higher due to discounts, 
  // but we can just check budget constraint inside the loop)
  // Discounts max out around 30% off, so let's multiply safe cap by 1.5 to be sure we cover discount ranges
  const safeMaxQ = Math.floor((budgetRMB / (basePrice * 0.7)) * 1.1) + 1; 

  let maxProfit = -Infinity;
  let optimalResult: CalculationResult | null = null;
  const dataPoints: CalculationResult[] = [];

  // Enumerate
  // For performance with large numbers, we might step, but for typical trade quantities (1-10000), JS is fast.
  // If Q is massive (millions), we'd need a smarter search. Assuming reasonable B2B qty.
  // Let's limit iteration to 10000 or budget limit.
  
  const iterationLimit = 10000; 
  const effectiveLimit = Math.min(safeMaxQ, iterationLimit);

  for (let q = 1; q <= effectiveLimit; q++) {
    const res = calculateScenario(q, type, inputs);
    
    // Strict Budget Check
    if (res.domesticTotalCostRMB > budgetRMB) break;

    // Optimization Target: Maximize Joint Total Profit
    if (res.jointTotalProfitUSD > maxProfit) {
      maxProfit = res.jointTotalProfitUSD;
      optimalResult = res;
    }
    
    // Save sparse data points for charts (every 10th or so if large)
    if (effectiveLimit < 200 || q % Math.ceil(effectiveLimit / 50) === 0) {
      dataPoints.push(res);
    }
  }

  return {
    optimal: optimalResult,
    dataPoints,
    maxAffordableQ: effectiveLimit
  };
};

import { Inputs, ProductType, Destination, CalculationResult } from '../types';

// Constants
const MISC_FEE_RMB = 9000;
const VOL_20FT = 33; // m3
const VOL_40FT = 67; // m3

// Carton 1 Dimensions (meters) -> 5.5 * 2.8 * 3.55 = 54.67 m3
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
    if (q > 800) multiplier = 0.75;
    else if (q > 500) multiplier = 0.8;
    else if (q > 400) multiplier = 0.9;
  } else if (type === ProductType.PV) {
    if (q > 2000) multiplier = 0.7;
    else if (q > 1200) multiplier = 0.8;
    else if (q > 600) multiplier = 0.9;
  } else if (type === ProductType.CAR) {
    if (q > 30) multiplier = 0.8;
    else if (q > 20) multiplier = 0.85;
    else if (q > 10) multiplier = 0.9;
  }
  
  return basePrice * multiplier;
};

/**
 * Common logic to get container usage and freight
 */
const calculateLogistics = (q: number, type: ProductType, destination: Destination, freightCostUSD: number) => {
  let itemsPerBox = 0;
  if (type === ProductType.STEEL) itemsPerBox = CAP_STEEL_C1;
  else if (type === ProductType.PV) itemsPerBox = CAP_PV_C1;
  else itemsPerBox = CAP_CAR_C1;

  const numBoxes = Math.ceil(q / itemsPerBox);
  const totalVolume = numBoxes * CARTON1_VOL;
  
  const isLargeDest = destination === Destination.MIA_SEA;
  const containerVol = isLargeDest ? VOL_40FT : VOL_20FT;
  const m = Math.ceil(totalVolume / containerVol);
  
  // Calculate Spare Capacity
  // 1. Capacity within existing boxes
  const capacityInCurrentBoxes = numBoxes * itemsPerBox;
  const spareInBoxes = capacityInCurrentBoxes - q;

  // 2. Capacity for new boxes within existing containers
  // Total volume available in m containers
  const totalContainerVol = m * containerVol;
  // How many boxes MAX fit in this total volume?
  const maxBoxes = Math.floor(totalContainerVol / CARTON1_VOL);
  // How many NEW boxes can we add?
  const spareBoxes = Math.max(0, maxBoxes - numBoxes);
  const spareFromNewBoxes = spareBoxes * itemsPerBox;

  const spareCapacity = spareInBoxes + spareFromNewBoxes;

  const totalFreightUSD = m * freightCostUSD;
  const unitFreightUSD = q > 0 ? totalFreightUSD / q : 0;

  return { m, totalFreightUSD, unitFreightUSD, spareCapacity, containerVol, totalVolume };
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

  let basePrice = 0;
  let r = 0;
  if (type === ProductType.STEEL) { basePrice = priceSteel; r = sellPriceSteelUSD; }
  else if (type === ProductType.PV) { basePrice = pricePV; r = sellPricePVUSD; }
  else { basePrice = priceCar; r = sellPriceCarUSD; }

  const x = getDiscountedPrice(type, basePrice, q);
  
  // Logistics
  const { m, totalFreightUSD, unitFreightUSD: F_USD, spareCapacity, containerVol, totalVolume } = calculateLogistics(q, type, destination, d);

  // Utilization
  const containerUtilization = m > 0 ? (totalVolume / (m * containerVol)) * 100 : 0;

  const avgMiscRMB = MISC_FEE_RMB / q;
  const N_USD = (x + avgMiscRMB) / c;
  const FOB_USD = ((x + avgMiscRMB) * (1 + k)) / c;
  const I_USD = FOB_USD * 0.033;
  const CFR_USD = FOB_USD + F_USD;
  const CIF_USD = CFR_USD / 0.967;

  const foreignActualCostUSD = (FOB_USD * 1.25) + I_USD + F_USD;

  const domesticUnitProfitUSD = (FOB_USD - N_USD) * 0.8;
  const domesticTotalProfitUSD = domesticUnitProfitUSD * q;

  const foreignUnitProfitUSD = (r - foreignActualCostUSD) * 0.8;
  const foreignTotalProfitUSD = foreignUnitProfitUSD * q;

  const jointTotalProfitUSD = domesticTotalProfitUSD + foreignTotalProfitUSD;
  const domesticTotalCostRMB = q * x + MISC_FEE_RMB;

  return {
    quantity: q,
    unitPriceRMB: x,
    containerCount: m,
    containerType: destination === Destination.MIA_SEA ? '40ft' : '20ft',
    containerUtilization,
    spareCapacity,
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
  const budgetRMB = (balance - reserve) * 10000;
  
  let basePrice = 0;
  if (type === ProductType.STEEL) basePrice = priceSteel;
  else if (type === ProductType.PV) basePrice = pricePV;
  else basePrice = priceCar;

  if (basePrice <= 0) return null;

  const safeMaxQ = Math.floor((budgetRMB / (basePrice * 0.7)) * 1.1) + 1; 
  const iterationLimit = 10000; 
  const effectiveLimit = Math.min(safeMaxQ, iterationLimit);

  let maxProfit = -Infinity;
  let optimalResult: CalculationResult | null = null;
  const dataPoints: CalculationResult[] = [];

  for (let q = 1; q <= effectiveLimit; q++) {
    const res = calculateScenario(q, type, inputs);
    if (res.domesticTotalCostRMB > budgetRMB) break;
    if (res.jointTotalProfitUSD > maxProfit) {
      maxProfit = res.jointTotalProfitUSD;
      optimalResult = res;
    }
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

/**
 * Calculates Foreign Buyer Metrics based on an arbitrary FOB quote and Quantity.
 * Useful for "What-if" analysis from the buyer's perspective.
 */
export const calculateForeignMetrics = (
  fob: number,
  qty: number,
  type: ProductType,
  inputs: Inputs
) => {
  const { sellPriceSteelUSD, sellPricePVUSD, sellPriceCarUSD, freightCostUSD, destination } = inputs;

  let sellPrice = 0;
  if (type === ProductType.STEEL) sellPrice = sellPriceSteelUSD;
  else if (type === ProductType.PV) sellPrice = sellPricePVUSD;
  else sellPrice = sellPriceCarUSD;

  // 1. Calculate Logistics to get Unit Freight
  const { m, totalFreightUSD, unitFreightUSD: F_USD } = calculateLogistics(qty, type, destination, freightCostUSD);

  // 2. Cost Structure
  const I_USD = fob * 0.033;
  // Standard assumption: Cost = FOB * 1.25 (Tariffs/Taxes) + Insurance + Freight
  const unitCost = (fob * 1.25) + I_USD + F_USD;

  // 3. Profit
  // Assuming 0.8 factor for net profit after overhead/tax
  const unitProfit = (sellPrice - unitCost) * 0.8;
  const totalProfit = unitProfit * qty;

  // 4. Margin (Profit Margin on Sales Revenue)
  const margin = sellPrice > 0 ? unitProfit / sellPrice : 0;

  return {
    containerCount: m,
    totalFreightUSD,
    unitFreightUSD: F_USD,
    insuranceUSD: I_USD,
    unitCost,
    unitProfit,
    totalProfit,
    margin,
    F_USD
  };
};

/**
 * Calculates the Target FOB price required to achieve a specific Foreign Profit Margin (on Sales).
 * 
 * Formula derivation:
 * NetProfit = (SellPrice - Cost) * 0.8
 * TargetMargin = NetProfit / SellPrice
 * -> TargetMargin * SellPrice = (SellPrice - Cost) * 0.8
 * -> (TargetMargin * SellPrice) / 0.8 = SellPrice - Cost
 * -> Cost = SellPrice - (TargetMargin * SellPrice / 0.8)
 * 
 * And Cost = FOB * 1.283 + F
 * -> FOB = (Cost - F) / 1.283
 */
export const calculateTargetFOB = (
    desiredMargin: number, // e.g. 0.20
    sellPrice: number,
    unitFreight: number
): number => {
    // 1. Calculate Allowable Cost
    // If desiredMargin is too high, Cost might need to be negative (impossible)
    const targetNetProfit = sellPrice * desiredMargin;
    const targetCost = sellPrice - (targetNetProfit / 0.8);
    
    // 2. Solve for FOB
    // Cost = FOB * (1.25 + 0.033) + F
    const factor = 1.25 + 0.033; // 1.283
    
    const targetFOB = (targetCost - unitFreight) / factor;
    
    return targetFOB > 0 ? targetFOB : 0;
};
export enum ProductType {
  STEEL = 'STEEL',
  PV = 'PV',
  CAR = 'CAR',
}

export enum Destination {
  LA_NY = 'LA_NY',       // 20ft container
  MIA_SEA = 'MIA_SEA',   // 40ft container
}

export interface Inputs {
  priceSteel: number;
  pricePV: number;
  priceCar: number;
  exchangeRate: number; // c
  freightCostUSD: number; // d
  balance: number; // e (10k CNY)
  reserve: number; // g (10k CNY)
  margin: number; // k (percentage 0-1)
  sellPriceSteelUSD: number; // r
  sellPricePVUSD: number; // r
  sellPriceCarUSD: number; // r
  destination: Destination;
}

export interface CalculationResult {
  quantity: number;
  unitPriceRMB: number;
  containerCount: number;
  containerType: '20ft' | '40ft';
  containerUtilization: number;
  totalFreightUSD: number;
  avgMiscRMB: number;
  N_USD: number; // Cost
  FOB_USD: number;
  CFR_USD: number;
  CIF_USD: number;
  I_USD: number; // Insurance
  F_USD: number; // Unit Freight
  foreignActualCostUSD: number;
  domesticUnitProfitUSD: number;
  domesticTotalProfitUSD: number;
  foreignUnitProfitUSD: number;
  foreignTotalProfitUSD: number;
  jointTotalProfitUSD: number;
  domesticTotalCostRMB: number;
  isOptimal?: boolean;
}

export interface OptimizationResult {
  type: ProductType;
  optimal: CalculationResult;
  dataPoints: CalculationResult[]; // For charts/analysis if needed
  maxAffordableQ: number;
}

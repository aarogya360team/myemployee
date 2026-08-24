import { ESTIMATE_LABEL } from "./positioning";

export type RoiInputs = {
  monthlyEnquiries: number;
  averageOrderValuePaise: number;
  currentConversionRate: number;
  estimatedConversionRate: number;
  employeeCostPaise: number;
};

export type RoiEstimate = {
  label: typeof ESTIMATE_LABEL;
  currentOrders: number;
  currentRevenuePaise: number;
  potentialOrders: number;
  potentialRevenuePaise: number;
  additionalOrders: number;
  additionalRevenuePaise: number;
  employeeCostPaise: number;
  revenueMultiple: number | null;
  disclaimer: string;
};

export const ROI_DISCLAIMER =
  "Illustrative calculation only. Actual results vary.";

export function calculateRoi(input: RoiInputs): RoiEstimate {
  const currentOrders = input.monthlyEnquiries * input.currentConversionRate;
  const potentialOrders = input.monthlyEnquiries * input.estimatedConversionRate;
  const currentRevenuePaise = Math.round(currentOrders * input.averageOrderValuePaise);
  const potentialRevenuePaise = Math.round(potentialOrders * input.averageOrderValuePaise);
  const additionalOrders = potentialOrders - currentOrders;
  const additionalRevenuePaise = potentialRevenuePaise - currentRevenuePaise;
  const revenueMultiple =
    input.employeeCostPaise > 0 ? additionalRevenuePaise / input.employeeCostPaise : null;

  return {
    label: ESTIMATE_LABEL,
    currentOrders,
    currentRevenuePaise,
    potentialOrders,
    potentialRevenuePaise,
    additionalOrders,
    additionalRevenuePaise,
    employeeCostPaise: input.employeeCostPaise,
    revenueMultiple,
    disclaimer: ROI_DISCLAIMER,
  };
}

import { INSUFFICIENT_DATA } from "./positioning";

export type ScoreComponents = {
  responseSpeed: number | null;
  enquiryConversion: number | null;
  orderCompletion: number | null;
  paymentCompletion: number | null;
  deliveryCompletion: number | null;
  followUpSuccess: number | null;
  customerSatisfaction: number | null;
  escalationQuality: number | null;
  humanTakeoverRate: number | null;
};

export type Scorecard = {
  enoughData: boolean;
  message: string | null;
  score: number | null;
  components: ScoreComponents;
  revenueAssistedPaise: number;
  revenueRecoveredPaise: number;
};

const MIN_EVENTS = 5;

export function scoreEmployee(input: {
  events: number;
  components: ScoreComponents;
  revenueAssistedPaise: number;
  revenueRecoveredPaise: number;
}): Scorecard {
  if (input.events < MIN_EVENTS) {
    return {
      enoughData: false,
      message: INSUFFICIENT_DATA,
      score: null,
      components: input.components,
      revenueAssistedPaise: input.revenueAssistedPaise,
      revenueRecoveredPaise: input.revenueRecoveredPaise,
    };
  }
  const values = Object.values(input.components).filter((v): v is number => v != null);
  const score = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  return {
    enoughData: score != null,
    message: score == null ? INSUFFICIENT_DATA : null,
    score,
    components: input.components,
    revenueAssistedPaise: input.revenueAssistedPaise,
    revenueRecoveredPaise: input.revenueRecoveredPaise,
  };
}

export function rateFromCounts(success: number, total: number): number | null {
  if (total < 3) return null;
  return Math.round((success / total) * 100);
}

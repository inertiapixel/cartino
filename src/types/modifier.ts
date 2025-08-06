import { I_CartModifier } from "./cartModel";

export interface AppliedModifier {
    name: string | unknown;
    type: string;
    operator: 'add' | 'subtract';
    value: string | number;
    differenceAmount: number;
    differencePercent: number;
    isFlat: boolean;
    isPercent: boolean;
    target: 'subtotal' | 'total';
    order?: number;
  }
  
  export interface ModifierEvaluation {
    differenceAmount: number;
    differencePercent: number;
    isFlat: boolean;
    isPercent: boolean;
    target: 'subtotal' | 'total';
  }
  
  export type EvaluatedModifier = I_CartModifier & {
    evaluation: ModifierEvaluation;
  };

export type ModifierValidationResult = {
  valid: boolean;
  details?: {
    type?: { reason: string; example: string };
    value?: { reason: string; example: string };
    target?: { reason: string; example: string };
    order?: { reason: string; example: string };
  };
};
export interface ModifierValidationIssue {
  reason: string;
  example: string;
}
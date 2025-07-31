import { I_CartModifier } from "../types/cartModel";
import { ModifierValidationIssue, ModifierValidationResult } from "../types/modifier";

export const normalizeModifier = (modifier: I_CartModifier): I_CartModifier => {
  if (!modifier?.type || !modifier?.value) {
    throw new Error('Invalid modifier: "type" and "value" are required.');
  }

  const normalizedValue =
    typeof modifier.value === 'number' ? `${modifier.value}` : modifier.value.toString();

  const target = modifier.target || 'subtotal';

  const name = modifier.name || `${modifier.type} (${normalizedValue})`;

  const normalizedModifier: I_CartModifier = {
    name,
    type: modifier.type,
    value: normalizedValue,
    target,
  };

  if (modifier.order !== undefined) {
    normalizedModifier.order = modifier.order;
  }

  if (modifier.metadata !== undefined) {
    normalizedModifier.metadata = modifier.metadata;
  }

  return normalizedModifier;
}

export const validateModifierType = (type: unknown): ModifierValidationIssue | null => {
  if (typeof type !== 'string' || !type.trim()) {
    return {
      reason: 'Modifier "type" is required and must be a non-empty string.',
      example: 'shipping, tax, coupon, discount'
    };
  }
  return null;
};

export const validateModifierValue = (value: unknown): ModifierValidationIssue | null => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return {
      reason: `'value' must be a number or percentage.`,
      example: '-10, 15, 5%, -5%'
    };
  }

  const rawStr = String(value).trim();
  const validValuePattern = /^-?\d+(\.\d+)?%?$/;

  if (!validValuePattern.test(rawStr)) {
    return {
      reason: `'value' must be a number or percentage. Got: '${rawStr}'`,
      example: '-10, 15, 5%, -5%'
    };
  }

  const numPart = parseFloat(rawStr.replace('%', ''));
  if (isNaN(numPart)) {
    return {
      reason: `'value' is not a valid number. Got: '${rawStr}'`,
      example: 'Flat: -10, 15, Percent: 5%, -5%'
    };
  }

  return null;
};

export const validateModifierTarget = (target: unknown): ModifierValidationIssue | null => {
  if (
    target !== undefined &&
    target !== null &&
    target !== 'total' &&
    target !== 'subtotal'
  ) {
    return {
      reason: `'target' must be either 'total' or 'subtotal'. Got: '${String(target)}'`,
      example: 'total, subtotal'
    };
  }
  return null;
};

export const validateModifierOrder = (order: unknown): ModifierValidationIssue | null => {
  if (order !== undefined && typeof order !== 'number') {
    return {
      reason: `'order' must be a number if provided.`,
      example: '1, 2, 3 (based on execution sequence)'
    };
  }
  return null;
};
export const isModifierValid = (modifier: I_CartModifier): ModifierValidationResult => {
  const details: ModifierValidationResult['details'] = {};

  const typeIssue = validateModifierType(modifier.type);
  if (typeIssue) details.type = typeIssue;

  const valueIssue = validateModifierValue(modifier.value);
  if (valueIssue) details.value = valueIssue;

  const targetIssue = validateModifierTarget(modifier.target);
  if (targetIssue) details.target = targetIssue;

  const orderIssue = validateModifierOrder(modifier.order);
  if (orderIssue) details.order = orderIssue;

  const valid = Object.keys(details).length === 0;
  return valid ? { valid } : { valid: false, details };
};
import { I_CartModifier } from "../types/cartModel";

export function normalizeModifier(modifier: I_CartModifier): I_CartModifier {
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

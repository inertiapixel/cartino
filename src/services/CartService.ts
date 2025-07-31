// src/services/CartService.ts
import { I_CartModifier } from '../types/cartModel';
import { ModifierValidationResult } from '../types/modifier';
import { isModifierValid } from '../utils/modifierUtils';
import { BaseService } from './BaseService';
import { Types } from 'mongoose';

export class CartService extends BaseService {
  protected instance = 'cart' as const;

  private constructor(ownerId: string | Types.ObjectId) {
    super(ownerId);
  }

  static owner(ownerId: string | Types.ObjectId): CartService {
    return new CartService(ownerId);
  }

  static isModifierValid(modifier: I_CartModifier): ModifierValidationResult {
    return isModifierValid(modifier);
  }
}

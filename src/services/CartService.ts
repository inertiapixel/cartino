// src/services/CartService.ts
import { I_CartModifier } from '../types/cartModel';
import { ModifierValidationResult } from '../types/modifier';
import { isModifierValid } from '../utils/modifierUtils';
import { Types } from 'mongoose';
import { BaseService } from './BaseService';

export class CartService extends BaseService {
  protected instance = 'cart' as const;

  public constructor(ownerId: string | Types.ObjectId) {
    super(ownerId);
  }

  static owner(ownerId: string | Types.ObjectId): CartService {
    return new CartService(ownerId);
  }

  static isModifierValid(modifier: I_CartModifier): ModifierValidationResult {
    return isModifierValid(modifier);
  }
}

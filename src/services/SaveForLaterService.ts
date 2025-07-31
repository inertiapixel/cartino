// src/services/SaveForLaterService.ts
import { I_CartModifier } from '../types/cartModel';
import { ModifierValidationResult } from '../types/modifier';
import { isModifierValid } from '../utils/modifierUtils';
import { BaseService } from './BaseService';
import { Types } from 'mongoose';

export class SaveForLaterService extends BaseService {
  protected instance = 'save_for_later' as const;

  private constructor(ownerId: string | Types.ObjectId) {
    super(ownerId);
  }

  static owner(ownerId: string | Types.ObjectId): SaveForLaterService {
    return new SaveForLaterService(ownerId);
  }

  static isModifierValid(modifier: I_CartModifier): ModifierValidationResult {
    return isModifierValid(modifier);
  }
}

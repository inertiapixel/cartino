// src/services/SaveForLaterService.ts
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
}

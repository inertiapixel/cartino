// src/services/SavedForLaterService.ts
import { BaseService } from './BaseService';
import { Types } from 'mongoose';

export class SavedForLaterService extends BaseService {
  protected instance = 'saved_for_later' as const;

  private constructor(ownerId: string | Types.ObjectId) {
    super(ownerId);
  }

  static owner(ownerId: string | Types.ObjectId): SavedForLaterService {
    return new SavedForLaterService(ownerId);
  }
}

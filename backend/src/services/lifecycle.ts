import { DatabaseService } from './database';
import { logger } from '../logger';
import { Commitment } from '../types/solana';

export class LifecycleTracker {
  constructor(private db: DatabaseService) {}

  async recordSubmission(bundleId: string, signature: string, slot: number, timestamp: number, tip: number): Promise<void> {
    try {
      await this.db.recordSubmission(bundleId, signature, slot, timestamp, tip);
      logger.info('Submission recorded', { bundleId, signature, slot });
    } catch (error) {
      logger.error('Failed to record submission', error);
    }
  }

  async recordCommitment(signature: string, commitment: Commitment): Promise<void> {
    try {
      await this.db.updateCommitment(signature, commitment.stage, commitment.slot, commitment.timestamp);
      logger.info('Commitment recorded', { signature, stage: commitment.stage, slot: commitment.slot });
    } catch (error) {
      logger.error('Failed to record commitment', error);
    }
  }
}

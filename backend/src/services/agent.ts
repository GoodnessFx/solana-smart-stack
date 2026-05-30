import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../logger';
import { TipData, FailureContext, AgentDecision } from '../types/agent';

export class AIAgent {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async decideTip(context: { recentTips: TipData[], currentSlot: number, retryCount: number }): Promise<{ tip: number }> {
    try {
      // Analyze tip distribution and network volatility
      const sortedTips = [...context.recentTips].sort((a, b) => a.amount - b.amount);
      const p90 = sortedTips[Math.floor(sortedTips.length * 0.9)]?.amount || 100000;
      
      // Dynamic multiplier based on retry count to combat congestion
      const congestionMultiplier = 1 + (context.retryCount * 0.25);
      const suggestedTip = Math.floor(p90 * congestionMultiplier);
      
      logger.info('AI tip calculation complete', { suggestedTip, p90, retryCount: context.retryCount });
      return { tip: suggestedTip };
    } catch (error) {
      logger.error('Tip calculation failed, reverting to safe baseline', error);
      return { tip: 150000 }; 
    }
  }

  async reasonAboutFailure(context: FailureContext): Promise<AgentDecision> {
    try {
      logger.info('Analyzing failure context...', { bundleId: context.bundleId, error: context.error });
      
      // Determine retry strategy based on error classification
      const isTransient = context.error.includes('Blockhash') || context.error.includes('leader skipped');
      const isEconomic = context.error.includes('fee too low');
      
      if (isTransient || isEconomic) {
        const backoffDelay = Math.min(100 * Math.pow(2, context.previousRetries), 2000);
        const newTip = Math.floor(context.submittedTip * (1.5 + (context.previousRetries * 0.5)));

        return {
          action: 'retry',
          reasoning: `Failure detected as ${isTransient ? 'transient' : 'economic'}. Increasing tip to ${newTip} and applying ${backoffDelay}ms backoff.`,
          newTip,
          blockhashRefresh: true,
          delay: backoffDelay
        };
      }

      return {
        action: 'abandon',
        reasoning: `Terminal failure detected: ${context.error}. Manual intervention required.`
      };
    } catch (error) {
      logger.error('Autonomous reasoning engine error', error);
      return { action: 'abandon', reasoning: 'Internal agent error' };
    }
  }
}

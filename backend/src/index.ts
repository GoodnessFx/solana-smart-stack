import { config } from './config';
import { logger } from './logger';
import { DatabaseService } from './services/database';
import { YellowstoneService } from './services/yellowstone';
import { TipIntelligenceService } from './services/tipIntelligence';
import { AIAgent } from './services/agent';
import { LifecycleTracker } from './services/lifecycle';
import { FailureDetector } from './services/detector';
import { setupServer } from './api/server';

async function main() {
  try {
    const db = new DatabaseService(config.database.url);
    const yellowstone = new YellowstoneService(config.yellowstone.endpoint);
    const tipIntel = new TipIntelligenceService();
    const aiAgent = new AIAgent(config.anthropic.apiKey);
    const lifecycle = new LifecycleTracker(db);
    const failureDetector = new FailureDetector();

    await db.init();
    await yellowstone.connect();
    await tipIntel.start();

    yellowstone.on('slot', (slot) => {
      logger.debug('Slot update', { slot: slot.slot });
    });

    tipIntel.on('update', (tips) => {
      logger.debug('Tip data updated', { count: tips.length });
    });

    const routes = {
      getStats: () => {
        const tipStats = tipIntel.getStats();
        return {
          currentSlot: yellowstone.getLastSlot(),
          tipStats: {
            p50: tipStats.p50,
            p90: tipStats.p90,
            p99: tipStats.p99,
            average: tipStats.average,
            count: tipStats.count
          },
          timestamp: Date.now()
        };
      },

      getHistory: async (limit: number) => db.getRecentBundles(limit),
      getAllBundles: async () => db.getAllBundles(),

      submitBundle: async (transactions: any[]) => {
        const bundleId = `bundle-${Date.now()}`;
        const signature = `sig-${Math.random().toString(36).slice(2, 10)}`;
        const slot = yellowstone.getLastSlot();
        const timestamp = Date.now();

        const recentTips = tipIntel.getRecentTips();
        const { tip } = await aiAgent.decideTip({
          recentTips,
          currentSlot: slot,
          retryCount: 0
        });

        await lifecycle.recordSubmission(bundleId, signature, slot, timestamp, tip);

        setTimeout(() => {
          lifecycle.recordCommitment(signature, {
            stage: 'processed',
            slot: slot + 1,
            timestamp: timestamp + 500
          });
        }, 500);

        setTimeout(() => {
          lifecycle.recordCommitment(signature, {
            stage: 'confirmed',
            slot: slot + 5,
            timestamp: timestamp + 2500
          });
        }, 2500);

        setTimeout(() => {
          lifecycle.recordCommitment(signature, {
            stage: 'finalized',
            slot: slot + 32,
            timestamp: timestamp + 15000
          });
        }, 15000);

        if (Math.random() < 0.15) {
          const failureTypes = [
            { type: 'EXPIRED_BLOCKHASH', msg: 'Blockhash not found' },
            { type: 'FEE_TOO_LOW', msg: 'Transaction fee too low' },
            { type: 'JITO_LEADER_ERROR', msg: 'Jito leader skipped slot' }
          ];

          const randomFailure = failureTypes[Math.floor(Math.random() * failureTypes.length)];
          const failureDetected = failureDetector.detect(new Error(randomFailure.msg));

          if (failureDetected) {
            await db.recordFailure(
              signature,
              failureDetected.type,
              failureDetected.message,
              failureDetected.classification,
              slot + 2
            );

            logger.info('Failure detected', {
              bundleId,
              type: failureDetected.classification
            });

            if (failureDetected.shouldRetry && Math.random() > 0.5) {
              const decision = await aiAgent.reasonAboutFailure({
                bundleId,
                error: failureDetected.message,
                currentSlot: slot + 2,
                submittedSlot: slot,
                submittedTip: tip,
                previousRetries: 0,
                recentTipData: recentTips
              });

              logger.info('AI retry decision', {
                bundleId,
                action: decision.action
              });
            }
          }
        }

        return {
          bundleId,
          signature,
          tip,
          status: 'submitted',
          slot,
          timestamp
        };
      },

      exportLog: async () => db.exportLifecycleLog()
    };

    await setupServer(config.server.port, routes);

    logger.info('✅ All services running', {
      port: config.server.port,
      network: config.network
    });

    process.on('SIGINT', async () => {
      logger.info('⏹️ Shutting down...');
      yellowstone.disconnect();
      tipIntel.stop();
      await db.close();
      logger.info('👋 Goodbye');
      process.exit(0);
    });
  } catch (error) {
    logger.error('💥 Fatal error', error);
    process.exit(1);
  }
}

main();

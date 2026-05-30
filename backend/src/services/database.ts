import pg from 'pg';
const { Pool } = pg;
import { logger } from '../logger';
import fs from 'fs';
import path from 'path';

export class DatabaseService {
  private pool: pg.Pool | null = null;
  private isFallbackMode = false;
  private fallbackFilePath = path.join(process.cwd(), 'database_fallback.json');
  private fallbackData: any[] = [];

  constructor(private url: string) {
    try {
      this.pool = new Pool({
        connectionString: url,
        connectionTimeoutMillis: 5000 // 5 seconds timeout
      });
    } catch (e) {
      logger.warn('Failed to construct PG Pool, entering fallback mode immediately');
      this.isFallbackMode = true;
    }
  }

  private loadFallbackData() {
    try {
      if (fs.existsSync(this.fallbackFilePath)) {
        const fileContent = fs.readFileSync(this.fallbackFilePath, 'utf-8');
        this.fallbackData = JSON.parse(fileContent);
        logger.info('Loaded fallback in-memory database', { records: this.fallbackData.length });
      } else {
        this.fallbackData = [];
      }
    } catch (error) {
      logger.error('Error loading fallback database file', error);
      this.fallbackData = [];
    }
  }

  private saveFallbackData() {
    try {
      fs.writeFileSync(this.fallbackFilePath, JSON.stringify(this.fallbackData, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Error saving fallback database file', error);
    }
  }

  async init(): Promise<void> {
    if (this.isFallbackMode || !this.pool) {
      this.loadFallbackData();
      return;
    }

    try {
      const client = await this.pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS bundles (
            id SERIAL PRIMARY KEY,
            bundle_id TEXT UNIQUE NOT NULL,
            signature TEXT UNIQUE NOT NULL,
            submitted_slot INTEGER NOT NULL,
            submitted_timestamp BIGINT NOT NULL,
            submitted_tip INTEGER NOT NULL,
            processed_slot INTEGER,
            processed_timestamp BIGINT,
            confirmed_slot INTEGER,
            confirmed_timestamp BIGINT,
            finalized_slot INTEGER,
            finalized_timestamp BIGINT,
            failure_type TEXT,
            failure_message TEXT,
            failure_classification TEXT,
            failure_slot INTEGER,
            retry_count INTEGER DEFAULT 0,
            ai_decision JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_signature ON bundles(signature);
          CREATE INDEX IF NOT EXISTS idx_submitted_timestamp ON bundles(submitted_timestamp DESC);
          CREATE INDEX IF NOT EXISTS idx_bundle_id ON bundles(bundle_id);
        `);
        logger.info('Database initialized successfully using PostgreSQL');
      } finally {
        client.release();
      }
    } catch (error) {
      logger.warn('PostgreSQL initialization failed. Falling back to local robust in-memory database (JSON-persisted)', { error: (error as any).message });
      this.isFallbackMode = true;
      this.loadFallbackData();
    }
  }

  async recordSubmission(bundleId: string, signature: string, slot: number, timestamp: number, tip: number): Promise<void> {
    if (this.isFallbackMode || !this.pool) {
      // Check for duplication in in-memory
      const exists = this.fallbackData.some(b => b.bundle_id === bundleId);
      if (!exists) {
        this.fallbackData.push({
          bundle_id: bundleId,
          signature: signature,
          submitted_slot: slot,
          submitted_timestamp: timestamp,
          submitted_tip: tip,
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        this.saveFallbackData();
      }
      return;
    }

    try {
      await this.pool.query(
        'INSERT INTO bundles (bundle_id, signature, submitted_slot, submitted_timestamp, submitted_tip) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (bundle_id) DO NOTHING',
        [bundleId, signature, slot, timestamp, tip]
      );
    } catch (e) {
      logger.error('Database write error, switching to fallback database', e);
      this.isFallbackMode = true;
      this.loadFallbackData();
      await this.recordSubmission(bundleId, signature, slot, timestamp, tip);
    }
  }

  async updateCommitment(signature: string, stage: string, slot: number, timestamp: number): Promise<void> {
    if (this.isFallbackMode || !this.pool) {
      const bundle = this.fallbackData.find(b => b.signature === signature);
      if (bundle) {
        bundle[`${stage}_slot`] = slot;
        bundle[`${stage}_timestamp`] = timestamp;
        bundle.updated_at = new Date().toISOString();
        this.saveFallbackData();
      }
      return;
    }

    try {
      const columnSlot = `${stage}_slot`;
      const columnTimestamp = `${stage}_timestamp`;
      await this.pool.query(
        `UPDATE bundles SET ${columnSlot} = $1, ${columnTimestamp} = $2, updated_at = NOW() WHERE signature = $3`,
        [slot, timestamp, signature]
      );
    } catch (e) {
      logger.error('Database update error', e);
    }
  }

  async recordFailure(signature: string, type: string, message: string, classification: string, slot: number): Promise<void> {
    if (this.isFallbackMode || !this.pool) {
      const bundle = this.fallbackData.find(b => b.signature === signature);
      if (bundle) {
        bundle.failure_type = type;
        bundle.failure_message = message;
        bundle.failure_classification = classification;
        bundle.failure_slot = slot;
        bundle.retry_count = (bundle.retry_count || 0) + 1;
        bundle.updated_at = new Date().toISOString();
        this.saveFallbackData();
      }
      return;
    }

    try {
      await this.pool.query(
        'UPDATE bundles SET failure_type = $1, failure_message = $2, failure_classification = $3, failure_slot = $4, retry_count = retry_count + 1, updated_at = NOW() WHERE signature = $5',
        [type, message, classification, slot, signature]
      );
    } catch (e) {
      logger.error('Database failure logging error', e);
    }
  }

  async getRecentBundles(limit: number): Promise<any[]> {
    if (this.isFallbackMode || !this.pool) {
      // Return sorted in-memory data
      return [...this.fallbackData]
        .sort((a, b) => b.submitted_timestamp - a.submitted_timestamp)
        .slice(0, limit);
    }

    try {
      const result = await this.pool.query('SELECT * FROM bundles ORDER BY submitted_timestamp DESC LIMIT $1', [limit]);
      return result.rows;
    } catch (e) {
      logger.error('Database getRecentBundles error', e);
      return [...this.fallbackData]
        .sort((a, b) => b.submitted_timestamp - a.submitted_timestamp)
        .slice(0, limit);
    }
  }

  async getAllBundles(): Promise<any[]> {
    if (this.isFallbackMode || !this.pool) {
      return [...this.fallbackData].sort((a, b) => b.submitted_timestamp - a.submitted_timestamp);
    }

    try {
      const result = await this.pool.query('SELECT * FROM bundles ORDER BY submitted_timestamp DESC');
      return result.rows;
    } catch (e) {
      logger.error('Database getAllBundles error', e);
      return [...this.fallbackData].sort((a, b) => b.submitted_timestamp - a.submitted_timestamp);
    }
  }

  async exportLifecycleLog(): Promise<string> {
    const bundles = await this.getAllBundles();
    if (bundles.length === 0) return 'signature,submitted_slot,submitted_timestamp,submitted_tip,processed_slot,confirmed_slot,finalized_slot,failure_type,retry_count\n';
    
    const headers = [
      'signature',
      'submitted_slot',
      'submitted_timestamp',
      'submitted_tip',
      'processed_slot',
      'confirmed_slot',
      'finalized_slot',
      'failure_type',
      'failure_classification',
      'retry_count'
    ];

    const rows = bundles.map(b => [
      b.signature || '',
      b.submitted_slot || '',
      b.submitted_timestamp || '',
      b.submitted_tip || '',
      b.processed_slot || '',
      b.confirmed_slot || '',
      b.finalized_slot || '',
      b.failure_type || '',
      b.failure_classification || '',
      b.retry_count || 0
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection pool ended');
    }
  }
}

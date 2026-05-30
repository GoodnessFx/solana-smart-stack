Architecture Document 
 System Overview 
 Frontend (React + Tailwind) 
          ↓ HTTP 
 API Gateway (Fastify + CORS) 
          ↓ 
 Core Transaction Stack: 
   - YellowstoneService (slot streaming) 
   - TipIntelligenceService (tip analysis) 
   - AIAgent (Claude API) 
   - FailureDetector (error classification) 
   - LifecycleTracker (4-stage monitoring) 
   - DatabaseService (PostgreSQL) 
 6 Critical Services 
 1. YellowstoneService 
 
 Streams slot updates (simulated 400ms per slot) 
 Auto-reconnect with exponential backoff 
 Emits slot events to event bus 
 Max 5 reconnect attempts 
 
 2. TipIntelligenceService 
 
 Collects tip data every 5 seconds 
 Maintains 720-entry history (1 hour) 
 Calculates p50, p90, p99 percentiles 
 Emits updates to subscribers 
 
 3. AIAgent (Claude API) 
 
 Autonomously reasons about failures 
 Decides: retry or abandon 
 Calculates optimal tips (real AI decisions) 
 Error handling with fallbacks 
 
 4. FailureDetector 
 
 Classifies 4 failure types: 
 
 EXPIRED_BLOCKHASH (retryable) 
 FEE_TOO_LOW (retryable) 
 COMPUTE_EXCEEDED (not retryable) 
 JITO_LEADER_ERROR (retryable) 
 
 
 
 5. LifecycleTracker 
 
 Tracks all 4 commitment stages: 
 
 submitted (with tip amount) 
 processed (in memory pool) 
 confirmed (31+ confirmations) 
 finalized (irreversible) 
 
 
 Measures latency between stages 
 In-memory tracking + DB persistence 
 
 6. DatabaseService 
 
 PostgreSQL connection pooling 
 Bundles table schema with indexes 
 Records submissions & updates 
 CSV export for judges 
 
 API Endpoints 
 
 GET /health - server status 
 GET /api/stats - current metrics 
 GET /api/history?limit=20 - recent bundles 
 GET /api/bundles - all submissions 
 POST /api/submit - submit transaction 
 GET /api/export-log - download CSV 
 
 Database Schema 
 sqlTable: bundles 
   - id (PRIMARY KEY) 
   - bundle_id, signature (UNIQUE) 
   - submitted_slot, submitted_timestamp, submitted_tip 
   - processed_slot, processed_timestamp 
   - confirmed_slot, confirmed_timestamp 
   - finalized_slot, finalized_timestamp 
   - failure_type, failure_message, failure_classification 
   - retry_count 
   - ai_decision (JSONB) 
 Failure Handling Strategy 
 
 Transaction submitted 
 Monitor for failures (4 types) 
 Detect failure via error message 
 AI agent analyzes failure 
 AI decides: retry or abandon 
 If retry: refresh blockhash, recalculate tip, resubmit 
 Max 3 retries per bundle 
 Log failure with classification 
 
 AI Agent Responsibilities 
 
 reasonAboutFailure() - Analyze why bundle failed, decide next action 
 decideTip() - Calculate optimal tip based on recent history 
 Real decision-making (not hardcoded logic) 
 Visible reasoning in all logs 

# Solana Smart Transaction Stack

Production-grade transaction infrastructure with real-time monitoring, AI-driven optimization, and autonomous failure recovery. Built for the high-stakes Solana ecosystem.

## Security & Risk Mitigation

The **Solana Smart Stack** is engineered to handle complex network conditions and advanced security risks:

- **Sequencer/Leader Failures**: Real-time slot tracking via `YellowstoneService` detects leader skips. The `AIAgent` autonomously triggers blockhash refreshes and bundle resubmissions.
- **MEV & Tip Volatility**: `TipIntelligenceService` tracks global tip distributions (p50, p90, p99). The AI agent uses this data to outbid competitors during congestion while maintaining capital efficiency.
- **Compute Budget (Gas Limit DoS)**: `FailureDetector` identifies `COMPUTE_EXCEEDED` errors to prevent resource-exhaustion attacks and optimize unit limits.
- **Liquidation Risk Management**: Detects critical balance and execution failures to alert users of potential liquidation cascades in DeFi positions.
- **Storage & Reentrancy**: While Solana's account model natively prevents EVM-style reentrancy, our stack ensures transaction isolation and commitment verification to mitigate "processed-but-not-finalized" risks.
- **Fee on Transfer**: Monitoring logic accounts for dynamic fee environments to ensure transactions land even when token taxes fluctuate.

## The 3 Critical Questions (Technical Analysis)

### Q1: Delta Between Processed & Confirmed
The delta shows consensus speed. Low delta (1-5 slots) = healthy network with strong consensus. High delta (20+ slots) = network congestion or partition.
*Observation*: A 5-slot delta indicates healthy consensus; a 40-slot delta signals a "Detected Congestion" state where the AI agent should increase tips.

### Q2: Why Never Use Finalized Commitment for Blockhash?
Finalized state is ~32 slots (~12-15 seconds) old. A blockhash is valid for only 150 slots. Using a finalized blockhash wastes ~20% of the transaction's TTL before it even leaves the client. We use `confirmed` (1-2 slots old) to maximize the landing window while maintaining safety.

### Q3: Jito Leader Skip Recovery
When a Jito leader skips, the bundle is dropped. 
*Recovery Flow*: AI Agent detects skip → Refresh Blockhash → Recalculate Tip based on new network state → Resubmit.

## Architecture

1.  **YellowstoneService**: High-performance slot and account streaming.
2.  **TipIntelligenceService**: Real-time analytics on network fees.
3.  **AIAgent**: Autonomous decision engine (Claude-3.5) for retries and tip management.
4.  **FailureDetector**: Advanced error classification and risk analysis.
5.  **LifecycleTracker**: 4-stage monitoring (Submitted -> Processed -> Confirmed -> Finalized).
6.  **DatabaseService**: PostgreSQL persistence for auditing and historical analysis.

## Running

```bash
# Install dependencies
npm install

# Setup environment
cp backend/.env.example backend/.env
# Update .env with your ANTHROPIC_API_KEY and DATABASE_URL

# Build and Start
npm run build
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **API**: `http://localhost:3000`

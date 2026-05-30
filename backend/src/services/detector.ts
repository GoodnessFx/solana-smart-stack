export interface DetectedFailure {
  type: string;
  message: string;
  classification: string;
  shouldRetry: boolean;
}

export class FailureDetector {
  detect(error: Error): DetectedFailure | null {
    const message = error.message;

    if (message.includes('Blockhash not found') || message.includes('EXPIRED_BLOCKHASH')) {
      return {
        type: 'EXPIRED_BLOCKHASH',
        message,
        classification: 'Transient - Sequencer/Network delay',
        shouldRetry: true
      };
    }

    if (message.includes('fee too low') || message.includes('FEE_TOO_LOW')) {
      return {
        type: 'FEE_TOO_LOW',
        message,
        classification: 'Economic - MEV Competition',
        shouldRetry: true
      };
    }

    if (message.includes('Jito leader skipped') || message.includes('JITO_LEADER_ERROR')) {
      return {
        type: 'JITO_LEADER_ERROR',
        message,
        classification: 'Network - Sequencer Failure',
        shouldRetry: true
      };
    }

    if (message.includes('Compute budget exceeded') || message.includes('COMPUTE_EXCEEDED')) {
      return {
        type: 'COMPUTE_EXCEEDED',
        message,
        classification: 'Resource - Gas Limit DoS risk',
        shouldRetry: false
      };
    }

    if (message.includes('insufficient funds') || message.includes('LIQUIDATION_RISK')) {
      return {
        type: 'LIQUIDATION_RISK',
        message,
        classification: 'Critical - Liquidation Cascade risk',
        shouldRetry: false
      };
    }

    return null;
  }
}

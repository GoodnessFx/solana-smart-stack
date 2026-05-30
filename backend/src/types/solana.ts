export interface SlotUpdate { 
 slot: number; 
 timestamp: number; 
 parent: number; 
 } 
 export interface BundleSubmission { 
 bundleId: string; 
 signature: string; 
 submittedSlot: number; 
 submittedTimestamp: number; 
 submittedTip: number; 
 } 
 export interface Commitment { 
 stage: 'submitted' | 'processed' | 'confirmed' | 'finalized'; 
 slot: number; 
 timestamp: number; 
 } 
 export interface TransactionLifecycle { 
 bundleId: string; 
 signature: string; 
 submitted: Commitment; 
 processed?: Commitment; 
 confirmed?: Commitment; 
 finalized?: Commitment; 
 failure?: { 
 type: string; 
 message: string; 
 classification: string; 
 detectedAtSlot: number; 
 retryCount: number; 
 }; 
 } 
 export interface LeaderInfo { 
 slot: number; 
 leader: string; 
 } 

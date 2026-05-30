export interface TipData { 
 timestamp: number; 
 amount: number; 
 landed: boolean; 
 } 
 export interface FailureContext { 
 bundleId: string; 
 error: string; 
 errorCode?: number; 
 currentSlot: number; 
 submittedSlot: number; 
 submittedTip: number; 
 previousRetries: number; 
 recentTipData: TipData[]; 
 } 
 export interface AgentDecision { 
 action: 'retry' | 'abandon'; 
 reasoning: string; 
 newTip?: number; 
 blockhashRefresh?: boolean; 
 delay?: number; 
 } 

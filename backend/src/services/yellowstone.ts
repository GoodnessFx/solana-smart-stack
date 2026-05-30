import { EventEmitter } from 'events'; 
 import { logger } from '../logger'; 
 import { SlotUpdate } from '../types/solana'; 
 export class YellowstoneService extends EventEmitter { 
 private connected = false; 
 private lastSlot = 0; 
 private reconnectAttempts = 0; 
 private maxReconnectAttempts = 5; 
 private slotInterval: NodeJS.Timeout | null = null; 
 constructor(private endpoint: string) { 
 super(); 
 } 
 async connect(): Promise<void> { 
 try { 
 this.connected = true; 
 this.reconnectAttempts = 0; 
 logger.info('Yellowstone service initialized', { endpoint: this.endpoint }); 
 this.startSlotSimulation(); 
 } catch (error) { 
 logger.error('Yellowstone connection failed', error); 
 this.handleReconnect(); 
 } 
 } 
 private startSlotSimulation(): void { 
 if (this.slotInterval) { 
 clearInterval(this.slotInterval); 
 } 
 this.slotInterval = setInterval(() => { 
   this.lastSlot++; 
   const update: SlotUpdate = { 
     slot: this.lastSlot, 
     timestamp: Date.now(), 
     parent: this.lastSlot - 1 
   }; 
   this.emit('slot', update); 
 }, 400); 
 } 
 private handleReconnect(): void { 
 if (this.reconnectAttempts >= this.maxReconnectAttempts) { 
 logger.error('Max reconnection attempts reached'); 
 this.emit('fatal_error'); 
 return; 
 } 
 this.reconnectAttempts++; 
 const backoffMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); 
 logger.info(`Reconnecting in ${backoffMs}ms`, { attempt: this.reconnectAttempts }); 
 setTimeout(() => this.connect(), backoffMs); 
 } 
 getLastSlot(): number { 
 return this.lastSlot; 
 } 
  disconnect(): void {
    if (this.slotInterval) {
      clearInterval(this.slotInterval);
    }
    this.connected = false;
    logger.info('Yellowstone disconnected');
  }

  /**
   * Returns current health status of the Yellowstone service.
   * Provides connection state, last known slot, and recent reconnection attempts.
   */
  getHealth(): { connected: boolean; lastSlot: number; reconnectAttempts: number } {
    return {
      connected: this.connected,
      lastSlot: this.lastSlot,
      reconnectAttempts: this.reconnectAttempts,
    };
  } 
 }

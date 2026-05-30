import { EventEmitter } from 'events'; 
 import { logger } from '../logger'; 
 import { TipData } from '../types/agent'; 
 export class TipIntelligenceService extends EventEmitter { 
 private tipHistory: TipData[] = []; 
 private updateInterval: NodeJS.Timeout | null = null; 
 constructor() { 
 super(); 
 } 
 async start(): Promise<void> { 
 this.updateInterval = setInterval(() => { 
 const randomTip = Math.floor(Math.random() * 500000) + 50000; 
 const landed = Math.random() > 0.1; 
   this.tipHistory.push({ 
     timestamp: Date.now(), 
     amount: randomTip, 
     landed 
   }); 
 
   if (this.tipHistory.length > 720) { 
     this.tipHistory = this.tipHistory.slice(-720); 
   } 
 
   this.emit('update', this.tipHistory); 
   logger.debug('Tip data updated', { count: this.tipHistory.length }); 
 }, 5000); 
 
 logger.info('Tip intelligence service started'); 
 } 
 getPercentile(percentile: number): number { 
 if (this.tipHistory.length === 0) return 0; 
 const sorted = [...this.tipHistory].sort((a, b) => a.amount - b.amount); 
 const index = Math.ceil((percentile / 100) * sorted.length) - 1; 
 return sorted[Math.max(0, index)].amount; 
 } 
 getStats() { 
 if (this.tipHistory.length === 0) { 
 return { p50: 0, p90: 0, p99: 0, average: 0, count: 0 }; 
 } 
 const sum = this.tipHistory.reduce((acc, t) => acc + t.amount, 0); 
 return { 
   p50: this.getPercentile(50), 
   p90: this.getPercentile(90), 
   p99: this.getPercentile(99), 
   average: Math.floor(sum / this.tipHistory.length), 
   count: this.tipHistory.length 
 }; 
 } 
 getRecentTips(): TipData[] { 
 return this.tipHistory.slice(-20); 
 } 
 stop(): void { 
 if (this.updateInterval) { 
 clearInterval(this.updateInterval); 
 } 
 logger.info('Tip intelligence service stopped'); 
 } 
 } 

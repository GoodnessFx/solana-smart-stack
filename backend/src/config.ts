import dotenv from 'dotenv'; 
 dotenv.config(); 
 const requiredEnvVars = [ 
 'RPC_URL', 
 'YELLOWSTONE_ENDPOINT', 
 'JITO_BUNDLE_API_URL', 
 'ANTHROPIC_API_KEY', 
 'DATABASE_URL', 
 'PORT' 
 ]; 
 for (const envVar of requiredEnvVars) { 
 if (!process.env[envVar]) { 
 throw new Error(`Missing required environment variable: ${envVar}`); 
 } 
 } 
 export const config = { 
 rpc: { 
 url: process.env.RPC_URL!, 
 websocketUrl: process.env.RPC_WEBSOCKET_URL || process.env.RPC_URL! 
 }, 
 yellowstone: { 
 endpoint: process.env.YELLOWSTONE_ENDPOINT! 
 }, 
 jito: { 
 bundleApiUrl: process.env.JITO_BUNDLE_API_URL!, 
 keypairPath: process.env.JITO_KEYPAIR_PATH 
 }, 
 anthropic: { 
 apiKey: process.env.ANTHROPIC_API_KEY!, 
 model: 'claude-3-5-sonnet-20241022' 
 }, 
 database: { 
 url: process.env.DATABASE_URL! 
 }, 
 server: { 
 port: parseInt(process.env.PORT || '3000'), 
 host: process.env.HOST || '0.0.0.0' 
 }, 
 logging: { 
 level: process.env.LOG_LEVEL || 'info' 
 }, 
 network: process.env.NETWORK || 'devnet' 
 }; 

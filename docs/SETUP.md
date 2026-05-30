Setup Instructions 
 Prerequisites 
 
 Node 20+ 
 PostgreSQL 12+ 
 Solana CLI (optional) 
 
 Installation 
 
 Clone repository 
 npm install (installs all workspaces) 
 cp backend/.env.example backend/.env 
 Fill in .env: 
 
 ANTHROPIC_API_KEY: Get from `https://console.anthropic.com` 
 RPC_URL: `https://api.devnet.solana.com` 
 YELLOWSTONE_ENDPOINT: `http://grpc.devnet.triton.one:8090` 
 DATABASE_URL: PostgreSQL connection string 
 
 
 npm run build 
 npm run dev (starts both backend and frontend) 
 
 Local PostgreSQL Setup 
 bash# macOS 
 brew install postgresql 
 brew services start postgresql 
 
 # Linux 
 sudo apt-get install postgresql 
 sudo systemctl start postgresql 
 
 # Create database 
 psql -U postgres 
 CREATE DATABASE solana_stack; 
 Running 
 bash# Terminal 1: Backend 
 npm run dev -w backend 
 
 # Terminal 2: Frontend 
 npm run dev -w frontend 
 
 # Visit http://localhost:5173 
 Testing 
 bash# Health check 
 curl http://localhost:3000/health 
 
 # Get stats 
 curl http://localhost:3000/api/stats 
 
 # Submit bundle 
 curl -X POST http://localhost:3000/api/submit \ 
   -H "Content-Type: application/json" \ 
   -d '{"transactions":[]}' 
 
 # Export log 
 curl http://localhost:3000/api/export-log > lifecycle_log.csv 

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/players.js';
import dealerRoutes from './routes/dealers.js';
import payoutRoutes from './routes/payouts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/payouts', payoutRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Karkade backend running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   POST /api/auth/register - Register`);
    console.log(`   POST /api/auth/login - Login`);
    console.log(`   GET  /api/auth/me - Get user`);
    console.log(`   GET  /api/players/profile - Player profile`);
    console.log(`   GET  /api/dealers/profile - Dealer profile`);
    console.log(`   POST /api/payouts/request - Request payout`);
  });
}

startServer();

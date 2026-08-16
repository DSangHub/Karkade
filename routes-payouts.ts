import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { UserModel } from '../models/User.js';

const router = express.Router();

// Request payout
router.post('/request', authenticate, async (req: any, res) => {
  try {
    const { amount, method } = req.body;
    const userId = req.user.id;

    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum payout is $10' });
    }

    const user = await UserModel.findById(userId);
    if (!user || parseFloat(user.balance) < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const result = await query(
      `INSERT INTO payouts (user_id, amount, status, method)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id, amount, status, created_at`,
      [userId, amount, method || 'paypal']
    );

    res.status(201).json({
      success: true,
      payout: result.rows[0]
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get payout history
router.get('/history', authenticate, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT * FROM payouts 
       WHERE user_id = $1 
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json({ payouts: result.rows });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

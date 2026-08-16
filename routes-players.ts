import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { UserModel } from '../models/User.js';
import { query } from '../config/database.js';

const router = express.Router();

// Get player profile
router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get race stats
    const stats = await query(
      `SELECT 
        COUNT(*) as total_races,
        COALESCE(SUM(ad_revenue), 0) as total_revenue,
        COALESCE(AVG(ad_revenue), 0) as avg_revenue_per_race
       FROM races
       WHERE players::jsonb ? $1`,
      [req.user.id]
    );

    res.json({
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: parseFloat(user.balance),
        total_earned: parseFloat(user.total_earned)
      },
      stats: stats.rows[0] || { total_races: 0, total_revenue: 0, avg_revenue_per_race: 0 }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update location (for geo-targeted ads)
router.post('/location', authenticate, async (req: any, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    await UserModel.updateLocation(req.user.id, lat, lng);
    res.json({ success: true, message: 'Location updated' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get earnings history
router.get('/earnings', authenticate, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT 
        DATE(created_at) as date,
        SUM(player_earnings) as earnings,
        COUNT(*) as impressions
       FROM ad_impressions
       WHERE user_id = $1
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      [req.user.id]
    );

    res.json({ earnings: result.rows });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

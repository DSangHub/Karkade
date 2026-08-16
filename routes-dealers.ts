import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { DealerModel } from '../models/Dealer.js';
import { query } from '../config/database.js';

const router = express.Router();

// Get dealer profile
router.get('/profile', authenticate, requireRole(['dealer', 'admin']), async (req: any, res) => {
  try {
    const dealer = await DealerModel.findByUserId(req.user.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }

    const stats = await DealerModel.getDealerStats(dealer.id);

    res.json({
      dealer: {
        id: dealer.id,
        business_name: dealer.business_name,
        tier: dealer.tier,
        monthly_spend: parseFloat(dealer.monthly_spend),
        geo_fence_radius: dealer.geo_fence_radius,
        zip_codes: dealer.zip_codes,
        is_active: dealer.is_active
      },
      stats: {
        total_impressions: parseInt(stats.total_impressions || '0'),
        unique_viewers: parseInt(stats.unique_viewers || '0'),
        total_revenue: parseFloat(stats.total_revenue || '0'),
        total_spent: parseFloat(stats.total_spent || '0')
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create ad campaign
router.post('/campaigns', authenticate, requireRole(['dealer', 'admin']), async (req: any, res) => {
  try {
    const { campaign_name, ad_type, creative_url, end_date } = req.body;

    const dealer = await DealerModel.findByUserId(req.user.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }

    const result = await query(
      `INSERT INTO ad_campaigns (dealer_id, campaign_name, ad_type, creative_url, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dealer.id, campaign_name, ad_type, creative_url, end_date]
    );

    res.status(201).json({
      success: true,
      campaign: result.rows[0]
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get dealer campaigns
router.get('/campaigns', authenticate, requireRole(['dealer', 'admin']), async (req: any, res) => {
  try {
    const dealer = await DealerModel.findByUserId(req.user.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }

    const result = await query(
      `SELECT * FROM ad_campaigns 
       WHERE dealer_id = $1 
       ORDER BY created_at DESC`,
      [dealer.id]
    );

    res.json({ campaigns: result.rows });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upgrade tier
router.post('/upgrade', authenticate, requireRole(['dealer', 'admin']), async (req: any, res) => {
  try {
    const { tier } = req.body;
    
    if (!['standard', 'premium', 'elite'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const dealer = await DealerModel.findByUserId(req.user.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer profile not found' });
    }

    await DealerModel.updateTier(dealer.id, tier);

    res.json({
      success: true,
      message: `Upgraded to ${tier} tier`,
      new_tier: tier
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

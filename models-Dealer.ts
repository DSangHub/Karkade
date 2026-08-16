import { query } from '../config/database.js';

export interface Dealer {
  id: string;
  user_id: string;
  business_name: string;
  tier: 'standard' | 'premium' | 'elite';
  monthly_spend: number;
  geo_fence_radius: number;
  zip_codes: string[];
  logo_url?: string;
  website_url?: string;
  is_active: boolean;
  created_at: Date;
}

export class DealerModel {
  static async create(data: {
    user_id: string;
    business_name: string;
    tier?: string;
    geo_fence_radius?: number;
    zip_codes?: string[];
  }): Promise<Dealer> {
    const result = await query(
      `INSERT INTO dealers (user_id, business_name, tier, geo_fence_radius, zip_codes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.user_id,
        data.business_name,
        data.tier || 'standard',
        data.geo_fence_radius || 10,
        data.zip_codes || []
      ]
    );
    return result.rows[0];
  }

  static async findByUserId(userId: string): Promise<Dealer | null> {
    const result = await query(
      'SELECT * FROM dealers WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<Dealer | null> {
    const result = await query(
      `SELECT d.*, u.email, u.username 
       FROM dealers d
       JOIN users u ON u.id = d.user_id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async updateTier(dealerId: string, tier: string): Promise<void> {
    const tierPrices: Record<string, number> = {
      standard: 95,
      premium: 195,
      elite: 295
    };

    await query(
      `UPDATE dealers 
       SET tier = $1, monthly_spend = $2, updated_at = NOW()
       WHERE id = $3`,
      [tier, tierPrices[tier], dealerId]
    );
  }

  static async getDealerStats(dealerId: string): Promise<any> {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT ai.id) as total_impressions,
        COUNT(DISTINCT ai.user_id) as unique_viewers,
        COALESCE(SUM(ai.player_earnings), 0) as total_revenue,
        COALESCE(SUM(ac.total_spent), 0) as total_spent
       FROM ad_campaigns ac
       LEFT JOIN ad_impressions ai ON ai.campaign_id = ac.id
       WHERE ac.dealer_id = $1
       AND ac.created_at > NOW() - INTERVAL '30 days'`,
      [dealerId]
    );
    return result.rows[0];
  }
}

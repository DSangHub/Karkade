-- Create database
CREATE DATABASE karkade;

\c karkade;

-- Users (players + dealers)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'dealer', 'admin')),
  balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dealers (extends users)
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  tier VARCHAR(20) DEFAULT 'standard' CHECK (tier IN ('standard', 'premium', 'elite')),
  monthly_spend DECIMAL(10,2) DEFAULT 0,
  geo_fence_radius INT DEFAULT 10, -- miles
  zip_codes TEXT[],
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad campaigns
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  ad_type VARCHAR(50) CHECK (ad_type IN ('livery', 'banner', 'race_car')),
  creative_url TEXT NOT NULL,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  cost_per_impression DECIMAL(6,4) DEFAULT 0.001,
  total_spent DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad impressions (tracked per race)
CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  view_duration INT DEFAULT 0, -- seconds
  track_id VARCHAR(50),
  race_id UUID,
  revenue_share DECIMAL(5,2) DEFAULT 5.0, -- 5-8%
  player_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Races
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id VARCHAR(50) NOT NULL,
  race_type VARCHAR(20) DEFAULT 'single' CHECK (race_type IN ('single', 'multiplayer')),
  players JSONB,
  results JSONB,
  ad_revenue DECIMAL(10,2) DEFAULT 0,
  total_impressions INT DEFAULT 0,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payouts
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  method VARCHAR(20) CHECK (method IN ('paypal', 'gift_card', 'bank')),
  external_id VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_dealers_user_id ON dealers(user_id);
CREATE INDEX idx_ad_campaigns_dealer ON ad_campaigns(dealer_id);
CREATE INDEX idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX idx_payouts_user ON payouts(user_id);

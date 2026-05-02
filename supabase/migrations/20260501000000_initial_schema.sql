-- Initial schema for Aventra Real Estate
-- Created: 2026-05-01

-- Create profiles table (references auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  notification_preferences JSONB DEFAULT '{"lease_expiry":true,"maintenance":true,"compliance":true}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, inactive, pending
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  status TEXT DEFAULT 'vacant', -- occupied, vacant, maintenance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open', -- open, in_progress, closed
  priority TEXT DEFAULT 'medium', -- low, medium, high, emergency
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Properties: Users can view/modify their own properties
CREATE POLICY "Users can view own properties" ON properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify own properties" ON properties FOR ALL USING (auth.uid() = user_id);

-- Units: Users can view/modify units for their own properties
CREATE POLICY "Users can view units" ON units FOR SELECT USING (
  property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
);
CREATE POLICY "Users can modify units" ON units FOR ALL USING (
  property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
);

-- Maintenance: Users can view/modify requests for their own properties
CREATE POLICY "Users can view maintenance" ON maintenance_requests FOR SELECT USING (
  property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
);
CREATE POLICY "Users can modify maintenance" ON maintenance_requests FOR ALL USING (
  property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
);

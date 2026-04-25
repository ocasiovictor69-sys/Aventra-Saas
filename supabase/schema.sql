-- AVENTRA Property Management Database Schema
-- Isolated Supabase instance for AVENTRA only
-- NO connection to AGENTO, AVER, FLO_MEDIA, or TNAI

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  property_type TEXT DEFAULT 'single_family',
  total_units INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own properties" ON public.properties USING (auth.uid() = user_id);

-- Units table
CREATE TABLE IF NOT EXISTS public.units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  unit_number TEXT,
  status TEXT DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance')),
  rent_amount INTEGER DEFAULT 0,
  tenant_name TEXT,
  lease_start DATE,
  lease_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own units" ON public.units USING (auth.uid() = user_id);

-- Maintenance requests table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'standard' CHECK (priority IN ('emergency', 'urgent', 'standard', 'low')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own maintenance" ON public.maintenance_requests USING (auth.uid() = user_id);

-- Compliance items table
CREATE TABLE IF NOT EXISTS public.compliance_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('lease', 'inspection', 'insurance', 'certificate')),
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own compliance" ON public.compliance_items USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_unit_id ON public.maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_compliance_property ON public.compliance_items(property_id);
CREATE INDEX IF NOT EXISTS idx_compliance_due_date ON public.compliance_items(due_date) WHERE status = 'pending';

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_maintenance_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_compliance_updated_at BEFORE UPDATE ON public.compliance_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

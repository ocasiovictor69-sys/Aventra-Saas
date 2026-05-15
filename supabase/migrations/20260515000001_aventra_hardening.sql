-- 1. Add team_id to core asset management entities
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.arrears_logs ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.compliance_audits ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- 2. Enforce Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrears_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audits ENABLE ROW LEVEL SECURITY;

-- 3. Create Team-Scoped RLS Policies
DO $$ 
BEGIN
    -- Properties
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'properties_team_all') THEN
        CREATE POLICY "properties_team_all" ON public.properties FOR ALL
        USING (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()));
    END IF;

    -- Tenants
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'tenants_team_all') THEN
        CREATE POLICY "tenants_team_all" ON public.tenants FOR ALL
        USING (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()));
    END IF;

    -- Leases
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'leases_team_all') THEN
        CREATE POLICY "leases_team_all" ON public.leases FOR ALL
        USING (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()));
    END IF;

    -- Arrears
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'arrears_team_all') THEN
        CREATE POLICY "arrears_team_all" ON public.arrears_logs FOR ALL
        USING (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()));
    END IF;

    -- Compliance
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'compliance_team_all') THEN
        CREATE POLICY "compliance_team_all" ON public.compliance_audits FOR ALL
        USING (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()));
    END IF;
END $$;

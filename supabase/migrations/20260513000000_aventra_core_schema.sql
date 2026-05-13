-- /gsd-artifacts --type sql (Aventra Core Schema)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Properties Table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT NOT NULL,
    jurisdiction TEXT NOT NULL, -- Crucial for Arrears Matrix legal logic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants Table (MOD-C01 Screening)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    screening_score INTEGER,
    income_verified BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'APPLICANT' CHECK (status IN ('APPLICANT', 'APPROVED', 'DENIED', 'ACTIVE', 'EVICTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leases Table (MOD-C02 Generation)
CREATE TABLE public.leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id),
    property_id UUID REFERENCES public.properties(id),
    rent_amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    signature_status TEXT DEFAULT 'PENDING' CHECK (signature_status IN ('PENDING', 'SIGNED', 'EXPIRED')),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arrears Matrix (MOD-C03 Escalation Logic)
CREATE TABLE public.arrears_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id),
    property_id UUID REFERENCES public.properties(id),
    missed_amount DECIMAL(10,2) NOT NULL,
    days_late INTEGER NOT NULL,
    escalation_status TEXT DEFAULT 'GRACE_PERIOD' CHECK (escalation_status IN ('GRACE_PERIOD', 'NOTICE_SENT', 'LEGAL_REVIEW', 'EVICTION_FILED')),
    next_action_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Audits (MOD-C04 47-Point Pass)
CREATE TABLE public.compliance_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id),
    pass_score INTEGER NOT NULL,
    failed_points JSONB DEFAULT '[]'::JSONB,
    is_compliant BOOLEAN GENERATED ALWAYS AS (pass_score >= 47) STORED,
    last_audit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

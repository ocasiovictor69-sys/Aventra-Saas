import { execute, ScreeningInputs } from '../modules/modc01-screening/index';

// ── Mock Supabase DB ──────────────────────────────────────────────────────────

function makeMockDb(overrides: {
  tenantSingle?: any,
  updateSingle?: any,
} = {}) {
  let callCount = 0;
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return overrides.tenantSingle ?? Promise.resolve({ 
          data: { id: 't-123', email: 'tenant@example.com' }, 
          error: null 
        });
      }
      return overrides.updateSingle ?? Promise.resolve({ data: { id: 't-123' }, error: null });
    }),
  };
  return { from: jest.fn(() => chain) };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MOD-C01: Tenant Screening', () => {
  const validInputs: ScreeningInputs = {
    tenant_id: 't-123',
    ssn_last_4: '6789',
    monthly_income: 6500,
    credit_score_min: 650
  };

  test('SUCCESS: Passes screening for high credit score', async () => {
    const db = makeMockDb();
    const services: any = {
      memory: { 
        captureContext: jest.fn().mockResolvedValue({ ok: true }),
        mapRelationships: jest.fn().mockResolvedValue({ ok: true })
      },
      screening: {
        runCreditCheck: jest.fn().mockResolvedValue({ score: 720, pass: true }),
        runBackgroundCheck: jest.fn().mockResolvedValue({ flags: [], pass: true })
      }
    };
    
    const result = await execute(validInputs, db, services);

    expect(result.success).toBe(true);
    expect(result.decision).toBe('PASS');
    expect(result.transition).toBe('MOD-C02');
  });

  test('FAIL: Fails screening for low credit score', async () => {
    const db = makeMockDb();
    const services: any = {
      memory: { 
        captureContext: jest.fn().mockResolvedValue({ ok: true }),
        mapRelationships: jest.fn().mockResolvedValue({ ok: true })
      },
      screening: {
        runCreditCheck: jest.fn().mockResolvedValue({ score: 580, pass: false }),
        runBackgroundCheck: jest.fn().mockResolvedValue({ flags: [], pass: true })
      }
    };

    const result = await execute(validInputs, db, services);

    expect(result.success).toBe(true);
    expect(result.decision).toBe('FAIL');
    expect(result.transition).toBe('MOD-HALT');
  });

  test('FAIL: Validation blocks missing tenant_id', async () => {
    const db = makeMockDb();
    const services: any = { 
      memory: { captureContext: jest.fn() },
      screening: { runCreditCheck: jest.fn(), runBackgroundCheck: jest.fn() }
    };
    const result = await execute({ ...validInputs, tenant_id: '' }, db, services);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/VALIDATION_FAIL/);
  });
});

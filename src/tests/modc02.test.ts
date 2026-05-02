import { execute, LeaseInputs } from '../modules/modc02-lease/index';

describe('MOD-C02: Lease Generation', () => {
  test('SUCCESS: Generates lease and dispatches for e-sign', async () => {
    const db: any = {};
    const services: any = {
      memory: { captureContext: jest.fn().mockResolvedValue({ ok: true }) },
      legal: { 
        generateLease: jest.fn().mockResolvedValue({ pdfUrl: 'http://docs.com/lease.pdf' }),
        dispatchESign: jest.fn().mockResolvedValue({ ok: true })
      }
    };

    const inputs: LeaseInputs = {
      tenant_id: 't-123',
      tenant_email: 'tenant@example.com',
      property_id: 'p-456',
      rent_amount: 2500,
      lease_term: 12
    };

    const result = await execute(inputs, db, services);

    expect(result.success).toBe(true);
    expect(result.lease_url).toBe('http://docs.com/lease.pdf');
    expect(services.legal.generateLease).toHaveBeenCalled();
    expect(services.legal.dispatchESign).toHaveBeenCalled();
    expect(services.memory.captureContext).toHaveBeenCalledWith(expect.objectContaining({
      type: 'lease_dispatched'
    }));
  });
});

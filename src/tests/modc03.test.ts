import { execute, ArrearsInputs } from '../modules/modc03-arrears/index';

describe('MOD-C03: Arrears Matrix', () => {
  test('SUCCESS: Processes Tier 1 arrears and logs to memory', async () => {
    const db: any = {};
    const services: any = {
      memory: { mapRelationships: jest.fn().mockResolvedValue({ ok: true }) }
    };

    const inputs: ArrearsInputs = {
      tenant_id: 't-123',
      balance: -1500,
      days_overdue: 5
    };

    const result = await execute(inputs, db, services);

    expect(result.success).toBe(true);
    expect(result.tier).toBe(1);
    expect(services.memory.mapRelationships).toHaveBeenCalledWith(expect.objectContaining({
      event: 'ARREARS_LEVEL_1'
    }));
  });

  test('SUCCESS: Escalates to Tier 3 for extreme arrears', async () => {
    const db: any = {};
    const services: any = {
      memory: { mapRelationships: jest.fn().mockResolvedValue({ ok: true }) }
    };

    const inputs: ArrearsInputs = {
      tenant_id: 't-123',
      balance: -5000,
      days_overdue: 65
    };

    const result = await execute(inputs, db, services);

    expect(result.success).toBe(true);
    expect(result.tier).toBe(3);
    expect(services.memory.mapRelationships).toHaveBeenCalledWith(expect.objectContaining({
      event: 'ARREARS_LEVEL_3'
    }));
  });
});

import { execute, MaintenanceInputs } from '../modules/modc04-maintenance/index';

describe('MOD-C04: Maintenance Audit', () => {
  test('SUCCESS: Routes maintenance request and updates property health', async () => {
    const db: any = {};
    const services: any = {
      memory: { captureContext: jest.fn().mockResolvedValue({ ok: true }) }
    };

    const inputs: MaintenanceInputs = {
      property_id: 'p-456',
      issue_description: 'Water leak in kitchen',
      urgency: 'high'
    };

    const result = await execute(inputs, db, services);

    expect(result.success).toBe(true);
    expect(result.vendor_category).toBe('PLUMBING');
    expect(services.memory.captureContext).toHaveBeenCalledWith(expect.objectContaining({
      type: 'maintenance_dispatched'
    }));
  });
});

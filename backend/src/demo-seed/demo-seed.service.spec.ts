import { ConfigService } from '@nestjs/config';
import { DemoSeedService } from './demo-seed.service';
import { InMemoryInsuranceRepository } from '../testing/in-memory-insurance.repository';
import { describe, expect, it } from '@jest/globals';

/**
 * Insurance seeding used to call the repository three times with no guard.
 * That was invisible while the repository was a Map keyed by farm, because a
 * repeat write overwrote the same key. Once insurance became a real table with
 * an ordinary index on farm_id, every boot appended three more rows.
 *
 * The guard is only an `if`, and there is no unique constraint backing it up:
 * docs/DATABASE.md §6 wants farm 1:N, so duplicates are legal at the schema
 * level and only this logic prevents them. That makes it worth a test.
 */
describe('DemoSeedService insurance seeding', () => {
  /**
   * The other ten constructor arguments are not touched by ensureInsurance, so
   * they are passed as inert stubs rather than stood up. Bracket access reaches
   * the private method deliberately: the alternative is exporting it purely to
   * make it reachable.
   */
  function serviceWith(insurance: InMemoryInsuranceRepository): {
    seed: DemoSeedService;
    ensureInsurance: (
      farmId: string,
      partner: string,
      status: 'PENDING' | 'ACTIVE' | 'EXPIRED',
    ) => Promise<unknown>;
  } {
    const seed = new DemoSeedService(
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
      insurance,
      null as never,
      null as never,
      null as never,
      null as never,
      new ConfigService({ DEMO_SEED: 'true' }),
    );

    return {
      seed,
      ensureInsurance: (farmId, partner, status) =>
        seed['ensureInsurance'](farmId, partner, status),
    };
  }

  it('writes one policy when the seed runs once', async () => {
    const insurance = new InMemoryInsuranceRepository();

    await serviceWith(insurance).ensureInsurance('farm-1', 'PT A', 'ACTIVE');

    expect(await insurance.findByFarmId('farm-1')).toMatchObject({
      partner: 'PT A',
      status: 'ACTIVE',
    });
  });

  it('does not duplicate a policy when the seed runs again', async () => {
    const insurance = new InMemoryInsuranceRepository();
    const { ensureInsurance } = serviceWith(insurance);

    await ensureInsurance('farm-1', 'PT A', 'ACTIVE');
    await ensureInsurance('farm-1', 'PT A', 'ACTIVE');
    await ensureInsurance('farm-1', 'PT A', 'ACTIVE');

    // Asserted on the row count rather than on findByFarmId, because that read
    // returns the newest policy whether or not the older ones are still there.
    // This is the assertion that fails when the guard is removed.
    expect(insurance.countByFarmId('farm-1')).toBe(1);
  });

  it('re-seeds when the seeded status for a farm changes', async () => {
    const insurance = new InMemoryInsuranceRepository();
    const { ensureInsurance } = serviceWith(insurance);

    await ensureInsurance('farm-1', 'PT A', 'ACTIVE');
    await ensureInsurance('farm-1', 'PT A', 'PENDING');

    expect(insurance.countByFarmId('farm-1')).toBe(2);
    expect(await insurance.findByFarmId('farm-1')).toMatchObject({
      status: 'PENDING',
    });
  });
});

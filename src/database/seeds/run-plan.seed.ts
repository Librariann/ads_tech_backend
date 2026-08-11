import dataSource from '../data-source';
import { seedPlanPolicies } from './plan.seed';

async function run() {
  await dataSource.initialize();
  try {
    await dataSource.transaction(seedPlanPolicies);
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

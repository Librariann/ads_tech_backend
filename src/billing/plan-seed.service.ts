import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedPlanPolicies } from '../database/seeds/plan.seed';

@Injectable()
export class PlanSeedService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.dataSource.transaction(seedPlanPolicies);
  }
}

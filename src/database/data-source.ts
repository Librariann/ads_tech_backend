import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { databaseEntities } from './entities';

const nodeEnv = process.env.NODE_ENV || 'dev';
config({ path: `.env.${nodeEnv}` });
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'ads_tech',
  entities: databaseEntities,
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
});

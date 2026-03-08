import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from './db.mts';

await migrate(db, { migrationsFolder: 'src/repository/migrations' });
console.log('Migrations complete.');

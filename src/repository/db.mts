import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { join } from 'node:path';
import * as schema from './schema.mts';

const DB_PATH = join(import.meta.dir, '../../data/app.db');

const sqlite = new Database(DB_PATH, { create: true });
sqlite.run('PRAGMA journal_mode = WAL');
sqlite.run('PRAGMA foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

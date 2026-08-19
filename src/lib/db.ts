import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const prismaClientSingleton = () => {
  // Use pg Pool for the adapter
  const connectionString = process.env.DATABASE_URL;
  // If connection string is empty (e.g. during build or initial setup), just return a dummy client or handle it safely.
  // In a real app, you might want it to crash if there is no URL at runtime, but Next.js might run code at build time.
  const pool = new pg.Pool({
    connectionString: connectionString || 'postgresql://dummy:dummy@localhost:5432/dummy',
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db;

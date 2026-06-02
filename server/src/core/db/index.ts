// Mongoose connection for the new tree. Tuned for throughput:
// connection pooling, fast server-selection timeout, and a single
// cached connection across hot-reloads.

import mongoose from 'mongoose';
import { env } from '@/core/config/env';
import { logger } from '@/core/logger';

const log = logger.child({ module: 'core/db' });

let connecting: Promise<typeof mongoose> | null = null;

export async function connectDb(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;

  mongoose.set('strictQuery', true);

  connecting = mongoose
    .connect(env.MONGODB_URI, {
      dbName: 'BloodBank',
      maxPoolSize: 50, // concurrency headroom without exhausting the server
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      // Read from secondaries where eventual consistency is fine; the
      // services that need read-your-writes use the primary explicitly.
      readPreference: 'primaryPreferred',
    })
    .then((m) => {
      log.info('mongo connected');
      return m;
    });

  return connecting;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  connecting = null;
  log.info('mongo disconnected');
}

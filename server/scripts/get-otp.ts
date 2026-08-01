import path from 'node:path';
import Queue from 'bull';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  const emailQueue = new Queue('email', REDIS_URL);

  const jobTypes = ['waiting', 'active', 'completed', 'failed', 'delayed'] as const;
  const jobs = await emailQueue.getJobs([...jobTypes]);

  const otpJobs = jobs
    .filter(
      (job) =>
        job && job.data && (job.data.type === 'LOGIN_OTP' || job.data.type === 'REGISTER_OTP'),
    )
    .sort((a, b) => b.timestamp - a.timestamp); // newest first

  if (otpJobs.length === 0) {
    console.log('No OTP jobs found in the queue. Please trigger an OTP on the login page first.');
    await emailQueue.close();
    return;
  }

  console.log('\n========================================');
  console.log('         RECENT GENERATED OTPS          ');
  console.log('========================================');
  for (const job of otpJobs.slice(0, 5)) {
    const time = new Date(job.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(
      `[${time}] ${job.data.to} -> OTP Code: ${job.data.payload?.code} (${job.data.type})`,
    );
  }
  console.log('========================================\n');

  await emailQueue.close();
}

main().catch((err) => {
  console.error('Error fetching OTP:', err);
  process.exit(1);
});

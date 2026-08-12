import { getQueue } from '@/core/queue';
import { childLogger } from '@/core/logger';
import { DonorModel } from './donor.model';
import { notificationService } from '@/modules/notification/notification.service';

const log = childLogger({ module: 'donor-jobs' });
const QUEUE = 'donor-maintenance';
const JOB_BIRTHDAY = 'daily-birthday-greetings';

export async function runBirthdayGreetings(): Promise<number> {
  const today = new Date();
  const mm = today.getMonth() + 1;
  const dd = today.getDate();

  // Match donors whose dob month+day matches today (year-agnostic)
  const donors = await DonorModel.aggregate([
    {
      $match: {
        dob: { $exists: true, $ne: null },
        deletedAt: null,
        eligibilityStatus: { $ne: 'deferred' },
      },
    },
    {
      $addFields: {
        dobMonth: { $month: '$dob' },
        dobDay: { $dayOfMonth: '$dob' },
      },
    },
    { $match: { dobMonth: mm, dobDay: dd } },
    {
      $project: {
        donorId: 1,
        name: 1,
        email: 1,
        bloodGroup: 1,
        rh: 1,
      },
    },
  ]);

  // Count total donations per donor (lean aggregate from Donation model)
  let sent = 0;
  for (const donor of donors) {
    if (!donor.email) continue;
    try {
      const { countAcrossDonations } = await import(
        '@/modules/donation/donation-collections.util'
      );
      const totalDonations = await countAcrossDonations({
        donor: donor._id,
        deletedAt: null,
      });

      await notificationService.send({
        type: 'DONOR_BIRTHDAY',
        to: donor.email as string,
        payload: {
          donorName: `${donor.name.firstName} ${donor.name.lastName}`,
          donorId: donor.donorId as string,
          bloodGroup: donor.bloodGroup as string,
          rh: donor.rh as string,
          totalDonations,
        },
      });
      sent++;
    } catch (err) {
      log.warn({ donorId: donor.donorId, err: (err as Error).message }, 'birthday email failed');
    }
  }

  log.info({ date: `${mm}/${dd}`, total: donors.length, sent }, 'birthday greetings sent');
  return sent;
}

export function registerDonorJobs(): void {
  const queue = getQueue(QUEUE);

  queue.process(JOB_BIRTHDAY, async () => runBirthdayGreetings());

  void queue.add(
    JOB_BIRTHDAY,
    {},
    {
      repeat: { cron: '0 7 * * *' }, // 07:00 IST daily
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: JOB_BIRTHDAY,
    },
  );

  log.info('donor birthday job scheduled (daily 07:00)');
}

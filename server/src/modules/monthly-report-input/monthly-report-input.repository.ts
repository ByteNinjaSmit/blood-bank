import { Types } from 'mongoose';
import { MonthlyReportInputModel } from '@/modules/monthly-report-input/monthly-report-input.model';

export interface IctcReferralCounts {
  hiv: number;
  hbsag: number;
  hcv: number;
  vdrl: number;
  malaria: number;
}

export interface MonthlyReportInputDto {
  month: number;
  year: number;
  donorCounsellingCount: number;
  ictcReferral: IctcReferralCounts;
}

export interface UpsertMonthlyReportInput {
  month: number;
  year: number;
  donorCounsellingCount: number;
  ictcReferral: IctcReferralCounts;
}

function toDto(raw: any): MonthlyReportInputDto {
  return {
    month: raw.month,
    year: raw.year,
    donorCounsellingCount: raw.donorCounsellingCount ?? 0,
    ictcReferral: {
      hiv: raw.ictcReferral?.hiv ?? 0,
      hbsag: raw.ictcReferral?.hbsag ?? 0,
      hcv: raw.ictcReferral?.hcv ?? 0,
      vdrl: raw.ictcReferral?.vdrl ?? 0,
      malaria: raw.ictcReferral?.malaria ?? 0,
    },
  };
}

export interface MonthlyReportInputRepo {
  upsert(input: UpsertMonthlyReportInput, actorId: string): Promise<MonthlyReportInputDto>;
  findByPeriod(month: number, year: number): Promise<MonthlyReportInputDto | null>;
  findAllByYear(year: number): Promise<MonthlyReportInputDto[]>;
}

export function createMonthlyReportInputRepo(): MonthlyReportInputRepo {
  return {
    async upsert(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await MonthlyReportInputModel.findOneAndUpdate(
        { month: input.month, year: input.year },
        {
          $set: {
            donorCounsellingCount: input.donorCounsellingCount,
            ictcReferral: input.ictcReferral,
            updatedBy: actor,
          },
          $setOnInsert: {
            month: input.month,
            year: input.year,
            createdBy: actor,
          },
        },
        { upsert: true, new: true },
      ).lean();
      return toDto(doc);
    },

    async findByPeriod(month, year) {
      const doc = await MonthlyReportInputModel.findOne({ month, year }).lean();
      if (!doc) return null;
      return toDto(doc);
    },

    async findAllByYear(year) {
      const docs = await MonthlyReportInputModel.find({ year }).lean();
      return docs.map(toDto);
    },
  };
}

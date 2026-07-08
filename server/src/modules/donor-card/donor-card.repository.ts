import { Types } from 'mongoose';
import { DonorCardModel } from '@/modules/donor-card/donor-card.model';

export interface DonorCardDto {
  id: string;
  requisitionId: string;
  name: string;
  address: string;
  bloodGroup: string;
  donationCardNumber: string;
  createdAt: string;
}

export interface CreateDonorCardInput {
  requisitionId: string;
  name: string;
  address: string;
  bloodGroup: string;
  donationCardNumber: string;
}

function toDto(raw: any): DonorCardDto {
  return {
    id: raw._id.toString(),
    requisitionId: raw.requisitionId.toString(),
    name: raw.name,
    address: raw.address,
    bloodGroup: raw.bloodGroup,
    donationCardNumber: raw.donationCardNumber,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
  };
}

export interface DonorCardRepo {
  create(input: CreateDonorCardInput, actorId: string): Promise<DonorCardDto>;
  list(): Promise<DonorCardDto[]>;
  findByRequisitionIds(requisitionIds: string[]): Promise<DonorCardDto[]>;
}

export function createDonorCardRepo(): DonorCardRepo {
  return {
    async create(input, actorId) {
      const doc = await DonorCardModel.create({
        requisitionId: new Types.ObjectId(input.requisitionId),
        name: input.name,
        address: input.address,
        bloodGroup: input.bloodGroup,
        donationCardNumber: input.donationCardNumber,
        createdBy: new Types.ObjectId(actorId),
      });
      return toDto(doc.toObject());
    },

    async list() {
      const docs = await DonorCardModel.find().sort({ createdAt: -1 }).lean();
      return docs.map(toDto);
    },

    async findByRequisitionIds(requisitionIds) {
      const docs = await DonorCardModel.find({
        requisitionId: { $in: requisitionIds.map((id) => new Types.ObjectId(id)) },
      }).lean();
      return docs.map(toDto);
    },
  };
}

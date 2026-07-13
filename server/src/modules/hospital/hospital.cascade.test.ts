// Integration test for the Hospital -> Requisition -> {Crossmatch,
// Issue} cascade chain. A requisition already ISSUED/COMPLETED (blood
// already left the bank) must be preserved untouched and marked
// affected; a requisition still PENDING/MATCHED is safe to cascade
// soft-delete.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';

import { hospitalService } from '@/modules/hospital/hospital.service';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { CrossmatchModel } from '@/modules/crossmatch/crossmatch.model';
import { IssueModel } from '@/modules/issue/issue.model';

let mongod: MongoMemoryServer;
const actorId = new Types.ObjectId().toHexString();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'hospital-cascade-test' });
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    HospitalModel.deleteMany({}),
    RequisitionModel.deleteMany({}),
    CrossmatchModel.deleteMany({}),
    IssueModel.deleteMany({}),
  ]);
});

async function seedHospitalWithFullChain() {
  const hospital = await HospitalModel.create({
    hospitalId: 'HSP-TEST-0001',
    name: 'Test Hospital',
    address: 'Test Address',
    contactPerson: 'Test Person',
    phone: '9999999999',
    createdBy: actorId,
    updatedBy: actorId,
  });

  const pendingReq = await RequisitionModel.create({
    requisitionId: 'RQ-TEST-PENDING',
    hospitalId: hospital._id,
    patientId: new Types.ObjectId(),
    clinicianName: 'Dr Test',
    status: 'PENDING',
    createdBy: actorId,
    updatedBy: actorId,
  });

  const issuedReq = await RequisitionModel.create({
    requisitionId: 'RQ-TEST-ISSUED',
    hospitalId: hospital._id,
    patientId: new Types.ObjectId(),
    clinicianName: 'Dr Test',
    status: 'ISSUED',
    createdBy: actorId,
    updatedBy: actorId,
  });

  const crossmatch = await CrossmatchModel.create({
    crossmatchId: 'XM-TEST-0001',
    requisitionId: issuedReq._id,
    unitId: 'U-TEST-0001',
    patientId: new Types.ObjectId(),
    method: 'IS',
    result: 'COMPATIBLE',
    performedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });

  const issue = await IssueModel.create({
    issueId: 'IS-TEST-0001',
    requisitionId: issuedReq._id,
    unitId: 'U-TEST-0001',
    patientId: new Types.ObjectId(),
    issuedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return { hospital, pendingReq, issuedReq, crossmatch, issue };
}

describe('hospital cascade soft-delete / restore', () => {
  it('cascades delete: pending requisition soft-deleted, issued requisition + its crossmatch/issue marked affected', async () => {
    const { hospital, pendingReq, issuedReq, crossmatch, issue } = await seedHospitalWithFullChain();

    await hospitalService.remove(hospital._id.toString(), actorId, 'Test hospital cascade delete');

    const hospitalAfter = await HospitalModel.findById(hospital._id).lean();
    expect(hospitalAfter?.deletedAt).not.toBeNull();

    const pendingAfter = await RequisitionModel.findById(pendingReq._id).lean();
    expect(pendingAfter?.deletedAt).not.toBeNull();

    const issuedAfter = await RequisitionModel.findById(issuedReq._id).lean();
    expect(issuedAfter?.affected).toBe(true);
    expect(issuedAfter?.deletedAt).toBeFalsy();
    expect(issuedAfter?.status).toBe('ISSUED'); // untouched

    const crossmatchAfter = await CrossmatchModel.findById(crossmatch._id).lean();
    expect(crossmatchAfter?.affected).toBe(true);

    const issueAfter = await IssueModel.findById(issue._id).lean();
    expect(issueAfter?.affected).toBe(true);
  });

  it('cascades restore: everything reverts to its prior state', async () => {
    const { hospital, pendingReq, issuedReq, crossmatch, issue } = await seedHospitalWithFullChain();

    await hospitalService.remove(hospital._id.toString(), actorId, 'Test delete');
    await hospitalService.restore(hospital._id.toString(), actorId);

    const hospitalAfter = await HospitalModel.findById(hospital._id).lean();
    expect(hospitalAfter?.deletedAt).toBeNull();

    const pendingAfter = await RequisitionModel.findById(pendingReq._id).lean();
    expect(pendingAfter?.deletedAt).toBeNull();

    const issuedAfter = await RequisitionModel.findById(issuedReq._id).lean();
    expect(issuedAfter?.affected).toBe(false);

    const crossmatchAfter = await CrossmatchModel.findById(crossmatch._id).lean();
    expect(crossmatchAfter?.affected).toBe(false);

    const issueAfter = await IssueModel.findById(issue._id).lean();
    expect(issueAfter?.affected).toBe(false);
  });

  it('permanentDelete removes the hospital row after soft-delete', async () => {
    const { hospital } = await seedHospitalWithFullChain();
    await hospitalService.remove(hospital._id.toString(), actorId, 'Soft delete first');
    await hospitalService.permanentDelete(hospital._id.toString(), actorId, 'Permanent cleanup');
    const hospitalAfter = await HospitalModel.findById(hospital._id).lean();
    expect(hospitalAfter).toBeNull();
  });
});

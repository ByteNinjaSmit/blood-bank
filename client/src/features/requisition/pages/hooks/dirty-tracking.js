export function checkHasChanges(doc, payload) {
  if (!doc) return true;
  
  const docHospId = doc.hospitalId?._id || doc.hospitalId || '';
  if (docHospId !== payload.hospitalId) return true;
  
  if ((doc.doctorName || doc.clinicianName || '') !== (payload.doctorName || '')) return true;
  
  const docRequiredAt = doc.requiredAt ? new Date(doc.requiredAt).getTime() : 0;
  const payRequiredAt = payload.requiredAt ? new Date(payload.requiredAt).getTime() : 0;
  if (docRequiredAt !== payRequiredAt) return true;

  // Compared at minute granularity — the form's datetime-local value only
  // carries minutes, so the stored instant's seconds/ms must not count as a
  // change (otherwise every post-create edit looks dirty).
  const toMinute = (v) => (v ? Math.floor(new Date(v).getTime() / 60000) : 0);
  if (toMinute(doc.requestedAt) !== toMinute(payload.requestedAt)) return true;

  // Patient details
  if ((doc.patient?.name || '') !== (payload.patient.name || '')) return true;
  if (Number(doc.patient?.age || 0) !== Number(payload.patient.age || 0)) return true;
  if ((doc.patient?.ageUnit || 'YEARS') !== (payload.patient.ageUnit || 'YEARS')) return true;
  if ((doc.patient?.sex || 'M') !== (payload.patient.sex || 'M')) return true;
  if ((doc.patient?.mrn || '') !== (payload.patient.mrn || '')) return true;
  if ((doc.patient?.diagnosis || '') !== (payload.patient.diagnosis || '')) return true;
  if (Number(doc.patient?.hb || 0) !== Number(payload.patient.hb || 0)) return true;
  if ((doc.patient?.indication || '') !== (payload.patient.indication || '')) return true;
  if ((doc.patient?.indicationCategory || null) !== (payload.patient.indicationCategory || null)) return true;
  if ((doc.patient?.otherDiseaseName || '') !== (payload.patient.otherDiseaseName || '')) return true;

  // Transfusion history
  if (Number(doc.patient?.history?.previousTransfusions || 0) !== Number(payload.patient.history.previousTransfusions || 0)) return true;
  if ((doc.patient?.history?.approximateDate || '') !== (payload.patient.history.approximateDate || '')) return true;
  if ((doc.patient?.history?.presenceOfReaction || 'None') !== (payload.patient.history.presenceOfReaction || 'None')) return true;
  
  // Pregnancy
  if (Number(doc.patient?.pregnancy?.numPregnancies || 0) !== Number(payload.patient.pregnancy.numPregnancies || 0)) return true;
  if (Number(doc.patient?.pregnancy?.numMiscarriages || 0) !== Number(payload.patient.pregnancy.numMiscarriages || 0)) return true;
  if (Number(doc.patient?.pregnancy?.numChildrenWithHemolyticDisease || 0) !== Number(payload.patient.pregnancy.numChildrenWithHemolyticDisease || 0)) return true;
  
  // Requested components
  const docComponents = doc.requestedComponents || [];
  const payComponents = payload.requestedComponents || [];
  if (docComponents.length !== payComponents.length) return true;
  
  for (let i = 0; i < docComponents.length; i++) {
    const dc = docComponents[i];
    const pc = payComponents[i];
    
    if (dc.componentType !== pc.componentType) return true;
    if (Number(dc.units) !== Number(pc.units)) return true;
    if (dc.bloodGroup !== pc.bloodGroup) return true;
    
    const dcRh = dc.rh === 'Positive' || dc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative';
    const pcRh = pc.rh === 'Positive' || pc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative';
    if (dcRh !== pcRh) return true;
    
    const dcUrgency = dc.urgency?.toLowerCase() === 'routine' ? 'regular' : dc.urgency?.toLowerCase();
    const pcUrgency = pc.urgency?.toLowerCase() === 'routine' ? 'regular' : pc.urgency?.toLowerCase();
    if (dcUrgency !== pcUrgency) return true;

    if ((dc.compatibilityMode || 'UNIVERSAL') !== (pc.compatibilityMode || 'UNIVERSAL')) return true;
  }
  
  return false;
}

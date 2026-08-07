export const defaultDonorCard = {
  brought: false,
  name: '',
  address: '',
  bloodGroup: 'A+',
  donationCardNumber: '',
};

export const defaultPatient = {
  name: '',
  address: '',
  age: '',
  sex: 'M',
  aboGroup: 'O',
  rh: 'Positive',
  mrn: '',
  diagnosis: '',
  hb: '',
  indication: '',
  indicationCategory: null,
  otherDiseaseName: '',
  history: {
    previousTransfusions: 0,
    approximateDate: '',
    presenceOfReaction: 'None',
  },
  pregnancy: {
    numPregnancies: 0,
    numMiscarriages: 0,
    numChildrenWithHemolyticDisease: 0,
  },
};

// Shared patient-shape builder for the create/update/reject/hasChanges
// payloads in useRequisition.js (previously hand-copied at each call site).
export function buildPatientPayload(patient) {
  return {
    name: patient.name,
    address: patient.address || undefined,
    age: Number(patient.age),
    sex: patient.sex,
    aboGroup: patient.aboGroup || 'O',
    rhFactor: patient.rh === 'Negative' ? 'NEGATIVE' : 'POSITIVE',
    mrn: patient.mrn || undefined,
    diagnosis: patient.diagnosis || undefined,
    hb: patient.hb ? Number(patient.hb) : undefined,
    indication: patient.indication || undefined,
    indicationCategory: patient.indicationCategory || undefined,
    otherDiseaseName: patient.otherDiseaseName || undefined,
    history: {
      previousTransfusions: Number(patient.history?.previousTransfusions || 0),
      approximateDate: patient.history?.approximateDate || undefined,
      presenceOfReaction: patient.history?.presenceOfReaction || 'None',
    },
    pregnancy: {
      numPregnancies: Number(patient.pregnancy?.numPregnancies || 0),
      numMiscarriages: Number(patient.pregnancy?.numMiscarriages || 0),
      numChildrenWithHemolyticDisease: Number(patient.pregnancy?.numChildrenWithHemolyticDisease || 0),
    },
  };
}

export const defaultRequestedComponent = {
  componentType: 'PRBC',
  units: 1,
  bloodGroup: 'O',
  rh: 'Positive',
  urgency: 'regular',
  compatibilityMode: 'UNIVERSAL',
};

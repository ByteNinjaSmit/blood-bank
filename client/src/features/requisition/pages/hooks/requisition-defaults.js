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
  mrn: '',
  diagnosis: '',
  hb: '',
  indication: '',
  specialNeeds: [],
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

export const defaultRequestedComponent = {
  componentType: 'PRBC',
  units: 1,
  bloodGroup: 'O',
  rh: 'Positive',
  urgency: 'regular',
  compatibilityMode: 'UNIVERSAL',
};

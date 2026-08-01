import React from 'react';

// Full descriptive phrase per component, matching the wording used on the
// paper cover letter (e.g. "human plasma which is component of whole blood").
const COMPONENT_DESCRIPTION = {
  WB: 'whole blood',
  PRBC: 'packed red blood cells which is component of whole blood',
  FFP: 'human plasma which is component of whole blood',
  RDP: 'platelet concentrate which is component of whole blood',
  CRYO: 'cryoprecipitate which is component of whole blood',
};

// Short noun used in "we are sending this X to ..."
const COMPONENT_NAME = {
  WB: 'blood',
  PRBC: 'blood',
  FFP: 'plasma',
  RDP: 'platelets',
  CRYO: 'cryoprecipitate',
};

export default function BulkTransferCoverLetter({ transfer, boxCount }) {
  if (!transfer) return null;

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${date.getFullYear()}`;
  };

  const items = transfer.items || [];
  const totalBags = items.length;
  const totalLitres = items.reduce((sum, it) => sum + (Number(it.volumeMl) || 0), 0) / 1000;
  const boxCountDisplay = String(boxCount).padStart(2, '0');

  const componentTypes = [...new Set(items.map((it) => it.componentType).filter(Boolean))];
  const isSingleComponent = componentTypes.length === 1;
  const componentDescription = isSingleComponent
    ? (COMPONENT_DESCRIPTION[componentTypes[0]] || componentTypes[0])
    : 'blood components';
  const componentName = isSingleComponent
    ? (COMPONENT_NAME[componentTypes[0]] || componentTypes[0])
    : 'blood components';

  return (
    <div id="bulk-transfer-cover-letter-print" className="bg-white text-black font-sans p-10" style={{ minHeight: '9.8in', boxSizing: 'border-box' }}>
      <p className="text-right text-sm font-semibold mb-10">DATE- {formatDate(transfer.transferDate)}</p>

      <p className="text-sm font-bold uppercase mb-6 text-center">To Whom So Ever It May Concern</p>

      <p className="text-sm leading-relaxed mb-4">
        This is to certify that this shipment boxes contains {boxCountDisplay} boxes of {componentDescription} perishable/temperature sensitive.
      </p>
      <p className="text-sm leading-relaxed mb-8">
        We are sending this {componentName} to {transfer.bloodBankName}, {transfer.bloodBankAddress} for further processing.
      </p>

      <div className="text-sm space-y-1 mb-10">
        <p>Total No. of Litres: {totalLitres.toFixed(2)}</p>
        <p>Total No. of Bags: {totalBags}</p>
        <p>Total No. of Boxes: {boxCountDisplay}</p>
      </div>

      <p className="text-sm mb-1">Thanking You,</p>
      <p className="text-sm font-bold">Sanjivani Blood Centre</p>
    </div>
  );
}

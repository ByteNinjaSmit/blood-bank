import React from 'react';

// Full descriptive name per component, used for "{X} Type: {value}" and
// swapped into the body copy wherever the paper certificate says "plasma".
const COMPONENT_TYPE_LABEL = {
  WB: 'Blood Type',
  PRBC: 'Blood Type',
  FFP: 'Plasma Type',
  RDP: 'Platelet Type',
  SDP: 'Platelet Type',
  CRYO: 'Cryo Type',
};

const COMPONENT_VALUE = {
  WB: 'Whole Blood',
  PRBC: 'Packed Red Blood Cells',
  FFP: 'Normal Human Plasma',
  RDP: 'Platelet Concentrate',
  SDP: 'Single Donor Platelets',
  CRYO: 'Cryoprecipitate',
};

const COMPONENT_NOUN = {
  WB: 'blood',
  PRBC: 'blood',
  FFP: 'plasma',
  RDP: 'platelets',
  SDP: 'platelets',
  CRYO: 'cryoprecipitate',
};

const TESTS = [
  { test: 'HBsAg (Hepatitis B Surface Antigen)', kit: 'HEPALISA', manufacturer: 'JMITRA', result: 'Non-Reactive' },
  { test: 'Anti-HCV (Hepatitis C Virus Antibodies)', kit: 'MICROLISA', manufacturer: 'JMITRA', result: 'Non-Reactive' },
  { test: 'Anti HIV-I & II (Human Immunodeficiency Virus I & II Antibodies)', kit: 'MICROLISA', manufacturer: 'JMITRA', result: 'Non-Reactive' },
  { test: 'Malarial Parasite', kit: 'MICROLISA', manufacturer: 'JMITRA', result: 'Negative' },
  { test: 'VDRL (Syphilis)', kit: 'MICROLISA', manufacturer: 'JMITRA', result: 'Non-Reactive' },
];

export default function TestingCertificate({ transfer, bleedDate, boxCount }) {
  if (!transfer) return null;

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${date.getFullYear()}`;
  };

  const items = transfer.items || [];
  const totalLitres = items.reduce((sum, it) => sum + (Number(it.volumeMl) || 0), 0) / 1000;
  const boxCountDisplay = String(boxCount).padStart(2, '0');

  const componentTypes = [...new Set(items.map((it) => it.componentType).filter(Boolean))];
  const isSingleComponent = componentTypes.length === 1;
  const componentType = isSingleComponent ? componentTypes[0] : null;

  const typeLabel = componentType ? (COMPONENT_TYPE_LABEL[componentType] || 'Component Type') : 'Component Type';
  const typeValue = componentType ? (COMPONENT_VALUE[componentType] || componentType) : 'Blood Components';
  const noun = componentType ? (COMPONENT_NOUN[componentType] || 'component') : 'components';

  return (
    <div id="testing-certificate-print" className="bg-white text-black font-sans p-10" style={{ minHeight: '9.8in', boxSizing: 'border-box' }}>
      <p className="text-center text-lg font-black uppercase tracking-wide mb-6">Certificate of Testing & Quality</p>

      <div className="text-sm space-y-1 mb-6">
        <p>{typeLabel} : <span className="font-semibold">{typeValue}</span></p>
        <p>Total no of Boxes: <span className="font-semibold">{boxCountDisplay}</span></p>
        <p>Total Volume of {isSingleComponent ? typeValue : 'Blood Components'}: <span className="font-semibold">{totalLitres.toFixed(2)} Ltr.</span></p>
        <p>Bleed Date: <span className="font-semibold">{formatDate(bleedDate)}</span></p>
      </div>

      <p className="text-sm leading-relaxed mb-4">
        We certify that the above mentioned {noun} has been collected in Indian Federal Licenses Facilities under the latest guidelines of Indian Federal, Drug and Cosmetic act, 1940. The {noun} units in this shipment were prepared and inspected for compliance with Indian Federal regulation, Drug and Cosmetics, 1940. The following tests have been performed individually on all the bags of {noun} in accordance to Indian Federal and Consignee requirements.
      </p>

      <table className="w-full border-collapse mb-4 text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-2 py-1.5 font-bold text-left">Test & Generation</th>
            <th className="border border-black px-2 py-1.5 font-bold text-left">Test Kit Name</th>
            <th className="border border-black px-2 py-1.5 font-bold text-left">Manufacturer</th>
            <th className="border border-black px-2 py-1.5 font-bold text-left">Result</th>
          </tr>
        </thead>
        <tbody>
          {TESTS.map((t) => (
            <tr key={t.test}>
              <td className="border border-black px-2 py-2">{t.test}</td>
              <td className="border border-black px-2 py-2">{t.kit}</td>
              <td className="border border-black px-2 py-2">{t.manufacturer}</td>
              <td className="border border-black px-2 py-2">{t.result}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {componentType === 'FFP' ? (
        <>
          <p className="text-sm leading-relaxed mb-3">
            The plasma supplied is human plasma for fractionation, obtained from whole blood donation, collected from healthy donors in India. The whole blood was collected in CE marked quadruple / triples SAGM Blood bags and plasma was obtained following the Indian Federal guidelines.
          </p>
          <p className="text-sm leading-relaxed mb-3">
            The plasma was recovered from whole blood in less than 6 hours of donation and after centrifugation and separation, frozen by cooling at -80&deg;C or below within one hour.
          </p>
          <p className="text-sm leading-relaxed mb-3">
            The storage temperature is routinely at a temperature of -40&deg;C or below, after taking into consideration the expected variances to account for normal defrost cycles, loading and unloading etc.
          </p>
        </>
      ) : (
        <p className="text-sm leading-relaxed mb-3">
          The {typeValue.toLowerCase()} supplied is obtained from whole blood donation, collected from healthy donors in India, prepared and stored under the temperature and handling conditions prescribed by the Indian Federal Drugs & Cosmetics Act, 1940.
        </p>
      )}

      <p className="text-sm leading-relaxed mb-10">
        Hereby, we certify that as per the guidelines of Indian Federal, Drugs & Cosmetics Act, 1940, all the units have been found to be free from HIV I & II Antibodies, Hepatitis B Surface Antigen, Hepatitis C Virus Antibodies, Malarial Parasite & Syphilis.
      </p>

      <div className="flex justify-between text-sm font-bold mt-16">
        <span>Authorized Signatory</span>
        <span>Date &amp; Stamp</span>
      </div>
    </div>
  );
}

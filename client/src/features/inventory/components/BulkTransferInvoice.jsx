import React from 'react';

const COMPONENT_MATERIAL = {
  RBC: 'Packed Red Blood Cells',
  FFP: 'Fresh Frozen Plasma',
  Platelet: 'Platelet Concentrate',
  Cryo: 'Cryoprecipitate',
};

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${TENS[tens]}${ones ? ' ' + ONES[ones] : ''}`;
}

function threeDigitsToWords(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let out = hundred ? `${ONES[hundred]} Hundred` : '';
  if (rest) out += `${out ? ' ' : ''}${twoDigitsToWords(rest)}`;
  return out;
}

// Indian numbering: crore / lakh / thousand / hundred.
function numberToWordsIndian(num) {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitsToWords(hundred));

  return parts.join(' ');
}

export default function BulkTransferInvoice({ transfer, ratePerLitre }) {
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
  const totalUnits = items.length;
  const totalLitres = items.reduce((sum, it) => sum + (Number(it.volumeMl) || 0), 0) / 1000;
  const rate = Number(ratePerLitre) || 0;
  const totalAmount = Math.round(totalLitres * rate);

  const componentTypes = [...new Set(items.map((it) => it.componentType).filter(Boolean))];
  const materialDescription = componentTypes.length === 1
    ? (COMPONENT_MATERIAL[componentTypes[0]] || componentTypes[0])
    : 'Blood Components';

  return (
    <div id="bulk-transfer-invoice-print" className="bg-white text-black font-sans p-10" style={{ minHeight: '9.8in', boxSizing: 'border-box' }}>
      <p className="text-center text-lg font-black uppercase tracking-widest mb-8">Invoice</p>

      <div className="flex justify-between text-sm mb-6">
        <div className="space-y-1">
          <p>Invoice No. <span className="font-semibold">{transfer.transferId}</span></p>
          <p>Invoice Date: <span className="font-semibold">{formatDate(transfer.createdAt)}</span></p>
        </div>
      </div>

      <div className="text-sm mb-6">
        <p className="font-bold uppercase mb-1">Customer Address:</p>
        <p className="font-semibold uppercase">{transfer.bloodBankName}</p>
        <p className="whitespace-pre-line">{transfer.bloodBankAddress}</p>
      </div>

      <table className="w-full border-collapse mb-4 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-2 py-2 font-bold">S.No</th>
            <th className="border border-black px-2 py-2 font-bold">Material Description</th>
            <th className="border border-black px-2 py-2 font-bold">Total Units</th>
            <th className="border border-black px-2 py-2 font-bold">Qty in Ltrs</th>
            <th className="border border-black px-2 py-2 font-bold">Rate per Ltr</th>
            <th className="border border-black px-2 py-2 font-bold">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 py-3 text-center">1</td>
            <td className="border border-black px-2 py-3">{materialDescription}</td>
            <td className="border border-black px-2 py-3 text-center">{totalUnits}</td>
            <td className="border border-black px-2 py-3 text-center">{totalLitres.toFixed(2)}</td>
            <td className="border border-black px-2 py-3 text-center">{rate}</td>
            <td className="border border-black px-2 py-3 text-right">{totalAmount.toLocaleString('en-IN')}/-</td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-2 font-bold text-right" colSpan={5}>Total</td>
            <td className="border border-black px-2 py-2 font-bold text-right">{totalAmount.toLocaleString('en-IN')}/-</td>
          </tr>
        </tbody>
      </table>

      <p className="text-sm font-semibold mb-6">
        Rupees :- {numberToWordsIndian(totalAmount)} Rupees Only
      </p>

      <p className="text-sm mb-2">Blood Bank license no &amp; Expiry date:-- N-KD 15, Date of Expiry-31/12/2026</p>
      <p className="text-sm mb-10">Name on which payment required:-- SAI HEALTH CARE FOUNDATION</p>

      <div className="flex justify-between text-sm font-bold mt-16">
        <span>Authorized Signatory</span>
        <span>Stamp</span>
      </div>
    </div>
  );
}

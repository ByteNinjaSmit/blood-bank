const fs = require('fs');
const path = 'src/features/bag-procurement/pages/GoodsReceipt.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename invoiceDate to billDate in state and API call
content = content.replace(/const \[invoiceDate, setInvoiceDate\] = useState\(''\);/g, "const [billDate, setBillDate] = useState('');");
content = content.replace(/invoiceDate,/g, "billDate,");
content = content.replace(/value=\{invoiceDate\} onChange=\{\(e\) => setInvoiceDate\(e\.target\.value\)\}/g, "value={billDate} onChange={(e) => setBillDate(e.target.value)}");
content = content.replace(/<label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Invoice Date<\/label>/g, '<label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bill Date</label>');

// 2. Add handlePoChange to auto-populate invoiceNo and billDate
const submitHandlerStr = '  const handleSubmit = (e) => {';
const handlePoStr = `  const handlePoChange = (e) => {
    const selectedPoId = e.target.value;
    setPoId(selectedPoId);
    if (!selectedPoId) {
      setInvoiceNo('');
      setBillDate('');
      return;
    }
    const selectedPo = pos.find((p) => p._id === selectedPoId || p.id === selectedPoId);
    if (selectedPo) {
      if (selectedPo.invoiceNo) setInvoiceNo(selectedPo.invoiceNo);
      if (selectedPo.billDate) setBillDate(selectedPo.billDate.split('T')[0]);
    }
  };

  const handleSubmit = (e) => {`;
content = content.replace(submitHandlerStr, handlePoStr);

// 3. Update select onChange to use handlePoChange
content = content.replace(/onChange=\{\(e\) => setPoId\(e\.target\.value\)\}/g, "onChange={handlePoChange}");

// 4. Update the PO mapping dropdown to show vendorName and NOT filter out non-APPROVED if we want them to show (wait, let's keep it APPROVED or add PENDING_APPROVAL?)
// The user said "make the po showing in goods receipt". If they just created it, it's DRAFT. Let's allow any PO that is not CANCELLED or REJECTED.
content = content.replace(/\(pos \?\? \[\]\)\.filter\(\(p\) => p\.status === 'APPROVED'\)\.map\(\(p\) => \(/g, "(pos ?? []).filter((p) => p.status !== 'CANCELLED' && p.status !== 'REJECTED').map((p) => (");
content = content.replace(/>\{p\.poNumber\} — \{p\.vendor\?\.vendorName\}<\/option>/g, ">{p.poNumber} — {p.vendorName ?? 'No Vendor'}</option>");

// 5. Update createGRN payload to send vendorName
const poIdLine = '      purchaseOrderId: poId,';
const poIdAndVendor = `      poId,
      vendorName: pos.find(p => p._id === poId || p.id === poId)?.vendorName,`;
content = content.replace(poIdLine, poIdAndVendor);

// 6. Fix table list column vendor name
content = content.replace(/<td className="px-4 py-3 text-sm text-gray-700">\{g\.purchaseOrder\?\.vendor\?\.vendorName \?\? '—'\}<\/td>/g, '<td className="px-4 py-3 text-sm text-gray-700">{g.vendorName ?? g.purchaseOrder?.vendorName ?? \'—\'}</td>');

// 7. Fix mapping of grns
content = content.replace(/const grns = data\?\.goodsReceipts \?\? data \?\? \[\];/g, "const grns = data?.items ?? data?.goodsReceipts ?? (Array.isArray(data) ? data : []);");
content = content.replace(/const pos  = poData\?\.purchaseOrders \?\? poData \?\? \[\];/g, "const pos = poData?.items ?? poData?.purchaseOrders ?? (Array.isArray(poData) ? poData : []);");


fs.writeFileSync(path, content, 'utf8');
console.log('GoodsReceipt.jsx updated successfully.');

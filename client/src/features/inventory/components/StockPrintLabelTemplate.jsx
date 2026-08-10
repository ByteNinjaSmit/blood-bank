import { COMPONENT_PRINT_LABEL } from "@/constants/component-types";
import Code39Barcode from "./Code39Barcode";

export default function StockPrintLabelTemplate({ item, formatDate }) {
  if (!item) return null;

  return (
    <div
      className="printable-label-area border border-black bg-white flex flex-col text-black font-sans relative overflow-hidden shrink-0 select-none"
      style={{
        width: '10cm',
        height: '13cm',
        boxSizing: 'border-box',
        padding: '0.15cm',
        border: '1.2px solid black',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Blood Bank Header matching the image */}
      <div className="w-full flex flex-col items-center justify-center border-b border-black pb-1 mb-1 bg-white shrink-0 text-center relative select-none" style={{ height: '2cm' }}>
        <span className="text-[9px] font-bold tracking-wide text-black uppercase leading-none mb-1">Sai Healthcare Foundation Charitable Trusts</span>
        <h3 className="text-[25px] font-black text-black leading-none tracking-tight uppercase" style={{ wordSpacing: '1px' }}>
          SANJIVANI BLOOD CENTRE
        </h3>
        <div className="w-full flex justify-between text-[6.5px] font-medium text-black uppercase mt-1 px-1.5">
          <span>(F.D.A. Lic. No. N-KD 15)</span>
          <span>(SBTC Reg. No. - 0031)</span>
        </div>
        <div className="w-full text-center text-[6px] leading-tight font-bold text-black uppercase mt-1 px-1">
          110-2-B, 'Nishigandha', Vivekanandnagar, Near S. G. Vidyalaya, Kopargaon - 423 601, Dist. Ahmednagar. (M.S.) <span style={{ filter: 'grayscale(100%) contrast(100%) brightness(0)' }}>☎︎</span> - (02423) 222237
        </div>
      </div>

      {/* Middle Section (divided into Blood Group, Component details, and QR code/Dates) */}
      <div className="flex w-full border-b border-black pb-1 shrink-0" style={{ height: '4.2cm' }}>
        {/* Left Side: Huge Blood Group Display */}
        <div className="w-[2.3cm] flex flex-col items-center justify-center border-r border-black pr-0.5 select-none shrink-0 text-center">
          <span
            className="font-black leading-none text-black tracking-tighter"
            style={{
              fontFamily: 'sans-serif',
              fontSize: (item?.bag?.bloodGroup || 'N/A') === 'AB' ? '48px' : '56px'
            }}
          >
            {item?.bag?.bloodGroup || 'N/A'}
          </span>
          <span className="text-[9px] font-black uppercase tracking-tighter -mt-0.5 text-black whitespace-nowrap">
            Rh(D) {item?.bag?.rh || 'N/A'}
          </span>
          <span className="text-[7px] font-black uppercase tracking-tighter text-black mt-1 leading-tight text-center">
            {(item?.bag?.donationType || 'VOLUNTARY').toLowerCase() === 'replacement' ? 'Replacement Donor' : 'Voluntary Donor'}
          </span>
        </div>

        {/* Center: Component Name, Volume, Test Results, and both separation specifications */}
        <div className="flex-1 px-1.5 flex flex-col justify-start pt-2 select-none text-left min-w-0">
          <h4 className="text-[14.5px] font-black leading-tight text-black uppercase">
            {COMPONENT_PRINT_LABEL[item?.component?.componentType] || 'Blood Component'}
          </h4>
          <p className="text-[13px] font-extrabold text-black leading-none mb-1.5">({item?.component?.volumeMl ? `${item.component.volumeMl} ml` : '— ml'})</p>

          <div className="text-[8px] leading-snug font-black text-black uppercase tracking-tight space-y-1.4 mt-1">
            <p>HIV I & II antibodies / HBs Ag / HCV: Non Reactive.</p>
            <p>VDRL / Malarial Parasite / Atypical Antibodies: Not Detected.</p>
          </div>

          <div className="border-t border-black my-1.5"></div>

          <div className="text-[7.4px] leading-tight font-bold text-black uppercase tracking-tight space-y-1">
            <p>Separated from 450 ml / 350 ml of human blood + 63 / 49 ml. of CPDA, anticoagulant</p>
            <div className="border-t border-black my-1 opacity-60"></div>
            <p>350 ml of human blood + SAGM-2 Solution (Volume 350 ± 20 ml.)</p>
          </div>
        </div>

        {/* Right Side: QR Code Scan Area & Dates below it */}
        <div className="w-[2.3cm] flex flex-col items-center justify-center border-l border-black pl-0.5 shrink-0 select-none">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?format=svg&size=500x500&qzone=1&ecc=M&data=${encodeURIComponent(`${import.meta.env.VITE_PUBLIC_FRONTEND_URL || ''}/verify/${item?.unitId || item?.bag?.bagNo || item?.bagNo || 'unknown'}`)}`}
            alt="QR Code"
            className="w-[2.1cm] h-[2.1cm] shrink-0"
            style={{ imageRendering: 'crisp-edges' }}
          />
          <span className="text-[5.5px] font-black text-center mt-1 uppercase tracking-tighter text-black leading-none">Scan For Details</span>

          <div className="flex flex-col text-[8px] font-black text-black mt-1.5 text-center leading-tight">
            <span>Collection: {formatDate(item?.bag?.donationDate)}</span>
            <span>Expiry: {formatDate(item?.component?.expiryDate)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section (instructions stacked above barcodes, since width is now the constrained dimension) */}
      <div className="flex flex-col flex-1 w-full pt-1 overflow-hidden">
        {/* Top: Instructions (full label width for the 10-point list) */}
        <div className="w-full pb-1 border-b border-black flex flex-col justify-start shrink-0 select-none">
          <h5 className="text-[7.5px] font-black uppercase tracking-wider mb-0.5 text-black underline">Instructions for Use & Storage</h5>
          <ol className="list-decimal pl-2.5 text-[7px] leading-tight font-bold space-y-0.5 text-black">
            <li>Keep continuously at +2°C to +6°C until administration.</li>
            <li>Do not dispense without prescription.</li>
            <li>Double check recipient's identity and cross-check the blood group of the unit and recipient before administration.</li>
            <li>Compatibility testing is essential before use (Report enclosed with bag).</li>
            <li>Shake the bag gently before use. Bring the unit to room temperature without warming the bag.</li>
            <li>Do not use if there is any visible evidence of haemolysis, clotting or discoloration in the bag.</li>
            <li>Do not add any other medication to the blood. Do not vent. Administration must be through a disposable, sterile set with filter.</li>
            <li>Caution: HIV, HBsAg & HCV transmission may not be ruled out despite careful donor screening due to the Window Period.</li>
            <li>Inform the Blood Bank immediately in case of transfusion reaction.</li>
            <li>Unit once issued will not be taken back.</li>
          </ol>
        </div>

        {/* Bottom: Barcodes side by side */}
        <div className="flex-1 pt-1 flex items-center justify-center gap-3 select-none">
          {/* Bag No Barcode */}
          <div className="flex-1 flex flex-col items-center">
            <Code39Barcode value={item?.bag?.bagNo || item?.bagNo || 'N/A'} width={0.85} height={30} className="h-[30px]" />
            <span className="text-[8px] font-black tracking-wider mt-1 uppercase text-black">
              {item?.bag?.bagNo || item?.bagNo || 'N/A'}
            </span>
          </div>

          {/* Segment No Barcode */}
          <div className="flex-1 flex flex-col items-center">
            <Code39Barcode value={item?.bag?.segmentNo || item?.segmentNo || 'N/A'} width={0.8} height={30} className="h-[30px]" />
            <span className="text-[7.5px] font-black tracking-wider mt-1 uppercase text-black">
              Segment No: {item?.bag?.segmentNo || item?.segmentNo || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

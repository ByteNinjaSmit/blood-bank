const CODE39_PATTERNS = {
  '0': 'n n n w w n w n n',
  '1': 'w n n w n n n n w',
  '2': 'n n w w n n n n w',
  '3': 'w n w w n n n n n',
  '4': 'n n n w w n n n w',
  '5': 'w n n w w n n n n',
  '6': 'n n w w w n n n n',
  '7': 'n n n w n n w n w',
  '8': 'w n n w n n w n n',
  '9': 'n n w w n n w n n',
  'A': 'w n n n n w n n w',
  'B': 'n n w n n w n n w',
  'C': 'w n w n n w n n n',
  'D': 'n n n n w w n n w',
  'E': 'w n n n w w n n n',
  'F': 'n n w n w w n n n',
  'G': 'n n n n n w w n w',
  'H': 'w n n n n w w n n',
  'I': 'n n w n n w w n n',
  'J': 'n n n n w w w n n',
  'K': 'w n n n n n n w w',
  'L': 'n n w n n n n w w',
  'M': 'w n w n n n n w n',
  'N': 'n n n n w n n w w',
  'O': 'w n n n w n n w n',
  'P': 'n n w n w n n w n',
  'Q': 'n n n n n n w w w',
  'R': 'w n n n n n w w n',
  'S': 'n n w n n n w w n',
  'T': 'n n n n w n w w n',
  'U': 'w w n n n n n n w',
  'V': 'n w w n n n n n w',
  'W': 'w w w n n n n n n',
  'X': 'n w n n w n n n w',
  'Y': 'w w n n w n n n n',
  'Z': 'n w w n w n n n n',
  '-': 'n w n n n n w n w',
  '.': 'w w n n n n w n n',
  ' ': 'n w w n n n w n n',
  '*': 'n w n n w n w n n',
  '$': 'n w n w n w n n n',
  '/': 'n w n w n n n w n',
  '+': 'n w n n n w n w n',
  '%': 'n n n w n w n w n'
};

const Code39Barcode = ({ value, width = 1.0, height = 30, className = "" }) => {
  if (!value) return null;
  // Code 39 only supports 0-9 A-Z - . space $ / + %. Any other character
  // (e.g. an underscore in a generated ID) is remapped to '-' rather than
  // silently dropped, so the encoded barcode never desyncs from the text
  // printed underneath it.
  const sanitized = value
    .toString()
    .toUpperCase()
    .replace(/[^0-9A-Z\-. $/+%]/g, '-');
  const uppercaseValue = `*${sanitized}*`;

  const narrowWidth = width;
  const wideWidth = width * 3.0;
  // Scanners need clear white space of roughly 10x the narrow-bar width on
  // both sides to reliably detect the start/stop pattern — without this
  // quiet zone the barcode reads as garbage or fails to scan at all.
  const quietZone = narrowWidth * 10;

  let currentX = quietZone;
  const rects = [];

  for (let i = 0; i < uppercaseValue.length; i++) {
    const char = uppercaseValue[i];
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) continue;

    const elements = pattern.split(' ');
    elements.forEach((size, index) => {
      const isBar = index % 2 === 0;
      const elementWidth = size === 'w' ? wideWidth : narrowWidth;

      if (isBar) {
        rects.push(
          <rect
            key={`${i}-${index}`}
            x={currentX}
            y={0}
            width={elementWidth}
            height={height}
            fill="black"
          />
        );
      }
      currentX += elementWidth;
    });

    currentX += narrowWidth;
  }

  const totalWidth = currentX + quietZone;

  return (
    <svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`} className={`max-w-full ${className}`}>
      {rects}
    </svg>
  );
};

export default Code39Barcode;

export function formatBloodBagQty(total) {
  if (total == null || isNaN(total)) return '0 bags';
  const boxes = Math.floor(total / 45);
  const remaining = total % 45;
  const packets = Math.floor(remaining / 5);
  const bags = remaining % 5;

  const parts = [];
  if (boxes > 0) parts.push(`${boxes} Box${boxes > 1 ? 'es' : ''}`);
  if (packets > 0) parts.push(`${packets} Packet${packets > 1 ? 's' : ''}`);
  if (bags > 0) parts.push(`${bags} Bag${bags > 1 ? 's' : ''}`);
  
  if (parts.length === 0) return '0 bags';
  if (total < 5) return `${total} bag${total > 1 ? 's' : ''}`;
  return `${parts.join(', ')} (${total} bags)`;
}

export function calcTotalBags(boxes, packets, bags) {
  const bx = Number(boxes) || 0;
  const pk = Number(packets) || 0;
  const bg = Number(bags) || 0;
  return (bx * 45) + (pk * 5) + bg;
}

export function getBoxPacketBagDecomposition(total) {
  if (total == null || isNaN(total)) return { boxes: '', packets: '', bags: '' };
  const boxes = Math.floor(total / 45);
  const remaining = total % 45;
  const packets = Math.floor(remaining / 5);
  const bags = remaining % 5;
  return {
    boxes: boxes || '',
    packets: packets || '',
    bags: bags || ''
  };
}

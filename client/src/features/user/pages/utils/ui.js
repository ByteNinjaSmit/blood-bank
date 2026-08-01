export const statusChipClass = (status) => {
  switch (status) {
    case 'active': return 'bg-green-600';
    case 'pending': return 'bg-amber-500';
    case 'blocked': return 'bg-red-600';
    case 'rejected': return 'bg-rose-600';
    case 'inactive': return 'bg-slate-500';
    default: return 'bg-slate-500';
  }
};

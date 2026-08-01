export default function DecisionBadge({ decision }) {
  const configs = {
    PASSED: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'Test Passed' },
    FAILED: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Test Failed' },
    REJECTED: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Rejected' },
    ACCEPTED: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'Accepted' },
  };
  const c = configs[decision] || { bg: 'bg-gray-100 text-gray-700 border-gray-200', text: decision };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg}`}>
      {c.text}
    </span>
  );
}

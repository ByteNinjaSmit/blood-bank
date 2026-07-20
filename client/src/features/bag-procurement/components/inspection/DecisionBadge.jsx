import { DECISION_BADGE } from './inspection-constants';

export default function DecisionBadge({ decision }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${DECISION_BADGE[decision] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {decision}
    </span>
  );
}

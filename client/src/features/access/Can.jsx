import useAccess from './useAccess';

// <Can module="donor" page="donor-creation" action="create">...</Can>
// `page` is optional — omit it to check a module-wide grant only.
export default function Can({ module, page, action, children, fallback = null }) {
  const { can } = useAccess();
  return can(module, action, page) ? children : fallback;
}

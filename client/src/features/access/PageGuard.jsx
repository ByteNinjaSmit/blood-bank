import useAccess from './useAccess';
import AccessDenied from './AccessDenied';

// Wraps a routed page element so direct URL navigation is blocked exactly
// like the nav/sidebar already hides the link — the fix for pages (like
// Donor Creation) that previously had zero permission check at all.
export default function PageGuard({ module, page, children }) {
  const { canViewPage } = useAccess();
  if (!canViewPage(module, page)) return <AccessDenied />;
  return children;
}

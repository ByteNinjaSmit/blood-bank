import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
      <ShieldAlert className="w-10 h-10 text-red-600" />
      <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        You don't have permission to view this page. Contact an administrator if you believe this is a mistake.
      </p>
      <Link to="/" className="mt-2 text-sm font-medium text-red-700 hover:text-red-900">
        Back to Dashboard
      </Link>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Button } from './components/ui/button';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="bg-red-500 text-white text-6xl font-bold rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">404</div>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you are looking for doesn't exist or has been moved.</p>
        <Button asChild className="bg-red-500 hover:bg-red-600">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
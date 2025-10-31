import { useAuth } from "@/store/auth";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "../utils/Spinner";
import MasterLoader from "../Loader";

export const AuthenticatedRoute = ({ children }) => {
  const { user, isLoading, isLoggedIn } = useAuth();
  const location = useLocation();

  if (isLoading && !isLoggedIn) {
    return <Loader />;
  }
  if (isLoading) {
    return <MasterLoader />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoggedIn && location.pathname.startsWith("/login")) {
    return <Navigate to="/" replace />;
  }

  return children; // ✅ render the wrapped comp
};
// components/auth/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import FullScreenLoader from "../../UI/loader/FullScreenLoader";
import { useAuth } from "../../../context/auth/AuthContext";
import {
  buildShopifyInstallPath,
  isEmbeddedShopifyContext,
} from "../../../utils/shopifyEmbedded";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { clearTokens, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [authGuardExpired, setAuthGuardExpired] = useState(false);
  const clearTokensRef = useRef(clearTokens);

  clearTokensRef.current = clearTokens;

  useEffect(() => {
    setAuthGuardExpired(false);
    if (!loading) return;

    const timeout = window.setTimeout(() => {
      setAuthGuardExpired(true);
      clearTokensRef.current();
    }, 12000);

    return () => window.clearTimeout(timeout);
  }, [loading, location.pathname]);

  if (loading && !authGuardExpired) return <FullScreenLoader />; // or global spinner
  if (!isAuthenticated) {
    if (isEmbeddedShopifyContext()) {
      return <Navigate to={buildShopifyInstallPath(location.pathname)} replace />;
    }
    // bounce user to login, keep the page they wanted
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}

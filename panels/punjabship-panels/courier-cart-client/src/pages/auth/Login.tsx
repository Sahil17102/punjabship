// pages/auth/Login.tsx
import { Navigate, useLocation } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { useAuth } from "../../context/auth/AuthContext";
import { isSellerEmployeeAccount } from "../../utils/sellerEmployee";

export default function Login() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const shop = String(params.get('shop') || '').trim();
  const isShopifyInstall = params.get('shopifyInstall') === '1';
  const from = (location.state as {
    from?: { pathname?: string; search?: string; hash?: string }
  } | null)?.from;
  const returnTo =
    from?.pathname && from.pathname !== "/"
      ? `${from.pathname}${from.search || ""}${from.hash || ""}`
      : "/home";

  // optional global loader while figuring out status
  if (loading) return null;

  if (shop || isShopifyInstall) {
    const nextParams = new URLSearchParams()
    nextParams.set('shopifyInstall', '1')
    if (shop) nextParams.set('shop', shop)
    if (params.get('host')) nextParams.set('host', String(params.get('host') || ''))
    return <Navigate to={`/shopify/install?${nextParams.toString()}`} replace />
  }

  if (isAuthenticated) {
    // not finished onboarding → push them to questions
    if (!isSellerEmployeeAccount(user) && !user?.onboardingComplete) {
      return <Navigate to="/onboarding-questions" replace />;
    }
    // fully onboarded → straight to dashboard
    return <Navigate to={returnTo} replace />;
  }

  // unauthenticated → show the actual login form
  return <LoginForm />;
}

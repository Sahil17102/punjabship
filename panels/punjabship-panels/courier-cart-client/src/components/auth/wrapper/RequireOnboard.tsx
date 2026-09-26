// components/auth/RequireOnboard.tsx
import { Navigate, useLocation } from "react-router-dom";
import FullScreenLoader from "../../UI/loader/FullScreenLoader";
import type { JSX } from "@emotion/react/jsx-runtime";
import { useAuth } from "../../../context/auth/AuthContext";
import { isSellerEmployeeAccount } from "../../../utils/sellerEmployee";

export default function RequireOnboard({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation(); // keeps track of where the user came from

  /* 1️⃣  Still loading auth state? show spinner */
  if (loading) return <FullScreenLoader />;

  /* 2️⃣  Not logged in at all → kick back to login */
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  /* 3️⃣  Logged‑in AND already onboarded → send to main app */
  if (user?.onboardingComplete || isSellerEmployeeAccount(user)) {
    return <Navigate to="/home" replace />;
  }

  /* 4️⃣  Logged‑in BUT NOT onboarded → let them see onboarding page */
  return children;
}

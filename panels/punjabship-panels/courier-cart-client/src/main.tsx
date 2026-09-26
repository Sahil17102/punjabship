import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import App from "./App.tsx";
import "./index.css";
import darkTheme from "./theme/theme.ts";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "./components/UI/Toast.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/auth/AuthContext.tsx";
import ErrorBoundary from "./components/UI/ErrorBoundary.tsx";
import "@fontsource-variable/andada-pro";
import "@fontsource-variable/epilogue";
import "@fontsource-variable/hahmlet";

const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const entrypointSrc =
  document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src || "punjabship-entry";
const CHUNK_RELOAD_KEY = `__chunk_reload_attempted__:${entrypointSrc}`;

const isChunkLoadError = (message?: string) => {
  if (!message) return false;
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed")
  );
};

const tryReloadForChunkError = () => {
  const alreadyAttempted = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
  if (alreadyAttempted) return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
};

window.addEventListener("error", (event) => {
  const message = event?.error?.message || event?.message;
  if (isChunkLoadError(message)) {
    tryReloadForChunkError();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason;
  const message =
    reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "";
  if (isChunkLoadError(message)) {
    tryReloadForChunkError();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2, // only retry failed queries once
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <ToastProvider />
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);

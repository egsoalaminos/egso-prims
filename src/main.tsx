import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { Toaster } from "@/components";
import { AuthProvider } from "@/features/auth/auth-context";
import { applyCachedAppearance } from "@/features/config/theme";
import { router } from "@/router";
import "@/index.css";

// Paint the stored theme before React mounts, so there is no flash of the
// wrong palette on reload or a cold start at the login screen.
applyCachedAppearance();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  </StrictMode>,
);

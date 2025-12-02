"use client";

import { useAuthListener } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  useAuthListener();
  
  return (
    <>
      {children}
      <AuthModal />
    </>
  );
}


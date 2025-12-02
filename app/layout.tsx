import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/store/provider";
import AuthWrapper from "@/components/layout/AuthWrapper";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Summarist - Book Summaries",
  description: "Get book summaries and audiobooks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <StoreProvider>
            <AuthWrapper>
              <Navbar />
              {children}
            </AuthWrapper>
          </StoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}


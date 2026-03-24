import type { Metadata } from "next";
import "./globals.css";

import { ToastProvider } from "@contexts/toastcontext";
import Navbar from "@components/navbar";
import { AuthProvider } from "@contexts/authcontext";
import { Suspense } from "react";
import Footer from "@components/footer";

export const metadata: Metadata = {
  title: "OpacubeVIP",
  description: "Opacube's website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`bg-background text-white`}>

        <Suspense>
          <ToastProvider>
            <AuthProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </AuthProvider>
          </ToastProvider>
        </Suspense>


      </body>
    </html>
  );
}

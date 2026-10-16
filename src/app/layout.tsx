import type { Metadata } from "next";
import "./globals.css";

import { ToastProvider } from "@contexts/toastcontext";
import Navbar from "@components/navbar";
import { AuthProvider } from "@contexts/authcontext";
import { Suspense } from "react";
import Footer from "@components/footer";
import { ImageViewerProvider } from "@contexts/imageviewercontext";
import { ModalProvider } from "@contexts/modalcontext";

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
      <body className={`bg-background text-textprimary`}>

        <Suspense>
          <ModalProvider>
            <ImageViewerProvider>
              <ToastProvider>
                <AuthProvider>
                    <div className="min-h-screen flex flex-col">
                      <Navbar type="top" />
                      <main className="flex-1">
                        {children}
                      </main>
                      <Footer />
                      <Navbar type="bottom" />
                    </div>
                </AuthProvider>
              </ToastProvider>
            </ImageViewerProvider>
          </ModalProvider>
        </Suspense>


      </body>
    </html>
  );
}

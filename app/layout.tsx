import type { Metadata } from "next";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Prediction Paddock",
    template: "%s | The Prediction Paddock",
  },
  description: "Predict F1 race results and compete with your friends in pools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

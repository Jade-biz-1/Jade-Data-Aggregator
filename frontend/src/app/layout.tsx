import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Aggregator Platform",
  description: "A comprehensive data integration solution designed to connect, process, and deliver data from multiple sources in a standardized format.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

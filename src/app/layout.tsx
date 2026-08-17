import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex";

export const metadata: Metadata = {
  title: "UniFi Access ↔ Jisr Attendance Bridge",
  description: "Real-time attendance synchronization and employee mapping engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}

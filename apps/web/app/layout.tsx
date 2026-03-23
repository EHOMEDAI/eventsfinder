import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "../components/auth-provider";
import { SiteShell } from "../components/site-shell";

export const metadata: Metadata = {
  title: "EventsFinder MVP",
  description: "Course-delivery MVP for event discovery, bookmarking, RSVP, and lightweight admin management"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}

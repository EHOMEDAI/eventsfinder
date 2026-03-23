"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/bookings", label: "Bookings" }
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { account, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand">
            <strong>EventsFinder</strong>
            <span>Course-delivery event discovery and RSVP platform</span>
          </Link>
          <nav className="nav-links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-pill${pathname === link.href ? " active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            {account?.roles.includes("ADMIN") ? (
              <Link href="/admin" className={`nav-pill${pathname === "/admin" ? " active" : ""}`}>
                Admin
              </Link>
            ) : null}
            {account ? (
              <>
                <span className="nav-pill">{account.displayName}</span>
                <button type="button" className="button-subtle" onClick={logout}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={`nav-pill${pathname === "/login" ? " active" : ""}`}>
                  Log In
                </Link>
                <Link href="/register" className="button">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="page-container">{children}</main>
    </div>
  );
}

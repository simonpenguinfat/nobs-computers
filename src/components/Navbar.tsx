import Link from "next/link";
import site from "../../content/site.json";
import LogoutButton from "./LogoutButton";

interface NavbarProps {
  user?: { email: string; role: string } | null;
  loading?: boolean;
}

export default function Navbar({ user, loading }: NavbarProps) {
  return (
    <nav className="border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
          <div className="w-8 h-8 shrink-0 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-xs tracking-tight">
            NB
          </div>
          <span className="font-semibold text-base sm:text-lg truncate group-hover:text-neutral-600 transition-colors">
            {site.siteName}
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {loading ? (
            <div className="h-9 w-24 bg-neutral-100 rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <Link
                href={user.role === "builder" ? "/admin" : "/buyer"}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors px-2 sm:px-3 py-2"
              >
                {user.role === "builder" ? "Admin" : "Dashboard"}
              </Link>
              <LogoutButton className="text-sm px-3 sm:px-4 py-2 rounded-lg border border-border hover:bg-surface-light transition-colors text-neutral-700" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors px-2 sm:px-3 py-2"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm px-3 sm:px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

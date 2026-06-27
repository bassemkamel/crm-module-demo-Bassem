"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Spinner } from "@/components/states";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (status === "unauthenticated" && !isLoginPage) {
      router.replace("/login");
    } else if (status === "authenticated" && isLoginPage) {
      router.replace("/");
    }
  }, [status, isLoginPage, router]);

  // The login page renders standalone (no app chrome).
  if (isLoginPage) {
    return <>{children}</>;
  }

  // While loading or redirecting an unauthenticated user, don't render the
  // protected content (avoids flashing data / firing protected requests).
  if (status !== "authenticated") {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/opportunities" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                C
              </span>
              <span className="text-base font-semibold text-zinc-900">CRM</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium text-zinc-600">
              <Link
                href="/opportunities"
                className="rounded-md px-3 py-1.5 hover:bg-zinc-100"
              >
                Opportunités
              </Link>
              <Link
                href="/clients"
                className="rounded-md px-3 py-1.5 hover:bg-zinc-100"
              >
                Clients
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">{user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </>
  );
}

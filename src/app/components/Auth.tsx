"use client";

import { usePrivy } from "@privy-io/react-auth";

export function Auth({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <button
          onClick={login}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-0 right-0 m-4">
        <button
          onClick={logout}
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      {children}
    </div>
  );
}

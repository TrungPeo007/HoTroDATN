"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/fetcher";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiFetch("http://localhost:5000/api/me")
      .then(() => setChecking(false))
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Đang xác thực...</p>
      </div>
    );
  }

  return <>{children}</>;
}

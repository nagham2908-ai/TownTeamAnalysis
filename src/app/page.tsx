"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "wfc_questionnaire_token";

function newToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "tt-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {
      // localStorage unavailable — fall back to a fresh token each visit
    }
    if (!token) {
      token = newToken();
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch {
        // ignore
      }
    }
    router.replace(`/q/${token}`);
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#5a6178" }}>
      Loading your questionnaire…
    </div>
  );
}

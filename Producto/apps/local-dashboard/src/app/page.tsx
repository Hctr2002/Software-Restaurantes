"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    window.location.replace(process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000");
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalDateKey } from "@/lib/dates";

// Opening /food with no date lands here. The server can't know what day it is
// on YOUR phone, so the browser works it out and jumps to /food?date=today.
export default function GoToToday() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/food?date=${getLocalDateKey()}`);
  }, [router]);

  return <p className="pt-12 text-center text-sm text-muted">Loading today…</p>;
}

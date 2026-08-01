"use client";

import { useEffect } from "react";

export default function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    const timers = [0, 100, 500].map((delay) =>
      window.setTimeout(() => {
        document.title = title;
      }, delay)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [title]);

  return null;
}

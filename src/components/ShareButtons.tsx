"use client";

import { useState } from "react";

export default function ShareButtons({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    return `${window.location.origin}/p/${slug}`;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable, ignore silently
    }
  }

  function handleShareWA() {
    const url = getUrl();
    const text = encodeURIComponent(`Roadmap "${title}": ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={handleShareWA}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-200 transition hover:opacity-90"
      >
        Share ke WhatsApp
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
      >
        {copied ? "Link disalin!" : "Salin Link"}
      </button>
    </div>
  );
}

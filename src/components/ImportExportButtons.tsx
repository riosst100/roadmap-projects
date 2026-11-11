"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportExportButtons() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Import gagal" });
      } else {
        setMessage({
          ok: true,
          text: `Import selesai: ${data.projectsCreated} project baru, ${data.projectsExisting} project sudah ada, ${data.itemsCreated} item ditambahkan, ${data.itemsSkipped} item dilewati (duplikat).`,
        });
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Import gagal" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <a
          href="/api/export"
          download
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          ⬇ Export
        </a>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? "Mengimpor..." : "⬆ Import"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {message && (
        <p className={`text-xs ${message.ok ? "text-emerald-600" : "text-rose-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

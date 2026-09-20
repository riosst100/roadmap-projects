"use client";

import { useState, useTransition } from "react";
import ItemModal from "./ItemModal";
import { formatRupiah } from "@/lib/currency";

type Item = {
  id: string;
  title: string;
  description: string | null;
  purpose: string | null;
  cost: number | null;
  status: string;
  priority: string;
  order: number;
};

const COLUMNS: { key: string; label: string; header: string; dot: string }[] = [
  {
    key: "backlog",
    label: "Backlog",
    header: "from-slate-500 to-slate-400",
    dot: "bg-slate-400",
  },
  {
    key: "in_progress",
    label: "In Progress",
    header: "from-amber-500 to-orange-400",
    dot: "bg-amber-400",
  },
  {
    key: "done",
    label: "Done",
    header: "from-emerald-500 to-teal-400",
    dot: "bg-emerald-400",
  },
];

const PRIORITY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-rose-100 text-rose-700",
};

export default function RoadmapBoard({
  projectSlug,
  initialItems,
}: {
  projectSlug: string;
  initialItems: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function itemsFor(status: string) {
    return items
      .filter((i) => i.status === status)
      .sort((a, b) => a.order - b.order);
  }

  async function addItem(
    status: string,
    data: {
      title: string;
      description: string;
      purpose: string;
      cost: string;
      priority: string;
    }
  ) {
    setAddingTo(null);

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectSlug, status, ...data }),
    });
    const created = await res.json();
    if (res.ok) setItems((prev) => [...prev, created]);
  }

  async function updateItem(id: string, data: Partial<Item>) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...data } : i))
    );
    startTransition(async () => {
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    });
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  }

  function handleDrop(status: string) {
    if (!dragId) return;
    const item = items.find((i) => i.id === dragId);
    if (item && item.status !== status) {
      const order = itemsFor(status).length;
      updateItem(dragId, { status, order });
    }
    setDragId(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => {
        const colItems = itemsFor(col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
            className="flex flex-col overflow-hidden rounded-2xl border border-white bg-white/80 shadow-sm shadow-indigo-50 backdrop-blur"
          >
            <div
              className={`flex items-center justify-between bg-gradient-to-r ${col.header} px-4 py-3`}
            >
              <h3 className="text-sm font-semibold text-white">{col.label}</h3>
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium text-white">
                {colItems.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
              {colItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  className="group cursor-grab rounded-xl border border-slate-100 bg-white p-3 text-sm shadow-sm transition hover:shadow-md active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="shrink-0 text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                      aria-label="Hapus item"
                    >
                      ×
                    </button>
                  </div>

                  {item.description && (
                    <p className="mt-1 text-xs text-slate-500">
                      {item.description}
                    </p>
                  )}

                  {item.purpose && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Tujuan: </span>
                      {item.purpose}
                    </p>
                  )}

                  {item.cost !== null && item.cost > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Biaya: </span>
                      {formatRupiah(item.cost)}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                    <select
                      value={item.priority}
                      onChange={(e) =>
                        updateItem(item.id, { priority: e.target.value })
                      }
                      className={`rounded-full border-none px-2 py-0.5 text-xs font-medium outline-none ${PRIORITY_STYLE[item.priority]}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setAddingTo(col.key)}
                className="rounded-xl border border-dashed border-slate-200 p-2.5 text-left text-xs font-medium text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500"
              >
                + Tambah item
              </button>
            </div>
          </div>
        );
      })}

      {addingTo && (
        <ItemModal
          columnLabel={COLUMNS.find((c) => c.key === addingTo)?.label ?? ""}
          onClose={() => setAddingTo(null)}
          onSubmit={(data) => addItem(addingTo, data)}
        />
      )}
    </div>
  );
}

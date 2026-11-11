"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [view, setView] = useState<"board" | "list" | "table">("board");
  const [menu, setMenu] = useState<{ id: string; top: number; right: number } | null>(null);
  const menuItem = menu ? items.find((i) => i.id === menu.id) ?? null : null;
  const [editing, setEditing] = useState<Item | null>(null);
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

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  function chevron(item: Item) {
    const open = menu?.id === item.id;
    return (
      <button
        onClick={(e) => {
          if (open) {
            setMenu(null);
            return;
          }
          const rect = e.currentTarget.getBoundingClientRect();
          setMenu({
            id: item.id,
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
          });
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
        aria-label={open ? "Tutup aksi" : "Buka aksi"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M5 12l5-5 5 5" : "M5 8l5 5 5-5"} />
        </svg>
      </button>
    );
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
    <div>
      <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-medium">
        {(["board", "list", "table"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-3 py-1.5 transition ${view === v ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-indigo-600"}`}
          >
            {v === "board" ? "Board" : v === "list" ? "List" : "Tabel"}
          </button>
        ))}
      </div>
      {view === "board" ? (
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
                        {chevron(item)}
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

        </div>
      ) : view === "list" ? (
      <div className="overflow-hidden rounded-2xl border border-white bg-white/80 shadow-sm shadow-indigo-50 backdrop-blur">
        {items.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">Belum ada item.</p>
        )}
        <ul className="divide-y divide-slate-100">
          {COLUMNS.flatMap((col) =>
            itemsFor(col.key).map((item) => (
              <li key={item.id} className="group flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{col.label}</span>
                  </div>
                  {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
                  {item.purpose && (
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Tujuan: </span>{item.purpose}
                    </p>
                  )}
                  {item.cost !== null && item.cost > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Biaya: </span>{formatRupiah(item.cost)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => updateItem(item.id, { status: e.target.value, order: itemsFor(e.target.value).length })}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-xs outline-none"
                    aria-label="Status"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                  <select
                    value={item.priority}
                    onChange={(e) => updateItem(item.id, { priority: e.target.value })}
                    className={`rounded-full border-none px-2 py-0.5 text-xs font-medium outline-none ${PRIORITY_STYLE[item.priority]}`}
                    aria-label="Prioritas"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  {chevron(item)}
                </div>
              </li>
            ))
          )}
        </ul>
        <button
          onClick={() => setAddingTo("backlog")}
          className="w-full border-t border-dashed border-slate-200 p-3 text-left text-xs font-medium text-slate-400 transition hover:text-indigo-500"
        >
          + Tambah item
        </button>
      </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white bg-white/80 shadow-sm shadow-indigo-50 backdrop-blur">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3">Tujuan</th>
                <th className="px-4 py-3">Biaya</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Prioritas</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">Belum ada item.</td>
                </tr>
              )}
              {COLUMNS.flatMap((col) =>
                itemsFor(col.key).map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{item.description || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{item.purpose || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {item.cost !== null && item.cost > 0 ? formatRupiah(item.cost) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={(e) => updateItem(item.id, { status: e.target.value, order: itemsFor(e.target.value).length })}
                        className="rounded-full border border-slate-200 px-2 py-0.5 text-xs outline-none"
                        aria-label="Status"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.priority}
                        onChange={(e) => updateItem(item.id, { priority: e.target.value })}
                        className={`rounded-full border-none px-2 py-0.5 text-xs font-medium outline-none ${PRIORITY_STYLE[item.priority]}`}
                        aria-label="Prioritas"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">{chevron(item)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <button
            onClick={() => setAddingTo("backlog")}
            className="w-full border-t border-dashed border-slate-200 p-3 text-left text-xs font-medium text-slate-400 transition hover:text-indigo-500"
          >
            + Tambah item
          </button>
        </div>
      )}

      {menu && menuItem && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
          <div
            style={{ top: menu.top, right: menu.right }}
            className="fixed z-40 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            role="menu"
          >
            <button
              role="menuitem"
              onClick={() => {
                setEditing(menuItem);
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              ✎ Edit
            </button>
            <button
              role="menuitem"
              onClick={() => {
                deleteItem(menuItem.id);
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
            >
              × Hapus
            </button>
          </div>
        </>
      )}

      {addingTo && (
        <ItemModal
          columnLabel={COLUMNS.find((c) => c.key === addingTo)?.label ?? ""}
          onClose={() => setAddingTo(null)}
          onSubmit={(data) => addItem(addingTo, data)}
        />
      )}

      {editing && (
        <ItemModal
          columnLabel=""
          initialValues={{
            title: editing.title,
            description: editing.description ?? "",
            purpose: editing.purpose ?? "",
            cost: editing.cost !== null ? String(editing.cost) : "",
            priority: editing.priority,
          }}
          onClose={() => setEditing(null)}
          onSubmit={(data) => {
            updateItem(editing.id, {
              title: data.title,
              description: data.description,
              purpose: data.purpose,
              cost: data.cost === "" ? null : Number(data.cost),
              priority: data.priority,
            });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ImportExportButtons from "@/components/ImportExportButtons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <h1 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            Roadmap Project
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 sm:mx-0 sm:text-base">
            Buat roadmap untuk project apa pun, bebas diakses dan diubah siapa
            saja yang punya link.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:items-end">
          <Link
            href="/new"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:opacity-90"
          >
            + Project Baru
          </Link>
          <ImportExportButtons />
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Semua Project{" "}
          <span className="text-slate-400">({projects.length})</span>
        </h2>

        {projects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-8 text-center text-sm text-slate-400">
            Belum ada project. Klik &quot;+ Project Baru&quot; untuk membuat yang pertama.
          </p>
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/p/${p.slug}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white bg-white/80 p-4 shadow-sm shadow-indigo-50 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-100"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {p.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
                    {p._count.items} item
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

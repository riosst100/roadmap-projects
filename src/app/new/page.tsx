import Link from "next/link";
import NewProjectForm from "@/components/NewProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700"
      >
        ← Semua project
      </Link>

      <h1 className="mt-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
        Buat Project Baru
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Beri nama roadmap-mu, langsung bisa dibagikan ke siapa saja.
      </p>

      <section className="mt-6 rounded-2xl border border-white bg-white/80 p-5 shadow-lg shadow-indigo-100 backdrop-blur sm:p-6">
        <NewProjectForm />
      </section>
    </div>
  );
}

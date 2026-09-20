import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeItem } from "@/lib/serialize";
import RoadmapBoard from "@/components/RoadmapBoard";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
  });

  if (!project) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white bg-white/80 p-4 shadow-sm shadow-indigo-50 backdrop-blur sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700"
          >
            ← Semua project
          </Link>
          <h1 className="mt-1 truncate bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-sm text-slate-500">{project.description}</p>
          )}
        </div>
        <ShareButtons title={project.name} slug={project.slug} />
      </div>

      <RoadmapBoard
        projectSlug={project.slug}
        initialItems={project.items.map(serializeItem)}
      />
    </div>
  );
}

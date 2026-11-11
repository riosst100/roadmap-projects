import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const STATUSES = ["backlog", "in_progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

type ImportItem = {
  title: string;
  description: string | null;
  purpose: string | null;
  cost: bigint | null;
  status: string;
  priority: string;
  order: number;
};

type ImportProject = {
  slug: string;
  name: string;
  description: string | null;
  items: ImportItem[];
};

function str(v: unknown): string | null {
  return v === undefined || v === null || v === "" ? null : String(v);
}

function parseProjects(body: unknown): ImportProject[] | null {
  const root = body as { projects?: unknown } | unknown[] | null;
  const list = Array.isArray(root)
    ? root
    : root && Array.isArray(root.projects)
      ? root.projects
      : null;
  if (!list) return null;

  const out: ImportProject[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw as Record<string, unknown>;
    const name = String(p.name ?? "").trim();
    if (!name) continue;
    const slug = slugify(String(p.slug ?? "")) || slugify(name) || "project";

    const items: ImportItem[] = [];
    if (Array.isArray(p.items)) {
      p.items.forEach((rawItem, idx) => {
        if (!rawItem || typeof rawItem !== "object") return;
        const i = rawItem as Record<string, unknown>;
        const title = String(i.title ?? "").trim();
        if (!title) return;
        const costNum =
          i.cost === null || i.cost === undefined || i.cost === "" ? null : Number(i.cost);
        const order = Number(i.order);
        items.push({
          title,
          description: str(i.description),
          purpose: str(i.purpose),
          cost:
            costNum !== null && Number.isFinite(costNum) && costNum >= 0
              ? BigInt(Math.trunc(costNum))
              : null,
          status: STATUSES.includes(String(i.status)) ? String(i.status) : "backlog",
          priority: PRIORITIES.includes(String(i.priority)) ? String(i.priority) : "medium",
          order: Number.isFinite(order) ? order : idx,
        });
      });
    }

    out.push({ slug, name, description: str(p.description), items });
  }
  return out;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "File bukan JSON yang valid" }, { status: 400 });
  }

  const projects = parseProjects(body);
  if (!projects || projects.length === 0) {
    return NextResponse.json(
      { error: "Format tidak dikenali atau tidak ada project di file" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    let projectsCreated = 0;
    let projectsExisting = 0;
    let itemsCreated = 0;
    let itemsSkipped = 0;

    for (const p of projects) {
      let project = await tx.project.findUnique({
        where: { slug: p.slug },
        include: { items: { select: { title: true, status: true, description: true } } },
      });

      if (!project) {
        const created = await tx.project.create({
          data: { slug: p.slug, name: p.name, description: p.description },
        });
        project = { ...created, items: [] };
        projectsCreated += 1;
      } else {
        projectsExisting += 1;
      }

      const seen = new Set(
        project.items.map((i) => `${i.title}\u0000${i.status}\u0000${i.description ?? ""}`)
      );
      const toCreate = p.items.filter((i) => {
        const key = `${i.title}\u0000${i.status}\u0000${i.description ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      itemsSkipped += p.items.length - toCreate.length;

      if (toCreate.length > 0) {
        await tx.roadmapItem.createMany({
          data: toCreate.map((i) => ({ ...i, projectId: project.id })),
        });
        itemsCreated += toCreate.length;
      }
    }

    return { projectsCreated, projectsExisting, itemsCreated, itemsSkipped };
  });

  return NextResponse.json(result);
}

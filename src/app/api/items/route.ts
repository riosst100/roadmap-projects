import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeItem } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const projectSlug = String(body.projectSlug ?? "");
  const title = String(body.title ?? "").trim();

  if (!projectSlug || !title) {
    return NextResponse.json(
      { error: "projectSlug dan title wajib diisi" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) {
    return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
  }

  const status = ["backlog", "in_progress", "done"].includes(body.status)
    ? body.status
    : "backlog";
  const priority = ["low", "medium", "high"].includes(body.priority)
    ? body.priority
    : "medium";

  const count = await prisma.roadmapItem.count({
    where: { projectId: project.id, status },
  });

  const cost =
    body.cost !== undefined && body.cost !== null && body.cost !== ""
      ? Number(body.cost)
      : null;

  const item = await prisma.roadmapItem.create({
    data: {
      projectId: project.id,
      title,
      description: body.description ? String(body.description) : null,
      purpose: body.purpose ? String(body.purpose) : null,
      cost: cost !== null && Number.isFinite(cost) ? BigInt(cost) : null,
      status,
      priority,
      order: count,
    },
  });

  return NextResponse.json(serializeItem(item), { status: 201 });
}

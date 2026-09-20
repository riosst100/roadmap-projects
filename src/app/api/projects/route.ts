import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { nanoid } from "nanoid";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, name: true, description: true, createdAt: true },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nama project wajib diisi" }, { status: 400 });
  }

  const base = slugify(name) || "project";
  let slug = base;
  let attempt = 0;
  while (await prisma.project.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${nanoid(5).toLowerCase()}`;
    if (attempt > 5) break;
  }

  const project = await prisma.project.create({
    data: {
      name,
      slug,
      description: body.description ? String(body.description) : null,
    },
  });

  return NextResponse.json(project, { status: 201 });
}

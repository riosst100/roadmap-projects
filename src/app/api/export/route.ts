import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeItem } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
  });

  const payload = {
    app: "roadmap-projects",
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: projects.map((p) => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      items: p.items.map((raw) => {
        const i = serializeItem(raw);
        return {
          title: i.title,
          description: i.description,
          purpose: i.purpose,
          cost: i.cost,
          status: i.status,
          priority: i.priority,
          order: i.order,
        };
      }),
    })),
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="roadmap-export-${date}.json"`,
    },
  });
}

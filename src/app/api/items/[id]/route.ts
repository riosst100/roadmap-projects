import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeItem } from "@/lib/serialize";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const item = await prisma.roadmapItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.description !== undefined) data.description = String(body.description);
  if (body.purpose !== undefined) data.purpose = String(body.purpose);
  if (body.cost !== undefined) {
    const cost = body.cost === null || body.cost === "" ? null : Number(body.cost);
    data.cost = cost !== null && Number.isFinite(cost) ? BigInt(cost) : null;
  }
  if (body.status !== undefined && ["backlog", "in_progress", "done"].includes(body.status)) {
    data.status = body.status;
  }
  if (body.priority !== undefined && ["low", "medium", "high"].includes(body.priority)) {
    data.priority = body.priority;
  }
  if (body.order !== undefined) data.order = Number(body.order);

  const updated = await prisma.roadmapItem.update({ where: { id }, data });
  return NextResponse.json(serializeItem(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.roadmapItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }

  await prisma.roadmapItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

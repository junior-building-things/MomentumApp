import { NextRequest, NextResponse } from "next/server";
import { createComplianceForFeature } from "@/lib/legal";
import { FeaturePriority } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    title?: string;
    priority?: FeaturePriority;
    prdUrl?: string | null;
    meegoUrl?: string | null;
  };

  const title = body.title?.trim();
  const priority = body.priority;
  const prdUrl = body.prdUrl?.trim() || null;
  const meegoUrl = body.meegoUrl?.trim() || null;

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!priority || !["p0", "p1", "p2", "p3", "tbd"].includes(priority)) {
    return NextResponse.json({ error: "A valid priority is required." }, { status: 400 });
  }

  if (!meegoUrl) {
    return NextResponse.json({ error: "A Meego story link is required." }, { status: 400 });
  }

  try {
    const created = await createComplianceForFeature({
      title,
      priority,
      prdUrl,
      meegoUrl,
    });

    return NextResponse.json(created);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the compliance ticket.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

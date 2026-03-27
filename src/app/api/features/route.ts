import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { EXTRA_FEATURES_COOKIE, parseExtraMeegoUrlsCookie } from "@/lib/feature-registry";
import { createFeatureInMeego } from "@/lib/meego";
import { FeaturePriority } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const extraFeatureUrls = parseExtraMeegoUrlsCookie(request.cookies.get(EXTRA_FEATURES_COOKIE)?.value);
  const data = await getDashboardData(extraFeatureUrls);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    title?: string;
    priority?: FeaturePriority;
    prdUrl?: string | null;
  };

  const title = body.title?.trim();
  const priority = body.priority;
  const prdUrl = body.prdUrl?.trim() || null;

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!priority || !["p0", "p1", "p2", "p3", "tbd"].includes(priority)) {
    return NextResponse.json({ error: "A valid priority is required." }, { status: 400 });
  }

  try {
    const created = await createFeatureInMeego({ title, priority, prdUrl });
    const existingUrls = parseExtraMeegoUrlsCookie(request.cookies.get(EXTRA_FEATURES_COOKIE)?.value);
    const nextUrls = [...new Set([...existingUrls, created.meegoUrl])];
    const response = NextResponse.json(created);

    response.cookies.set(EXTRA_FEATURES_COOKIE, JSON.stringify(nextUrls), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the Meego story.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

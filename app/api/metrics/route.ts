import { NextResponse } from "next/server"
import { getMetrics } from "@/lib/data"

export async function GET() {
  return NextResponse.json(getMetrics())
}

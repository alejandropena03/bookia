import { NextResponse } from "next/server"
import { getConversations } from "@/lib/data"

export async function GET() {
  return NextResponse.json(getConversations())
}

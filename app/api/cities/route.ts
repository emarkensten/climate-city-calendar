import { NextResponse } from "next/server"
import { parseICS } from "@/lib/ics-parser"

const ICS_FEED_URL = "https://klimatkalendern.nu/feed/instance/ics"

export const revalidate = 604800 // Cache for 1 week (7 days * 24 hours * 60 minutes * 60 seconds)

export async function GET() {
  try {
    const response = await fetch(ICS_FEED_URL, {
      next: { revalidate: 604800 },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch ICS feed")
    }

    const icsContent = await response.text()
    const { cities, events } = parseICS(icsContent)

    return NextResponse.json({
      cities,
      totalEvents: events.length,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Error fetching cities:", error)
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { parseICS, filterEventsByCity } from "@/lib/ics-parser"

const ICS_FEED_URL = "https://klimatkalendern.nu/feed/instance/ics"

export const revalidate = 604800 // Cache for 1 week

export async function GET(request: Request, { params }: { params: Promise<{ city: string }> }) {
  try {
    const { city } = await params

    const response = await fetch(ICS_FEED_URL, {
      next: { revalidate: 604800 },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch ICS feed")
    }

    const icsContent = await response.text()
    const { events } = parseICS(icsContent)
    const filteredEvents = filterEventsByCity(events, decodeURIComponent(city))

    return NextResponse.json({
      city: decodeURIComponent(city),
      count: filteredEvents.length, // Changed from eventCount to count to match frontend
      events: filteredEvents.slice(0, 10), // Return first 10 for preview
    })
  } catch (error) {
    console.error("[v0] Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

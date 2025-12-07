import { NextResponse } from "next/server"
import { parseICS, filterEventsByCity } from "@/lib/ics-parser"

const ICS_FEED_URL = "https://klimatkalendern.nu/feed/instance/ics"

export const revalidate = 86400 // Cache for 24 hours

export async function GET() {
  try {
    const response = await fetch(ICS_FEED_URL, {
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch ICS feed")
    }

    const icsContent = await response.text()
    const { cities: mentionedCities, events } = parseICS(icsContent)

    // Only return cities that actually have events when filtered
    const citiesWithEvents = mentionedCities.filter((city) => {
      const filtered = filterEventsByCity(events, city)
      return filtered.length > 0
    })

    return NextResponse.json({
      cities: citiesWithEvents,
      totalEvents: events.length,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Error fetching cities:", error)
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 })
  }
}

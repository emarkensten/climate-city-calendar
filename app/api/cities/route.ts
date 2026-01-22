import { NextResponse } from "next/server"
import { parseICS, filterEventsByCity } from "@/lib/ics-parser"

const ICS_FEED_URL = "https://klimatkalendern.nu/feed/instance/ics"

export const revalidate = 86400 // Cache for 24 hours

export async function GET() {
  try {
    const response = await fetch(ICS_FEED_URL, {
      cache: "no-store", // Don't cache fetch - let route-level revalidate handle caching
    })

    if (!response.ok) {
      throw new Error("Failed to fetch ICS feed")
    }

    const icsContent = await response.text()
    const { cities: mentionedCities, events } = parseICS(icsContent)

    // Build array with city name and event count
    const citiesWithCounts = mentionedCities
      .map((city) => {
        const filtered = filterEventsByCity(events, city)
        return {
          name: city,
          count: filtered.length,
        }
      })
      .filter((cityData) => cityData.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "sv")) // Sort alphabetically (Swedish locale)

    return NextResponse.json({
      cities: citiesWithCounts,
      totalEvents: events.length,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Error fetching cities:", error)
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 })
  }
}

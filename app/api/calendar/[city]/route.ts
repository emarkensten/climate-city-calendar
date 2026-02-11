import { NextResponse } from "next/server"
import { parseICS, filterEventsByCity, generateICS } from "@/lib/ics-parser"

const ICS_FEED_URL = "https://klimatkalendern.nu/feed/instance/ics"

// Cache for 24 hours - simple and predictable
// Data updates daily, so users always get reasonably fresh data
export const revalidate = 86400

export async function GET(request: Request, { params }: { params: Promise<{ city: string }> }) {
  try {
    const { city } = await params
    const url = new URL(request.url)
    const includeSuburbs = url.searchParams.get("suburbs") !== "0"

    console.log(`[Calendar API] Request for city: "${city}", suburbs: ${includeSuburbs}`)
    const decodedCity = decodeURIComponent(city)
    console.log(`[Calendar API] Decoded city: "${decodedCity}"`)
    // Normalize city slug to ASCII-safe characters (å→a, ä→a, ö→o)
    const citySlug = decodedCity
      .toLowerCase()
      .replace(/å/g, "a")
      .replace(/ä/g, "a")
      .replace(/ö/g, "o")
      .replace(/\s+/g, "-")
    console.log(`[Calendar API] City slug: "${citySlug}"`)

    // Fetch ICS data with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(ICS_FEED_URL, {
      cache: "no-store", // Don't cache fetch - let route-level revalidate handle caching
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const icsContent = await response.text()

    const { events } = parseICS(icsContent)
    const filteredEvents = filterEventsByCity(events, decodedCity, includeSuburbs)

    if (filteredEvents.length === 0) {
      console.warn(`[Calendar API] No events found for city: ${decodedCity}`)
    }

    const calendarName = `Klimatkalendern - ${decodedCity}`
    const icsOutput = generateICS(filteredEvents, calendarName, citySlug)

    return new NextResponse(icsOutput, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="klimatkalendern-${citySlug}.ics"`,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600", // 24h cache, 1h stale
        "Access-Control-Allow-Origin": "*", // Allow CORS for calendar apps
      },
    })
  } catch (error) {
    console.error("[Calendar API] Error generating calendar:", error)
    return NextResponse.json(
      {
        error: "Failed to generate calendar",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

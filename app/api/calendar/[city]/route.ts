import { NextResponse } from "next/server"
import { parseICS, filterEventsByCity, generateICS } from "@/lib/ics-parser"

const ICS_FEED_URL = "https://klimatkalendern.nu/feed/instance/ics"

export const revalidate = 604800 // Cache for 1 week

// In-memory cache for fallback when source is unavailable
let lastKnownGoodData: { icsContent: string; timestamp: number } | null = null

export async function GET(request: Request, { params }: { params: Promise<{ city: string }> }) {
  try {
    const { city } = await params
    console.log(`[Calendar API] Request for city: "${city}"`)
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

    let icsContent: string

    try {
      // Try to fetch fresh data with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(ICS_FEED_URL, {
        next: { revalidate: 604800 },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      icsContent = await response.text()

      // Store as fallback for future failures
      lastKnownGoodData = {
        icsContent,
        timestamp: Date.now(),
      }
    } catch (fetchError) {
      console.error("[Calendar API] Error fetching ICS feed:", fetchError)

      // Use fallback data if available and not too old (max 2 weeks old)
      if (lastKnownGoodData && Date.now() - lastKnownGoodData.timestamp < 14 * 24 * 60 * 60 * 1000) {
        console.log("[Calendar API] Using fallback data from", new Date(lastKnownGoodData.timestamp))
        icsContent = lastKnownGoodData.icsContent
      } else {
        throw new Error("Unable to fetch calendar data and no valid fallback available")
      }
    }

    const { events } = parseICS(icsContent)
    const filteredEvents = filterEventsByCity(events, decodedCity)

    if (filteredEvents.length === 0) {
      console.warn(`[Calendar API] No events found for city: ${decodedCity}`)
    }

    const calendarName = `Klimatkalendern - ${decodedCity}`
    const icsOutput = generateICS(filteredEvents, calendarName, citySlug)

    return new NextResponse(icsOutput, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="klimatkalendern-${citySlug}.ics"`,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400", // 1 week cache, 1 day stale
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

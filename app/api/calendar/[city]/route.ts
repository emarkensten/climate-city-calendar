import { NextResponse } from "next/server"
import { parseICS, filterEventsByCity, generateICS } from "@/lib/ics-parser"

const ICS_FEED_URL = "https://klimatkalendern.nu/feed/instance/ics"

export const revalidate = 604800 // Cache for 1 week

export async function GET(request: Request, { params }: { params: Promise<{ city: string }> }) {
  try {
    const { city } = await params
    const decodedCity = decodeURIComponent(city)

    const response = await fetch(ICS_FEED_URL, {
      next: { revalidate: 604800 },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch ICS feed")
    }

    const icsContent = await response.text()
    const { events } = parseICS(icsContent)
    const filteredEvents = filterEventsByCity(events, decodedCity)

    const calendarName = `Klimatkalendern - ${decodedCity}`
    const icsOutput = generateICS(filteredEvents, calendarName)

    return new NextResponse(icsOutput, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="klimatkalendern-${decodedCity.toLowerCase()}.ics"`,
        "Cache-Control": "public, max-age=604800", // 1 week cache
        "Access-Control-Allow-Origin": "*", // Allow CORS for calendar apps
      },
    })
  } catch (error) {
    console.error("[v0] Error generating calendar:", error)
    return NextResponse.json({ error: "Failed to generate calendar" }, { status: 500 })
  }
}

export interface CalendarEvent {
  uid: string
  summary: string
  description: string
  location: string
  start: Date
  end: Date
  url?: string
  isAllDay?: boolean
  rrule?: string
  dtstamp?: Date
}

export interface ParsedCalendar {
  events: CalendarEvent[]
  cities: string[]
}

// List of Swedish cities that actually have climate events
const SWEDISH_CITIES = [
  "Stockholm",
  "Göteborg",
  "Kristianstad",
  "Västerås",
  "Lund",
  "Uppsala",
  "Karlskrona",
  "Karlstad",
  "Norrköping",
  "Linköping",
  "Nyköping",
  "Kalmar",
  "Gnesta",
  "Falun",
]

// City aliases - suburbs/neighboring municipalities that should be included in main city results
// Based on official län/county municipalities lists
const CITY_ALIASES: Record<string, string[]> = {
  // Stockholm County (Stockholms län) - 26 municipalities
  Stockholm: [
    "Solna",
    "Sundbyberg",
    "Lidingö",
    "Nacka",
    "Huddinge",
    "Botkyrka",
    "Haninge",
    "Tyresö",
    "Järfälla",
    "Sollentuna",
    "Täby",
    "Danderyd",
    "Värmdö",
    "Österåker",
    "Sigtuna",
    "Upplands Väsby",
    "Upplands-Bro",
    "Norrtälje",
    "Nynäshamn",
    "Södertälje",
    "Ekerö",
    "Salem",
    "Vaxholm",
    "Nykvarn",
    "Vallentuna",
  ],
  // Göteborg and nearest suburbs in Västra Götalands län (49 municipalities)
  Göteborg: [
    "Mölndal",
    "Partille",
    "Härryda",
    "Kungälv",
    "Ale",
    "Lerum",
    "Öckerö",
    "Stenungsund",
    "Tjörn",
    "Götene",
  ],
  // Malmö and nearest suburbs in Skåne län (33 municipalities)
  Malmö: [
    "Burlöv",
    "Lomma",
    "Staffanstorp",
    "Svedala",
    "Vellinge",
    "Kävlinge",
    "Lund", // Note: Lund has its own events but is also a Malmö suburb
  ],
}

export function parseICS(icsContent: string): ParsedCalendar {
  const events: CalendarEvent[] = []
  const citiesFound = new Set<string>()

  // Split by VEVENT blocks
  const eventBlocks = icsContent.split("BEGIN:VEVENT")

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split("END:VEVENT")[0]

    const event: Partial<CalendarEvent> = {}

    // Parse each field
    const lines = block.split(/\r?\n/)
    let currentField = ""
    let currentValue = ""

    for (const line of lines) {
      // Handle line continuation (lines starting with space)
      if (line.startsWith(" ") || line.startsWith("\t")) {
        currentValue += line.substring(1)
        continue
      }

      // Process previous field
      if (currentField) {
        processField(event, currentField, currentValue)
      }

      // Parse new field
      const colonIndex = line.indexOf(":")
      if (colonIndex > 0) {
        currentField = line.substring(0, colonIndex)
        currentValue = line.substring(colonIndex + 1)
      }
    }

    // Process last field
    if (currentField) {
      processField(event, currentField, currentValue)
    }

    // Validate and only add complete, valid events
    if (event.uid && event.summary && event.start && event.end) {
      // Validate that dates are valid
      if (isNaN(event.start.getTime()) || isNaN(event.end.getTime())) {
        console.warn(`[ICS Parser] Invalid dates for event: ${event.uid}`)
        continue
      }

      // Validate that start is before end
      if (event.start >= event.end) {
        console.warn(`[ICS Parser] Start date after end date for event: ${event.uid}`)
        continue
      }

      // Add DTSTAMP if missing (use current time)
      if (!event.dtstamp) {
        event.dtstamp = new Date()
      }

      events.push(event as CalendarEvent)

      // Extract cities from location, summary, and description
      const searchText = `${event.location || ""} ${event.summary || ""} ${event.description || ""}`.toLowerCase()

      for (const city of SWEDISH_CITIES) {
        if (searchText.includes(city.toLowerCase())) {
          citiesFound.add(city)
        }
      }
    }
  }

  return {
    events,
    cities: Array.from(citiesFound).sort(),
  }
}

function processField(event: Partial<CalendarEvent>, field: string, value: string) {
  // Remove TZID and other parameters
  const fieldName = field.split(";")[0]

  switch (fieldName) {
    case "UID":
      event.uid = value
      break
    case "SUMMARY":
      event.summary = unescapeICS(value)
      break
    case "DESCRIPTION":
      event.description = unescapeICS(value)
      break
    case "LOCATION":
      event.location = unescapeICS(value)
      break
    case "DTSTART":
      // Check if this is an all-day event (VALUE=DATE parameter)
      event.isAllDay = field.includes("VALUE=DATE")
      event.start = parseICSDate(value)
      break
    case "DTEND":
      event.end = parseICSDate(value)
      break
    case "URL":
      event.url = value
      break
    case "RRULE":
      event.rrule = value
      break
    case "DTSTAMP":
      event.dtstamp = parseICSDate(value)
      break
  }
}

function parseICSDate(dateString: string): Date {
  // Handle both DATE and DATETIME formats
  // YYYYMMDD or YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const year = Number.parseInt(dateString.substring(0, 4))
  const month = Number.parseInt(dateString.substring(4, 6)) - 1
  const day = Number.parseInt(dateString.substring(6, 8))

  if (dateString.length > 8 && dateString.includes("T")) {
    const hour = Number.parseInt(dateString.substring(9, 11))
    const minute = Number.parseInt(dateString.substring(11, 13))
    const second = Number.parseInt(dateString.substring(13, 15))
    return new Date(Date.UTC(year, month, day, hour, minute, second))
  }

  // For all-day events (YYYYMMDD), create UTC midnight to preserve the date
  // This prevents timezone shifts from changing the actual date
  return new Date(Date.UTC(year, month, day, 0, 0, 0))
}

function unescapeICS(text: string): string {
  return text.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\")
}

export function filterEventsByCity(events: CalendarEvent[], city: string): CalendarEvent[] {
  const cityLower = city.toLowerCase()

  // Get all city name variations (main city + suburbs/aliases)
  const cityVariations = [city]
  const aliases = CITY_ALIASES[city]
  if (aliases && aliases.length > 0) {
    cityVariations.push(...aliases)
  }

  // Create regex pattern matching any of the city variations
  // Escape special regex characters and use word boundaries to avoid partial matches
  const escapedCities = cityVariations.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const cityPattern = escapedCities.join("|")
  const cityRegex = new RegExp(`\\b(${cityPattern})\\b`, "i")

  return events.filter((event) => {
    const searchText = `${event.location || ""} ${event.summary || ""} ${event.description || ""}`
    return cityRegex.test(searchText)
  })
}

export function generateICS(events: CalendarEvent[], calendarName: string, citySlug?: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Klimatkalendern//City Filter//SV",
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    "X-WR-TIMEZONE:Europe/Stockholm",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  for (const event of events) {
    lines.push("BEGIN:VEVENT")

    // Generate unique UID to avoid conflicts with original calendar
    const uniqueUID = citySlug ? `${event.uid}-filtered-${citySlug}` : event.uid
    lines.push(`UID:${uniqueUID}`)

    // DTSTAMP is required by RFC 5545
    const dtstamp = event.dtstamp || new Date()
    lines.push(`DTSTAMP:${formatICSDate(dtstamp)}`)

    lines.push(`SUMMARY:${escapeICS(event.summary)}`)

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`)
    }

    // Format dates correctly for all-day vs timed events
    if (event.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatICSDate(event.start, true)}`)
      lines.push(`DTEND;VALUE=DATE:${formatICSDate(event.end, true)}`)
    } else {
      lines.push(`DTSTART:${formatICSDate(event.start)}`)
      lines.push(`DTEND:${formatICSDate(event.end)}`)
    }

    if (event.url) {
      lines.push(`URL:${event.url}`)
    }

    // Preserve recurring event rules
    if (event.rrule) {
      lines.push(`RRULE:${event.rrule}`)
    }

    // Add status field (recommended)
    lines.push("STATUS:CONFIRMED")

    // Add sequence number (for event updates)
    lines.push("SEQUENCE:0")

    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")

  return lines.join("\r\n")
}

function formatICSDate(date: Date, isAllDay = false): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")

  if (isAllDay) {
    // All-day events use VALUE=DATE format (YYYYMMDD)
    return `${year}${month}${day}`
  }

  const hour = String(date.getUTCHours()).padStart(2, "0")
  const minute = String(date.getUTCMinutes()).padStart(2, "0")
  const second = String(date.getUTCSeconds()).padStart(2, "0")

  return `${year}${month}${day}T${hour}${minute}${second}Z`
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

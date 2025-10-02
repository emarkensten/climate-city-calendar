export interface CalendarEvent {
  uid: string
  summary: string
  description: string
  location: string
  start: Date
  end: Date
  url?: string
}

export interface ParsedCalendar {
  events: CalendarEvent[]
  cities: string[]
}

// List of major Swedish cities to match against
const SWEDISH_CITIES = [
  "Stockholm",
  "Göteborg",
  "Malmö",
  "Uppsala",
  "Västerås",
  "Örebro",
  "Linköping",
  "Helsingborg",
  "Jönköping",
  "Norrköping",
  "Lund",
  "Umeå",
  "Gävle",
  "Borås",
  "Södertälje",
  "Eskilstuna",
  "Karlstad",
  "Täby",
  "Växjö",
  "Halmstad",
  "Sundsvall",
  "Luleå",
  "Trollhättan",
  "Östersund",
  "Borlänge",
  "Falun",
  "Kalmar",
  "Kristianstad",
  "Karlskrona",
  "Skellefteå",
  "Uddevalla",
  "Lidingö",
  "Landskrona",
  "Nyköping",
  "Motala",
  "Varberg",
  "Trelleborg",
  "Örnsköldsvik",
  "Skövde",
  "Ängelholm",
]

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

    // Only add complete events
    if (event.uid && event.summary && event.start) {
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
      event.start = parseICSDate(value)
      break
    case "DTEND":
      event.end = parseICSDate(value)
      break
    case "URL":
      event.url = value
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

  return new Date(year, month, day)
}

function unescapeICS(text: string): string {
  return text.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\")
}

export function filterEventsByCity(events: CalendarEvent[], city: string): CalendarEvent[] {
  const cityLower = city.toLowerCase()
  return events.filter((event) => {
    const searchText = `${event.location || ""} ${event.summary || ""} ${event.description || ""}`.toLowerCase()
    return searchText.includes(cityLower)
  })
}

export function generateICS(events: CalendarEvent[], calendarName: string): string {
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
    lines.push(`UID:${event.uid}`)
    lines.push(`SUMMARY:${escapeICS(event.summary)}`)

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`)
    }

    lines.push(`DTSTART:${formatICSDate(event.start)}`)
    lines.push(`DTEND:${formatICSDate(event.end)}`)

    if (event.url) {
      lines.push(`URL:${event.url}`)
    }

    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")

  return lines.join("\r\n")
}

function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hour = String(date.getUTCHours()).padStart(2, "0")
  const minute = String(date.getUTCMinutes()).padStart(2, "0")
  const second = String(date.getUTCSeconds()).padStart(2, "0")

  return `${year}${month}${day}T${hour}${minute}${second}Z`
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

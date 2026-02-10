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

// All 290 Swedish municipalities (kommuner)
// Source: SKR (Sveriges Kommuner och Regioner) - https://skr.se/kommunerochregioner/kommunerlista.8288.html
const SWEDISH_CITIES = [
  "Ale", "Alingsås", "Alvesta", "Aneby", "Arboga", "Arjeplog", "Arvidsjaur", "Arvika",
  "Askersund", "Avesta", "Bengtsfors", "Berg", "Bjurholm", "Bjuv", "Boden", "Bollebygd",
  "Bollnäs", "Borgholm", "Borlänge", "Borås", "Botkyrka", "Boxholm", "Bromölla", "Bräcke",
  "Burlöv", "Båstad", "Dals-Ed", "Danderyd", "Degerfors", "Dorotea", "Eda", "Ekerö",
  "Eksjö", "Emmaboda", "Enköping", "Eskilstuna", "Eslöv", "Essunga", "Fagersta", "Falkenberg",
  "Falköping", "Falun", "Filipstad", "Finspång", "Flen", "Forshaga", "Färgelanda", "Gagnef",
  "Gislaved", "Gnesta", "Gnosjö", "Gotland", "Grums", "Grästorp", "Gullspång", "Gällivare",
  "Gävle", "Göteborg", "Götene", "Habo", "Hagfors", "Hallsberg", "Hallstahammar", "Halmstad",
  "Hammarö", "Haninge", "Haparanda", "Heby", "Hedemora", "Helsingborg", "Herrljunga", "Hjo",
  "Hofors", "Huddinge", "Hudiksvall", "Hultsfred", "Hylte", "Håbo", "Hällefors", "Härjedalen",
  "Härnösand", "Härryda", "Hässleholm", "Höganäs", "Högsby", "Hörby", "Höör", "Jokkmokk",
  "Järfälla", "Jönköping", "Kalix", "Kalmar", "Karlsborg", "Karlshamn", "Karlskoga", "Karlskrona",
  "Karlstad", "Katrineholm", "Kil", "Kinda", "Kiruna", "Klippan", "Knivsta", "Kramfors",
  "Kristianstad", "Kristinehamn", "Krokom", "Kumla", "Kungsbacka", "Kungsör", "Kungälv", "Kävlinge",
  "Köping", "Laholm", "Landskrona", "Laxå", "Lekeberg", "Leksand", "Lerum", "Lessebo",
  "Lidingö", "Lidköping", "Lilla Edet", "Lindesberg", "Linköping", "Ljungby", "Ljusdal",
  "Ljusnarsberg", "Lomma", "Ludvika", "Luleå", "Lund", "Lycksele", "Lysekil", "Malmö",
  "Malung-Sälen", "Malå", "Mariestad", "Mark", "Markaryd", "Mellerud", "Mjölby", "Mora",
  "Motala", "Mullsjö", "Munkedal", "Munkfors", "Mölndal", "Mönsterås", "Mörbylånga", "Nacka",
  "Nora", "Norberg", "Nordanstig", "Nordmaling", "Norrköping", "Norrtälje", "Norsjö", "Nybro",
  "Nykvarn", "Nyköping", "Nynäshamn", "Nässjö", "Ockelbo", "Olofström", "Orsa", "Orust",
  "Osby", "Oskarshamn", "Ovanåker", "Oxelösund", "Pajala", "Partille", "Perstorp", "Piteå",
  "Ragunda", "Robertsfors", "Ronneby", "Rättvik", "Sala", "Salem", "Sandviken", "Sigtuna",
  "Simrishamn", "Sjöbo", "Skara", "Skellefteå", "Skinnskatteberg", "Skurup", "Skövde",
  "Smedjebacken", "Sollefteå", "Sollentuna", "Solna", "Sorsele", "Sotenäs", "Staffanstorp",
  "Stenungsund", "Stockholm", "Storfors", "Storuman", "Strängnäs", "Strömstad", "Strömsund",
  "Sundbyberg", "Sundsvall", "Sunne", "Surahammar", "Svalöv", "Svedala", "Svenljunga", "Säffle",
  "Säter", "Sävsjö", "Söderhamn", "Söderköping", "Södertälje", "Sölvesborg", "Tanum", "Tibro",
  "Tidaholm", "Tierp", "Timrå", "Tingsryd", "Tjörn", "Tomelilla", "Torsby", "Torsås",
  "Tranemo", "Tranås", "Trelleborg", "Trollhättan", "Trosa", "Tyresö", "Täby", "Töreboda",
  "Uddevalla", "Ulricehamn", "Umeå", "Upplands-Bro", "Upplands Väsby", "Uppsala", "Uppvidinge",
  "Vadstena", "Vaggeryd", "Valdemarsvik", "Vallentuna", "Vansbro", "Vara", "Varberg", "Vaxholm",
  "Vellinge", "Vetlanda", "Vilhelmina", "Vimmerby", "Vindeln", "Vingåker", "Vårgårda",
  "Vänersborg", "Vännäs", "Värmdö", "Värnamo", "Västervik", "Västerås", "Växjö", "Ydre",
  "Ystad", "Åmål", "Ånge", "Åre", "Årjäng", "Åsele", "Åstorp", "Åtvidaberg", "Älmhult",
  "Älvdalen", "Älvkarleby", "Älvsbyn", "Ängelholm", "Öckerö", "Ödeshög", "Örebro",
  "Örkelljunga", "Örnsköldsvik", "Östersund", "Österåker", "Östhammar", "Östra Göinge",
  "Överkalix", "Övertorneå"
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
  // Malmö and nearest suburbs in Skåne län
  Malmö: [
    "Burlöv",
    "Lomma",
    "Staffanstorp",
    "Svedala",
    "Vellinge",
    "Kävlinge",
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

export function filterEventsByCity(events: CalendarEvent[], city: string, includeSuburbs: boolean = true): CalendarEvent[] {
  try {
    // Get all city name variations (main city + optionally suburbs/aliases)
    const cityVariations = [city]
    if (includeSuburbs) {
      const aliases = CITY_ALIASES[city]
      if (aliases && aliases.length > 0) {
        cityVariations.push(...aliases)
      }
    }

    // Normalize city names to ASCII so \b word boundaries work correctly.
    // JavaScript's \b treats å, ä, ö as non-word characters, which breaks
    // matching for cities like "Malmö", "Luleå", "Örebro" etc.
    const escapedCities = cityVariations.map((c) =>
      normalizeSwedish(c).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const cityPattern = escapedCities.join("|")
    const cityRegex = new RegExp(`\\b(${cityPattern})\\b`)

    return events.filter((event) => {
      const searchText = normalizeSwedish(
        `${event.location || ""} ${event.summary || ""} ${event.description || ""}`
      )
      return cityRegex.test(searchText)
    })
  } catch (error) {
    console.error(`[filterEventsByCity] Error filtering events for city "${city}":`, error)
    // Fallback to simple normalized includes check
    const normalized = normalizeSwedish(city)
    return events.filter((event) => {
      const searchText = normalizeSwedish(
        `${event.location || ""} ${event.summary || ""} ${event.description || ""}`
      )
      return searchText.includes(normalized)
    })
  }
}

/**
 * Returns the list of suburb aliases for a given city, or empty array if none.
 */
export function getCityAliases(city: string): string[] {
  return CITY_ALIASES[city] || []
}

export function generateICS(events: CalendarEvent[], calendarName: string, citySlug?: string): string {
  try {
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
      try {
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
      } catch (eventError) {
        console.error(`[generateICS] Error processing event "${event.summary}":`, eventError)
        // Skip this event and continue with others
        continue
      }
    }

    lines.push("END:VCALENDAR")

    return lines.join("\r\n")
  } catch (error) {
    console.error("[generateICS] Fatal error generating ICS:", error)
    throw error
  }
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

/**
 * Normalizes Swedish characters to ASCII equivalents for comparison
 * Handles both directions: "Malmö" → "malmo" and "Malmo" → "malmo"
 */
function normalizeSwedish(text: string): string {
  return text
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
}

/**
 * Maps a suburb/municipality to its main city if it exists in CITY_ALIASES
 * For example: "Solna" → "Stockholm", "Partille" → "Göteborg"
 * Returns the original city name if no alias mapping exists
 */
export function getMainCityFromSuburb(cityName: string): string {
  const cityNormalized = normalizeSwedish(cityName)

  // Check each main city's aliases
  for (const [mainCity, suburbs] of Object.entries(CITY_ALIASES)) {
    if (suburbs.some((suburb) => normalizeSwedish(suburb) === cityNormalized)) {
      return mainCity
    }
  }

  // Return original city if no alias found
  return cityName
}

/**
 * Finds a city in the available cities list, handling Vercel's ASCII city names
 * For example: "Malmo" will match "Malmö", "Goteborg" will match "Göteborg"
 */
export function findCityByName(
  detectedCity: string,
  availableCities: Array<{ name: string; count: number }>
): { name: string; count: number } | undefined {
  const normalizedDetected = normalizeSwedish(detectedCity)

  return availableCities.find(
    (city) => normalizeSwedish(city.name) === normalizedDetected
  )
}

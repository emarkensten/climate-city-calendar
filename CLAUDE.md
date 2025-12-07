# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swedish City Calendar** - A Next.js application that fetches climate events from [klimatkalendern.nu](https://klimatkalendern.nu), filters them by Swedish city, and generates ICS calendar files for integration with Google Calendar, Outlook, Apple Calendar, and other calendar applications.

**Key Features:**
- Automatic city detection via IP geolocation (Vercel edge runtime)
- City-based event filtering from a master ICS feed
- ICS calendar file generation for calendar subscriptions
- Automatic updates via ISR (24-hour caching strategy)
- Multi-platform setup instructions (Google Calendar, iPhone/iOS, Outlook)
- Responsive design

**Live Deployment:** Vercel

---

## Common Development Commands

```bash
# Install dependencies (uses pnpm)
npm install

# Start development server (localhost:3000)
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run ESLint
npm run lint

# Debug: Inspect ICS structure
npm run dev
# Then run scripts/inspect-ics.ts using development tools
```

---

## High-Level Architecture

### Data Flow Pipeline

```
┌─────────────────────────────────┐
│  User Browser (React Client)    │
│  - City selection & display     │
│  - Copy calendar URL            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Next.js API Routes (Vercel)    │
│  - /api/cities (list all)       │
│  - /api/location (geoip)        │
│  - /api/events/[city] (count)   │
│  - /api/calendar/[city] (ICS)   │
└────────────┬────────────────────┘
             │
             ▼ (24h ISR cache)
┌─────────────────────────────────┐
│  klimatkalendern.nu ICS Feed    │
│  (Original climate events)       │
└─────────────────────────────────┘
```

### Core Processing: ICS → City-Filtered Calendar

1. **Fetch Phase**: Original ICS fetched from klimatkalendern.nu
2. **Parse Phase**: ICS content parsed into event objects; Swedish cities auto-extracted
3. **Filter Phase**: Events filtered by selected city (searches: location, summary, description)
4. **Generate Phase**: Valid ICS file generated from filtered events
5. **Cache Phase**: Result cached on Vercel edge for 24 hours (ISR with stale-while-revalidate)

### Caching Strategy

- **Method**: Next.js ISR (Incremental Static Regeneration)
- **Duration**: 24 hours (`revalidate: 86400` seconds)
- **Behavior**: After 24h, edge serves stale data while fetching fresh data
- **Benefit**: Reduces load on klimatkalendern.nu; fast responses for all users
- **Update Trigger**: Request-driven (when users or calendar apps fetch the URL)

---

## Project Structure

```
climate-city-calendar/
├── .github/
│   └── workflows/
│       └── refresh-calendar-data.yml     # Optional: Daily data refresh trigger
├── app/
│   ├── api/
│   │   ├── calendar/[city]/route.ts      # Generates ICS files for city
│   │   ├── cities/route.ts               # Returns list of available cities
│   │   ├── events/[city]/route.ts        # Returns event count for city
│   │   └── location/route.ts             # IP geolocation (edge runtime)
│   ├── globals.css                       # Global Tailwind + CSS variables
│   ├── layout.tsx                        # Root layout (Suspense, analytics)
│   └── page.tsx                          # Main landing page (client component)
├── components/
│   ├── theme-provider.tsx                # next-themes wrapper
│   └── ui/                               # shadcn/ui components (Button, Card, Select, Tabs, Input, Dialog)
├── lib/
│   ├── ics-parser.ts                     # Core ICS parsing, filtering, generation
│   └── utils.ts                          # Utility: cn() helper for classnames
├── scripts/
│   └── inspect-ics.ts                    # Debug script for ICS inspection
├── public/                               # Static assets
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
├── components.json                       # shadcn/ui configuration
└── README.md
```

---

## Core Modules

### `lib/ics-parser.ts` (570 lines)

**Responsibilities**: Parse ICS feeds, filter events by city, generate valid ICS files

**Key Functions:**

- **`parseICS(icsContent: string): ParsedCalendar`**
  - Parses raw ICS file content into structured events
  - Handles RFC 5545 line continuations
  - Extracts: UID, SUMMARY, DESCRIPTION, LOCATION, DTSTART, DTEND, URL
  - Auto-detects Swedish cities from event fields
  - Returns: `{ events: CalendarEvent[], cities: string[] }`

- **`filterEventsByCity(events: CalendarEvent[], city: string): CalendarEvent[]`**
  - Case-insensitive matching against city name
  - Searches: location, summary, description fields
  - Returns: Subset of matching events

- **`generateICS(events: CalendarEvent[], calendarName: string): string`**
  - Creates RFC 5545-compliant ICS file
  - Adds calendar metadata (PRODID, timezone)
  - Serializes events with `\r\n` delimiters
  - Returns: Valid ICS string ready for HTTP response

**Data:**

- `SWEDISH_CITIES` - Array of all 290 Swedish municipalities (from SKR)

**Helpers:**
- `processField()` - Parses individual ICS field lines
- `parseICSDate()` - Handles YYYYMMDD and YYYYMMDDTHHMMSSZ formats
- `unescapeICS()` / `escapeICS()` - Handle RFC 5545 escape sequences
- `formatICSDate()` - Converts Date objects to ICS format

### `app/page.tsx` (324 lines)

**Main user interface and interaction logic**

**State:**
- `cities` - Available cities list (fetched from /api/cities)
- `selectedCity` - User's chosen city
- `eventCount` - Event count for selected city
- `loading` - Loading states for async operations
- `copied` - Clipboard feedback state

**Effects:**
- Load cities on component mount
- Auto-detect and pre-select city from IP geolocation
- Fetch event count when selected city changes

**UI Sections:**
- Hero heading + description
- City selector dropdown
- Event count display
- Calendar URL with copy-to-clipboard button
- Instructions tabs (Google Calendar, iPhone/iOS, Outlook)
- Download button (via `/api/calendar/[city]`)
- Footer with data attribution

### API Routes

All API routes implement ISR caching with `revalidate: 86400` (24 hours)

- **`/api/cities`** - Fetches all available cities; returns `{ cities, totalEvents }`
- **`/api/location`** - IP geolocation (edge runtime); returns city if in Sweden
- **`/api/events/[city]`** - Returns event count and first 10 events for city
- **`/api/calendar/[city]`** - Generates ICS file; sets MIME type `text/calendar`; enables CORS

---

## Key Technologies

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14, React 18, TypeScript 5 |
| **Styling** | Tailwind CSS v4, shadcn/ui, Lucide icons |
| **Forms** | React Hook Form, Zod validation |
| **Utilities** | date-fns, clsx, tailwind-merge |
| **Hosting** | Vercel (edge runtime, geolocation) |
| **Package Manager** | pnpm |

---

## Important Implementation Details

### ICS File Parsing

- **Format**: RFC 5545 iCalendar standard
- **Line Delimiters**: `\r\n` (required by spec)
- **Line Folding**: Lines can be folded with continuation whitespace (handled)
- **Escape Sequences**: Characters like commas and semicolons must be escaped
- **Date Formats**: Supports both `YYYYMMDD` (all-day) and `YYYYMMDDTHHMMSSZ` (timed) formats

### City Detection

- **Automatic**: Extracted from event LOCATION, SUMMARY, DESCRIPTION fields
- **Case-insensitive**: "stockholm" matches "Stockholm"
- **Fallback**: `SWEDISH_CITIES` array contains hardcoded list of major cities
- **Geolocation**: Vercel edge headers provide user's country/city via IP

### CORS Configuration

- Calendar apps (Google, Outlook) need CORS headers to fetch ICS files directly
- All calendar API routes include: `Access-Control-Allow-Origin: *`

### Component Styling

- **Framework**: Tailwind CSS v4 with CSS custom properties
- **Components**: shadcn/ui (New York style, RSC-compatible)
- **Dark Mode**: `next-themes` handles light/dark switching
- **Responsive**: Mobile-first approach using Tailwind breakpoints

---

## Common Development Tasks

### Adding a new API endpoint

1. Create file: `app/api/[route]/route.ts`
2. Export async `GET` or `POST` function
3. Add `export const revalidate = 86400` for caching (24h)
4. Return `NextResponse` with appropriate headers

### Modifying cache duration

Find `revalidate` in API routes and adjust (in seconds):
- 1 hour: `3600`
- 1 day: `86400` (current)
- 1 week: `604800`

### Adding a city manually

All 290 Swedish municipalities are already included in `SWEDISH_CITIES` array in `lib/ics-parser.ts`. The list is sourced from SKR (Sveriges Kommuner och Regioner).

### Debugging ICS parsing

1. Run `npm run dev`
2. Call `/api/cities` and inspect the response JSON
3. Check browser console or server logs for parsing errors
4. Use `scripts/inspect-ics.ts` for detailed event structure

### Creating a new UI component

1. Import from `@/components/ui` (shadcn/ui components already available)
2. Or add new component in `components/`
3. Use `className` with Tailwind utilities; use `cn()` helper for conditional classes
4. Example: `className={cn("px-4 py-2", variant === "large" && "px-6 py-4")}`

---

## Configuration Files

- **`next.config.mjs`**: Disables ESLint/TypeScript checks during build (permissive mode)
- **`tsconfig.json`**: Strict mode enabled; path alias `@/*` for root
- **`components.json`**: shadcn/ui config (New York style, RSC enabled)
- **`postcss.config.mjs`**: Uses `@tailwindcss/postcss` for Tailwind v4

---

## Deployment

- Connected to Vercel via GitHub
- Automatic deployments on push to main
- Edge runtime available (used for geolocation)
- Environment variables configured in Vercel dashboard
- Build ignores ESLint and TypeScript errors (see `next.config.mjs`)

---

## Recent Improvements (October 2025)

The following critical issues were identified and fixed:

### 1. ✅ City Filtering with Word Boundaries
**Problem**: Original used `.includes()` which caused false positives (e.g., "Lund" matched "Lundby")
**Solution**: Implemented regex with word boundaries (`\b`) for precise matching

### 2. ✅ All-Day Event Date Handling
**Problem**: All-day events were parsed as local time but generated as UTC, causing date shifts
**Solution**:
- Parse all-day events as UTC midnight to preserve date
- Detect `VALUE=DATE` parameter to identify all-day events
- Generate with correct `DTSTART;VALUE=DATE:YYYYMMDD` format

### 3. ✅ Event Data Validation
**Problem**: No validation of parsed data; corrupt events could enter calendar
**Solution**: Added validation for:
- Required fields (UID, summary, start, end)
- Valid Date objects (checks for `Invalid Date`)
- Start date before end date
- Automatic DTSTAMP generation if missing

### 4. ✅ RFC 5545 Compliance
**Problem**: Missing required ICS fields (DTSTAMP, STATUS, SEQUENCE)
**Solution**: All events now include:
- `DTSTAMP` (required by RFC 5545)
- `STATUS:CONFIRMED` (recommended)
- `SEQUENCE:0` (for update tracking)

### 5. ✅ Unique UIDs for Filtered Events
**Problem**: Reusing original UIDs caused conflicts if user subscribed to both original and filtered calendar
**Solution**: Generate unique UIDs: `{originalUID}-filtered-{citySlug}`

### 6. ✅ Network Error Handling
**Problem**: If klimatkalendern.nu is down, calendar completely fails
**Solution**:
- 10-second timeout for fetch requests
- ISR cache ensures stale data is served while revalidating
- Enhanced error logging

### 7. ✅ Recurring Events Support (RRULE)
**Problem**: Recurring events were ignored, losing weekly/monthly events
**Solution**: Parse and preserve `RRULE` fields in generated ICS

### 8. ✅ City Aliases for Suburbs/Metropolitan Areas
**Problem**: Events in Solna wouldn't appear when filtering for Stockholm; suburbs were isolated
**Solution**: Implemented `CITY_ALIASES` mapping based on official län/county municipalities:
- **Stockholm** → includes 25 municipalities in Stockholms län (Solna, Lidingö, Nacka, Södertälje, etc.)
- **Göteborg** → includes 10 nearest municipalities (Mölndal, Partille, Kungälv, etc.)
- **Malmö** → includes 7 nearest municipalities (Burlöv, Lomma, Lund, etc.)

Users selecting "Stockholm" now get events from entire metropolitan area automatically.

---

## Notes for Claude Code Instances

1. **Caching is critical**: The 24h ISR cache is essential for performance. Don't remove `revalidate` without understanding impact.

2. **ICS format is strict**: RFC 5545 requires specific formatting (`\r\n` delimiters, escape sequences). Test after modifying ICS generation.

3. **City matching uses word boundaries**: The parser searches multiple fields (location, summary, description) with word-boundary regex. Case-insensitive for better UX.

4. **All 290 municipalities supported**: `SWEDISH_CITIES` contains all Swedish municipalities from SKR.

5. **Unique UIDs prevent conflicts**: Filtered calendars use modified UIDs to avoid duplicates with original calendar.

6. **Vercel-specific features**: Geolocation and edge runtime are Vercel-specific. Code won't work identically on other platforms.

7. **No test framework**: Currently no Jest/Vitest setup. Manual testing via `npm run dev` and browser.

8. **TypeScript is strict but permissive in build**: `tsconfig.json` has strict mode, but `next.config.mjs` ignores errors during build. Fix all TypeScript errors before committing.

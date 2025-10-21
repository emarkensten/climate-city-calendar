# Swedish City Calendar

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/erik-markenstens-projects/v0-swedish-city-calendar)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/ZHybRRl1P40)

En Next.js-app som hämtar klimathändelser från [klimatkalendern.nu](https://klimatkalendern.nu), filtrerar dem per svensk stad, och genererar anpassade ICS-kalenderfiler som kan prenumereras på i Google Calendar, Outlook, eller andra kalenderapplikationer.

## Features

- **Automatisk stadsdetektering** - Använder IP-geolocation för att automatiskt välja användarens stad
- **Smart stadsfiltrering** - Visar endast klimathändelser för vald stad med ordgräns-matchning (undviker felaktiga delträffar)
- **Storstadsområden** - Stockholm inkluderar 26 kommuner (Solna, Lidingö, Södertälje, etc.), Göteborg inkluderar 10 kommuner, Malmö inkluderar 7 kommuner
- **Kalenderintegration** - Genererar RFC 5545-kompatibla ICS-filer som kan prenumereras på i Google Calendar, Outlook, Apple Calendar, etc.
- **Automatiska uppdateringar** - Kalendern uppdateras automatiskt med nya händelser från originalkällan
- **Robust felhantering** - Fallback-cache (2 veckor) om originalkällan är otillgänglig
- **Stöd för återkommande events** - Bevarar RRULE för veckovisa/månatliga händelser
- **Pedagogiska instruktioner** - Steg-för-steg guide för att lägga till kalendern i olika appar (Google, iPhone, Outlook)
- **Responsiv design** - Fungerar på desktop, tablet och mobil

## Hur det fungerar

### Caching och automatiska uppdateringar

Appen använder **inte** ett cron job eller schemalagda uppdateringar. Istället använder den Next.js ISR (Incremental Static Regeneration) med request-baserad caching:

1. **Initial request**: När någon besöker sidan första gången hämtas data från klimatkalendern.nu
2. **Caching**: Datan cachas på Vercels edge network i 1 vecka (`revalidate: 604800`)
3. **Stale-while-revalidate**: Efter 1 vecka visar nästa request den gamla cachade datan medan ny data hämtas i bakgrunden
4. **Uppdatering**: När nya datan är klar ersätts cachen automatiskt

**För kalenderprenumarationer:**
- Google Calendar/Outlook hämtar ICS-filen automatiskt (vanligtvis var 24:e timme)
- Varje hämtning får den cachade versionen från Vercel
- När cachen är äldre än 1 vecka uppdateras den automatiskt med nya händelser
- Användare får alltid de senaste händelserna för sin valda stad

**Viktigt:**
- Uppdateringar sker när någon faktiskt använder appen (request-drivet)
- För aktiva prenumerationer uppdateras datan regelbundet eftersom kalenderapparna hämtar filen dagligen
- Ingen kostnad för att köra - helt serverless och edge-cached

### Dataflöde

\`\`\`
klimatkalendern.nu (original ICS)
         ↓
    API Route (fetch & parse)
         ↓
    Filter by city
         ↓
    Generate new ICS
         ↓
    Cache for 1 week
         ↓
    User's calendar app
\`\`\`

## Tech Stack

- **Next.js 15** - React framework med App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI komponenter
- **Vercel** - Hosting och edge caching
- **Vercel Geolocation** - IP-baserad stadsdetektering

## Installation

### Förutsättningar

- Node.js 18+ 
- npm eller yarn

### Lokal utveckling

1. Klona repot:
\`\`\`bash
git clone https://github.com/yourusername/climate-city-calendar.git
cd climate-city-calendar
\`\`\`

2. Installera dependencies:
\`\`\`bash
npm install
\`\`\`

3. Starta dev-servern:
\`\`\`bash
npm run dev
\`\`\`

4. Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare

## Deployment

Projektet är konfigurerat för Vercel:

1. Pusha till GitHub
2. Importera projektet i Vercel
3. Deploy automatiskt

**Live deployment:** [https://vercel.com/erik-markenstens-projects/v0-swedish-city-calendar](https://vercel.com/erik-markenstens-projects/v0-swedish-city-calendar)

## API Endpoints

### `GET /api/cities`
Hämtar lista över alla tillgängliga svenska städer från ICS-filen.

**Response:**
\`\`\`json
{
  "cities": ["Stockholm", "Göteborg", "Kristianstad", "Västerås", "Lund", ...],
  "totalEvents": 316,
  "lastUpdated": "2025-10-21T05:17:09.960Z"
}
\`\`\`

**Caching:** 1 vecka

### `GET /api/events/[city]`
Hämtar antal händelser för en specifik stad.

**Response:**
\`\`\`json
{
  "city": "Stockholm",
  "count": 42
}
\`\`\`

**Caching:** 1 vecka

### `GET /api/calendar/[city]`
Genererar en filtrerad ICS-fil för en specifik stad.

**Response:** ICS-fil (text/calendar)

**Caching:** 1 vecka

### `GET /api/location`
Detekterar användarens stad baserat på IP-adress (Vercel Geolocation).

**Response:**
\`\`\`json
{
  "city": "Stockholm",
  "country": "SE"
}
\`\`\`

**Caching:** Ingen (dynamisk per användare)

## Projektstruktur

\`\`\`
├── app/
│   ├── api/
│   │   ├── calendar/[city]/route.ts  # ICS-generering
│   │   ├── cities/route.ts           # Städer-lista
│   │   ├── events/[city]/route.ts    # Händelseräkning
│   │   └── location/route.ts         # IP-geolocation
│   ├── globals.css                   # Tailwind styles
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Huvudsida
├── lib/
│   └── ics-parser.ts                 # ICS parsing utilities
├── components/
│   └── ui/                           # shadcn/ui komponenter
└── scripts/
    └── inspect-ics.ts                # Debug script
\`\`\`

## Utveckling

### Inspektera ICS-data

För att se hur ICS-filen är strukturerad:

\`\`\`bash
npm run dev
# Kör scripts/inspect-ics.ts från v0 UI
\`\`\`

### Tillgängliga städer

Appen filtrerar events för **14 svenska städer** som har klimathändelser:

- **Stockholm** (138 events, inkl. 26 kommuner: Solna, Lidingö, Nacka, Södertälje, m.fl.)
- **Göteborg** (25 events, inkl. 10 kommuner: Mölndal, Partille, Kungälv, m.fl.)
- **Kristianstad** (13 events)
- **Västerås** (10 events)
- **Lund** (10 events)
- **Uppsala** (5 events)
- **Karlskrona** (5 events)
- **Karlstad** (4 events)
- **Norrköping, Linköping, Nyköping** (3 events vardera)
- **Kalmar, Gnesta, Falun** (2 events vardera)

För att lägga till fler städer eller ändra alias, uppdatera `SWEDISH_CITIES` och `CITY_ALIASES` i `lib/ics-parser.ts`.

### Ändra cache-tid

Uppdatera `revalidate` värdet i API routes (i sekunder):
- 1 timme: `3600`
- 1 dag: `86400`
- 1 vecka: `604800` (nuvarande)

## Fortsätt bygga

Fortsätt utveckla appen på [v0.app](https://v0.app/chat/projects/ZHybRRl1P40)

## Licens

MIT

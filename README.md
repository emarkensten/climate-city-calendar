# Swedish City Calendar

![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

En Next.js-app som hämtar klimathändelser från [klimatkalendern.nu](https://klimatkalendern.nu), filtrerar dem per svensk kommun, och genererar anpassade ICS-kalenderfiler som kan prenumereras på i Google Calendar, Outlook, eller andra kalenderapplikationer.

## Features

- **Alla 290 kommuner** - Stöd för alla svenska kommuner (källa: SKR)
- **Automatisk stadsdetektering** - Använder IP-geolocation för att automatiskt välja användarens stad
- **Smart kommunfiltrering** - Visar endast klimathändelser för vald kommun med ordgräns-matchning (undviker felaktiga delträffar)
- **Storstadsområden** - Stockholm inkluderar 26 kommuner (Solna, Lidingö, Södertälje, etc.), Göteborg inkluderar 10 kommuner, Malmö inkluderar 7 kommuner
- **Kalenderintegration** - Genererar RFC 5545-kompatibla ICS-filer som kan prenumereras på i Google Calendar, Outlook, Apple Calendar, etc.
- **Automatiska uppdateringar** - Data uppdateras automatiskt var 24:e timme
- **Stöd för återkommande events** - Bevarar RRULE för veckovisa/månatliga händelser
- **Pedagogiska instruktioner** - Steg-för-steg guide för att lägga till kalendern i olika appar (Google, iPhone, Outlook)
- **Responsiv design** - Fungerar på desktop, tablet och mobil

## Hur det fungerar

### Caching och automatiska uppdateringar

Appen använder Next.js ISR (Incremental Static Regeneration) med request-baserad caching:

1. **Initial request**: När någon besöker sidan första gången hämtas data från klimatkalendern.nu
2. **Caching**: Datan cachas på Vercels edge network i 24 timmar (`revalidate: 86400`)
3. **Stale-while-revalidate**: Efter 24 timmar visar nästa request den gamla cachade datan medan ny data hämtas i bakgrunden
4. **Uppdatering**: När nya datan är klar ersätts cachen automatiskt

**För kalenderprenumerationer:**
- Google Calendar/Outlook hämtar ICS-filen automatiskt (vanligtvis var 24:e timme)
- Varje hämtning får den cachade versionen från Vercel
- Användare får alltid relativt färska händelser för sin valda kommun

**Viktigt:**
- Uppdateringar sker när någon faktiskt använder appen (request-drivet)
- Ingen kostnad för att köra - helt serverless och edge-cached

### Dataflöde

```
klimatkalendern.nu (original ICS)
         ↓
    API Route (fetch & parse)
         ↓
    Filter by city
         ↓
    Generate new ICS
         ↓
    Cache for 24h
         ↓
    User's calendar app
```

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
```bash
git clone https://github.com/yourusername/climate-city-calendar.git
cd climate-city-calendar
```

2. Installera dependencies:
```bash
npm install
```

3. Starta dev-servern:
```bash
npm run dev
```

4. Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare

## Deployment

Projektet är konfigurerat för Vercel:

1. Pusha till GitHub
2. Importera projektet i Vercel
3. Deploy automatiskt

**Live deployment:** Deployed on Vercel

## API Endpoints

### `GET /api/cities`
Hämtar lista över alla tillgängliga svenska kommuner som har event.

**Response:**
```json
{
  "cities": ["Stockholm", "Göteborg", "Malmö", "Uppsala", ...],
  "totalEvents": 316,
  "lastUpdated": "2025-12-07T10:00:00.000Z"
}
```

**Caching:** 24 timmar

### `GET /api/events/[city]`
Hämtar antal händelser för en specifik kommun.

**Response:**
```json
{
  "city": "Stockholm",
  "count": 42
}
```

**Caching:** 24 timmar

### `GET /api/calendar/[city]`
Genererar en filtrerad ICS-fil för en specifik kommun.

**Response:** ICS-fil (text/calendar)

**Caching:** 24 timmar

### `GET /api/location`
Detekterar användarens stad baserat på IP-adress (Vercel Geolocation).

**Response:**
```json
{
  "city": "Stockholm",
  "country": "SE"
}
```

**Caching:** Ingen (dynamisk per användare)

## Projektstruktur

```
├── app/
│   ├── api/
│   │   ├── calendar/[city]/route.ts  # ICS-generering
│   │   ├── cities/route.ts           # Kommuner-lista
│   │   ├── events/[city]/route.ts    # Händelseräkning
│   │   └── location/route.ts         # IP-geolocation
│   ├── globals.css                   # Tailwind styles
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Huvudsida
├── lib/
│   └── ics-parser.ts                 # ICS parsing utilities
├── components/
│   └── ui/                           # shadcn/ui komponenter
├── docs/
│   └── SYSTEMGUIDE.md                # Dokumentation för klimatkalenderns redaktion
└── scripts/
    └── inspect-ics.ts                # Debug script
```

## Utveckling

### Inspektera ICS-data

För att se hur ICS-filen är strukturerad:

```bash
npm run dev
# Använd utvecklingsverktyg för att köra scripts/inspect-ics.ts
```

### Tillgängliga kommuner

Appen stöder **alla 290 svenska kommuner** (från SKR - Sveriges Kommuner och Regioner).

**Storstadsområden:**
- **Stockholm** - Inkluderar 26 kranskommuner (Solna, Nacka, Södertälje, etc.)
- **Göteborg** - Inkluderar 10 kranskommuner (Mölndal, Partille, Kungälv, etc.)
- **Malmö** - Inkluderar 7 kranskommuner (Lund, Lomma, Staffanstorp, etc.)

Dropdown-listan visar endast kommuner som faktiskt har event i klimatkalendern just nu.

### Ändra cache-tid

Uppdatera `revalidate` värdet i API routes (i sekunder):
- 1 timme: `3600`
- 1 dag: `86400` (nuvarande)
- 1 vecka: `604800`

## Dokumentation

Se `docs/SYSTEMGUIDE.md` för en detaljerad guide om hur systemet fungerar - skriven för både redaktionen och tekniker.

## Licens

MIT

# Integration med Klimatkalendern.nu

## Översikt

Detta projekt är en kompletterande tjänst till [klimatkalendern.nu](https://klimatkalendern.nu) som erbjuder **stadsfiltrerade ICS-kalendrar** för användare som vill prenumerera på klimatevent i sin specifika stad eller region.

**Problem som löses:**
- Klimatkalenderns huvudfeed innehåller event från hela Sverige
- Användare vill endast se event relevanta för sin stad
- Kalenderapplikationer (Google Calendar, Outlook, Apple Calendar) saknar inbyggd geografisk filtrering

**Lösning:**
- Hämtar klimatkalenderns ICS-feed automatiskt
- Filtrerar event baserat på svensk stad/kommun
- Genererar separata ICS-kalendrar per stad
- Användare prenumererar på sin stadsspecifika URL

---

## Teknisk Arkitektur

### Dataflöde

```
Klimatkalendern.nu (källdata)
         ↓
Next.js API (cache + filtrering)
         ↓
ICS-generering per stad
         ↓
Användare (kalenderprenumeration)
```

### Komponenter

1. **ICS Parser** (`lib/ics-parser.ts`)
   - Läser källfeed från klimatkalendern.nu
   - Extraherar stadsnamn automatiskt från eventfält
   - Validerar och normaliserar eventdata

2. **API Endpoints** (`app/api/`)
   - `/api/cities` - Listar alla tillgängliga städer
   - `/api/calendar/[stad]` - Genererar ICS-fil för specifik stad
   - `/api/events/[stad]` - Returnerar eventantal för förhandsvisning

3. **Cachning** (Next.js ISR)
   - Data cachas i 1 vecka på Vercel Edge
   - Minskar belastning på klimatkalendern.nu
   - Snabba svar för alla användare
   - Automatisk uppdatering via GitHub Actions (dagligen)

4. **Frontend** (`app/page.tsx`)
   - Stadsväljare med auto-detektering via IP-geolokalisering
   - Instruktioner för kalenderprenumeration
   - Nedladdning av ICS-filer

---

## Filtringslogik

### Stadsdetektering

Event matchas mot stad genom att söka i följande fält (i prioritetsordning):

1. **LOCATION** - Geografisk plats (t.ex. "Stockholm, Sweden")
2. **SUMMARY** - Eventtitel (t.ex. "Klimatstrejk i Göteborg")
3. **DESCRIPTION** - Beskrivningstext

**Matchningsregler:**
- Case-insensitive (Stockholm = stockholm)
- Word boundaries (Lund matchar inte Lundby)
- Regex-baserad för precision

### Storstadsområden (Län/Kommuner)

För att hantera förorter och närliggande kommuner används `CITY_ALIASES`:

- **Stockholm** → 25 kommuner i Stockholms län (Solna, Nacka, Södertälje, etc.)
- **Göteborg** → 10 närliggande kommuner (Mölndal, Partille, Kungälv, etc.)
- **Malmö** → 7 närliggande kommuner (Lund, Lomma, Burlöv, etc.)

**Exempel:** Event i Solna visas automatiskt för användare som prenumererar på Stockholm-kalendern.

---

## RFC 5545 Compliance

Genererade ICS-filer följer iCalendar-standarden (RFC 5545):

- **Line delimiters**: `\r\n` (required)
- **Date formats**: Både all-day (`VALUE=DATE:YYYYMMDD`) och timed (`YYYYMMDDTHHMMSSZ`)
- **Escape sequences**: Komma, semikolon, backslash escapas korrekt
- **Required fields**: UID, DTSTAMP, DTSTART, DTEND, SUMMARY
- **Recurring events**: RRULE preserved från källdata
- **Timezone**: Europe/Stockholm för svenska event

### UID-hantering

För att undvika konflikter om användare prenumererar på både original och filtrerad kalender:
- Original UID: `event-123@klimatkalendern.nu`
- Filtrerad UID: `event-123@klimatkalendern.nu-filtered-stockholm`

---

## Felhantering och Resiliens

### Nätverksfel

**Problem:** klimatkalendern.nu kan vara tillfälligt nere eller långsam.

**Lösning:**
- 10 sekunders timeout för fetch-requests
- In-memory cache av senast framgångsrika fetch (max 2 veckor gammal)
- Fallback till cachad data vid nätverksfel
- Detaljerad error-loggning för debugging

### Datavalidering

Innan event läggs till i filtrerad kalender valideras:
- Alla required fields finns (UID, summary, start, end)
- Datumformat är giltiga (inte `Invalid Date`)
- Starttid är före sluttid
- DTSTAMP genereras automatiskt om saknas

---

## Automatisk Datauppdatering

### ISR (Incremental Static Regeneration)

- Cache revalideras efter 1 vecka
- Request-driven: uppdatering sker när användare hämtar data
- Stale-while-revalidate: användare får snabbt svar medan ny data hämtas i bakgrunden

### GitHub Actions (Daglig Refresh)

För att garantera färsk data oberoende av trafik:

```yaml
Schedule: Dagligen kl 06:00 UTC (07:00/08:00 svensk tid)
Process:
  1. Hämta lista på städer från /api/cities
  2. Loop genom varje stad
  3. Anropa /api/calendar/[stad] för cache-revalidering
  4. Logga resultat
```

**Konfiguration:** Kräver `APP_URL` secret i GitHub (se `.github/workflows/README.md`)

---

## Hosting och Infrastructure

**Platform:** Vercel
- Edge runtime för geolokalisering
- Global CDN för snabba svar
- Automatiska deployments från GitHub
- ISR-support inbyggd

**Environment:**
- Node.js 18+
- Next.js 14 (App Router)
- TypeScript 5

---

## Dataskydd och Integritet

**Data som processas:**
- Publik eventdata från klimatkalendern.nu
- IP-baserad geolokalisering (endast land/stad, inget lagring)
- Ingen användardata lagras permanent

**CORS:**
- Öppna CORS-headers på `/api/calendar/*` för kalenderappar
- Tillåter direkta prenumerationer från Google/Outlook/Apple

---

## Integration Guidelines

### För Klimatkalenderns Utvecklare

**Om ni uppdaterar ICS-formatet:**

1. **Nya fält** - Läggs automatiskt till i filtrerade kalendrar
2. **Ändrade fält** - Kan kräva uppdatering av parser (`lib/ics-parser.ts`)
3. **Breaking changes** - Testa att parsern fortfarande fungerar

**Rekommendationer:**

- Behåll konsekvent stadsformatering i LOCATION-fält (t.ex. "Stockholm, Sweden")
- Inkludera stad i SUMMARY eller DESCRIPTION för event utan LOCATION
- Följ RFC 5545 strikt för maximal kompatibilitet

### För Användare

**Prenumerationsinstruktioner:**

1. Välj stad på webbplatsen
2. Kopiera kalenderprenumerations-URL
3. Lägg till i kalenderapp:
   - **Google Calendar:** Settings → Add calendar → From URL
   - **iPhone/iOS:** Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar
   - **Outlook:** Add calendar → Subscribe from web

**Uppdateringsfrekvens:**

Kalenderapplikationer hämtar vanligtvis uppdateringar var 24e timme. Vår cache uppdateras dagligen via GitHub Actions.

---

## Teknisk Kontakt

**Repository:** https://github.com/emarkensten/climate-city-calendar

**Support:**
- Öppna GitHub Issue för buggrapporter
- Pull requests välkomnas för förbättringar

**Källdata:**
- klimatkalendern.nu - Original ICS-feed
- Tack för ert arbete med att samla klimatevent!

---

## Licens

Projektet använder öppen källkod under samma villkor som klimatkalendern.nu tillåter återanvändning av sin eventdata.

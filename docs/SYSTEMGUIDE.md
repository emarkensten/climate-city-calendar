# Klimatkalendern Stadsfilter - Systemguide

Denna guide förklarar hur stadsfiltrerings-tjänsten fungerar. Den är skriven för att vara användbar både för redaktionen och för tekniker.

---

## Innehåll

1. [Vad gör tjänsten?](#vad-gör-tjänsten)
2. [Användarupplevelsen](#användarupplevelsen)
3. [Hur data flödar](#hur-data-flödar)
4. [Hur snabbt uppdateras data?](#hur-snabbt-uppdateras-data)
5. [Stadsfiltrering](#stadsfiltrering)
6. [Teknisk referens](#teknisk-referens-för-utvecklare)
7. [Vanliga frågor](#vanliga-frågor)

---

## Vad gör tjänsten?

**Kort sagt:** Tjänsten tar ert kalenderflöde och skapar separata kalendrar för varje kommun i Sverige.

**Steg 1:** klimatkalendern.nu (alla event i hela Sverige)

**Steg 2:** Stadsfiltret ("Visa bara min kommun")

**Steg 3:** Filtrerad kalender (bara lokala event)

**Varför är detta bra?**

Användare vill inte bläddra igenom hundratals event från hela Sverige - de vill se vad som händer nära dem.

---

## Användarupplevelsen

### 1. Besökaren kommer till webbplatsen

- Tjänsten **försöker gissa vilken stad** besökaren befinner sig i (fungerar oftast)
- Besökaren kan **välja en annan kommun** från listan
- Antalet event i vald kommun visas

### 2. Besökaren kopierar sin kalender-URL

Varje kommun har en egen adress:

- `https://[webbplats]/api/calendar/Stockholm`
- `https://[webbplats]/api/calendar/Göteborg`
- `https://[webbplats]/api/calendar/Umeå`

### 3. Besökaren lägger till i sin kalenderapp

När adressen läggs till i Google Calendar, iPhone eller Outlook:

- Kalendern **synkar automatiskt** - inga fler steg behövs
- Nya event dyker upp när ni lägger till dem i klimatkalendern
- Användaren behöver aldrig göra något mer

---

## Hur data flödar

### Steg 1: Klimatkalendern

Redaktionen skapar event → Event sparas i kalenderfilen

Adress: `https://klimatkalendern.nu/feed/instance/ics`

### Steg 2: Vår tjänst

Tjänsten hämtar kalenderfilen och:

- Läser in alla event
- Hittar vilka kommuner som nämns
- När någon begär t.ex. "Umeå" - filtrerar ut bara Umeå-event
- Skapar en ny kalenderfil med bara dessa event

### Steg 3: Användarens kalender

Den filtrerade kalenderfilen skickas till användarens kalenderapp (Google Calendar, iPhone, Outlook, etc.)

Kalendern synkar automatiskt (var 1-24 timme beroende på app).

---

## Hur snabbt uppdateras data?

### Det enkla svaret

**Nya event syns inom 24 timmar.**

### Lite mer detaljer

1. Ni skapar ett nytt event i klimatkalendern
2. Vår tjänst hämtar ny data (inom 24 timmar)
3. Användarens kalenderapp synkar (inom 1-24 timmar)
4. Användaren ser eventet i sin kalender

**Totalt: Max ~48 timmar, oftast snabbare**

### Varför inte uppdatera direkt?

- **Prestanda**: Vi vill inte överbelasta klimatkalendern.nu med tusentals anrop
- **Hastighet**: Användare får snabba svar istället för att vänta på nya hämtningar
- **Stabilitet**: Om klimatkalendern.nu tillfälligt är nere, fortsätter tjänsten fungera

---

## Stadsfiltrering

### Vilka kommuner stöds?

**Alla Sveriges 290 kommuner** - från Arjeplog till Övertorneå.

Listan hämtas från [SKR (Sveriges Kommuner och Regioner)](https://skr.se/kommunerochregioner/kommunerlista.8288.html).

### Hur hittas rätt event?

Systemet söker efter kommunnamnet i tre ställen:

| Fält | Exempel |
|------|---------|
| **Plats** | "Stadsbiblioteket, Umeå" |
| **Rubrik** | "Klimatmarsch i Göteborg" |
| **Beskrivning** | "Välkommen till Malmö för..." |

### Smart matchning

Systemet använder **ordgränser** för att undvika felträffar:

- "Lund" matchar "Klimatmarsch i Lund" ✓
- "Lund" matchar "Stadsbiblioteket, Lund" ✓
- "Lund" matchar INTE "Lundby kulturhus" ✗

### Storstadsområden

För de tre största städerna inkluderas **hela storstadsområdet**:

**Stockholm** visar också event i:
Solna, Nacka, Huddinge, Södertälje, Lidingö, Täby, och 19 andra kranskommuner

**Göteborg** visar också event i:
Mölndal, Partille, Kungälv, Lerum, och 6 andra kranskommuner

**Malmö** visar också event i:
Lund, Lomma, Staffanstorp, Vellinge, och 3 andra kranskommuner

**Varför?** En stockholmare som pendlar från Solna vill troligen också se event i centrala Stockholm.

---

## Teknisk referens (för utvecklare)

> Denna sektion innehåller implementationsdetaljer.

### Arkitektur

**Next.js 14 App (Vercel)**

API-routes:
- `app/api/calendar/[city]/route.ts` → Genererar kalenderfil per kommun
- `app/api/cities/route.ts` → Listar tillgängliga kommuner
- `app/api/events/[city]/route.ts` → Returnerar eventantal
- `app/api/location/route.ts` → IP-geolokalisering (Vercel Edge)

Kärnlogik:
- `lib/ics-parser.ts` → Parsing, filtrering, generering

### API-endpoints

| Endpoint | Returnerar | Cache |
|----------|------------|-------|
| `GET /api/cities` | `{ cities: [...], totalEvents: N }` | 24h |
| `GET /api/calendar/[city]` | ICS-fil (text/calendar) | 24h |
| `GET /api/events/[city]` | `{ count: N, events: [...] }` | 24h |
| `GET /api/location` | `{ city, country }` | Ingen |

### ICS-format

Kalenderfiler följer [RFC 5545](https://tools.ietf.org/html/rfc5545)-standarden.

Exempel:

```
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event-123-filtered-stockholm
SUMMARY:Klimatmanifestation
LOCATION:Sergels torg, Stockholm
DTSTART:20251215T180000Z
DTEND:20251215T200000Z
END:VEVENT
END:VCALENDAR
```

### Unika ID:n

För att undvika konflikter om någon prenumererar på både original-kalendern och en filtrerad version:

- Original: `event-123@klimatkalendern.nu`
- Filtrerad: `event-123@klimatkalendern.nu-filtered-stockholm`

### Källkod

Huvudfilen för parsing och filtrering: `lib/ics-parser.ts`

---

## Vanliga frågor

### "Hur snabbt syns nya event?"

Inom 24-48 timmar. Vår tjänst uppdateras inom 24h, sedan synkar användarens kalenderapp (1-24h beroende på app).

### "Kan vi lägga till fler kommuner?"

Alla 290 svenska kommuner stöds redan. Om ni skapar ett event med en kommun i platsfältet, kommer det automatiskt att visas för användare som valt den kommunen.

### "Vad händer om klimatkalendern.nu går ner?"

Tjänsten fortsätter fungera med senast hämtade data (max 24h gammal). Användare märker ingenting.

### "Vilka kalenderprogram fungerar?"

Alla som stöder ICS-prenumerationer:
- Google Calendar
- Apple Calendar (iPhone, Mac)
- Microsoft Outlook
- Thunderbird
- Proton Calendar
- ...och många fler

### "Kan användare ladda ner istället för att prenumerera?"

Ja, det finns en nedladdningsknapp. Men nedladdade kalendrar uppdateras inte automatiskt - prenumeration rekommenderas.

### "Varför visar dropdown bara kommuner med event?"

Dropdown-listan visar endast kommuner som faktiskt har event i klimatkalendern just nu. Kommuner utan event visas inte.

### "Hur vet vi om tjänsten fungerar?"

Besök webbplatsen och välj en kommun. Om eventantal visas fungerar allt.

---

## Kontakt

För tekniska frågor, kontakta utvecklaren.

---

*Dokumentation uppdaterad: December 2025*

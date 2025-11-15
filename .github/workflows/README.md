# GitHub Actions Workflows

## Refresh Calendar Data

**Fil:** `refresh-calendar-data.yml`

### Syfte
Säkerställer att kalenderdatan är färsk genom att dagligen trigga cache-uppdatering för alla städer.

### Hur det fungerar
1. **Hämtar städer** från `/api/cities` endpoint
2. **Loopar igenom varje stad** och anropar `/api/calendar/[city]`
3. **Triggar ISR-revalidering** på Vercel för alla endpoints
4. **Loggar resultat** för varje stad

### Schema
- **Automatiskt:** Dagligen kl 06:00 UTC (07:00/08:00 svensk tid)
- **Manuellt:** Kan triggas via GitHub Actions-fliken

### Konfiguration

#### Steg 1: Lägg till APP_URL som GitHub Secret

1. Gå till ditt GitHub-repo → **Settings** → **Secrets and variables** → **Actions**
2. Klicka på **New repository secret**
3. Namn: `APP_URL`
4. Värde: Din Vercel production URL (t.ex. `https://din-app.vercel.app`)
5. Spara

#### Steg 2: Verifiera att workflow är aktiverad

1. Gå till **Actions**-fliken i ditt repo
2. Du bör se "Refresh Calendar Data" i listan över workflows
3. Klicka på workflow → **Enable workflow** om den är disabled

### Manuell körning

1. Gå till **Actions**-fliken
2. Välj "Refresh Calendar Data" i vänstermenyn
3. Klicka på **Run workflow** → **Run workflow**

### Felsökning

**Problem:** Workflow misslyckas med "Failed to fetch cities"
- **Lösning:** Kontrollera att `APP_URL` secret är korrekt konfigurerad

**Problem:** Vissa städer får HTTP 404
- **Lösning:** Detta är normalt om städer saknar events. Workflow fortsätter ändå.

**Problem:** Timeout eller network errors
- **Lösning:** Klimatkalendern.nu kan vara temporärt nere. Workflow försöker igen nästa dag.

### Loggar

Varje körning visar:
- ✅ Antal städer som uppdaterades framgångsrikt
- ❌ Antal städer som misslyckades
- 📅 Tidsstämpel för körningen

### Kostnad

GitHub Actions är gratis för publika repos och har generöst free tier för privata repos. Denna workflow använder minimal tid (~1-2 minuter per dag).

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MapPin, Copy, Check } from "lucide-react"
import { getMainCityFromSuburb, findCityByName } from "@/lib/ics-parser"

interface CityData {
  name: string
  count: number
}

export default function Home() {
  const [cities, setCities] = useState<CityData[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [eventCount, setEventCount] = useState<number | null>(null)
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch("/api/cities")
        const data = await response.json()
        const availableCities: CityData[] = data.cities || []
        setCities(availableCities)

        // Try to auto-detect user's city from IP
        try {
          const locationResponse = await fetch("/api/location")
          const locationData = await locationResponse.json()

          if (locationData.city) {
            // Try to map suburb to main city (e.g., Solna → Stockholm)
            const mainCity = getMainCityFromSuburb(locationData.city)

            // Find city using normalized comparison (handles Vercel's ASCII names like "Malmo" → "Malmö")
            const matchedCity = findCityByName(mainCity, availableCities)

            if (matchedCity) {
              setSelectedCity(matchedCity.name)
            }
          }
        } catch (error) {
          console.error("Failed to detect location:", error)
          // Silently fail - user can still select manually
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error)
      } finally {
        setCitiesLoading(false)
      }
    }
    fetchCities()
  }, [])

  // Set event count from cities data when city is selected
  useEffect(() => {
    if (!selectedCity) {
      setEventCount(null)
      return
    }

    const cityData = cities.find((c) => c.name === selectedCity)
    if (cityData) {
      setEventCount(cityData.count)
    }
  }, [selectedCity, cities])

  const handleCopy = async () => {
    if (!selectedCity) return
    const calendarUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/calendar/${encodeURIComponent(selectedCity)}`
    try {
      await navigator.clipboard.writeText(calendarUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const calendarUrl = selectedCity
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/calendar/${encodeURIComponent(selectedCity)}`
    : ""

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/icon.svg" alt="Klimatkalendern logo" className="w-20 h-20" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-balance">Klimatkalendern för din kommun</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Filtrera klimathändelser efter kommun och prenumerera på dem i din kalender
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Välj din kommun
            </CardTitle>
            <CardDescription>Välj en kommun för att se klimathändelser i ditt område</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* City Selector */}
            <div className="space-y-2">
              <Select value={selectedCity} onValueChange={setSelectedCity} disabled={citiesLoading}>
                <SelectTrigger id="city-select" className="w-full">
                  <SelectValue placeholder={citiesLoading ? "Laddar kommuner..." : "Välj kommun"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((cityData) => (
                    <SelectItem key={cityData.name} value={cityData.name}>
                      <div className="flex items-center justify-between w-full gap-3">
                        <span>{cityData.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {cityData.count} {cityData.count === 1 ? "händelse" : "händelser"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{cities.length} kommuner har klimathändelser</p>
            </div>

            {/* Event Count */}
            {selectedCity && eventCount !== null && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary">{eventCount} händelser</p>
                  <p className="text-sm text-muted-foreground">Tillgängliga i {selectedCity}</p>
                </div>
              </div>
            )}

            {selectedCity && eventCount !== null && eventCount > 0 && (
              <div className="space-y-4 pt-2">
                {/* Calendar URL with Copy Button */}
                <div className="space-y-2">
                  <label htmlFor="calendar-url" className="text-sm font-medium">
                    Kalender-URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="calendar-url"
                      value={calendarUrl}
                      readOnly
                      className="font-mono text-sm"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <Button onClick={handleCopy} variant="outline" size="icon" className="shrink-0 bg-transparent">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Instructions Tabs */}
                <Tabs defaultValue="google" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="google">Google</TabsTrigger>
                    <TabsTrigger value="iphone">iPhone</TabsTrigger>
                    <TabsTrigger value="outlook">Outlook</TabsTrigger>
                  </TabsList>
                  <TabsContent value="google" className="space-y-3 mt-4">
                    <div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
                      <p className="font-medium">Så här lägger du till kalendern i Google Calendar:</p>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Kopiera URL:en ovan</li>
                        <li>
                          Öppna{" "}
                          <a
                            href="https://calendar.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Google Calendar
                          </a>{" "}
                          (på dator eller webbläsare)
                        </li>
                        <li>Klicka på + bredvid "Andra kalendrar" i vänstermenyn</li>
                        <li>Välj "Från URL"</li>
                        <li>Klistra in URL:en och klicka "Lägg till kalender"</li>
                      </ol>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          ✓ Kalendern uppdateras automatiskt med nya händelser från klimatkalendern.nu
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          📱 Android-användare: Följ dessa instruktioner på webben, kalendern synkas sedan till din
                          telefon
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="iphone" className="space-y-3 mt-4">
                    <div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
                      <p className="font-medium">Så här lägger du till kalendern på iPhone/iPad:</p>
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium text-muted-foreground mb-2">Alternativ 1 (Enklast):</p>
                          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Kopiera URL:en ovan</li>
                            <li>Öppna Safari på din iPhone/iPad</li>
                            <li>Klistra in URL:en i adressfältet och tryck Enter</li>
                            <li>Kalendern öppnas automatiskt i Kalender-appen</li>
                            <li>Tryck "Prenumerera" för att lägga till den</li>
                          </ol>
                        </div>
                        <div className="border-t pt-3">
                          <p className="font-medium text-muted-foreground mb-2">Alternativ 2 (Via Inställningar):</p>
                          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Kopiera URL:en ovan</li>
                            <li>Öppna Inställningar på din iPhone/iPad</li>
                            <li>Gå till Kalender → Konton → Lägg till konto</li>
                            <li>Välj "Annat" → "Lägg till prenumererad kalender"</li>
                            <li>Klistra in URL:en och tryck "Nästa"</li>
                            <li>Tryck "Spara"</li>
                          </ol>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          ✓ Kalendern uppdateras automatiskt med nya händelser från klimatkalendern.nu
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="outlook" className="space-y-3 mt-4">
                    <div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
                      <p className="font-medium">Så här lägger du till kalendern i Outlook:</p>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Kopiera URL:en ovan</li>
                        <li>
                          Öppna{" "}
                          <a
                            href="https://outlook.live.com/calendar"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Outlook Calendar
                          </a>
                        </li>
                        <li>Klicka på "Lägg till kalender" i vänstermenyn</li>
                        <li>Välj "Prenumerera från webben"</li>
                        <li>Klistra in URL:en och ge kalendern ett namn</li>
                        <li>Klicka "Importera"</li>
                      </ol>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          ✓ Kalendern uppdateras automatiskt med nya händelser från klimatkalendern.nu
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {selectedCity && eventCount === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Inga händelser hittades för {selectedCity}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Data från{" "}
            <a
              href="https://klimatkalendern.nu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              klimatkalendern.nu
            </a>
          </p>
          <p className="mt-1">Uppdateras dagligen</p>
        </div>
      </div>
    </main>
  )
}

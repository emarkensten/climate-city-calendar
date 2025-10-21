"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Calendar, Download, Loader2, MapPin, Copy, Check } from "lucide-react"

export default function Home() {
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [eventCount, setEventCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch("/api/cities")
        const data = await response.json()
        const availableCities = data.cities || []
        setCities(availableCities)

        // Try to auto-detect user's city from IP
        try {
          const locationResponse = await fetch("/api/location")
          const locationData = await locationResponse.json()

          if (locationData.city) {
            // Check if detected city exists in available cities (case-insensitive)
            const matchedCity = availableCities.find(
              (city: string) => city.toLowerCase() === locationData.city.toLowerCase(),
            )

            if (matchedCity) {
              setSelectedCity(matchedCity)
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

  // Fetch event count when city is selected
  useEffect(() => {
    if (!selectedCity) {
      setEventCount(null)
      return
    }

    async function fetchEventCount() {
      setLoading(true)
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(selectedCity)}`)
        const data = await response.json()
        setEventCount(data.count || 0) // Now correctly matches API response
      } catch (error) {
        console.error("Failed to fetch event count:", error)
        setEventCount(0)
      } finally {
        setLoading(false)
      }
    }
    fetchEventCount()
  }, [selectedCity])

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

  const handleDownload = () => {
    if (!selectedCity) return
    window.open(`/api/calendar/${encodeURIComponent(selectedCity)}`, "_blank")
  }

  const calendarUrl = selectedCity
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/calendar/${encodeURIComponent(selectedCity)}`
    : ""

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-balance">Klimatkalendern för din stad</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Filtrera klimathändelser efter stad och prenumerera på dem i din kalender
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Välj din stad
            </CardTitle>
            <CardDescription>Välj en stad för att se klimathändelser i ditt område</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* City Selector */}
            <div className="space-y-2">
              <label htmlFor="city-select" className="text-sm font-medium">
                Stad
              </label>
              <Select value={selectedCity} onValueChange={setSelectedCity} disabled={citiesLoading}>
                <SelectTrigger id="city-select" className="w-full">
                  <SelectValue placeholder={citiesLoading ? "Laddar städer..." : "Välj en stad"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Count */}
            {selectedCity && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Räknar händelser...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{eventCount} händelser</p>
                    <p className="text-sm text-muted-foreground">Tillgängliga i {selectedCity}</p>
                  </div>
                )}
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

                {/* Download Alternative */}
                <div className="pt-2">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full bg-transparent"
                    size="lg"
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Eller ladda ner som ICS-fil
                  </Button>
                </div>
              </div>
            )}

            {selectedCity && eventCount === 0 && !loading && (
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
          <p className="mt-1">Uppdateras varje vecka</p>
        </div>
      </div>
    </main>
  )
}

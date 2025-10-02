import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  // Get city from Vercel geolocation headers
  const city = request.headers.get("x-vercel-ip-city")
  const country = request.headers.get("x-vercel-ip-country")

  // Decode city name (Vercel encodes it)
  const decodedCity = city ? decodeURIComponent(city) : null

  // Only return city if it's in Sweden
  if (country === "SE" && decodedCity) {
    return NextResponse.json({ city: decodedCity })
  }

  return NextResponse.json({ city: null })
}

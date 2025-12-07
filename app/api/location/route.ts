import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

// Disable all caching for geolocation
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  // Get city from Vercel geolocation headers
  const city = request.headers.get("x-vercel-ip-city")
  const country = request.headers.get("x-vercel-ip-country")
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")

  // Decode city name (Vercel encodes it)
  const decodedCity = city ? decodeURIComponent(city) : null

  // Only return city if it's in Sweden
  const response = NextResponse.json({
    city: country === "SE" && decodedCity ? decodedCity : null,
    debug: {
      rawCity: city,
      decodedCity,
      country,
      ip: ip?.split(",")[0], // First IP in chain
    },
  })

  // Ensure no caching
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  return response
}

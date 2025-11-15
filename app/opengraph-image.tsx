import { ImageResponse } from 'next/og'

export const alt = 'Klimatkalendern - Klimatevent i din stad'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          {/* Logo */}
          <svg width="200" height="200" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M460.8 76.8C460.8 163.28 399.52 235.44 318.08 252.32C311.76 205.84 290.88 164 260.08 131.6C292.16 83.2 347.12 51.2 409.6 51.2H435.2C449.36 51.2 460.8 62.64 460.8 76.8ZM51.2 128C51.2 113.84 62.64 102.4 76.8 102.4H102.4C201.36 102.4 281.6 182.64 281.6 281.6V435.2C281.6 449.36 270.16 460.8 256 460.8C241.84 460.8 230.4 449.36 230.4 435.2V307.2C131.44 307.2 51.2 226.96 51.2 128Z" fill="white"/>
          </svg>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              letterSpacing: -2,
            }}
          >
            Klimatkalendern
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 36,
              color: 'rgba(255, 255, 255, 0.95)',
              textAlign: 'center',
              maxWidth: 800,
            }}
          >
            Klimatevent i din stad
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              maxWidth: 700,
              marginTop: 10,
            }}
          >
            Prenumerera på klimatevent från klimatkalendern.nu
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

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
          {/* Calendar icon */}
          <div
            style={{
              width: 180,
              height: 180,
              backgroundColor: 'white',
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                height: 50,
                backgroundColor: '#047857',
                display: 'flex',
              }}
            />
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: 20,
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, height: 15, backgroundColor: '#10b981', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 15, backgroundColor: '#10b981', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 15, backgroundColor: '#10b981', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, height: 15, backgroundColor: '#d1fae5', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 15, backgroundColor: '#d1fae5', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 15, backgroundColor: '#d1fae5', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, height: 15, backgroundColor: '#d1fae5', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 15, backgroundColor: '#d1fae5', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 15, backgroundColor: '#d1fae5', borderRadius: 4 }} />
              </div>
            </div>
          </div>

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

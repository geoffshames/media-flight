import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const artist = searchParams.get('artist') || 'Artist';
  const tour = searchParams.get('tour') || 'Tour';
  const leg = searchParams.get('leg') || '';

  // Load N27 Bold font + CCD wordmark
  const [fontData, logoData] = await Promise.all([
    fetch(
      new URL('../../../../public/brand/N27-Bold.otf', import.meta.url)
    ).then(res => res.arrayBuffer()),
    fetch(
      new URL('../../../../public/brand/CC-LOGO-2024-WHITE.png', import.meta.url)
    ).then(res => res.arrayBuffer()),
  ]);
  const logoBase64 = `data:image/png;base64,${Buffer.from(logoData).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0A0A0A',
          padding: '60px',
          fontFamily: 'N27Bold',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent glow */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(253,55,55,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(253,55,55,0.06) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top: label + CCD */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: '#FD3737',
              letterSpacing: '0.35em',
              textTransform: 'uppercase' as const,
            }}
          >
            MEDIA FLIGHT
          </div>
          <img
            src={logoBase64}
            height={28}
            style={{
              opacity: 0.7,
            }}
          />
        </div>

        {/* Center: Artist + Tour */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingTop: '20px',
          }}
        >
          <div
            style={{
              fontSize: 86,
              color: '#FAFAFA',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            {artist.toUpperCase()}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: 30,
                color: '#E4E4E7',
              }}
            >
              {tour}
            </div>
            {leg && (
              <>
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#FD3737',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    fontSize: 30,
                    color: '#888',
                  }}
                >
                  {leg}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            height: 2,
            background: 'linear-gradient(to right, #FD3737, rgba(253,55,55,0.2), transparent)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'N27Bold',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    },
  );
}

export function OgCard({
  name,
  description,
  color = '#e9ece2',
}: {
  name: string;
  description: string;
  color?: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#f8f7f2',
        display: 'flex',
        padding: 70,
        fontFamily: 'sans-serif',
        flexDirection: 'column',
        color: '#303f35',
      }}
    >
      <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>
        playroom<span style={{ color: '#ec633c' }}>.</span>
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 45 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 780 }}>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -3, lineHeight: 1.1 }}>
            {name}
          </div>
          <div style={{ fontSize: 27, marginTop: 25, color: '#6f796c' }}>{description}</div>
        </div>
        <div
          style={{
            display: 'flex',
            width: 200,
            height: 200,
            background: color,
            borderRadius: 35,
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 80,
            transform: 'rotate(-8deg)',
          }}
        >
          ✳
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 20, color: '#7c846f' }}>
        A little play. A lot of happy.
      </div>
    </div>
  );
}

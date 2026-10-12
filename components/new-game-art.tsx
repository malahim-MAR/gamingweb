import type { GameSlug } from '@/types';
const groupColors = ['#b99a7c', '#84babc', '#dba876', '#aa9bc2'];
export function NewGameArt({ slug }: { slug: GameSlug }) {
  if (slug === 'metro-runner' || slug === 'car-racing')
    return (
      <svg viewBox="0 0 300 180" className="h-full w-full" aria-hidden="true">
        <circle cx="216" cy="40" r="22" fill="#fff0bd" />
        {[25, 55, 90, 130, 170, 240, 275].map((x, i) => (
          <rect
            key={x}
            x={x}
            y={65 - (i % 3) * 12}
            width="22"
            height={35 + (i % 3) * 12}
            fill="#578b8555"
          />
        ))}
        <path d="M126 85H174L268 180H32Z" fill="#495960" />
        <path d="M125 85L30 180M175 85L270 180" stroke="#f7dfbc" strokeWidth="5" />
        <path
          d="M143 90L115 180M157 90L185 180"
          stroke="#eee5d0"
          strokeWidth="2"
          strokeDasharray="9 8"
        />
        {slug === 'metro-runner' ? (
          <>
            <g className="preview-sway">
              <rect x="185" y="103" width="35" height="51" rx="5" fill="#276b72" />
              <rect x="190" y="108" width="25" height="15" rx="3" fill="#b9e5dc" />
              <rect x="192" y="144" width="21" height="4" fill="#f4ca68" />
            </g>
            <g className="preview-drive">
              <ellipse cx="137" cy="165" rx="18" ry="5" fill="#142e3240" />
              <rect x="124" y="127" width="26" height="31" rx="7" fill="#ec633c" />
              <circle cx="137" cy="119" r="11" fill="#ffe0b4" />
              <path d="M126 115Q137 103 148 115" stroke="#354f67" strokeWidth="8" />
              <path d="M128 153L124 168M146 153L150 168" stroke="#354f67" strokeWidth="8" />
            </g>
            {[105, 96, 86].map((x, i) => (
              <ellipse
                key={x}
                cx={x}
                cy={112 + i * 15}
                rx={4 + i}
                ry={6 + i}
                fill="#f4ca68"
                stroke="#fff0af"
                strokeWidth="1.5"
              />
            ))}
          </>
        ) : (
          <>
            <g className="preview-sway">
              <rect x="181" y="104" width="24" height="38" rx="5" fill="#719cc1" />
              <rect x="185" y="112" width="16" height="10" rx="2" fill="#314b5d" />
            </g>
            <g className="preview-drive">
              <rect x="125" y="123" width="9" height="13" rx="2" fill="#263c40" />
              <rect x="160" y="123" width="9" height="13" rx="2" fill="#263c40" />
              <rect x="125" y="153" width="9" height="13" rx="2" fill="#263c40" />
              <rect x="160" y="153" width="9" height="13" rx="2" fill="#263c40" />
              <rect x="131" y="114" width="33" height="58" rx="8" fill="#ed6842" />
              <rect x="136" y="129" width="23" height="16" rx="3" fill="#314b5d" />
              <rect x="139" y="155" width="17" height="7" rx="2" fill="#314b5d" />
            </g>
          </>
        )}
      </svg>
    );
  if (slug === 'ludo')
    return (
      <svg viewBox="0 0 300 180" className="h-full w-full" aria-hidden="true">
        <g transform="translate(80 20) rotate(-7 70 70)">
          <rect
            width="140"
            height="140"
            rx="12"
            fill="#fff9ed"
            stroke="#354e4640"
            strokeWidth="3"
          />
          {[
            [8, 8, '#e96d54'],
            [82, 8, '#8cac71'],
            [8, 82, '#e2bd59'],
            [82, 82, '#568fc0'],
          ].map(([x, y, color], i) => (
            <g key={i}>
              <rect x={x} y={y} width="50" height="50" rx="6" fill={String(color)} />
              {[0, 1, 2, 3].map((j) => (
                <circle
                  key={j}
                  cx={Number(x) + 15 + (j % 2) * 20}
                  cy={Number(y) + 15 + Math.floor(j / 2) * 20}
                  r="7"
                  fill="#fff9ed"
                />
              ))}
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <rect x="61" y={7 + i * 21} width="17" height="15" rx="2" fill="#b1c5a2" />
              <rect x={7 + i * 21} y="61" width="15" height="17" rx="2" fill="#efb39f" />
            </g>
          ))}
          <circle cx="69" cy="91" r="7" fill="#568fc0" stroke="#fff" strokeWidth="2" />
          <circle cx="91" cy="69" r="7" fill="#e96d54" stroke="#fff" strokeWidth="2" />
        </g>
      </svg>
    );
  if (slug === 'monopoly')
    return (
      <svg viewBox="0 0 300 180" className="h-full w-full" aria-hidden="true">
        <g transform="translate(73 14) rotate(6 77 77)">
          <rect
            width="154"
            height="154"
            rx="12"
            fill="#e3ead6"
            stroke="#354e4640"
            strokeWidth="3"
          />
          {Array.from({ length: 24 }, (_, i) => {
            const [r, c] =
              i <= 6 ? [6, 6 - i] : i <= 12 ? [12 - i, 0] : i <= 18 ? [0, i - 12] : [i - 18, 6];
            return (
              <g key={i}>
                <rect x={c * 21 + 4} y={r * 21 + 4} width="20" height="20" rx="2" fill="#fff9ed" />
                <rect
                  x={c * 21 + 4}
                  y={r * 21 + 4}
                  width="20"
                  height="4"
                  fill={groupColors[Math.floor(i / 6)]}
                />
              </g>
            );
          })}
          <path d="M60 76L77 60L94 76V96H60Z" fill="#6e9873" />
          <rect x="72" y="82" width="10" height="14" fill="#e3ead6" />
          <circle cx="139" cy="140" r="5" fill="#e96d54" />
          <circle cx="12" cy="118" r="5" fill="#568fc0" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 300 180" className="h-full w-full" aria-hidden="true">
      <path d="M0 0H300V180H0Z" fill="#566c63" />
      <path d="M0 180L100 91H202L300 180" fill="#708370" />
      <path d="M0 29L101 66V119L0 160Z" fill="#bac0a0" />
      <path d="M300 29L201 66V119L300 160Z" fill="#8e9d82" />
      <rect x="101" y="66" width="100" height="53" fill="#cbd0b0" />
      <path
        d="M0 64L100 87M0 109L100 103M300 64L201 87M300 109L201 103"
        stroke="#526b5430"
        strokeWidth="2"
      />
      <g className="preview-sway">
        <rect x="166" y="88" width="19" height="24" rx="4" fill="#b66e54" />
        <circle cx="175" cy="82" r="7" fill="#d4ac83" />
        <path d="M169 108L167 124M181 108L184 124" stroke="#354f45" strokeWidth="5" />
      </g>
      <path d="M140 90H148M152 90H160M150 80V88M150 92V100" stroke="#fff1bb" strokeWidth="2" />
      <path d="M200 180L194 129H212L233 180" fill="#273d41" />
      <path d="M205 142V112H215L220 142" fill="#273d41" />
      <rect x="16" y="16" width="65" height="6" rx="3" fill="#d6e6b4" />
      <rect x="219" y="16" width="65" height="6" rx="3" fill="#f4ca68" />
    </svg>
  );
}

import React from 'react';

interface Props {
  value: string;
  height?: number;
  showText?: boolean;
}

export const BarcodeRenderer: React.FC<Props> = ({
  value,
  height = 40,
  showText = true
}) => {
  // Generate deterministic bar widths based on character codes
  const generateBars = (code: string) => {
    const bars: { width: number; isBlack: boolean }[] = [];

    // Start guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const w1 = (charCode % 3) + 1;
      const w2 = ((charCode >> 1) % 2) + 1;
      const w3 = ((charCode >> 2) % 3) + 1;

      bars.push({ width: w1, isBlack: i % 2 === 0 });
      bars.push({ width: w2, isBlack: i % 2 !== 0 });
      bars.push({ width: w3, isBlack: true });
    }

    // Stop guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    return bars;
  };

  const bars = generateBars(value);
  let currentX = 0;

  return (
    <div className="inline-flex flex-col items-center bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
      <svg
        height={height}
        width={Math.max(bars.reduce((sum, b) => sum + b.width * 2, 0), 120)}
        className="overflow-visible"
      >
        {bars.map((bar, index) => {
          const barWidth = bar.width * 2;
          const x = currentX;
          currentX += barWidth;

          if (!bar.isBlack) return null;

          return (
            <rect
              key={index}
              x={x}
              y={0}
              width={barWidth}
              height={height}
              fill="#0f172a"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-slate-800 font-bold mt-1">
          {value}
        </span>
      )}
    </div>
  );
};

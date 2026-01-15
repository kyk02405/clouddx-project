interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export default function Sparkline({ 
  data, 
  width = 80, 
  height = 30, 
  color,
  className = "" 
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className={className} style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Create SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // Determine color based on trend (first vs last value)
  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = color || (isPositive 
    ? "rgb(34, 197, 94)" // green-600
    : "rgb(239, 68, 68)" // red-600
  );

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

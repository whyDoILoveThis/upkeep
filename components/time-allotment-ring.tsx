"use client";

interface TimeAllotmentRingProps {
  usedMinutes: number;
  totalMinutes: number;
  quarterStart: string;
  quarterEnd: string;
}

export function TimeAllotmentRing({
  usedMinutes,
  totalMinutes,
  quarterStart,
  quarterEnd,
}: TimeAllotmentRingProps) {
  const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
  const percentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;

  // SVG ring calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  const getColor = () => {
    if (percentage >= 90)
      return { stroke: "#ef4444", text: "text-red-400", label: "Critical" };
    if (percentage >= 70)
      return { stroke: "#f59e0b", text: "text-amber-400", label: "Low" };
    return { stroke: "#6366f1", text: "text-accent-light", label: "On Track" };
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      {/* Ring */}
      <div className="relative w-50 h-50">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          {/* Progress ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${color.stroke}40)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-3xl font-bold ${color.text}`}>
            {hours}h {mins}m
          </div>
          <div className="text-xs text-muted mt-1">remaining</div>
        </div>
      </div>

      {/* Stats below */}
      <div className="mt-4 w-full space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Used</span>
          <span>
            {Math.floor(usedMinutes / 60)}h {usedMinutes % 60}m
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Total</span>
          <span>
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Status</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              percentage >= 90
                ? "bg-red-400/10 text-red-400"
                : percentage >= 70
                  ? "bg-amber-400/10 text-amber-400"
                  : "bg-accent/10 text-accent-light"
            }`}
          >
            {color.label}
          </span>
        </div>
        <div className="pt-1 text-xs text-muted text-center">
          Quarter:{" "}
          {new Date(quarterStart).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          –{" "}
          {new Date(quarterEnd).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

interface HandymanTimeRingProps {
  scheduledMinutes: number;
  completedMinutes: number;
  quarterStart: string;
  quarterEnd: string;
}

export function HandymanTimeRing({
  scheduledMinutes,
  completedMinutes,
  quarterStart,
  quarterEnd,
}: HandymanTimeRingProps) {
  const percentage =
    scheduledMinutes > 0 ? (completedMinutes / scheduledMinutes) * 100 : 0;
  const remainingMinutes = Math.max(0, scheduledMinutes - completedMinutes);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(percentage, 100) / 100) * circumference;

  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  const getColor = () => {
    if (percentage >= 100)
      return { stroke: "#22c55e", text: "text-success", label: "Done" };
    if (percentage >= 70)
      return {
        stroke: "#6366f1",
        text: "text-accent-light",
        label: "On Track",
      };
    if (percentage > 0)
      return { stroke: "#f59e0b", text: "text-amber-400", label: "Upcoming" };
    return { stroke: "#6366f1", text: "text-accent-light", label: "No Time" };
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-50 h-50">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
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
            style={{ filter: `drop-shadow(0 0 8px ${color.stroke}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {scheduledMinutes > 0 ? (
            <>
              <div className={`text-3xl font-bold ${color.text}`}>
                {hours}h {mins}m
              </div>
              <div className="text-xs text-muted mt-1">remaining</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted">0h</div>
              <div className="text-xs text-muted mt-1">scheduled</div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 w-full space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Completed</span>
          <span>
            {Math.floor(completedMinutes / 60)}h {completedMinutes % 60}m
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Total Scheduled</span>
          <span>
            {Math.floor(scheduledMinutes / 60)}h {scheduledMinutes % 60}m
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Status</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              percentage >= 100
                ? "bg-success/10 text-success"
                : percentage >= 70
                  ? "bg-accent/10 text-accent-light"
                  : percentage > 0
                    ? "bg-amber-400/10 text-amber-400"
                    : "bg-white/5 text-muted"
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

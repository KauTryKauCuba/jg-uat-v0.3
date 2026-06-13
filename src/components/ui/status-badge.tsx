import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();
  
  let badgeStyles = "bg-zinc-800 text-zinc-300 border-zinc-700";
  if (normalizedStatus === "PASSED" || normalizedStatus === "SUBMITTED") {
    badgeStyles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (normalizedStatus === "FAILED") {
    badgeStyles = "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (normalizedStatus === "PENDING" || normalizedStatus === "IN_PROGRESS") {
    badgeStyles = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold select-none transition-colors",
        badgeStyles,
        className
      )}
    >
      {normalizedStatus}
    </span>
  );
}
export default StatusBadge;

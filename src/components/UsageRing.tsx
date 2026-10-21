"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UsageRingProps {
  used: number;
  limit: number;
  onClick?: () => void;
}

export function UsageRing({ used, limit, onClick }: UsageRingProps) {
  const remaining = Math.max(limit - used, 0);
  const pct = Math.min(used / limit, 1);

  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  let color: string;
  if (remaining >= 10) {
    color = "#22c55e";
  } else if (remaining >= 5) {
    color = "#eab308";
  } else {
    color = "#ef4444";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="cursor-pointer inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-accent transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.15"
              />
              <circle
                cx="12"
                cy="12"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 12 12)"
              />
              <text
                x="12"
                y="12"
                textAnchor="middle"
                dominantBaseline="central"
                fill="currentColor"
                fontSize="8"
                fontWeight="600"
              >
                {remaining}
              </text>
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          {remaining} free {remaining === 1 ? "link" : "links"} left
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

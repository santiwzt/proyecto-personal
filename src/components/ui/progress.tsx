import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0-100 */
  value?: number;
}

/**
 * @radix-ui/react-progress is not a pinned dependency, so this is a small
 * hand-rolled progress bar with the equivalent ARIA semantics.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
        {...props}
      >
        <div
          className="h-full flex-1 rounded-full bg-primary transition-transform"
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };

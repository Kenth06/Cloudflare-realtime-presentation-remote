import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSlides } from "./useSlides";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Remote() {
  const {
    currentSlide,
    slideNumber,
    totalSlides,
    isFirst,
    isLast,
    connected,
    next,
    prev,
  } = useSlides();

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  const resetTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerSeconds(0);
  }, []);

  const toggleTimer = useCallback(() => {
    setTimerRunning((r) => !r);
  }, []);

  // Swipe detection
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0 && !isLast) next();
        if (dx > 0 && !isFirst) prev();
      }
    },
    [next, prev, isFirst, isLast]
  );

  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, []);

  if (!connected) {
    return (
      <div className="h-dvh w-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-2 rounded-full bg-destructive animate-pulse-dot" />
          <p className="text-muted-foreground text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="h-dvh w-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="h-dvh w-screen bg-background flex flex-col select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                connected
                  ? "bg-emerald-500 animate-pulse-dot"
                  : "bg-destructive"
              )}
            />
            <span className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              Title
            </span>
          </div>
          <span className="text-muted-foreground text-sm font-mono tabular-nums">
            {slideNumber} / {totalSlides}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-foreground text-sm font-mono tabular-nums font-medium">
            {formatTime(timerSeconds)}
          </span>
          <button
            onClick={toggleTimer}
            className={cn(
              "h-7 px-2.5 rounded-md text-[0.65rem] font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer",
              timerRunning
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "bg-warm text-warm-foreground hover:opacity-90"
            )}
          >
            {timerRunning ? (
              <>
                <Pause className="size-2.5" /> Pause
              </>
            ) : (
              <>
                <Play className="size-2.5" /> Start
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-4" />

      {/* Slide title */}
      <div className="px-4 py-3">
        <h2 className="text-foreground font-semibold text-lg leading-tight truncate">
          {currentSlide.title}
        </h2>
      </div>

      {/* Speaker notes — scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-3 space-y-2.5">
        {/* Notes card */}
        <div className="bg-card rounded-lg border border-border p-4 animate-fade-in">
          <p className="text-card-foreground text-base leading-7">
            {currentSlide.speakerNotes}
          </p>
        </div>

        {/* Quick cue */}
        <div className="bg-warm/10 rounded-lg border border-warm/20 p-4">
          <p className="text-warm text-sm font-medium leading-relaxed">
            Keep this short. 30 seconds. Get to the point.
          </p>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border">
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            className={cn(
              "flex-1 h-12 text-sm font-semibold gap-1.5 active:scale-[0.97] transition-transform",
              isFirst && "opacity-30 pointer-events-none"
            )}
            onClick={prev}
            disabled={isFirst}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>

          <Button
            variant="ghost"
            size="icon-lg"
            onClick={resetTimer}
            className="shrink-0 text-muted-foreground"
          >
            <RotateCcw className="size-4" />
          </Button>

          <Button
            className={cn(
              "flex-1 h-12 text-sm font-semibold gap-1.5 active:scale-[0.97] transition-transform",
              isLast && "opacity-30 pointer-events-none"
            )}
            onClick={next}
            disabled={isLast}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

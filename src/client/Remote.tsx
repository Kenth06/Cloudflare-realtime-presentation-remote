import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "./lib/utils";
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

  // Timer state
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

  // Prevent overscroll
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, []);

  if (!connected) {
    return (
      <div className="h-dvh w-screen bg-luma-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-luma-accent animate-pulse-dot" />
          <p className="text-luma-text-muted text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="h-dvh w-screen bg-luma-bg flex items-center justify-center">
        <p className="text-luma-text-muted text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="h-dvh w-screen bg-luma-bg flex flex-col select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        {/* Left: live dot + title label */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              connected ? "bg-luma-success animate-pulse-dot" : "bg-red-500"
            )}
          />
          <span className="text-luma-text-muted text-xs font-medium uppercase tracking-wider truncate">
            Title
          </span>
        </div>

        {/* Center: slide counter */}
        <div className="flex items-center gap-3">
          <span className="text-luma-text-secondary text-sm font-mono tabular-nums">
            {slideNumber} / {totalSlides}
          </span>
        </div>

        {/* Right: timer + start/pause */}
        <div className="flex items-center gap-2">
          <span className="text-luma-text-secondary text-sm font-mono tabular-nums min-w-[3rem] text-right">
            {formatTime(timerSeconds)}
          </span>
          <button
            onClick={toggleTimer}
            className={cn(
              "h-7 px-3 rounded-md text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer",
              timerRunning
                ? "bg-luma-surface-raised text-luma-text-secondary hover:text-luma-text"
                : "bg-luma-accent text-white hover:bg-luma-accent-hover"
            )}
          >
            {timerRunning ? (
              <>
                <Pause size={10} /> Pause
              </>
            ) : (
              <>
                <Play size={10} /> Start
              </>
            )}
          </button>
        </div>
      </div>

      {/* Slide title */}
      <div className="px-4 py-3 border-b border-luma-border-subtle">
        <h2 className="text-luma-text font-semibold text-lg leading-tight truncate">
          {currentSlide.title}
        </h2>
      </div>

      {/* Speaker notes — scrollable main area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3">
        {/* Notes card */}
        <div className="bg-luma-surface rounded-xl p-4 border border-luma-border-subtle animate-fade-in">
          <p className="text-luma-text text-[1.05rem] leading-[1.7]">
            {currentSlide.speakerNotes}
          </p>
        </div>

        {/* Quick reminder card (accent) */}
        <div className="bg-luma-accent-soft rounded-xl p-4 border border-luma-accent/20">
          <p className="text-luma-accent text-sm font-medium leading-relaxed">
            Keep this short. 30 seconds. Get to the point.
          </p>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-luma-border-subtle px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Nav buttons */}
        <div className="flex gap-2">
          <button
            onClick={prev}
            disabled={isFirst}
            className={cn(
              "flex-1 h-14 rounded-xl flex items-center justify-center gap-2 font-semibold text-base transition-all active:scale-[0.97] cursor-pointer",
              isFirst
                ? "bg-luma-surface text-luma-text-muted/40 cursor-default"
                : "bg-luma-surface-raised text-luma-text hover:bg-luma-border"
            )}
          >
            <ChevronLeft size={18} />
            Prev
          </button>

          <button
            onClick={resetTimer}
            className="w-14 h-14 rounded-xl bg-luma-surface flex items-center justify-center text-luma-text-muted hover:text-luma-text hover:bg-luma-surface-raised transition-colors cursor-pointer active:scale-[0.95]"
            title="Reset timer"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={next}
            disabled={isLast}
            className={cn(
              "flex-1 h-14 rounded-xl flex items-center justify-center gap-2 font-semibold text-base transition-all active:scale-[0.97] cursor-pointer",
              isLast
                ? "bg-luma-accent/30 text-white/40 cursor-default"
                : "bg-luma-accent text-white hover:bg-luma-accent-hover"
            )}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

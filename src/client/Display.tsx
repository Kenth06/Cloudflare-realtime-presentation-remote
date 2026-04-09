import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSlides } from "./useSlides";

export function Display() {
  const {
    currentSlide,
    slideNumber,
    totalSlides,
    connected,
    next,
    prev,
    goTo,
    state,
  } = useSlides();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const prevSlideRef = useRef(state.currentSlide);

  useEffect(() => {
    if (state.currentSlide !== prevSlideRef.current) {
      setSlideKey((k) => k + 1);
      prevSlideRef.current = state.currentSlide;
    }
  }, [state.currentSlide]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "f":
        case "F":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, toggleFullscreen]);

  const remoteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/remote`
      : "/remote";

  if (!connected) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading slides...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden select-none">
      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-20 py-16">
        <div key={slideKey} className="max-w-4xl w-full animate-slide-in">
          <h1 className="text-foreground font-bold leading-[1.05] tracking-tight mb-8 text-[clamp(2.5rem,5vw,4.5rem)]">
            {currentSlide.title}
          </h1>
          <div className="text-muted-foreground text-[clamp(1.05rem,2vw,1.45rem)] leading-relaxed max-w-3xl space-y-1.5">
            {currentSlide.body.split("\n").map((line, i) =>
              line === "" ? (
                <div key={i} className="h-3" />
              ) : line.startsWith("- ") ? (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-primary mt-[0.4em] text-[0.4em]">&#9679;</span>
                  <span className="text-foreground/80">{line.slice(2)}</span>
                </div>
              ) : line.startsWith("```") ? null : (
                <p key={i}>{line}</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="h-14 border-t border-border flex items-center px-5 gap-3">
        {/* Slide dots */}
        <div className="flex items-center gap-1.5 flex-1">
          {state.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200 cursor-pointer",
                i === state.currentSlide
                  ? "bg-primary w-5"
                  : "bg-muted w-1.5 hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>

        {/* Slide counter with nav arrows */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={prev}
            disabled={state.currentSlide === 0}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-muted-foreground text-xs font-mono tabular-nums min-w-[3rem] text-center">
            {slideNumber}/{totalSlides}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={next}
            disabled={state.currentSlide === state.slides.length - 1}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Fullscreen */}
        <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <Minimize className="size-3.5" />
          ) : (
            <Maximize className="size-3.5" />
          )}
        </Button>

        {/* QR code */}
        <div className="opacity-30 hover:opacity-70 transition-opacity">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(remoteUrl)}&bgcolor=262626&color=ededed`}
            alt="Remote"
            className="size-7 rounded-sm"
          />
        </div>
      </div>
    </div>
  );
}

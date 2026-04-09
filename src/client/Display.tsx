import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "./lib/utils";
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

  // Track slide changes for animation
  useEffect(() => {
    if (state.currentSlide !== prevSlideRef.current) {
      setSlideKey((k) => k + 1);
      prevSlideRef.current = state.currentSlide;
    }
  }, [state.currentSlide]);

  // Fullscreen tracking
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

  // Keyboard shortcuts
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
      <div className="h-screen w-screen bg-luma-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-luma-border border-t-luma-accent rounded-full animate-spin" />
          <p className="text-luma-text-muted font-sans text-sm tracking-wide">
            Connecting...
          </p>
        </div>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="h-screen w-screen bg-luma-bg flex items-center justify-center">
        <p className="text-luma-text-muted text-sm">Loading slides...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-luma-bg flex flex-col overflow-hidden select-none">
      {/* Main slide area */}
      <div className="flex-1 flex items-center justify-center px-16 py-12">
        <div key={slideKey} className="max-w-4xl w-full animate-slide-in">
          {/* Title */}
          <h1 className="text-luma-text font-sans font-bold leading-[1.05] tracking-tight mb-6 text-[clamp(2.5rem,5vw,4.5rem)]">
            {currentSlide.title.split(" ").map((word, i) => {
              // Accent the second word for Luma-style flair
              if (i === 1) {
                return (
                  <span key={i} className="text-luma-accent">
                    {word}{" "}
                  </span>
                );
              }
              return <span key={i}>{word} </span>;
            })}
          </h1>

          {/* Body */}
          <div className="text-luma-text-secondary text-[clamp(1rem,2vw,1.5rem)] leading-relaxed max-w-3xl">
            {currentSlide.body.split("\n").map((line, i) =>
              line === "" ? (
                <div key={i} className="h-3" />
              ) : line.startsWith("- ") ? (
                <div key={i} className="flex gap-3 mb-1.5">
                  <span className="text-luma-accent mt-[0.35em] text-xs">
                    ●
                  </span>
                  <span>{line.slice(2)}</span>
                </div>
              ) : line.startsWith("```") ? null : (
                <p key={i} className="mb-1.5">
                  {line}
                </p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-16 border-t border-luma-border-subtle flex items-center px-6 gap-4">
        {/* Slide dots */}
        <div className="flex items-center gap-1.5 flex-1">
          {state.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200 cursor-pointer",
                i === state.currentSlide
                  ? "bg-luma-accent w-6"
                  : "bg-luma-border hover:bg-luma-text-muted"
              )}
            />
          ))}
        </div>

        {/* Slide counter with arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            disabled={state.currentSlide === 0}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-md transition-colors",
              state.currentSlide === 0
                ? "text-luma-text-muted/30 cursor-default"
                : "text-luma-text-secondary hover:text-luma-text hover:bg-luma-surface-raised cursor-pointer"
            )}
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-luma-text-secondary text-sm font-mono tabular-nums min-w-[3.5rem] text-center">
            {slideNumber}/{totalSlides}
          </span>

          <button
            onClick={next}
            disabled={state.currentSlide === state.slides.length - 1}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-md transition-colors",
              state.currentSlide === state.slides.length - 1
                ? "text-luma-text-muted/30 cursor-default"
                : "text-luma-text-secondary hover:text-luma-text hover:bg-luma-surface-raised cursor-pointer"
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 flex items-center justify-center rounded-md text-luma-text-muted hover:text-luma-text hover:bg-luma-surface-raised transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>

        {/* QR code */}
        <div className="ml-2 opacity-40 hover:opacity-80 transition-opacity">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(remoteUrl)}&bgcolor=121212&color=f5f5f5`}
            alt="Remote"
            className="w-8 h-8 rounded-sm"
          />
        </div>
      </div>
    </div>
  );
}

import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSlides } from "./useSlides";

export function Display({ presentationId }: { presentationId?: string }) {
  const {
    currentSlide,
    slideNumber,
    totalSlides,
    connected,
    viewers,
    next,
    prev,
    goTo,
    state,
  } = useSlides(presentationId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQr, setShowQr] = useState(false);
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
          <div className="size-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
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
      {/* Slide content — centered */}
      <div className="flex-1 flex items-center justify-center px-[8%] py-16">
        <div key={slideKey} className="max-w-[900px] w-full animate-slide-in">
          <h1 className="text-foreground font-bold leading-[1.08] tracking-[-0.02em] mb-6 text-[clamp(2.2rem,4.5vw,4.2rem)]">
            {currentSlide.title}
          </h1>
          <div className="text-muted-foreground text-[clamp(1rem,1.8vw,1.35rem)] leading-[1.7] space-y-1">
            {currentSlide.body.split("\n").map((line, i) =>
              line === "" ? (
                <div key={i} className="h-4" />
              ) : line.startsWith("- ") ? (
                <div key={i} className="flex items-baseline gap-2.5">
                  <span className="text-foreground/40 text-[0.5em]">&#9679;</span>
                  <span className="text-foreground/70">{line.slice(2)}</span>
                </div>
              ) : line.startsWith("```") ? null : (
                <p key={i}>{line}</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-12 border-t border-border flex items-center px-5 gap-4">
        {/* Slide dots — left */}
        <div className="flex items-center gap-1.5 flex-1">
          {state.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-[5px] rounded-full transition-all duration-200 cursor-pointer",
                i === state.currentSlide
                  ? "bg-foreground w-5"
                  : "bg-muted w-[5px] hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Counter + arrows — right side */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={prev}
            disabled={state.currentSlide === 0}
            className="text-muted-foreground"
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
            className="text-muted-foreground"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Viewers */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="size-3" />
          <span className="text-xs font-mono tabular-nums">{viewers}</span>
        </div>

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleFullscreen}
          className="text-muted-foreground"
        >
          {isFullscreen ? (
            <Minimize className="size-3.5" />
          ) : (
            <Maximize className="size-3.5" />
          )}
        </Button>

        {/* QR toggle */}
        <button
          onClick={() => setShowQr(true)}
          className="opacity-25 hover:opacity-60 transition-opacity cursor-pointer"
        >
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(remoteUrl)}&bgcolor=262626&color=ededed`}
            alt="Remote"
            className="size-6 rounded-sm"
          />
        </button>
      </div>

      {/* QR overlay */}
      {showQr && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer animate-fade-in"
          onClick={() => setShowQr(false)}
        >
          <div className="bg-white p-6 rounded-2xl shadow-2xl">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(remoteUrl)}`}
              alt="Scan to open remote"
              className="size-56"
            />
          </div>
          <p className="text-white/70 text-sm mt-4 font-mono">{remoteUrl}</p>
          <p className="text-white/40 text-xs mt-2">Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}

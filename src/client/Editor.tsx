import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSlides } from "./useSlides";
import type { Slide } from "../server";

function emptySlide(): Slide {
  return { title: "", body: "", speakerNotes: "" };
}

export function Editor({ presentationId }: { presentationId: string }) {
  const { state, connected, loadSlides } = useSlides(presentationId);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [dirty, setDirty] = useState(false);

  // Sync from server on first load
  useEffect(() => {
    if (connected && state.slides.length > 0 && !dirty) {
      setSlides(state.slides);
    }
  }, [connected, state.slides, dirty]);

  const updateSlide = useCallback((index: number, field: keyof Slide, value: string) => {
    setSlides((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  }, []);

  const addSlide = useCallback((afterIndex: number) => {
    setSlides((prev) => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, emptySlide());
      return next;
    });
    setDirty(true);
  }, []);

  const removeSlide = useCallback((index: number) => {
    setSlides((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
    setDirty(true);
  }, []);

  const moveSlide = useCallback((index: number, direction: -1 | 1) => {
    setSlides((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    const valid = slides.filter((s) => s.title.trim() || s.body.trim());
    if (valid.length === 0) return;
    // Ensure all have at least a title
    const cleaned = valid.map((s) => ({
      title: s.title.trim() || "Untitled",
      body: s.body,
      speakerNotes: s.speakerNotes,
    }));
    loadSlides(cleaned);
    setDirty(false);
  }, [slides, loadSlides]);

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

  return (
    <div className="h-dvh w-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5">
        <div className="flex items-center gap-3">
          <a
            href={`/remote?p=${presentationId}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </a>
          <h1 className="text-foreground font-semibold text-base">
            Slide Editor
          </h1>
          <span className="text-muted-foreground text-xs font-mono">
            {slides.length} slides
          </span>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleSave}
          disabled={!dirty || slides.length === 0}
        >
          <Save className="size-3.5" />
          Save
        </Button>
      </div>
      <div className="h-px bg-border mx-4" />

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-4">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="bg-card rounded-lg border border-border p-4 space-y-3 animate-fade-in"
          >
            {/* Slide header */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-mono font-medium">
                Slide {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveSlide(i, -1)}
                  disabled={i === 0}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5",
                    i === 0 && "opacity-30 pointer-events-none"
                  )}
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  onClick={() => moveSlide(i, 1)}
                  disabled={i === slides.length - 1}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5",
                    i === slides.length - 1 && "opacity-30 pointer-events-none"
                  )}
                >
                  <ChevronDown className="size-3.5" />
                </button>
                <button
                  onClick={() => removeSlide(i)}
                  disabled={slides.length <= 1}
                  className={cn(
                    "text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-0.5 ml-1",
                    slides.length <= 1 && "opacity-30 pointer-events-none"
                  )}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Title */}
            <input
              type="text"
              value={slide.title}
              onChange={(e) => updateSlide(i, "title", e.target.value)}
              placeholder="Slide title"
              className="w-full bg-transparent border-b border-border pb-1.5 text-foreground text-sm font-semibold placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30 transition-colors"
            />

            {/* Body */}
            <textarea
              value={slide.body}
              onChange={(e) => updateSlide(i, "body", e.target.value)}
              placeholder="Slide content..."
              rows={3}
              className="w-full bg-transparent text-foreground text-sm leading-relaxed placeholder:text-muted-foreground/40 resize-none focus:outline-none"
            />

            {/* Speaker notes */}
            <textarea
              value={slide.speakerNotes}
              onChange={(e) => updateSlide(i, "speakerNotes", e.target.value)}
              placeholder="Speaker notes (optional)"
              rows={2}
              className="w-full bg-muted/50 rounded-md p-2 text-muted-foreground text-xs leading-relaxed placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-ring/50"
            />

            {/* Add slide after */}
            <button
              onClick={() => addSlide(i)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer mx-auto"
            >
              <Plus className="size-3" />
              Add slide below
            </button>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-muted-foreground text-sm">No slides yet</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => addSlide(-1)}
            >
              <Plus className="size-3.5" />
              Add first slide
            </Button>
          </div>
        )}
      </div>

      {/* Bottom safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}

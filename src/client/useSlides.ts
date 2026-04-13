import { useAgent } from "agents/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Slide, SlideState } from "../server";

const INITIAL_STATE: SlideState = {
  currentSlide: 0,
  slides: [],
  viewers: 0,
  timerStartedAt: null,
  timerPausedElapsed: 0,
  timerRunning: false,
  presentationName: "",
};

function useTimerDisplay(state: SlideState) {
  const [now, setNow] = useState(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!state.timerRunning) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state.timerRunning]);

  const elapsedMs = state.timerRunning && state.timerStartedAt
    ? state.timerPausedElapsed + (now - state.timerStartedAt)
    : state.timerPausedElapsed;

  return Math.max(0, Math.floor(elapsedMs / 1000));
}

export function useSlides(instanceName = "default") {
  const [state, setState] = useState<SlideState>(INITIAL_STATE);
  const [connected, setConnected] = useState(false);

  const agent = useAgent<SlideState>({
    agent: "PresentationAgent",
    name: instanceName,
    onStateUpdate: (newState) => setState(newState),
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onError: () => setConnected(false),
  });

  const next = useCallback(() => agent.call("next"), [agent]);
  const prev = useCallback(() => agent.call("prev"), [agent]);
  const goTo = useCallback((index: number) => agent.call("goTo", [index]), [agent]);
  const loadSlides = useCallback((slides: Slide[]) => agent.call("loadSlides", [slides]), [agent]);
  const startTimer = useCallback(() => agent.call("startTimer"), [agent]);
  const pauseTimer = useCallback(() => agent.call("pauseTimer"), [agent]);
  const resetTimer = useCallback(() => agent.call("resetTimer"), [agent]);
  const renamePresentation = useCallback((name: string) => agent.call("renamePresentation", [name]), [agent]);
  const generateSlides = useCallback((topic: string, slideCount: number) => agent.call("generateSlides", [topic, slideCount]), [agent]);

  const timerSeconds = useTimerDisplay(state);

  const currentSlide: Slide | undefined = state.slides[state.currentSlide];
  const totalSlides = state.slides.length;
  const slideNumber = state.currentSlide + 1;
  const isFirst = state.currentSlide === 0;
  const isLast = state.currentSlide === state.slides.length - 1;

  return {
    state,
    currentSlide,
    slideNumber,
    totalSlides,
    isFirst,
    isLast,
    connected,
    viewers: state.viewers,
    timerSeconds,
    timerRunning: state.timerRunning,
    presentationName: state.presentationName,
    next,
    prev,
    goTo,
    loadSlides,
    startTimer,
    pauseTimer,
    resetTimer,
    renamePresentation,
    generateSlides,
  };
}

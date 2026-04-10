import { useAgent } from "agents/react";
import { useCallback, useState } from "react";
import type { Slide, SlideState } from "../server";

const INITIAL_STATE: SlideState = {
  currentSlide: 0,
  slides: [],
};

export function useSlides() {
  const [state, setState] = useState<SlideState>(INITIAL_STATE);
  const [connected, setConnected] = useState(false);

  const agent = useAgent<SlideState>({
    agent: "PresentationAgent",
    name: "default",
    onStateUpdate: (newState) => setState(newState),
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onError: () => setConnected(false),
  });

  const next = useCallback(() => {
    agent.call("next");
  }, [agent]);

  const prev = useCallback(() => {
    agent.call("prev");
  }, [agent]);

  const goTo = useCallback(
    (index: number) => {
      agent.call("goTo", [index]);
    },
    [agent]
  );

  const loadSlides = useCallback(
    (slides: Slide[]) => {
      agent.call("loadSlides", [slides]);
    },
    [agent]
  );

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
    next,
    prev,
    goTo,
    loadSlides,
  };
}

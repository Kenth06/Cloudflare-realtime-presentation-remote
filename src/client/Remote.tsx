import { useRef, useEffect, useCallback } from "react";
import { useSlides } from "./useSlides";

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

      // Only trigger if horizontal swipe is dominant and > 50px
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0 && !isLast) next();
        if (dx > 0 && !isFirst) prev();
      }
    },
    [next, prev, isFirst, isLast]
  );

  // Prevent pull-to-refresh on mobile
  useEffect(() => {
    const preventPull = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", preventPull, { passive: false });
    return () => document.removeEventListener("touchmove", preventPull);
  }, []);

  // Dark mode detection
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const theme = isDark ? darkTheme : lightTheme;

  if (!connected) {
    return (
      <div style={{ ...styles.container, ...theme.container }}>
        <div style={styles.connectingWrapper}>
          <div
            style={{
              ...styles.dot,
              background: "#ef4444",
              animation: "pulse 1.5s infinite",
            }}
          />
          <p style={{ ...styles.connectingText, color: theme.muted }}>
            Connecting...
          </p>
        </div>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div style={{ ...styles.container, ...theme.container }}>
        <p style={{ color: theme.muted }}>Loading slides...</p>
      </div>
    );
  }

  return (
    <div
      style={{ ...styles.container, ...theme.container }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div
            style={{
              ...styles.dot,
              background: connected ? "#22c55e" : "#ef4444",
            }}
          />
          <span style={{ ...styles.liveLabel, color: theme.accent }}>LIVE</span>
        </div>
        <span style={{ color: theme.muted, fontSize: "0.9rem" }}>
          Slide {slideNumber} / {totalSlides}
        </span>
      </div>

      {/* Slide title peek */}
      <div style={{ ...styles.titlePeek, color: theme.text }}>
        {currentSlide.title}
      </div>

      {/* Speaker notes */}
      <div style={{ ...styles.notesContainer, ...theme.notesContainer }}>
        <div style={styles.notesLabel}>
          <span style={{ color: theme.muted, fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            Speaker Notes
          </span>
        </div>
        <p style={{ ...styles.notesText, color: theme.text }}>
          {currentSlide.speakerNotes}
        </p>
      </div>

      {/* Navigation buttons */}
      <div style={styles.navContainer}>
        <button
          onClick={prev}
          disabled={isFirst}
          style={{
            ...styles.navButton,
            ...theme.navButton,
            opacity: isFirst ? 0.3 : 1,
            cursor: isFirst ? "default" : "pointer",
          }}
        >
          <span style={styles.navArrow}>&larr;</span>
          <span style={styles.navLabel}>Prev</span>
        </button>
        <button
          onClick={next}
          disabled={isLast}
          style={{
            ...styles.navButton,
            ...theme.navButton,
            opacity: isLast ? 0.3 : 1,
            cursor: isLast ? "default" : "pointer",
          }}
        >
          <span style={styles.navLabel}>Next</span>
          <span style={styles.navArrow}>&rarr;</span>
        </button>
      </div>

      {/* Swipe hint */}
      <p style={{ ...styles.swipeHint, color: theme.muted }}>
        Swipe left/right to navigate
      </p>
    </div>
  );
}

const lightTheme = {
  container: { background: "#f8fafc" },
  text: "#1e293b",
  muted: "#94a3b8",
  accent: "#22c55e",
  notesContainer: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
  },
  navButton: {
    background: "#6366f1",
    color: "#ffffff",
  },
};

const darkTheme = {
  container: { background: "#0f172a" },
  text: "#e2e8f0",
  muted: "#64748b",
  accent: "#22c55e",
  notesContainer: {
    background: "#1e293b",
    border: "1px solid #334155",
  },
  navButton: {
    background: "#6366f1",
    color: "#ffffff",
  },
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    padding: "1rem",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: "hidden",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  connectingWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
  },
  connectingText: {
    fontSize: "1.1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  liveLabel: {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
  },
  titlePeek: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "0.75rem",
    lineHeight: 1.3,
  },
  notesContainer: {
    flex: 1,
    borderRadius: "12px",
    padding: "1.25rem",
    overflowY: "auto" as const,
    WebkitOverflowScrolling: "touch" as const,
  },
  notesLabel: {
    marginBottom: "0.75rem",
  },
  notesText: {
    fontSize: "1.15rem",
    lineHeight: 1.7,
    margin: 0,
  },
  navContainer: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.75rem",
  },
  navButton: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
    padding: "1rem",
    border: "none",
    borderRadius: "12px",
    fontSize: "1.1rem",
    fontWeight: 600,
    minHeight: "56px",
    transition: "opacity 0.15s, transform 0.1s",
    WebkitTapHighlightColor: "transparent",
  },
  navArrow: {
    fontSize: "1.3rem",
  },
  navLabel: {
    fontSize: "1rem",
  },
  swipeHint: {
    textAlign: "center" as const,
    fontSize: "0.75rem",
    marginTop: "0.5rem",
    marginBottom: 0,
  },
};

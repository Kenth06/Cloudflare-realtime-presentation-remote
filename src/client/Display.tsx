import { useEffect, useState, useCallback } from "react";
import { useSlides } from "./useSlides";

export function Display() {
  const { currentSlide, slideNumber, totalSlides, connected, next, prev } =
    useSlides();
  const [transitioning, setTransitioning] = useState(false);
  const [displaySlide, setDisplaySlide] = useState(currentSlide);

  // Animate slide transitions
  useEffect(() => {
    if (!currentSlide) return;
    setTransitioning(true);
    const timeout = setTimeout(() => {
      setDisplaySlide(currentSlide);
      setTransitioning(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [currentSlide]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
            document.documentElement.requestFullscreen?.();
          }
          break;
      }
    },
    [next, prev]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // QR code URL for remote
  const remoteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/remote`
      : "/remote";

  if (!connected) {
    return (
      <div style={styles.container}>
        <div style={styles.connecting}>
          <div style={styles.spinner} />
          <p style={styles.connectingText}>Waiting for connection...</p>
        </div>
      </div>
    );
  }

  if (!displaySlide) {
    return (
      <div style={styles.container}>
        <p style={styles.connectingText}>Loading slides...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.slideContent,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateX(20px)" : "translateX(0)",
        }}
      >
        <h1 style={styles.title}>{displaySlide.title}</h1>
        <div style={styles.body}>
          {displaySlide.body.split("\n").map((line, i) => (
            <p key={i} style={line === "" ? styles.emptyLine : styles.bodyLine}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Slide counter */}
      <div style={styles.counter}>
        {slideNumber} / {totalSlides}
      </div>

      {/* QR code for remote */}
      <div style={styles.qrContainer}>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(remoteUrl)}&bgcolor=000000&color=ffffff`}
          alt="Scan for remote"
          style={styles.qrCode}
        />
        <span style={styles.qrLabel}>/remote</span>
      </div>

      {/* Keyboard hint */}
      <div style={styles.hint}>
        <kbd style={styles.kbd}>&larr;</kbd> <kbd style={styles.kbd}>&rarr;</kbd>{" "}
        navigate &nbsp; <kbd style={styles.kbd}>F</kbd> fullscreen
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
    color: "#ffffff",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: "hidden",
    position: "relative",
    padding: "2rem",
    boxSizing: "border-box",
  },
  connecting: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  connectingText: {
    fontSize: "1.5rem",
    color: "rgba(255,255,255,0.6)",
  },
  slideContent: {
    maxWidth: "1200px",
    width: "100%",
    textAlign: "center",
    transition: "opacity 0.15s ease, transform 0.15s ease",
  },
  title: {
    fontSize: "clamp(2.5rem, 5vw, 5rem)",
    fontWeight: 700,
    marginBottom: "2rem",
    lineHeight: 1.1,
    background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  body: {
    fontSize: "clamp(1.2rem, 2.5vw, 2rem)",
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.85)",
    textAlign: "left",
    maxWidth: "900px",
    margin: "0 auto",
  },
  bodyLine: {
    margin: "0.3rem 0",
  },
  emptyLine: {
    margin: "0",
    height: "1rem",
  },
  counter: {
    position: "absolute",
    bottom: "2rem",
    right: "2rem",
    fontSize: "1rem",
    color: "rgba(255,255,255,0.3)",
    fontVariantNumeric: "tabular-nums",
  },
  qrContainer: {
    position: "absolute",
    bottom: "1.5rem",
    left: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
    opacity: 0.5,
    transition: "opacity 0.2s",
  },
  qrCode: {
    width: "80px",
    height: "80px",
    borderRadius: "4px",
  },
  qrLabel: {
    fontSize: "0.7rem",
    color: "rgba(255,255,255,0.5)",
  },
  hint: {
    position: "absolute",
    bottom: "2rem",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.2)",
  },
  kbd: {
    display: "inline-block",
    padding: "0.15rem 0.5rem",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontFamily: "inherit",
    color: "rgba(255,255,255,0.3)",
  },
};

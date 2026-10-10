import { useEffect, useRef, useState } from "react";

/** One downloaded movie, shared across recommendations. No cloud requests in the app. */
export default function JourneyVideo({ direction, onReveal, onComplete }: {
  direction: "depart" | "return";
  onReveal: () => void;
  onComplete: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const callbacks = useRef({ onReveal, onComplete });
  callbacks.current = { onReveal, onComplete };
  const finish = useRef<() => void>(() => {});
  const [leaving, setLeaving] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = video.current!;
    let completed = false;
    let dissolve: ReturnType<typeof setTimeout> | undefined;
    const done = () => {
      if (completed) return;
      completed = true;
      element.pause();
      clearTimeout(watchdog);
      // Keep the last decoded frame while the actual stars and mascot emerge.
      callbacks.current.onReveal();
      setLeaving(true);
      dissolve = setTimeout(() => callbacks.current.onComplete(), 700);
    };
    finish.current = done;
    const ended = () => done();
    const failed = () => done();
    element.addEventListener("ended", ended);
    element.addEventListener("error", failed);
    // Broken, stalled or autoplay-blocked media must never block the meal flow.
    const watchdog = setTimeout(failed, 12_000);
    element.play().catch(failed);
    return () => {
      completed = true;
      clearTimeout(watchdog);
      clearTimeout(dissolve);
      element.pause();
      element.removeEventListener("ended", ended);
      element.removeEventListener("error", failed);
    };
  }, [direction]);
  return <div className={`journey-overlay ${ready ? "ready" : ""} ${leaving ? "leaving" : ""}`}>
    <video
      ref={video}
      src={`${import.meta.env.BASE_URL}assets/${direction === "depart" ? "departure" : "return"}-v1.mp4`}
      muted playsInline preload="auto"
      onPlaying={() => setReady(true)}
      aria-label={direction === "depart" ? "前往恒星的转场视频" : "返回星海的转场视频"}
    />
    <button className="soft-button journey-skip" disabled={leaving} onClick={() => finish.current()}>
      {direction === "depart" ? "跳过，查看推荐" : "跳过，返回星海"}
    </button>
  </div>;
}

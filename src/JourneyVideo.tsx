import { useEffect, useRef, useState } from "react";

/** One downloaded movie, shared across recommendations. No cloud requests in the app. */
export default function JourneyVideo({ direction, onComplete }: {
  direction: "depart" | "return";
  onComplete: (played: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const finish = useRef<(played: boolean) => void>(() => {});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = video.current!;
    let completed = false;
    const done = (played: boolean) => {
      if (completed) return;
      completed = true;
      element.pause();
      callback.current(played);
    };
    finish.current = done;
    const ended = () => done(true);
    const failed = () => done(false);
    element.addEventListener("ended", ended);
    element.addEventListener("error", failed);
    // Broken, stalled or autoplay-blocked media must never block the meal flow.
    const watchdog = setTimeout(failed, 12_000);
    element.play().catch(failed);
    return () => {
      completed = true;
      clearTimeout(watchdog);
      element.pause();
      element.removeEventListener("ended", ended);
      element.removeEventListener("error", failed);
    };
  }, [direction]);
  return <div className={`journey-overlay ${ready ? "ready" : ""}`}>
    <video
      ref={video}
      src={`${import.meta.env.BASE_URL}assets/${direction === "depart" ? "departure" : "return"}-v1.mp4`}
      muted playsInline preload="auto"
      onPlaying={() => setReady(true)}
      aria-label={direction === "depart" ? "前往恒星的转场视频" : "返回星海的转场视频"}
    />
    <button className="soft-button journey-skip" onClick={() => finish.current(false)}>
      {direction === "depart" ? "跳过，查看推荐" : "跳过，返回星海"}
    </button>
  </div>;
}

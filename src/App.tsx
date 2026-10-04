import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  ExternalLink,
  History,
  MapPin,
  Orbit,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  X,
  Pencil,
  LocateFixed,
} from "lucide-react";
import {
  canteens,
  canteenById,
  HOURS_SOURCE,
  MAP_SOURCE,
  moods,
  places,
  preferences,
  priceText,
} from "./data";
import { draw, isOpen, localDateTime, recommend } from "./engine";
import { loadStore, parseStore, STORAGE_KEY } from "./storage";
import type { Canteen, Conditions, Meal, Recommendation, Store } from "./types";
import Galaxy from "./Galaxy";
import StarBody from "./StarBody";
import { COPY } from "./copy";

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
const download = (content: string, name: string) => {
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={wide ? "modal wide" : "modal"}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="关闭弹窗"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
function CanteenDetail({ canteen, time }: { canteen: Canteen; time: string }) {
  const place = places.find((p) => p.id === canteen.id)!;
  return (
    <div className="canteen-detail">
      <div className="detail-star">
        <StarBody canteen={canteen} />
        <div>
          <span className="eyebrow">{canteen.code}</span>
          <h3>{canteen.star}</h3>
        </div>
        <span className={`status ${isOpen(canteen, time) ? "open" : ""}`}>
          {isOpen(canteen, time) ? "参考时段内" : "参考时段外"}
        </span>
      </div>
      <p className="metaphor">“{canteen.metaphor}”</p>
      <div className="detail-block">
        <h4>我的食堂印象</h4>
        <p>{canteen.description}</p>
        <div className="tag-row">
          <span>{priceText(canteen.price)}</span>
          {canteen.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      <div className="detail-block">
        <h4>
          <MapPin size={15} /> 校园位置
        </h4>
        <p>{canteen.area}</p>
        <small>
          地图参考点 ({place.x}, {place.y}) · 仅用于估计远近
        </small>
      </div>
      <div className="detail-block">
        <h4>
          <Clock3 size={15} /> 参考供餐时间
        </h4>
        <p>{canteen.hours.map((h) => h.join("—")).join(" / ")}</p>
        <small>
          {canteen.id === "taoli"
            ? "17:00—23:00 对应一层晚餐及夜宵，其他楼层可能更早结束。"
            : "采用本作业默认三餐时段，不代表各楼层、窗口实时营业。"}
        </small>
      </div>
      {canteen.companions.length > 0 && (
        <div className="detail-block">
          <h4>
            <Orbit size={15} /> 伴星系统
          </h4>
          {canteen.companions.map((c) => (
            <p key={c.name} className="companion-note">
              <b style={{ color: c.color }}>{c.name}</b>
              <small>{c.note}</small>
            </p>
          ))}
        </div>
      )}
      <p className="fineprint">
        食堂印象来自你的个人评价；星体设定是创意类比。伴星暂不独立参与推荐。
      </p>
    </div>
  );
}
function MealForm({
  meal,
  recommendation,
  onSave,
  onClose,
  error,
}: {
  meal?: Meal;
  recommendation?: Recommendation;
  onSave: (meal: Meal) => boolean;
  onClose: () => void;
  error?: string;
}) {
  const [canteenId, setCanteenId] = useState(
    meal?.canteenId ?? recommendation?.canteenId ?? canteens[0].id,
  );
  const [eatenAt, setEatenAt] = useState(meal?.eatenAt ?? localDateTime());
  const [rating, setRating] = useState(meal?.rating ?? 4);
  const [note, setNote] = useState(meal?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal title={meal ? COPY.meal.edit : COPY.meal.create} onClose={onClose}>
      <form
        className="meal-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (submitting) return;
          setSubmitting(true);
          if (
            !onSave({
              id: meal?.id ?? crypto.randomUUID(),
              eatenAt,
              canteenId,
              rating,
              note: note.trim(),
              ...((meal?.recommendationId ?? recommendation?.id)
                ? {
                    recommendationId:
                      meal?.recommendationId ?? recommendation?.id,
                  }
                : {}),
            })
          )
            setSubmitting(false);
        }}
      >
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {recommendation && (
          <p className="recommendation-hint">
            本次宇宙推荐了{" "}
            <strong>{canteenById(recommendation.canteenId).name}</strong>
            ，最后吃了哪颗星，由你决定。
          </p>
        )}
        <label>
          实际食堂
          <select
            value={canteenId}
            onChange={(e) => setCanteenId(e.target.value)}
          >
            {canteens.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name} · {c.star}
              </option>
            ))}
          </select>
        </label>
        <label>
          用餐时间
          <input
            type="datetime-local"
            required
            value={eatenAt}
            max={localDateTime()}
            onChange={(e) => setEatenAt(e.target.value)}
          />
        </label>
        <fieldset>
          <legend>这一餐，几分满足？</legend>
          <div className="rating-picker">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                aria-label={`${n} 分`}
                aria-pressed={rating === n}
                onClick={() => setRating(n)}
              >
                <Star
                  size={30}
                  fill={n <= rating ? "currentColor" : "none"}
                  className={n <= rating ? "filled" : ""}
                />
              </button>
            ))}
            <span>
              {
                ["", "不太合口味", "一般般", "还不错", "喜欢", "非常满足"][
                  rating
                ]
              }
            </span>
          </div>
        </fieldset>
        <label>
          留一句话 <span className="optional">选填</span>
          <textarea
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            placeholder={COPY.meal.placeholder}
            rows={3}
          />
        </label>
        <button className="primary" disabled={submitting}>
          <Sparkles size={17} /> {COPY.meal.save}
        </button>
        <p className="fineprint centered">
          只保存在这个浏览器里。你的评价会影响下次相遇。
        </p>
      </form>
    </Modal>
  );
}
export default function App() {
  const [initial] = useState(loadStore);
  const [store, setStore] = useState(initial.data);
  const storeRef = useRef(store);
  const recoveryNeeded = useRef(!!initial.error);
  const [storageError, setStorageError] = useState(initial.error ?? "");
  const [page, setPage] = useState<"home" | "journal">("home");
  const [conditions, setConditions] = useState<Conditions>({
    time: localDateTime().slice(11),
    locationId: store.locationId,
    mood: "normal",
    preferences: store.preferences,
  });
  const [followClock, setFollowClock] = useState(true);
  useEffect(() => {
    if (!followClock) return;
    const tick = () =>
      setConditions((previous) => ({
        ...previous,
        time: localDateTime().slice(11),
      }));
    const interval = setInterval(tick, 15_000);
    return () => clearInterval(interval);
  }, [followClock]);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [paused, setPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [detail, setDetail] = useState<Canteen | null>(null);
  const [panel, setPanel] = useState<"atlas" | "settings" | null>(null);
  const [mealDialog, setMealDialog] = useState<{
    meal?: Meal;
    recommendation?: Recommendation;
  } | null>(null);
  const [toast, setToast] = useState("");
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [showProbability, setShowProbability] = useState(false);
  const [pendingImport, setPendingImport] = useState<Store | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const distribution = recommend(conditions, store.meals);
  const openCount = distribution.length;
  const visited = new Set(store.meals.map((m) => m.canteenId));
  const latestPending = [...store.recommendations]
    .reverse()
    .find(
      (r) =>
        r.accepted && !store.meals.some((m) => m.recommendationId === r.id),
    );
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(null), 2200);
    return () => clearTimeout(t);
  }, [celebrate]);
  const notify = (message: string) => setToast(message);
  const commit = (next: Store) => {
    if (recoveryNeeded.current && !pendingImport) {
      setStorageError(
        "原有数据读取失败，为避免覆盖，请在数据管理中先导出原始备份，再导入有效备份。",
      );
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      storeRef.current = next;
      setStore(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "保存失败：浏览器存储不可用或空间不足。原有记录未改动，请先导出备份。",
      );
      return false;
    }
  };
  const launch = () => {
    if (busyRef.current) return;
    const canteenId = draw(distribution);
    if (!canteenId) return;
    const recommendation: Recommendation = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      conditions: { ...conditions, preferences: [...conditions.preferences] },
      distribution,
      canteenId,
      accepted: false,
    };
    if (
      !commit({
        ...storeRef.current,
        locationId: conditions.locationId,
        preferences: conditions.preferences,
        recommendations: [...storeRef.current.recommendations, recommendation],
      })
    )
      return;
    busyRef.current = true;
    setBusy(true);
    setResult(recommendation);
    setShowProbability(false);
    timer.current = setTimeout(
      () => {
        busyRef.current = false;
        setBusy(false);
      },
      paused ? 150 : 2100,
    );
  };
  const accept = () => {
    if (!result) return;
    const next = { ...result, accepted: true };
    if (
      commit({
        ...storeRef.current,
        recommendations: storeRef.current.recommendations.map((r) =>
          r.id === result.id ? next : r,
        ),
      })
    ) {
      setResult(next);
      notify("目的地已记下，吃完再来记录这一餐。");
    }
  };
  const saveMeal = (meal: Meal) => {
    const current = storeRef.current;
    if (
      meal.recommendationId &&
      current.meals.some(
        (m) => m.recommendationId === meal.recommendationId && m.id !== meal.id,
      )
    ) {
      notify("这次推荐已经记录过用餐。");
      return false;
    }
    const next = {
      ...current,
      meals: current.meals.some((m) => m.id === meal.id)
        ? current.meals.map((m) => (m.id === meal.id ? meal : m))
        : [...current.meals, meal],
    };
    if (!commit(next)) return false;
    setMealDialog(null);
    setCelebrate(meal.canteenId);
    notify(
      `吞下一颗${canteenById(meal.canteenId).star}，满足感 +${meal.rating}！`,
    );
    return true;
  };
  const activeStar = celebrate
    ? canteenById(celebrate)
    : result
      ? canteenById(result.canteenId)
      : null;
  const filteredMeals = [...store.meals]
    .filter((m) => filter === "all" || m.canteenId === filter)
    .sort((a, b) => b.eatenAt.localeCompare(a.eatenAt));
  const resultRecorded =
    !!result && store.meals.some((m) => m.recommendationId === result.id);
  return (
    <div className={`app ${paused ? "motion-paused" : ""}`}>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => setPage("home")}
          aria-label="返回星际觅食"
        >
          <span className="brand-icon">
            <Orbit size={27} />
          </span>
          <span>
            {COPY.brand.name}
            <span className="brand-dot">?</span>
            <small>{COPY.brand.english}</small>
          </span>
        </button>
        <nav aria-label="主导航">
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => setPage("home")}
          >
            <Compass size={17} /> {COPY.nav.home}
          </button>
          <button
            className={page === "journal" ? "active" : ""}
            onClick={() => setPage("journal")}
          >
            <BookOpen size={17} /> {COPY.nav.journal}{" "}
            {store.meals.length > 0 && (
              <span className="count">{store.meals.length}</span>
            )}
          </button>
        </nav>
        <div className="header-right">
          <span className="campus-label">
            <span className="live-dot" /> {COPY.brand.campus}
          </span>
          <button
            className="icon-button"
            aria-label="数据与设置"
            onClick={() => setPanel("settings")}
          >
            <Settings2 size={19} />
          </button>
        </div>
      </header>
      <main>
        {storageError && (
          <div className="error-banner" role="alert">
            {storageError}
            <button onClick={() => setPanel("settings")}>数据管理</button>
          </div>
        )}
        {page === "home" ? (
          <>
            <section className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="little-line" /> {COPY.home.eyebrow}
                </div>
                <h1>
                  {COPY.home.title}
                  <span>{COPY.home.titleAccent}</span>
                </h1>
                <p>{COPY.home.subtitle}</p>
              </div>
              <button
                className="text-button atlas-link"
                onClick={() => setPanel("atlas")}
              >
                <Orbit size={18} /> {COPY.nav.atlas} <ArrowRight size={16} />
              </button>
            </section>
            <div className="home-grid">
              <section
                className={`space-card local-space ${openCount ? "inside-arm" : "between-arms"} ${busy ? "traveling" : ""} ${celebrate ? "celebrating" : ""}`}
                data-region={openCount ? "arm" : "interarm"}
                aria-label="食堂星系"
              >
                <Galaxy
                  paused={paused}
                  inArm={openCount > 0}
                  time={conditions.time}
                  activeCanteenId={activeStar?.id ?? null}
                  celebrating={!!celebrate}
                  onInspect={setDetail}
                />
                <div className="space-vignette" />
                <div className="space-topline">
                  <div>
                    <span className="live-dot" /> {COPY.scene.name}
                    <small>{COPY.scene.coordinates}</small>
                  </div>
                  <span className="region-badge" aria-live="polite">
                    <i />
                    {openCount ? COPY.scene.inArm : COPY.scene.betweenArms}
                  </span>
                  <button
                    className="icon-button"
                    onClick={() => setPaused(!paused)}
                    aria-label={paused ? "播放星系动画" : "暂停星系动画"}
                  >
                    {paused ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                </div>
                <div className={`mascot ${celebrate ? "happy" : ""}`}>
                  {(celebrate || busy || result) && (
                    <span className="mascot-bubble">
                      {celebrate
                        ? COPY.scene.satisfied
                        : busy
                          ? COPY.scene.approaching
                          : result
                            ? COPY.scene.arrived
                            : COPY.scene.thinking}
                    </span>
                  )}
                  <img
                    src={asset("little-black-hole.png")}
                    alt={COPY.scene.mascotAlt}
                  />
                  <span className="mascot-label">
                    <span /> {COPY.scene.mascotLabel}
                  </span>
                </div>
                {!result && (
                  <div className="space-caption">
                    <span>✧</span>
                    <p>
                      {openCount
                        ? COPY.scene.armCaption
                        : COPY.scene.gapCaption}
                      <small>{COPY.scene.help}</small>
                    </p>
                  </div>
                )}
                {result && !busy && (
                  <div className="result-card" aria-live="polite">
                    <div className="result-heading">
                      <span className="eyebrow">
                        {resultRecorded
                          ? COPY.result.recorded
                          : result.accepted
                            ? COPY.result.accepted
                            : COPY.result.found}
                      </span>
                      <button
                        className="icon-button"
                        aria-label="收起推荐结果"
                        onClick={() => setResult(null)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="result-main">
                      <div>
                        <h2>
                          {canteenById(result.canteenId).name}
                          <small>{canteenById(result.canteenId).star}</small>
                        </h2>
                        <p>
                          {result.distribution
                            .find((p) => p.canteenId === result.canteenId)
                            ?.reasons.slice(0, 2)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="result-actions">
                        {!resultRecorded && !result.accepted && (
                          <button className="soft-button" onClick={accept}>
                            <Check size={15} /> {COPY.result.accept}
                          </button>
                        )}
                        <button
                          className="primary compact"
                          onClick={() =>
                            resultRecorded
                              ? setPage("journal")
                              : setMealDialog({ recommendation: result })
                          }
                        >
                          {resultRecorded
                            ? COPY.result.journal
                            : COPY.result.record}
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="probability-toggle"
                      aria-expanded={showProbability}
                      onClick={() => setShowProbability(!showProbability)}
                    >
                      {COPY.result.why}
                      <span>
                        {(
                          result.distribution.find(
                            (p) => p.canteenId === result.canteenId,
                          )!.probability * 100
                        ).toFixed(1)}
                        % 的缘分
                      </span>
                      <ChevronDown size={13} />
                    </button>
                    {showProbability && (
                      <div className="probability-list">
                        {[...result.distribution]
                          .sort((a, b) => b.probability - a.probability)
                          .map((p) => (
                            <div key={p.canteenId}>
                              <span>{canteenById(p.canteenId).name}</span>
                              <i>
                                <b
                                  style={{
                                    width: `${p.probability * 100}%`,
                                    background: canteenById(p.canteenId).color,
                                  }}
                                />
                              </i>
                              <small>{(p.probability * 100).toFixed(1)}%</small>
                            </div>
                          ))}
                        <p>
                          抽取时 {result.conditions.time} 的概率快照 · 80%
                          偏好评分 + 20% 随机探索
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-bottomline">
                  <span>
                    <i className="legend-dot" /> {openCount}{" "}
                    颗恒星在参考供餐时段内
                  </span>
                  <span>
                    {COPY.scene.viewLabel} <CircleHelp size={12} />
                  </span>
                </div>
              </section>
              <aside className="control-card">
                <div className="control-title">
                  <span className="control-icon">
                    <LocateFixed size={21} />
                  </span>
                  <div>
                    <h2>{COPY.controls.title}</h2>
                    <p>{COPY.controls.subtitle}</p>
                  </div>
                </div>
                <div className="field-pair">
                  <label>
                    <Clock3 size={14} /> {COPY.controls.time}
                    <input
                      aria-label={COPY.controls.time}
                      type="time"
                      required
                      value={conditions.time}
                      onChange={(e) => {
                        setFollowClock(false);
                        setConditions({ ...conditions, time: e.target.value });
                      }}
                    />
                  </label>
                  <button
                    className="now-button"
                    aria-pressed={followClock}
                    title="跟随当前时间；手动改时间可预览其他饭点"
                    onClick={() => {
                      setFollowClock(true);
                      setConditions({
                        ...conditions,
                        time: localDateTime().slice(11),
                      });
                    }}
                  >
                    {COPY.controls.now}
                  </button>
                </div>
                <label className="field-label">
                  <MapPin size={14} /> {COPY.controls.location}
                  <select
                    aria-label={COPY.controls.location}
                    value={conditions.locationId}
                    onChange={(e) =>
                      setConditions({
                        ...conditions,
                        locationId: e.target.value,
                      })
                    }
                  >
                    {["生活区", "教学区", "图书馆与院系", "食堂"].map(
                      (group) => (
                        <optgroup key={group} label={group}>
                          {places
                            .filter((p) => p.group === group)
                            .map((p) => (
                              <option value={p.id} key={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </optgroup>
                      ),
                    )}
                  </select>
                </label>
                <fieldset className="mood-field">
                  <legend>{COPY.controls.mood}</legend>
                  <div className="mood-grid">
                    {moods.map((m) => (
                      <button
                        key={m.id}
                        className={conditions.mood === m.id ? "selected" : ""}
                        aria-pressed={conditions.mood === m.id}
                        onClick={() =>
                          setConditions({ ...conditions, mood: m.id })
                        }
                      >
                        <span>{m.emoji}</span>
                        {m.name}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="preference-field">
                  <legend>
                    {COPY.controls.preferences}{" "}
                    <small>{COPY.controls.multiple}</small>
                  </legend>
                  <div className="preference-chips">
                    {preferences.map((p) => (
                      <button
                        key={p}
                        aria-pressed={conditions.preferences.includes(p)}
                        className={
                          conditions.preferences.includes(p) ? "selected" : ""
                        }
                        onClick={() =>
                          setConditions({
                            ...conditions,
                            preferences: conditions.preferences.includes(p)
                              ? conditions.preferences.filter((x) => x !== p)
                              : [...conditions.preferences, p],
                          })
                        }
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="launch-area">
                  <button
                    className="primary launch"
                    onClick={launch}
                    disabled={busy || !openCount}
                  >
                    {busy ? (
                      <>
                        <Orbit className="spin" size={19} />{" "}
                        {COPY.controls.drawing}
                      </>
                    ) : result ? (
                      <>
                        <RefreshCw size={17} /> {COPY.controls.redraw}
                      </>
                    ) : (
                      <>
                        <Sparkles size={19} /> {COPY.controls.draw}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <p>{!openCount ? COPY.controls.empty : COPY.controls.hint}</p>
                </div>
              </aside>
            </div>
            <section className="trip-summary">
              <div>
                <span className="summary-icon">
                  <Orbit size={21} />
                </span>
                <p>
                  <strong>
                    {visited.size}
                    <small> / 9</small>
                  </strong>
                  <span>已经认识的恒星</span>
                </p>
              </div>
              <div>
                <span className="summary-icon">
                  <History size={20} />
                </span>
                <p>
                  <strong>
                    {store.meals.length}
                    <small> 餐</small>
                  </strong>
                  <span>好好吃饭的证据</span>
                </p>
              </div>
              <div className="last-note">
                <span className="summary-icon">
                  <Star size={20} />
                </span>
                <p>
                  <strong>
                    {latestPending
                      ? `待记录 · ${canteenById(latestPending.canteenId).name}`
                      : "每一次相遇，都值得记下来"}
                  </strong>
                  <span>
                    {latestPending
                      ? "吃完了吗？给今天的旅程一个结尾。"
                      : "让每一顿饭，慢慢拼成你的专属星河。"}
                  </span>
                </p>
                <button
                  className="icon-button"
                  aria-label={
                    latestPending ? "补记待完成的用餐" : "前往吞星日志"
                  }
                  onClick={() =>
                    latestPending
                      ? setMealDialog({ recommendation: latestPending })
                      : setPage("journal")
                  }
                >
                  <ArrowRight size={19} />
                </button>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="little-line" /> {COPY.journal.eyebrow}
                </div>
                <h1>
                  {COPY.journal.title}
                  <span>{COPY.journal.titleAccent}</span>
                </h1>
                <p>{COPY.journal.subtitle}</p>
              </div>
              <button
                className="primary compact"
                onClick={() => setMealDialog({})}
              >
                <Plus size={17} /> {COPY.journal.add}
              </button>
            </section>
            <section className="journal-stats">
              <div>
                <small>已记录用餐</small>
                <strong>
                  {store.meals.length}
                  <span> 餐</span>
                </strong>
              </div>
              <div>
                <small>探索过的恒星</small>
                <strong>
                  {visited.size}
                  <span> / 9 类</span>
                </strong>
              </div>
              <div>
                <small>平均满足感</small>
                <strong>
                  {store.meals.length
                    ? (
                        store.meals.reduce((s, m) => s + m.rating, 0) /
                        store.meals.length
                      ).toFixed(1)
                    : "—"}
                  <span> / 5</span>
                </strong>
              </div>
              <div className="journal-quote">
                “吃饱了，才有力气
                <br />
                继续探索宇宙。”<span>—— 小吞</span>
              </div>
            </section>
            {latestPending && (
              <div className="pending-banner">
                <Clock3 size={18} />
                <p>
                  还有一颗{" "}
                  <strong>{canteenById(latestPending.canteenId).name}</strong>{" "}
                  等你写下结局
                </p>
                <button
                  className="text-button"
                  onClick={() =>
                    setMealDialog({ recommendation: latestPending })
                  }
                >
                  补记这一餐 <ArrowRight size={15} />
                </button>
              </div>
            )}
            <div className="journal-toolbar">
              <h2>
                我的吞星足迹 <span>{filteredMeals.length}</span>
              </h2>
              <select
                aria-label="按食堂筛选日志"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">全部恒星</option>
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {filteredMeals.length ? (
              <div className="meal-list">
                {filteredMeals.map((m) => {
                  const c = canteenById(m.canteenId);
                  const rec = store.recommendations.find(
                    (r) => r.id === m.recommendationId,
                  );
                  return (
                    <article className="meal-card" key={m.id}>
                      <div className="meal-star">
                        <StarBody canteen={c} />
                      </div>
                      <div className="meal-content">
                        <div className="meal-heading">
                          <h3>
                            {c.name}
                            <small>{c.star}</small>
                          </h3>
                          <time>
                            {new Date(m.eatenAt).toLocaleString("zh-CN", {
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </time>
                        </div>
                        <div className="meal-rating">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < m.rating ? "currentColor" : "none"}
                              style={{ opacity: i < m.rating ? 1 : 0.2 }}
                            />
                          ))}
                          <span>{m.rating} / 5 满足感</span>
                        </div>
                        <p className={m.note ? "" : "muted"}>
                          {m.note || "没有留下文字，但这一餐已经在星河里。"}
                        </p>
                        <div className="meal-origin">
                          {rec ? (
                            <>
                              宇宙推荐 {canteenById(rec.canteenId).name}{" "}
                              <ArrowRight size={12} /> 实际选择 {c.name}
                            </>
                          ) : (
                            "自由探索 · 自己选择的目的地"
                          )}
                        </div>
                      </div>
                      <div className="meal-tools">
                        <button
                          className="icon-button"
                          aria-label={`修改${c.name}用餐记录`}
                          onClick={() =>
                            setMealDialog({ meal: m, recommendation: rec })
                          }
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`删除${c.name}用餐记录`}
                          onClick={() => {
                            if (
                              window.confirm(
                                "删除这次用餐记录？此操作会影响下次推荐。",
                              )
                            )
                              if (
                                commit({
                                  ...storeRef.current,
                                  meals: storeRef.current.meals.filter(
                                    (x) => x.id !== m.id,
                                  ),
                                })
                              )
                                notify("这次记录已删除。");
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-journal">
                <img
                  src={asset("little-black-hole.png")}
                  alt="等待第一顿饭的小吞"
                />
                <span className="eyebrow">YOUR STORY STARTS WITH A BITE</span>
                <h2>
                  {store.meals.length
                    ? "这颗星还没有留下足迹"
                    : "你的星河，等第一顿饭来点亮"}
                </h2>
                <p>认真吃过的一餐，就值得在这里留个位置。</p>
                <button
                  className="soft-button"
                  onClick={() => setMealDialog({})}
                >
                  <Plus size={16} /> 记录第一颗星
                </button>
              </div>
            )}
            {store.recommendations.length > 0 && (
              <details className="recommendation-history">
                <summary>
                  漂泊记录 <span>{store.recommendations.length} 次相遇</span>
                </summary>
                <p>
                  保留每次抽取的结果；重抽不会变成用餐记录。展示最近 20
                  次，完整历史可导出备份。
                </p>
                {[...store.recommendations]
                  .reverse()
                  .slice(0, 20)
                  .map((r) => {
                    const recorded = store.meals.find(
                      (m) => m.recommendationId === r.id,
                    );
                    return (
                      <div className="history-row" key={r.id}>
                        <span
                          className="history-dot"
                          style={{ background: canteenById(r.canteenId).color }}
                        />
                        <div>
                          <b>{canteenById(r.canteenId).name}</b>
                          <small>
                            {new Date(r.createdAt).toLocaleString("zh-CN", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}{" "}
                            · 计划 {r.conditions.time}
                          </small>
                        </div>
                        <span className="history-status">
                          {recorded
                            ? `实际：${canteenById(recorded.canteenId).name}`
                            : r.accepted
                              ? "已选定，待记录"
                              : "尚未记录用餐"}
                        </span>
                        {!recorded && (
                          <button
                            className="text-button"
                            onClick={() => setMealDialog({ recommendation: r })}
                          >
                            补记 <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </details>
            )}
          </>
        )}
        <footer className="site-footer">
          <span>
            <Orbit size={13} /> {COPY.footer.signature}
          </span>
          <span>
            记录留在本机 <i /> 美味留在心里
          </span>
          <button onClick={() => setPanel("settings")}>
            {COPY.footer.about} <ArrowRight size={12} />
          </button>
        </footer>
      </main>
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <CanteenDetail canteen={detail} time={conditions.time} />
        </Modal>
      )}
      {mealDialog && (
        <MealForm
          {...mealDialog}
          error={storageError}
          onClose={() => setMealDialog(null)}
          onSave={saveMeal}
        />
      )}
      {panel === "atlas" && (
        <Modal title="食堂星体图鉴" wide onClose={() => setPanel(null)}>
          <p className="modal-intro">
            九种食堂，九种相遇。这里的口味与价格，来自你的个人印象。
          </p>
          <div className="atlas-grid">
            {canteens.map((c) => (
              <button
                key={c.id}
                className="atlas-card"
                onClick={() => {
                  setPanel(null);
                  setDetail(c);
                }}
              >
                <StarBody canteen={c} />
                <h3>{c.name}</h3>
                <span style={{ color: c.color }}>{c.star}</span>
                <p>{c.description}</p>
                <div>
                  {priceText(c.price)}
                  <ArrowRight size={15} />
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {panel === "settings" && (
        <Modal
          title="关于这片宇宙"
          onClose={() => {
            setPanel(null);
            setPendingImport(null);
          }}
        >
          <div className="settings-content">
            {toast && (
              <p className="inline-status" role="status">
                {toast}
              </p>
            )}
            <span className="eyebrow">STELLAR BITES · FIRST ORBIT</span>
            <p>
              这是一个属于你的清华食堂小宇宙。位置决定远近，心情改变引力，随机留下一点惊喜。
            </p>
            <div className="detail-block">
              <h4>本机数据</h4>
              <p>
                共 {store.meals.length} 条用餐、{store.recommendations.length}{" "}
                次推荐。刷新后仍在；更换浏览器或清除网站数据后不会自动同步。
              </p>
              <div className="button-row">
                <button
                  className="soft-button"
                  onClick={() => {
                    try {
                      download(
                        localStorage.getItem(STORAGE_KEY) ??
                          JSON.stringify(store, null, 2),
                        `stellar-bites-${localDateTime().slice(0, 10)}.json`,
                      );
                      notify("备份已导出。");
                    } catch {
                      download(
                        JSON.stringify(store, null, 2),
                        "stellar-bites-memory-backup.json",
                      );
                    }
                  }}
                >
                  <ArrowDownToLine size={16} /> 导出备份
                </button>
                <button
                  className="soft-button"
                  onClick={() => fileRef.current?.click()}
                >
                  <ArrowUpFromLine size={16} /> 导入备份
                </button>
                <input
                  hidden
                  type="file"
                  accept="application/json,.json"
                  ref={fileRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      if (file.size > 5_000_000)
                        throw new Error("备份不能超过 5MB。");
                      setPendingImport(parseStore(await file.text()));
                    } catch (error) {
                      notify(
                        error instanceof Error ? error.message : "无法读取备份",
                      );
                    }
                  }}
                />
              </div>
              {pendingImport && (
                <div className="import-confirm">
                  <p>
                    导入 {pendingImport.meals.length} 条用餐、
                    {pendingImport.recommendations.length}{" "}
                    次推荐，将替换当前记录。
                  </p>
                  <div className="button-row">
                    <button
                      className="primary compact"
                      onClick={() => {
                        if (commit(pendingImport)) {
                          recoveryNeeded.current = false;
                          setConditions({
                            ...conditions,
                            locationId: pendingImport.locationId,
                            preferences: pendingImport.preferences,
                          });
                          setResult(null);
                          setPendingImport(null);
                          notify("备份已恢复。");
                        }
                      }}
                    >
                      确认替换
                    </button>
                    <button
                      className="soft-button"
                      onClick={() => setPendingImport(null)}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="detail-block">
              <h4>数据来源与边界</h4>
              <p>
                早餐 06:30—09:00，午餐 11:00—13:00，晚餐
                17:00—19:00；桃李晚餐与一层夜宵延续至 23:00。具体窗口可能不同。
              </p>
              <p>
                坐标来自 2025 年 12
                月校园地图的人工近似标注，仅比较相对远近，不是步行导航。物理楼使用附中南侧的新楼位置。
              </p>
              <a href={MAP_SOURCE} target="_blank" rel="noreferrer">
                清华官方校园地图 <ExternalLink size={13} />
              </a>
              <a href={HOURS_SOURCE} target="_blank" rel="noreferrer">
                官方校园生活手册（营业时间参考）
                <ExternalLink size={13} />
              </a>
              <small>资料核对：2026-10-04 · 主观评价由你提供</small>
            </div>
            <div className="detail-block">
              <h4>小吞的第一张宇宙合影</h4>
              <img
                className="keyframe-preview"
                src={asset("galaxy-keyframe.png")}
                alt="小吞漂浮在棒旋星系中的视频关键帧"
              />
              <small>
                这是第一版的星系全景参考图。当前首页按局部俯视漂泊设计，后续转场需重新准备一致视角的首尾帧。
              </small>
            </div>
            <div className="detail-block">
              <h4>动画与视频</h4>
              <p>
                {COPY.scene.videoNote}
                支持暂停动画；系统减少动态效果偏好会默认暂停。
              </p>
              <button
                className="soft-button"
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}{" "}
                {paused ? "开启动画" : "暂停动画"}
              </button>
            </div>
            <p className="fineprint">
              恒星种类混合了光谱型、演化阶段和系统结构，是为食堂设计的视觉类比，不是互斥的天文学分类。
            </p>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

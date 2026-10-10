import type { CSSProperties } from "react";
import type { Canteen } from "./types";

export default function StarBody({
  canteen,
  small = false,
}: {
  canteen: Canteen;
  small?: boolean;
}) {
  return (
    <span
      className={`star-body ${canteen.kind} ${small ? "small" : ""}`}
      style={
        {
          "--star-color": canteen.color,
          "--star-size": `${small ? 28 : canteen.size}px`,
        } as CSSProperties
      }
    >
      <span className="star-corona" aria-hidden="true" />
      <span className="star-surface" />
      {canteen.companions.map((c, i) => (
        <i
          key={c.name}
          className={`companion companion-${i}`}
          style={{ color: c.color, background: `radial-gradient(circle, #fff9e9 10%, ${c.color} 65%, transparent 100%)` }}
        />
      ))}
    </span>
  );
}

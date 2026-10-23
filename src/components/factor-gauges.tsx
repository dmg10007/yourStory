"use client";

import styles from "./factor-gauges.module.css";

export interface FactorGaugeItem {
  id: string;
  label: string;
  value: number;
}

export function FactorGauges({ factors }: { factors: FactorGaugeItem[] }) {
  return (
    <div className={styles.container}>
      {factors.map((factor) => {
        const val = factor.value;
        const valClass = val > 0 ? styles.positive : val < 0 ? styles.negative : styles.neutral;
        const sign = val > 0 ? "+" : "";

        // Calculate fill percentage relative to a baseline scale (max +/- 3)
        const magnitude = Math.min(Math.abs(val), 3);
        const percent = (magnitude / 3) * 50; // Max 50% from center

        const isPos = val > 0;
        const fillStyle = isPos
          ? { left: "50%", width: `${percent}%` }
          : { left: `${50 - percent}%`, width: `${percent}%` };

        return (
          <div key={factor.id} className={styles.gaugeCard}>
            <div className={styles.header}>
              <span className={styles.label}>{factor.label}</span>
              <span className={`${styles.delta} ${valClass}`}>
                {sign}{val}
              </span>
            </div>
            <div className={styles.barTrack}>
              <div className={styles.barCenterMarker} />
              {val !== 0 && (
                <div
                  className={`${styles.barFill} ${isPos ? styles.barPositive : styles.barNegative}`}
                  style={fillStyle}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

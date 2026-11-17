import React, { useEffect, useRef, useState, useCallback } from "react";

export function ElectricCurrentDemo() {
  const [sliderVal, setSliderVal] = useState(49);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Simulation references
  const elsRef = useRef<
    Array<{
      el: SVGCircleElement | null;
      hx: number;
      hy: number;
      x: number;
      y: number;
      free: boolean;
      ph: number;
      v: number;
    }>
  >([]);

  const phsRef = useRef<
    Array<{
      g: SVGGElement | null;
      x: number;
      y: number;
    }>
  >([]);

  // Physics formulas
  const R = useCallback((l: number) => 1e4 * Math.pow(l / 10, -0.7), []);
  const I = useCallback((l: number) => 1e6 / (R(l) + 1000), [R]);

  const lo = Math.log(I(1));
  const hi = Math.log(I(1000));

  const p = sliderVal / 100;
  const lux = Math.pow(10, 3 * p);
  const resistance = R(lux);
  const current = I(lux);
  const b = (Math.log(current) - lo) / (hi - lo);
  const brightnessPct = Math.round(5 + 95 * b);
  const numFreeElectrons = Math.round(2 + 14 * p);
  const numPhotons = Math.round(1 + 9 * p);

  const needleAngle = (-60 + 120 * Math.min(1, current / 1000)).toFixed(1);
  const lv = Math.round(38 + 212 * (brightnessPct / 100));
  const phoneBg = `rgb(${lv}, ${lv}, ${Math.round(lv * 0.98)})`;
  const phoneFg = lv < 128 ? "#F1EFE8" : "#2C2C2A";

  // Build atoms, electrons, photons on mount
  useEffect(() => {
    const order = [3, 12, 7, 16, 0, 9, 14, 5, 11, 1, 17, 6, 13, 2, 10, 8, 15, 4];
    const atoms: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 18; i++) {
      const x = 90 + 30 * (i % 9);
      const y = 132 + 26 * Math.floor(i / 9);
      atoms.push({ x, y });
    }

    const els = order.map((ai, r) => {
      const a = atoms[ai];
      return {
        el: null as SVGCircleElement | null,
        hx: a.x,
        hy: a.y,
        x: a.x,
        y: a.y,
        free: false,
        ph: r * 1.7,
        v: 55 + (r % 5) * 6,
      };
    });
    elsRef.current = els;

    const pOrder = [4, 9, 1, 6, 3, 8, 0, 5, 2, 7];
    const phs = [];
    for (let r = 0; r < 10; r++) {
      phs.push({
        g: null as SVGGElement | null,
        x: 82 + pOrder[r] * 28,
        y: 18 + ((r * 13) % 62),
      });
    }
    phsRef.current = phs;
  }, []);

  // Update free status based on slider
  useEffect(() => {
    elsRef.current.forEach((e, k) => {
      e.free = k < numFreeElectrons;
      if (e.el) {
        e.el.setAttribute("r", e.free ? "4.5" : "3");
        e.el.setAttribute("fill", e.free ? "#D85A30" : "#888780");
      }
    });

    phsRef.current.forEach((q, k) => {
      if (q.g) {
        q.g.setAttribute("display", k < numPhotons ? "" : "none");
      }
    });
  }, [numFreeElectrons, numPhotons]);

  // Animation loop
  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function frame(dt: number, t: number) {
      elsRef.current.forEach((e) => {
        if (e.free) {
          e.x += e.v * dt;
          if (e.x > 346) e.x = 74;
          e.y += (Math.random() - 0.5) * 30 * dt;
          e.y = Math.max(118, Math.min(172, e.y));
        } else {
          const k = dt ? Math.min(1, 8 * dt) : 1;
          e.x += (e.hx - e.x) * k;
          e.y += (e.hy - e.y) * k;
        }
        const jx = e.free ? 0 : Math.sin(t / 260 + e.ph) * 1.2;
        const jy = e.free ? 0 : Math.cos(t / 310 + e.ph) * 1.2;
        if (e.el) {
          e.el.setAttribute("cx", (e.x + jx).toFixed(1));
          e.el.setAttribute("cy", (e.y + jy).toFixed(1));
        }
      });

      phsRef.current.forEach((p) => {
        p.y += 48 * dt;
        if (p.y > 80) p.y = 18;
        if (p.g) {
          p.g.setAttribute("transform", `translate(${p.x} ${p.y.toFixed(1)})`);
        }
      });
    }

    if (reduceMotion) {
      frame(0, 0);
      return;
    }

    let running = true;
    lastTimeRef.current = performance.now();

    function loop(t: number) {
      if (!running) return;
      const dt = Math.min(0.05, (t - lastTimeRef.current) / 1000);
      lastTimeRef.current = t;
      frame(dt, t);
      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const setPreset = (targetLux: number) => {
    const val = Math.round((100 * Math.log10(targetLux)) / 3);
    setSliderVal(Math.max(0, Math.min(100, val)));
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-8 shadow-sm">
      <div className="mx-auto max-w-[680px]">
        {/* SVG Diagram */}
        <div className="overflow-hidden rounded-xl bg-background/50 border border-border/40 p-2 sm:p-4">
          <svg
            ref={svgRef}
            viewBox="0 0 680 380"
            role="img"
            className="w-full h-auto block select-none"
          >
            <title>Photoresistor circuit driving phone brightness</title>
            <desc>
              Photons free electrons in a semiconductor strip, lowering its resistance. A microammeter reads the current, an ADC converts it, and the phone sets its screen brightness.
            </desc>
            <defs>
              <marker
                id="circuit-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M2 1L8 5L2 9"
                  fill="none"
                  stroke="#5F5E5A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
            </defs>

            {/* Title / Incoming light label */}
            <text
              x="210"
              y="12"
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[12px] font-medium fill-[#5F5E5A]"
            >
              Incoming light
            </text>

            {/* Photons */}
            <g id="phot">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => {
                const pOrder = [4, 9, 1, 6, 3, 8, 0, 5, 2, 7];
                const x = 82 + pOrder[idx] * 28;
                const y = 18 + ((idx * 13) % 62);
                return (
                  <g
                    key={`phot-${idx}`}
                    ref={(node) => {
                      if (phsRef.current[idx]) phsRef.current[idx].g = node;
                    }}
                    transform={`translate(${x} ${y})`}
                  >
                    <path
                      d="M0 0q4 3 0 6t0 6t0 6t0 6"
                      fill="none"
                      stroke="#EF9F27"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <polygon points="-3.5,22 3.5,22 0,29" fill="#EF9F27" />
                  </g>
                );
              })}
            </g>

            {/* Semiconductor body */}
            <rect
              x="66"
              y="110"
              width="288"
              height="70"
              strokeWidth="0.5"
              fill="#E1F5EE"
              stroke="#0F6E56"
            />

            {/* Atoms */}
            <g id="atoms">
              {Array.from({ length: 18 }).map((_, i) => {
                const x = 90 + 30 * (i % 9);
                const y = 132 + 26 * Math.floor(i / 9);
                return (
                  <circle
                    key={`atom-${i}`}
                    cx={x}
                    cy={y}
                    r={10}
                    fill="none"
                    stroke="#5F5E5A"
                    strokeWidth="0.5"
                    opacity={0.6}
                  />
                );
              })}
            </g>

            {/* Electrons */}
            <g id="elec">
              {Array.from({ length: 18 }).map((_, i) => (
                <circle
                  key={`elec-${i}`}
                  ref={(node) => {
                    if (elsRef.current[i]) elsRef.current[i].el = node;
                  }}
                  cx="0"
                  cy="0"
                  r={3}
                  fill="#888780"
                />
              ))}
            </g>

            {/* Electrodes (-) and (+) */}
            <g>
              <rect
                x="40"
                y="110"
                width="26"
                height="70"
                rx="4"
                strokeWidth="0.5"
                fill="#F1EFE8"
                stroke="#5F5E5A"
              />
              <text
                x="53"
                y="145"
                textAnchor="middle"
                dominantBaseline="central"
                className="font-bold text-[14px] fill-[#444441]"
              >
                −
              </text>
            </g>
            <g>
              <rect
                x="354"
                y="110"
                width="26"
                height="70"
                rx="4"
                strokeWidth="0.5"
                fill="#F1EFE8"
                stroke="#5F5E5A"
              />
              <text
                x="367"
                y="145"
                textAnchor="middle"
                dominantBaseline="central"
                className="font-bold text-[14px] fill-[#444441]"
              >
                +
              </text>
            </g>

            <text
              x="210"
              y="202"
              textAnchor="middle"
              className="text-[14px] font-semibold fill-foreground"
            >
              Photoresistor
            </text>
            <text
              x="210"
              y="222"
              textAnchor="middle"
              className="text-[12px] fill-[#5F5E5A]"
            >
              Free electrons drift toward +
            </text>

            {/* Circuit wiring */}
            <g
              fill="none"
              stroke="#5F5E5A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M40 145H24V330H196" />
              <path d="M208 330H270" />
              <path d="M314 330H410V277" />
              <path d="M410 213V145H380" />
              <line x1="196" y1="322" x2="196" y2="338" strokeWidth="3" />
              <line x1="208" y1="316" x2="208" y2="344" strokeWidth="3" />
            </g>
            <text x="202" y="364" textAnchor="middle" className="text-[12px] fill-[#5F5E5A]">
              1.0 V
            </text>

            <rect
              x="270"
              y="323"
              width="44"
              height="14"
              rx="2"
              strokeWidth="0.5"
              fill="#F1EFE8"
              stroke="#B4B2A9"
            />
            <text x="292" y="364" textAnchor="middle" className="text-[12px] fill-[#5F5E5A]">
              1 kΩ
            </text>

            {/* Microammeter */}
            <circle
              cx="410"
              cy="245"
              r="32"
              strokeWidth="0.5"
              fill="#F1EFE8"
              stroke="#5F5E5A"
            />
            <text
              x="410"
              y="226"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold text-[14px] fill-foreground"
            >
              µA
            </text>
            <line
              x1="410"
              y1="264"
              x2="410"
              y2="240"
              stroke="#2C2C2A"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${needleAngle} 410 264)`}
            />
            <circle cx="410" cy="264" r="2.5" fill="#2C2C2A" />

            <line
              x1="442"
              y1="245"
              x2="464"
              y2="245"
              stroke="#5F5E5A"
              strokeWidth="1.5"
              markerEnd="url(#circuit-arrow)"
            />

            {/* ADC Box */}
            <g>
              <rect
                x="466"
                y="231"
                width="42"
                height="28"
                rx="4"
                strokeWidth="0.5"
                fill="#EEEDFE"
                stroke="#534AB7"
              />
              <text
                x="487"
                y="245"
                textAnchor="middle"
                dominantBaseline="central"
                className="font-bold text-[14px] fill-[#3C3489]"
              >
                ADC
              </text>
            </g>
            <line
              x1="508"
              y1="245"
              x2="526"
              y2="245"
              stroke="#5F5E5A"
              strokeWidth="1.5"
              markerEnd="url(#circuit-arrow)"
            />
            <text x="487" y="278" textAnchor="middle" className="text-[12px] fill-[#5F5E5A]">
              reading
            </text>

            {/* Phone OS Screen */}
            <text
              x="584"
              y="46"
              textAnchor="middle"
              className="text-[14px] font-semibold fill-foreground"
            >
              Phone OS
            </text>
            <rect
              x="528"
              y="60"
              width="112"
              height="240"
              rx="14"
              fill="#1F1F1E"
              stroke="#5F5E5A"
              strokeWidth="1"
            />
            <rect
              x="535"
              y="68"
              width="98"
              height="224"
              rx="9"
              fill={phoneBg}
            />
            <text
              x="584"
              y="118"
              textAnchor="middle"
              className="text-[14px] font-semibold"
              fill={phoneFg}
            >
              9:41
            </text>
            <rect x="550" y="150" width="68" height="8" rx="4" fill={phoneFg} opacity={0.6} />
            <rect x="550" y="166" width="48" height="8" rx="4" fill={phoneFg} opacity={0.6} />
            <text
              x="550"
              y="254"
              className="text-[12px]"
              fill={phoneFg}
            >
              Brightness
            </text>
            <rect x="550" y="266" width="68" height="4" rx="2" fill={phoneFg} opacity={0.3} />
            <rect
              x="550"
              y="266"
              width={(68 * brightnessPct) / 100}
              height="4"
              rx="2"
              fill="#EF9F27"
            />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mt-4 mb-5">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#EF9F27]" />
            Photon
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#D85A30]" />
            Free electron (carries current)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#888780]" />
            Bound electron (stuck to atom)
          </span>
        </div>

        {/* Slider */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          <label htmlFor="lux-slider" className="text-sm font-medium text-foreground whitespace-nowrap">
            Ambient light
          </label>
          <input
            id="lux-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={sliderVal}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-[#534AB7]"
          />
          <output className="min-w-[70px] text-right font-semibold text-sm tabular-nums text-foreground">
            {lux < 10 ? lux.toFixed(1) : Math.round(lux)} lux
          </output>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setPreset(1)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Dark room (1 lx)
          </button>
          <button
            type="button"
            onClick={() => setPreset(30)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Dim room (30 lx)
          </button>
          <button
            type="button"
            onClick={() => setPreset(300)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Office (300 lx)
          </button>
          <button
            type="button"
            onClick={() => setPreset(1000)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Daylight (1000 lx)
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
            <p className="text-xs text-muted-foreground font-medium">Photoresistor</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1 tabular-nums">
              {resistance >= 1000 ? `${(resistance / 1000).toFixed(1)} kΩ` : `${Math.round(resistance)} Ω`}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
            <p className="text-xs text-muted-foreground font-medium">Current</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1 tabular-nums">
              {current < 100 ? `${current.toFixed(1)} µA` : `${Math.round(current)} µA`}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
            <p className="text-xs text-muted-foreground font-medium">Free electrons</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1 tabular-nums">
              {numFreeElectrons} of 18
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
            <p className="text-xs text-muted-foreground font-medium">Screen brightness</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1 tabular-nums">
              {brightnessPct}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { MoveHorizontal, MoveVertical } from 'lucide-react';
import { LENS_PRESETS } from '../data/projectorsIndia';
import { OpticalCalculationResult, RoomConfiguration, UnitSystem } from '../types/projector';
import { formatLength } from '../utils/optics';

interface Props {
  config: RoomConfiguration;
  calc: OpticalCalculationResult;
  unit: UnitSystem;
  dragHint: string;
  onChange: (patch: Partial<RoomConfiguration>) => void;
}

type DragTarget = 'projector' | 'screenTop' | 'screenBottom' | null;

export const InteractiveThrowCanvas: React.FC<Props> = ({
  config,
  calc,
  unit,
  dragHint,
  onChange,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);

  // Architectural SVG coordinate system: 800 x 360
  const VIEW_W = 800;
  const VIEW_H = 360;
  const SCREEN_X = 96;
  const MAX_DIST_X = 720;
  const CENTER_Y = 180;

  // Dynamic horizontal scale so UST (0.4m) through Long Throw (8.5m) stay legible
  const maxRoomMeters = config.throwRatio < 0.4 ? 2.5 : Math.max(6.5, calc.throwDistanceMeters * 1.25);
  const maxScreenHalfPx = 128;
  const maxScreenMeters = 5.0;

  const distToX = (meters: number) => {
    const ratio = Math.max(0.03, Math.min(1, meters / maxRoomMeters));
    return SCREEN_X + ratio * (MAX_DIST_X - SCREEN_X);
  };

  const xToDist = (svgX: number) => {
    const clampedX = Math.max(SCREEN_X + 18, Math.min(MAX_DIST_X, svgX));
    const ratio = (clampedX - SCREEN_X) / (MAX_DIST_X - SCREEN_X);
    return Number(Math.max(0.18, ratio * maxRoomMeters).toFixed(2));
  };

  const screenWidthToHalfPx = (widthM: number) => {
    const ratio = Math.max(0.18, Math.min(1, widthM / maxScreenMeters));
    return Math.max(32, ratio * maxScreenHalfPx);
  };

  const yOffsetToScreenWidth = (offsetPx: number) => {
    const clampedHalf = Math.max(24, Math.min(maxScreenHalfPx, Math.abs(offsetPx)));
    const meters = (clampedHalf / maxScreenHalfPx) * maxScreenMeters;
    return Number(Math.max(1.0, Math.min(5.0, meters)).toFixed(2));
  };

  const projX = distToX(calc.throwDistanceMeters);
  const screenHalfH = screenWidthToHalfPx(calc.screenWidthMeters);
  const screenTopY = CENTER_Y - screenHalfH;
  const screenBotY = CENTER_Y + screenHalfH;

  const seatMinX = distToX(calc.seatingDistanceMinMeters);
  const seatMaxX = Math.min(MAX_DIST_X + 20, distToX(calc.seatingDistanceMaxMeters));

  const getSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW_W,
      y: ((clientY - rect.top) / rect.height) * VIEW_H,
    };
  };

  const handlePointerDown = (target: DragTarget) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDragging(target);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const { x, y } = getSvgCoords(e.clientX, e.clientY);

    if (dragging === 'projector') {
      const nextDist = xToDist(x);
      onChange({ throwDistanceMeters: nextDist });
    } else if (dragging === 'screenTop' || dragging === 'screenBottom') {
      const nextWidth = yOffsetToScreenWidth(y - CENTER_Y);
      onChange({ screenWidthMeters: nextWidth });
    }
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  // Subtle room canvas tint reflecting selected lighting intensity
  const roomFill =
    config.lightIntensity === 'dark'
      ? '#0F172A'
      : config.lightIntensity === 'semi_lit'
      ? '#1E293B'
      : '#334155';

  const gridStroke =
    config.lightIntensity === 'dark'
      ? 'rgba(148, 163, 184, 0.10)'
      : 'rgba(226, 232, 240, 0.14)';

  const beamOpacity =
    config.lightIntensity === 'dark' ? 0.34 : config.lightIntensity === 'semi_lit' ? 0.28 : 0.22;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Top interactive bar: Lens Model Preset buttons */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MoveHorizontal className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>{dragHint}</span>
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {LENS_PRESETS.map((preset) => {
            const active = config.lensPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onChange({
                    lensPresetId: preset.id,
                    throwRatio: preset.defaultThrowRatio,
                    mountingType: preset.category === 'ust' ? 'ust_console' : config.mountingType === 'ust_console' ? 'ceiling' : config.mountingType,
                  })
                }
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.name.split(' (')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive SVG Optical Room Plan */}
      <div className="relative select-none touch-none bg-slate-900">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto block cursor-default"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="img"
          aria-label="Interactive projector throw distance and screen width calibration diagram"
        >
          <defs>
            <linearGradient id="opticalBeam" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity={beamOpacity + 0.18} />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity={beamOpacity * 0.45} />
            </linearGradient>
            <pattern id="roomGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={gridStroke} strokeWidth="1" />
            </pattern>
          </defs>

          {/* Room floor canvas */}
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill={roomFill} />
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#roomGrid)" />

          {/* Recommended Seating Zone band */}
          {seatMaxX > seatMinX + 12 && (
            <g>
              <rect
                x={seatMinX}
                y={24}
                width={seatMaxX - seatMinX}
                height={VIEW_H - 48}
                fill="rgba(16, 185, 129, 0.08)"
                stroke="rgba(16, 185, 129, 0.30)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={(seatMinX + seatMaxX) / 2}
                y={40}
                textAnchor="middle"
                fill="#6EE7B7"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                IDEAL SEATING ({formatLength(calc.seatingDistanceMinMeters, unit, 1)}–
                {formatLength(calc.seatingDistanceMaxMeters, unit, 1)})
              </text>
            </g>
          )}

          {/* Wall line behind screen */}
          <line
            x1={SCREEN_X - 10}
            y1={24}
            x2={SCREEN_X - 10}
            y2={VIEW_H - 24}
            stroke="#475569"
            strokeWidth="3"
          />

          {/* Projected Optical Beam Cone */}
          <polygon
            points={`${projX - 14},${CENTER_Y - 5} ${projX - 14},${CENTER_Y + 5} ${SCREEN_X},${screenBotY} ${SCREEN_X},${screenTopY}`}
            fill="url(#opticalBeam)"
          />
          <line
            x1={projX - 14}
            y1={CENTER_Y - 4}
            x2={SCREEN_X}
            y2={screenTopY}
            stroke="#60A5FA"
            strokeWidth="1.25"
            strokeDasharray="5 4"
          />
          <line
            x1={projX - 14}
            y1={CENTER_Y + 4}
            x2={SCREEN_X}
            y2={screenBotY}
            stroke="#60A5FA"
            strokeWidth="1.25"
            strokeDasharray="5 4"
          />

          {/* Center optical axis & Throw Distance Dimension Line */}
          <line
            x1={SCREEN_X + 6}
            y1={CENTER_Y}
            x2={projX - 24}
            y2={CENTER_Y}
            stroke="#94A3B8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Bottom Throw Distance Ruler */}
          <g transform={`translate(0, ${VIEW_H - 34})`}>
            <line x1={SCREEN_X} y1={0} x2={projX} y2={0} stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1={SCREEN_X} y1={-6} x2={SCREEN_X} y2={6} stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1={projX} y1={-6} x2={projX} y2={6} stroke="#CBD5E1" strokeWidth="1.5" />
            <rect
              x={(SCREEN_X + projX) / 2 - 64}
              y={-12}
              width={128}
              height={22}
              rx={4}
              fill="#0F172A"
              stroke="#334155"
              strokeWidth="1"
            />
            <text
              x={(SCREEN_X + projX) / 2}
              y={3}
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="11"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              {formatLength(calc.throwDistanceMeters, unit, 2)} ({config.throwRatio.toFixed(2)}:1)
            </text>
          </g>

          {/* Projection Screen Bar */}
          <rect
            x={SCREEN_X - 4}
            y={screenTopY}
            width={8}
            height={screenBotY - screenTopY}
            rx={2}
            fill="#F8FAFC"
            stroke="#3B82F6"
            strokeWidth="1.5"
          />

          {/* Screen Width & Diagonal Label on Left */}
          <g>
            <text
              x={SCREEN_X - 18}
              y={CENTER_Y - 6}
              textAnchor="end"
              fill="#F8FAFC"
              fontSize="12"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              {Math.round(calc.screenDiagonalInches)}&quot;
            </text>
            <text
              x={SCREEN_X - 18}
              y={CENTER_Y + 11}
              textAnchor="end"
              fill="#94A3B8"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              W: {formatLength(calc.screenWidthMeters, unit, 2)}
            </text>
            <text
              x={SCREEN_X - 18}
              y={CENTER_Y + 25}
              textAnchor="end"
              fill="#64748B"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              {config.aspectRatio}
            </text>
          </g>

          {/* Draggable Screen Top Handle */}
          <g
            transform={`translate(${SCREEN_X}, ${screenTopY})`}
            onPointerDown={handlePointerDown('screenTop')}
            className="cursor-ns-resize"
          >
            <circle r="14" fill="transparent" />
            <circle
              r="7"
              fill={dragging === 'screenTop' ? '#2563EB' : '#FFFFFF'}
              stroke="#2563EB"
              strokeWidth="2.5"
            />
          </g>

          {/* Draggable Screen Bottom Handle */}
          <g
            transform={`translate(${SCREEN_X}, ${screenBotY})`}
            onPointerDown={handlePointerDown('screenBottom')}
            className="cursor-ns-resize"
          >
            <circle r="14" fill="transparent" />
            <circle
              r="7"
              fill={dragging === 'screenBottom' ? '#2563EB' : '#FFFFFF'}
              stroke="#2563EB"
              strokeWidth="2.5"
            />
          </g>

          {/* Draggable Projector Unit */}
          <g
            transform={`translate(${projX}, ${CENTER_Y})`}
            onPointerDown={handlePointerDown('projector')}
            className="cursor-ew-resize"
          >
            {/* Large touch target */}
            <rect x="-32" y="-36" width="76" height="72" fill="transparent" />
            {/* Chassis */}
            <rect
              x="-16"
              y="-22"
              width="48"
              height="44"
              rx="6"
              fill={dragging === 'projector' ? '#1D4ED8' : '#1E293B'}
              stroke={dragging === 'projector' ? '#93C5FD' : '#60A5FA'}
              strokeWidth="2"
            />
            {/* Optical lens */}
            <rect x="-22" y="-9" width="8" height="18" rx="2" fill="#93C5FD" />
            {/* Top lens rings detail */}
            <line x1="-6" y1="-12" x2="22" y2="-12" stroke="#475569" strokeWidth="1.5" />
            <line x1="-6" y1="12" x2="22" y2="12" stroke="#475569" strokeWidth="1.5" />
            {/* Drag grip chevrons */}
            <text
              x="8"
              y="4"
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="10"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              ↔
            </text>
            {/* Label above projector */}
            <text
              x="8"
              y="-31"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="10"
              fontWeight="600"
              fontFamily="DM Sans, sans-serif"
            >
              PROJECTOR (DRAG)
            </text>
          </g>
        </svg>

        {/* Bottom legend strip inside dark canvas */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
              Drag projector for throw distance
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MoveVertical className="w-3.5 h-3.5 text-blue-400" />
              Drag screen edge handles for size
            </span>
          </div>
          <span className="font-mono tabular-nums text-slate-400">
            Area: {calc.screenAreaSqFeet.toFixed(1)} ft² ({calc.screenAreaSqMeters.toFixed(2)} m²)
          </span>
        </div>
      </div>
    </div>
  );
};

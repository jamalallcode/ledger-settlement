import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  X, 
  FilePlus2, 
  ClipboardCheck, 
  PieChart, 
  Library, 
  Mail, 
  MailPlus,
  LayoutDashboard, 
  ExternalLink, 
  Vote,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  getActiveWheelItems, 
  CycleWheelItem, 
  getWheelSettings,
  MASTER_WHEEL_ITEMS
} from '../utils/cycleWheelConfig';
import { ModuleVisibility } from '../types';

interface SegmentedCycleWheelProps {
  onSelectFeature: (tab: string, subModule?: 'settlement' | 'correspondence') => void;
  isAdmin?: boolean;
  moduleVisibility?: ModuleVisibility;
  wheelSettings?: Record<string, boolean>;
}

// Icon helper to render appropriate Lucide icon for each item
const renderWheelIcon = (iconName: string, className: string = "w-4 h-4") => {
  switch (iconName) {
    case 'FilePlus2':
      return <FilePlus2 className={className} />;
    case 'ClipboardCheck':
      return <ClipboardCheck className={className} />;
    case 'PieChart':
      return <PieChart className={className} />;
    case 'Library':
      return <Library className={className} />;
    case 'Mail':
      return <Mail className={className} />;
    case 'MailPlus':
      return <MailPlus className={className} />;
    case 'LayoutDashboard':
      return <LayoutDashboard className={className} />;
    case 'ExternalLink':
      return <ExternalLink className={className} />;
    case 'Vote':
      return <Vote className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

/**
 * Polar coordinate to Cartesian converter
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Generates an SVG path for a circular chevron arrow segment.
 * The segment has a leading chevron arrowhead and trailing notch
 * so consecutive segments interlock seamlessly with a clean gap.
 */
function describeChevronSegment(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
  arrowAngle: number
): string {
  const rMid = (rInner + rOuter) / 2;

  // Outer arc endpoints
  const pOuterStart = polarToCartesian(cx, cy, rOuter, startAngle);
  const pOuterEnd = polarToCartesian(cx, cy, rOuter, endAngle);

  // Arrowhead tip at leading edge (mid radius, projected forward)
  const pArrowTip = polarToCartesian(cx, cy, rMid, endAngle + arrowAngle);

  // Inner arc endpoints
  const pInnerEnd = polarToCartesian(cx, cy, rInner, endAngle);
  const pInnerStart = polarToCartesian(cx, cy, rInner, startAngle);

  // Arrow socket notch at trailing edge (mid radius, matched indent)
  const pNotch = polarToCartesian(cx, cy, rMid, startAngle + arrowAngle);

  const arcSpan = endAngle - startAngle;
  const largeArcFlag = arcSpan > Math.PI ? 1 : 0;

  return [
    `M ${pOuterStart.x.toFixed(2)} ${pOuterStart.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${pOuterEnd.x.toFixed(2)} ${pOuterEnd.y.toFixed(2)}`,
    `L ${pArrowTip.x.toFixed(2)} ${pArrowTip.y.toFixed(2)}`,
    `L ${pInnerEnd.x.toFixed(2)} ${pInnerEnd.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${pInnerStart.x.toFixed(2)} ${pInnerStart.y.toFixed(2)}`,
    `L ${pNotch.x.toFixed(2)} ${pNotch.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/**
 * Generates a clean full circular donut segment for a single active option
 */
function describeSingleRingSegment(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  gapAngle: number = 0.06
): string {
  const startAngle = -Math.PI / 2 + gapAngle / 2;
  const midAngle = startAngle + Math.PI;
  const endAngle = startAngle + 2 * Math.PI - gapAngle;

  const pOutStart = polarToCartesian(cx, cy, rOuter, startAngle);
  const pOutMid = polarToCartesian(cx, cy, rOuter, midAngle);
  const pOutEnd = polarToCartesian(cx, cy, rOuter, endAngle);

  const pInEnd = polarToCartesian(cx, cy, rInner, endAngle);
  const pInMid = polarToCartesian(cx, cy, rInner, midAngle);
  const pInStart = polarToCartesian(cx, cy, rInner, startAngle);

  return [
    `M ${pOutStart.x.toFixed(2)} ${pOutStart.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${pOutMid.x.toFixed(2)} ${pOutMid.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${pOutEnd.x.toFixed(2)} ${pOutEnd.y.toFixed(2)}`,
    `L ${pInEnd.x.toFixed(2)} ${pInEnd.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 0 0 ${pInMid.x.toFixed(2)} ${pInMid.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 0 0 ${pInStart.x.toFixed(2)} ${pInStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export const SegmentedCycleWheel: React.FC<SegmentedCycleWheelProps> = ({
  onSelectFeature,
  isAdmin = false,
  moduleVisibility,
  wheelSettings: propWheelSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [localWheelSettings, setLocalWheelSettings] = useState<Record<string, boolean>>(() => getWheelSettings());

  // Listen for settings update from Admin Dashboard
  useEffect(() => {
    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, boolean>>;
      if (customEvent.detail) {
        setLocalWheelSettings(customEvent.detail);
      } else {
        setLocalWheelSettings(getWheelSettings());
      }
    };

    window.addEventListener('cycle-wheel-settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('cycle-wheel-settings-updated', handleSettingsUpdate);
    };
  }, []);

  const effectiveWheelSettings = propWheelSettings || localWheelSettings;

  // Compute active items based strictly on right-panel wheelSettings (Cycle Wheel Feature Controls)
  const activeItems = useMemo(() => {
    return getActiveWheelItems(effectiveWheelSettings);
  }, [effectiveWheelSettings]);

  // Geometry configuration for SVG rendering
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 132;
  const rInner = 64;
  const rMid = (rOuter + rInner) / 2;
  const centerHubRadius = 45;

  const count = activeItems.length || 1;
  const angleStep = (2 * Math.PI) / count;
  const gapAngle = Math.min(0.045, (2 * Math.PI * 0.012) / count); // Uniform proportional gap
  const arrowAngle = Math.min(angleStep * 0.18, 0.22); // Angle shift for chevron tip

  // Starting angle offset so item 1 starts symmetrically (bottom-right / bottom like diagram)
  const startBaseAngle = Math.PI / 6;

  // Selected item info for tooltip
  const activeHoveredItem = useMemo(() => {
    return activeItems.find(item => item.id === hoveredItemId);
  }, [activeItems, hoveredItemId]);

  return (
    <div className="w-full flex flex-col items-center justify-center select-none py-0 mt-0 mb-auto md:my-auto">
      
      {/* Active Hovered Feature Floating Tooltip (Positioned cleanly between header and wheel, never overlapping 'খুলনা') */}
      <div className="h-5.5 w-full flex items-center justify-center pointer-events-none mb-0.5 z-20">
        {activeHoveredItem ? (
          <div 
            className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black shadow-md animate-fade-in"
            style={{
              backgroundColor: activeHoveredItem.color,
              color: activeHoveredItem.textColor,
            }}
          >
            {renderWheelIcon(activeHoveredItem.iconName, "w-3 h-3 shrink-0")}
            <span>{activeHoveredItem.numberBn}. {activeHoveredItem.title}</span>
          </div>
        ) : (
          <div className="h-4 invisible" />
        )}
      </div>

      {/* Main Wheel Container with SVG segments and Center '+' Hub - Optimized compact mobile dimensions */}
      <div className="relative w-[230px] h-[230px] min-[360px]:w-[250px] min-[360px]:h-[250px] min-[400px]:w-[270px] min-[400px]:h-[270px] sm:w-[280px] sm:h-[280px] flex items-center justify-center">
        
        {/* Scoped CSS for smooth continuous rotation and elevated ambient glow */}
        <style>{`
          @keyframes cycle-wheel-slow-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes cycle-wheel-ambient-glow {
            0%, 100% {
              opacity: 0.55;
              transform: scale(0.98);
              box-shadow: 0 0 25px 6px rgba(14, 165, 233, 0.22), 0 0 45px 12px rgba(16, 185, 129, 0.18);
            }
            50% {
              opacity: 0.85;
              transform: scale(1.03);
              box-shadow: 0 0 38px 12px rgba(14, 165, 233, 0.35), 0 0 65px 20px rgba(16, 185, 129, 0.28);
            }
          }
          .cycle-wheel-rotating {
            animation: cycle-wheel-slow-spin 48s linear infinite;
            transform-origin: center center;
          }
          .cycle-wheel-glow-aura {
            animation: cycle-wheel-ambient-glow 4.5s ease-in-out infinite;
          }
        `}</style>

        {/* Premium Ambient Glow Backdrop (stops pulsation when options are opened/scattered) */}
        <div 
          className={`absolute rounded-full pointer-events-none transition-all duration-700 ease-out ${
            isOpen 
              ? 'w-[95%] h-[95%] opacity-35 scale-110 blur-xl bg-gradient-to-tr from-emerald-500/20 via-sky-400/20 to-teal-400/20' 
              : 'w-[90%] h-[90%] cycle-wheel-glow-aura blur-lg bg-gradient-to-tr from-sky-400/20 via-emerald-400/20 to-amber-400/15'
          }`} 
        />

        {/* SVG Container for Chevron Arrow Segments - Smooth reliable rotation wrapper */}
        <div 
          className={`absolute inset-0 w-full h-full flex items-center justify-center transition-transform duration-500 ${
            !isOpen ? 'cycle-wheel-rotating' : ''
          }`}
          style={{ transformOrigin: 'center center' }}
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            width="100%"
            height="100%"
            className="w-full h-full overflow-visible drop-shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
          >
            <defs>
              {/* Soft inner filter for depth */}
              <filter id="wheel-segment-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
              </filter>
              <filter id="wheel-active-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ffffff" floodOpacity="0.8" />
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Group containing all segments */}
            <g id="cycle-wheel-segments-group">
              {/* Empty state placeholder when all switches are OFF */}
              {activeItems.length === 0 && (
                <g className="pointer-events-none select-none">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={rMid}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="10"
                    strokeDasharray="6 6"
                    className="opacity-40"
                  />
                  <text
                    x={cx}
                    y={cy - 52}
                    textAnchor="middle"
                    fill="#64748b"
                    className="text-[11px] font-bold"
                  >
                    কোনো অপশন সক্রিয় নেই
                  </text>
                </g>
              )}

              {/* Render each active chevron segment */}
              {activeItems.map((item, index) => {
                let pathData = '';
                let labelPos = { x: cx, y: cy + rMid };
                let dx = 0;
                let dy = 0;

                if (count === 1) {
                  pathData = describeSingleRingSegment(cx, cy, rInner, rOuter);
                  labelPos = polarToCartesian(cx, cy, rMid, Math.PI / 2);
                } else {
                  const startAngle = startBaseAngle + index * angleStep + gapAngle / 2;
                  const endAngle = startBaseAngle + (index + 1) * angleStep - gapAngle / 2;
                  pathData = describeChevronSegment(cx, cy, rInner, rOuter, startAngle, endAngle, arrowAngle);

                  // Centroid angle for positioning labels and outward explosion
                  const midAngle = (startAngle + endAngle) / 2 + arrowAngle / 2;
                  
                  // Explode translation vector when isOpen = true
                  const explodeDistance = 34; // outward shift in pixels
                  dx = isOpen ? Math.cos(midAngle) * explodeDistance : 0;
                  dy = isOpen ? Math.sin(midAngle) * explodeDistance : 0;

                  // Content label position (Cartesian)
                  labelPos = polarToCartesian(cx, cy, rMid, midAngle);
                }

                const isHovered = hoveredItemId === item.id;
                const segmentTransform = count === 1
                  ? `${isOpen ? 'scale(1.05)' : isHovered ? 'scale(1.03)' : 'scale(1)'}`
                  : `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) ${isHovered ? 'scale(1.04)' : 'scale(1)'}`;

                return (
                  <g
                    key={item.id}
                    id={`wheel-segment-${item.id}`}
                    className="cursor-pointer"
                    style={{
                      transform: segmentTransform,
                      transformOrigin: `${cx}px ${cy}px`,
                      transition: 'transform 440ms cubic-bezier(0.34, 1.45, 0.64, 1), filter 240ms ease',
                      filter: isHovered 
                        ? 'url(#wheel-active-glow) brightness(1.1)' 
                        : 'url(#wheel-segment-shadow)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFeature(item.tab, item.subModule);
                    }}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    onTouchStart={() => setHoveredItemId(item.id)}
                  >
                    {/* Segment Chevron Shape */}
                    <path
                      d={pathData}
                      fill={item.color}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      className="transition-colors duration-200"
                    />

                    {/* Number & Bengali Label within the Segment */}
                    <g 
                      transform={`translate(${labelPos.x}, ${labelPos.y})`}
                      className="pointer-events-none select-none"
                    >
                      {/* Sequence Number */}
                      <text
                        y="-4"
                        textAnchor="middle"
                        fill="#ffffff"
                        className="font-black text-[13px] sm:text-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                      >
                        {item.numberBn}
                      </text>
                      
                      {/* Short Feature Title in Bengali */}
                      <text
                        y="10"
                        textAnchor="middle"
                        fill="#ffffff"
                        className="font-bold text-[9px] sm:text-[10px] tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      >
                        {item.shortTitle}
                      </text>
                    </g>
                  </g>
                );
              })}
          </g>
        </svg>
      </div>

        {/* CENTER HUB: The Iconic Green Circular '+' Button */}
        <div 
          className="absolute z-20 flex items-center justify-center"
          style={{ width: centerHubRadius * 2, height: centerHubRadius * 2 }}
        >
          {/* Circular ring aura */}
          <div 
            className={`absolute inset-0 rounded-full border-2 border-emerald-400/40 transition-all duration-500 pointer-events-none ${
              isOpen ? 'scale-125 opacity-100 bg-emerald-500/15 animate-ping' : 'scale-100 opacity-60'
            }`}
          />

          <button
            id="cycle-wheel-center-btn"
            onClick={() => {
              setIsOpen(!isOpen);
              setHoveredItemId(null);
            }}
            className={`relative z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 text-white border-2 border-white flex items-center justify-center active:scale-95 transition-all duration-300 cursor-pointer shadow-xl ${
              isOpen 
                ? 'shadow-emerald-700/60 ring-4 ring-emerald-400/30' 
                : 'shadow-emerald-600/40 hover:scale-105 hover:shadow-2xl'
            }`}
            title={isOpen ? "চক্র জোড়া লাগান" : "ফিচারসমূহ ছড়িয়ে দিন"}
          >
            <span 
              className={`transition-transform duration-500 ease-out flex items-center justify-center ${
                isOpen ? 'rotate-135' : 'rotate-0'
              }`}
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
            </span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default SegmentedCycleWheel;

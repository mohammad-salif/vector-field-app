import { useState, useRef, useEffect } from 'react';
import { Truck, AlertTriangle, Layers, ChevronDown, ChevronUp, X } from 'lucide-react';

function LegendItems() {
  const items = [
    { label: 'Accessible Route', color: '#059669', dashed: false },
    { label: 'At-Risk Route', color: '#d97706', dashed: true },
    { label: 'Blocked Route', color: '#dc2626', dashed: false, blocked: true },
  ];

  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className="flex h-3.5 w-5 shrink-0 items-center">
            <div
              className={`h-[2px] w-full ${item.dashed ? 'border-t-2 border-dashed' : 'rounded-full'}`}
              style={{
                borderColor: item.color,
                backgroundColor: item.dashed ? 'transparent' : item.color,
              }}
            />
            {item.blocked && (
              <span
                className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
          </div>
          <span className="text-[11px] font-medium text-neutral-700 whitespace-nowrap">{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <div className="flex h-3.5 w-5 shrink-0 items-center justify-center">
          <Truck className="h-3.5 w-3.5 text-neutral-900" />
        </div>
        <span className="text-[11px] font-medium text-neutral-700 whitespace-nowrap">Vehicle</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-3.5 w-5 shrink-0 items-center justify-center">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
        </div>
        <span className="text-[11px] font-medium text-neutral-700 whitespace-nowrap">Incident</span>
      </div>
    </div>
  );
}

export function Legend() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // Close mobile expanded view on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileContainerRef.current &&
        !mobileContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop / Tablet Legend: Compact container with optional minimize in top-left */}
      <div
        id="desktop-map-legend"
        className="hidden md:block absolute left-3.5 top-3.5 z-10"
      >
        {isDesktopCollapsed ? (
          <button
            type="button"
            onClick={() => setIsDesktopCollapsed(false)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200/90 bg-white/95 px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-xs backdrop-blur-md transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            aria-label="Expand map legend"
            title="Expand legend"
          >
            <Layers className="h-3.5 w-3.5 text-neutral-600" />
            <span>Legend</span>
            <ChevronDown className="h-3 w-3 text-neutral-400" />
          </button>
        ) : (
          <div className="w-fit rounded-xl border border-neutral-200/90 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-md transition-all">
            <div className="mb-1.5 flex items-center justify-between gap-3 border-b border-neutral-100 pb-1">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                <Layers className="h-3 w-3 text-neutral-500" />
                Map Legend
              </span>
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(true)}
                className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
                aria-label="Collapse map legend"
                title="Minimize legend"
              >
                <ChevronUp className="h-3 w-3 text-neutral-500" />
              </button>
            </div>
            <LegendItems />
          </div>
        )}
      </div>

      {/* Mobile Legend: Compact collapsible control — preferred collapsed state */}
      <div
        id="mobile-map-legend-container"
        ref={mobileContainerRef}
        className="md:hidden absolute left-3 top-3 z-20"
      >
        <button
          type="button"
          id="button-mobile-map-legend"
          data-testid="button-mobile-map-legend"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse map legend' : 'Expand map legend'}
          className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-neutral-200/90 bg-white/95 px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-xs backdrop-blur-md transition-colors hover:bg-neutral-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <Layers className="h-3.5 w-3.5 text-neutral-700" />
          <span>Legend</span>
          <ChevronDown
            className={`h-3 w-3 text-neutral-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            id="mobile-map-legend-expanded"
            data-testid="mobile-map-legend-expanded"
            className="mt-1.5 w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200/90 bg-white/98 p-2.5 shadow-lg backdrop-blur-md"
          >
            <div className="mb-1.5 flex items-center justify-between border-b border-neutral-100 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Map Legend
              </span>
              <button
                type="button"
                id="button-mobile-map-legend-close"
                data-testid="button-mobile-map-legend-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close legend"
                className="flex h-5 w-5 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <LegendItems />
          </div>
        )}
      </div>
    </>
  );
}


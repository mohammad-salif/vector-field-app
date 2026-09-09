import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Truck,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
  MapPin,
  Crosshair,
  Info,
  Maximize2,
  Globe,
  Radio,
} from 'lucide-react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import type { RouteSegment, Incident, Vehicle, FleetVehicle } from '@/types';

// MapTiler API credentials provided by user
const MAPTILER_API_KEY =
  (import.meta.env.VITE_MAPTILER_API_KEY as string) || 'wkndVymjmsbf6Y0M1QG4';
const MAPTILER_API_TOKEN =
  (import.meta.env.VITE_MAPTILER_API_TOKEN as string) ||
  '4944422b95dd4dcfba73ddc23520d066_3ebe7e7a3e239c7de29d29becadb0f73b2e8acd4a3285c9d477557f7cec3c86f';

// Set global MapTiler SDK configuration
maptilersdk.config.apiKey = MAPTILER_API_KEY;

export interface FieldGpsPosition {
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  timestamp?: string;
  source?: 'simulated' | 'gps';
}

interface FieldRouteMapProps {
  assignedRoute: RouteSegment;
  currentVehicle: FleetVehicle | Vehicle;
  incidentOnRoute?: Incident;
  gpsPosition?: FieldGpsPosition;
  onSelectIncident?: (id: string) => void;
  onReportIncident?: () => void;
}

// Real-world GeoJSON coordinates for Corridor Delta tactical operations
const ASSIGNED_COORDINATES: [number, number][] = [
  [88.4200, 27.7200], // Westfield Center
  [88.4850, 27.7650], // Checkpoint Bravo
  [88.5412, 27.8124], // Mile 28.5 (Current Vehicle Fix)
  [88.6250, 27.8850], // Mile 42 Incident (INC-3401 Blockage)
  [88.6850, 27.9150], // High Pass Incline
  [88.7400, 27.9500], // Southport Depot
];

const ALTERNATE_COORDINATES: [number, number][] = [
  [88.4200, 27.7200], // Westfield Center
  [88.4600, 27.6800], // Lowland Valley Entry
  [88.5600, 27.6950], // Corridor Alpha Junction
  [88.6600, 27.7500], // River Valley Bridge
  [88.7200, 27.8600], // Corridor Zeta Junction
  [88.7400, 27.9500], // Southport Depot
];

const VIEW_W = 1000;
const VIEW_H = 600;

function pointsToPath(points: { x: number; y: number }[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

export function FieldRouteMap({
  assignedRoute,
  currentVehicle,
  incidentOnRoute,
  gpsPosition,
  onSelectIncident,
}: FieldRouteMapProps) {
  const [mapMode, setMapMode] = useState<'maptiler' | 'schematic'>('maptiler');
  const [mapStyleKey, setMapStyleKey] = useState<'outdoor' | 'satellite' | 'streets'>('outdoor');
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<
    'current-location' | 'assigned-route' | 'alternate-route' | 'incident' | null
  >(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  // Telemetry fix
  const telemetry: FieldGpsPosition = {
    x:
      gpsPosition?.x ??
      ('position' in currentVehicle && currentVehicle.position ? currentVehicle.position.x : 650),
    y:
      gpsPosition?.y ??
      ('position' in currentVehicle && currentVehicle.position ? currentVehicle.position.y : 460),
    latitude: gpsPosition?.latitude ?? 27.8124,
    longitude: gpsPosition?.longitude ?? 88.5412,
    accuracyMeters: gpsPosition?.accuracyMeters ?? 8,
    timestamp: gpsPosition?.timestamp ?? '09:42:15 UTC',
    source: gpsPosition?.source ?? 'simulated',
  };

  // Add GeoJSON Route Layers on MapTiler map
  const addRouteLayers = useCallback((map: maptilersdk.Map) => {
    // 1. Assigned Route (RTE-104 - Blocked)
    if (!map.getSource('assigned-route-source')) {
      map.addSource('assigned-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: 'RTE-104 Corridor Delta' },
          geometry: {
            type: 'LineString',
            coordinates: ASSIGNED_COORDINATES,
          },
        },
      });
    }

    if (!map.getLayer('assigned-route-casing')) {
      map.addLayer({
        id: 'assigned-route-casing',
        type: 'line',
        source: 'assigned-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#7f1d1d',
          'line-width': 8,
          'line-opacity': 0.6,
        },
      });
    }

    if (!map.getLayer('assigned-route-line')) {
      map.addLayer({
        id: 'assigned-route-line',
        type: 'line',
        source: 'assigned-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#dc2626',
          'line-width': 4.5,
          'line-dasharray': [3, 2],
        },
      });
    }

    // 2. Alternate Route (ALT-104 - Open Lowland Bypass)
    if (!map.getSource('alternate-route-source')) {
      map.addSource('alternate-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: 'ALT-104 Lowland Bypass' },
          geometry: {
            type: 'LineString',
            coordinates: ALTERNATE_COORDINATES,
          },
        },
      });
    }

    if (!map.getLayer('alternate-route-casing')) {
      map.addLayer({
        id: 'alternate-route-casing',
        type: 'line',
        source: 'alternate-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#064e3b',
          'line-width': 8,
          'line-opacity': 0.6,
        },
      });
    }

    if (!map.getLayer('alternate-route-line')) {
      map.addLayer({
        id: 'alternate-route-line',
        type: 'line',
        source: 'alternate-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 4.5,
        },
      });
    }

    // Interactive clicks on route lines
    map.on('click', 'assigned-route-line', () => {
      setActiveHighlight('assigned-route');
    });
    map.on('click', 'alternate-route-line', () => {
      setActiveHighlight('alternate-route');
    });
    map.on('mouseenter', 'assigned-route-line', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'assigned-route-line', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', 'alternate-route-line', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'alternate-route-line', () => {
      map.getCanvas().style.cursor = '';
    });
  }, []);

  // Clear existing markers and rebuild
  const renderMarkers = useCallback((map: maptilersdk.Map) => {
    // Remove previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Current Vehicle Marker (YOU ARE HERE)
    const vehicleEl = document.createElement('div');
    vehicleEl.className = 'cursor-pointer select-none';
    vehicleEl.innerHTML = `
      <div class="relative flex flex-col items-center">
        <div class="absolute -top-7 whitespace-nowrap rounded-md border border-neutral-900 bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-md flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>YOU • VHC-2044</span>
        </div>
        <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-white shadow-lg">
          <div class="absolute -inset-2 rounded-full bg-emerald-500/25 animate-ping"></div>
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="1" y="3" width="15" height="13" rx="1"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        </div>
      </div>
    `;
    vehicleEl.onclick = (e) => {
      e.stopPropagation();
      setActiveHighlight('current-location');
    };

    const vehiclePopup = new maptilersdk.Popup({ offset: 25, closeButton: false }).setHTML(`
      <div class="p-2 text-xs font-sans text-neutral-900">
        <div class="font-bold flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Vehicle VHC-2044 • Officer V. Rawat
        </div>
        <div class="text-neutral-600 mt-1">Corridor Delta Mile 28.5 Pull-off</div>
        <div class="font-mono text-[10px] text-neutral-500 mt-0.5">GPS Fix: 27.8124° N, 88.5412° E</div>
      </div>
    `);

    const vehicleMarker = new maptilersdk.Marker({ element: vehicleEl })
      .setLngLat([telemetry.longitude || 88.5412, telemetry.latitude || 27.8124])
      .setPopup(vehiclePopup)
      .addTo(map);

    markersRef.current.push(vehicleMarker);

    // 2. Incident / Blockage Marker (Mile 42)
    const incidentEl = document.createElement('div');
    incidentEl.className = 'cursor-pointer select-none';
    incidentEl.innerHTML = `
      <div class="relative flex flex-col items-center">
        <div class="absolute -top-7 whitespace-nowrap rounded-md border border-red-700 bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-md flex items-center gap-1">
          <span>⚠️</span>
          <span>Mile 42 Blocked</span>
        </div>
        <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-600 text-white shadow-lg font-black text-xs">
          <div class="absolute -inset-2 rounded-full bg-red-600/30 animate-pulse"></div>
          ✕
        </div>
      </div>
    `;
    incidentEl.onclick = (e) => {
      e.stopPropagation();
      setActiveHighlight('incident');
      if (incidentOnRoute?.id && onSelectIncident) {
        onSelectIncident(incidentOnRoute.id);
      }
    };

    const incidentPopup = new maptilersdk.Popup({ offset: 25 }).setHTML(`
      <div class="p-2 text-xs font-sans text-neutral-900">
        <div class="font-bold text-red-600 flex items-center gap-1">
          <span>⚠️</span> INC-3401: Critical Boulder Rockfall
        </div>
        <div class="text-neutral-700 mt-1 font-medium">Corridor Delta (RTE-104) at Mile 42</div>
        <div class="text-neutral-500 text-[11px] mt-0.5">Both carriageways blocked. Recommended detour: ALT-104 Lowland Bypass.</div>
      </div>
    `);

    const incidentMarker = new maptilersdk.Marker({ element: incidentEl })
      .setLngLat([88.6250, 27.8850])
      .setPopup(incidentPopup)
      .addTo(map);

    markersRef.current.push(incidentMarker);

    // 3. Start Terminal: Westfield Center
    const startEl = document.createElement('div');
    startEl.className = 'select-none pointer-events-none';
    startEl.innerHTML = `
      <div class="flex flex-col items-center">
        <div class="whitespace-nowrap rounded border border-neutral-300 bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-neutral-900 shadow-xs mb-1">
          Westfield Center (Start)
        </div>
        <div class="h-4 w-4 rounded-full border-2 border-white bg-neutral-900 shadow"></div>
      </div>
    `;
    const startMarker = new maptilersdk.Marker({ element: startEl })
      .setLngLat([88.4200, 27.7200])
      .addTo(map);
    markersRef.current.push(startMarker);

    // 4. Destination Terminal: Southport Depot
    const endEl = document.createElement('div');
    endEl.className = 'select-none pointer-events-none';
    endEl.innerHTML = `
      <div class="flex flex-col items-center">
        <div class="whitespace-nowrap rounded border border-neutral-300 bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-neutral-900 shadow-xs mb-1">
          Southport Depot (Destination)
        </div>
        <div class="h-4 w-4 rounded-full border-2 border-white bg-neutral-900 shadow"></div>
      </div>
    `;
    const endMarker = new maptilersdk.Marker({ element: endEl })
      .setLngLat([88.7400, 27.9500])
      .addTo(map);
    markersRef.current.push(endMarker);
  }, [telemetry.longitude, telemetry.latitude, incidentOnRoute?.id, onSelectIncident]);

  // Initialize MapTiler Map
  useEffect(() => {
    if (mapMode !== 'maptiler') return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      let initialStyle:
        | maptilersdk.ReferenceMapStyle
        | maptilersdk.MapStyleVariant
        | string = maptilersdk.MapStyle.OUTDOOR;
      if (mapStyleKey === 'satellite') initialStyle = maptilersdk.MapStyle.SATELLITE;
      if (mapStyleKey === 'streets') initialStyle = maptilersdk.MapStyle.STREETS;

      const map = new maptilersdk.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [telemetry.longitude || 88.5412, telemetry.latitude || 27.8124],
        zoom: 11,
        pitch: 30,
        bearing: -10,
        navigationControl: false,
      });

      // Add navigation controls
      map.addControl(
        new maptilersdk.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.on('load', () => {
        setIsMapLoaded(true);
        addRouteLayers(map);
        renderMarkers(map);

        // Fit initial bounds to show entire corridor
        const bounds = new maptilersdk.LngLatBounds();
        ASSIGNED_COORDINATES.forEach((c) => bounds.extend(c));
        ALTERNATE_COORDINATES.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, {
          padding: { top: 40, bottom: 40, left: 30, right: 30 },
          maxZoom: 12.5,
          duration: 800,
        });
      });

      map.on('error', (err) => {
        console.warn('MapTiler error:', err);
      });

      mapInstanceRef.current = map;
    } catch (err: unknown) {
      console.error('Failed to initialize MapTiler SDK:', err);
      setMapError(err instanceof Error ? err.message : 'Map rendering unavailable');
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      setIsMapLoaded(false);
    };
  }, [mapMode, addRouteLayers, renderMarkers]);

  // Handle ResizeObserver
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      mapInstanceRef.current?.resize();
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, [mapMode]);

  // Handle style switch
  const handleStyleSwitch = (style: 'outdoor' | 'satellite' | 'streets') => {
    setMapStyleKey(style);
    if (!mapInstanceRef.current) return;

    let targetStyle:
      | maptilersdk.ReferenceMapStyle
      | maptilersdk.MapStyleVariant
      | string = maptilersdk.MapStyle.OUTDOOR;
    if (style === 'satellite') targetStyle = maptilersdk.MapStyle.SATELLITE;
    if (style === 'streets') targetStyle = maptilersdk.MapStyle.STREETS;

    mapInstanceRef.current.setStyle(targetStyle);
    mapInstanceRef.current.once('style.load', () => {
      if (mapInstanceRef.current) {
        addRouteLayers(mapInstanceRef.current);
        renderMarkers(mapInstanceRef.current);
      }
    });
  };

  // Center on Vehicle
  const handleCenterVehicle = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo({
      center: [telemetry.longitude || 88.5412, telemetry.latitude || 27.8124],
      zoom: 12.5,
      pitch: 35,
      duration: 1000,
    });
    setActiveHighlight('current-location');
  };

  // Fit Route Bounds
  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    const bounds = new maptilersdk.LngLatBounds();
    ASSIGNED_COORDINATES.forEach((c) => bounds.extend(c));
    ALTERNATE_COORDINATES.forEach((c) => bounds.extend(c));
    bounds.extend([telemetry.longitude || 88.5412, telemetry.latitude || 27.8124]);
    mapInstanceRef.current.fitBounds(bounds, {
      padding: { top: 40, bottom: 40, left: 30, right: 30 },
      maxZoom: 13,
      duration: 1000,
    });
  };

  // SVG Fallback Route points
  const assignedRoutePoints =
    assignedRoute.points.length > 0
      ? assignedRoute.points
      : [
          { x: 500, y: 480 },
          { x: 650, y: 460 },
          { x: 780, y: 420 },
          { x: 900, y: 360 },
        ];

  const alternateRoutePoints = [
    { x: 500, y: 480 },
    { x: 570, y: 535 },
    { x: 720, y: 545 },
    { x: 850, y: 470 },
    { x: 900, y: 360 },
  ];

  const incidentPos = incidentOnRoute?.position ?? { x: 780, y: 420 };

  return (
    <div className="relative flex flex-col rounded-xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
      {/* Map Scope Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50/90 px-3 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-neutral-900">
            Tactical Map — Corridor Delta
          </span>
          <span className="text-neutral-400">•</span>
          <span className="font-mono text-[11px] font-semibold text-neutral-600">
            {currentVehicle.id}
          </span>
          {/* MapTiler API status badge */}
          <div
            className="hidden xs:inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800"
            title={`Connected via MapTiler Map API (Key: ${MAPTILER_API_KEY.slice(0, 8)}...)`}
          >
            <Globe className="h-3 w-3 text-sky-600" />
            <span>MapTiler API Active</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle: MapTiler Live vs Schematic */}
          <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 text-[11px] font-medium shadow-2xs">
            <button
              type="button"
              onClick={() => setMapMode('maptiler')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
                mapMode === 'maptiler'
                  ? 'bg-neutral-900 font-bold text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>MapTiler</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('schematic')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
                mapMode === 'schematic'
                  ? 'bg-neutral-900 font-bold text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Radio className="h-3 w-3" />
              <span>Schematic</span>
            </button>
          </div>

          {/* Legend toggle button */}
          <button
            type="button"
            onClick={() => setIsLegendOpen((prev) => !prev)}
            aria-label="Toggle map legend"
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors shadow-xs ${
              isLegendOpen
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Legend</span>
            {isLegendOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Compact Inline Legend Bar */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto border-b border-neutral-100 bg-neutral-50/60 px-3 py-1.5 text-[10px] text-neutral-600 sm:text-[11px]">
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-3 rounded-full bg-[#dc2626] inline-block border-t border-dashed border-white" />
            <strong className="text-neutral-900">RTE-104:</strong> Blocked
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-3 rounded-full bg-[#10b981] inline-block" />
            <strong className="text-neutral-900">ALT-104:</strong> Open Bypass
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-900 inline-block border border-white" />
            <strong className="text-neutral-900">You:</strong> Mile 28.5
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] font-bold">!</span>
            <strong className="text-neutral-900">Blockage:</strong> Mile 42
          </span>
        </div>

        {/* Map style switcher (when in MapTiler mode) */}
        {mapMode === 'maptiler' && (
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <span className="text-[10px] text-neutral-400 hidden md:inline">Layer:</span>
            <button
              type="button"
              onClick={() => handleStyleSwitch('outdoor')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                mapStyleKey === 'outdoor'
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              Outdoor
            </button>
            <button
              type="button"
              onClick={() => handleStyleSwitch('satellite')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                mapStyleKey === 'satellite'
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleStyleSwitch('streets')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                mapStyleKey === 'streets'
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              Streets
            </button>
          </div>
        )}
      </div>

      {/* Main Map View Area */}
      <div className="relative h-[320px] xs:h-[360px] sm:h-[420px] w-full bg-[#f8fafc] overflow-hidden select-none">
        {mapMode === 'maptiler' ? (
          <>
            {/* MapTiler WebGL Map Container */}
            <div
              id="maptiler-route-map"
              ref={mapContainerRef}
              className="h-full w-full"
            />

            {/* Floating Navigation Quick Actions */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleCenterVehicle}
                title="Center on My Vehicle"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300/80 bg-white/95 text-neutral-800 shadow-sm backdrop-blur-sm transition-transform active:scale-95 hover:bg-white hover:text-black"
              >
                <Crosshair className="h-4 w-4 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={handleFitRoute}
                title="Fit Route Bounds"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300/80 bg-white/95 text-neutral-800 shadow-sm backdrop-blur-sm transition-transform active:scale-95 hover:bg-white hover:text-black"
              >
                <Maximize2 className="h-4 w-4 text-neutral-700" />
              </button>
            </div>

            {mapError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/90 p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-600 mb-2" />
                <div className="font-bold text-neutral-900">Map Rendering Issue</div>
                <div className="text-xs text-neutral-600 mt-1 max-w-sm">{mapError}</div>
                <button
                  type="button"
                  onClick={() => setMapMode('schematic')}
                  className="mt-3 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Switch to Schematic View
                </button>
              </div>
            )}
          </>
        ) : (
          /* Schematic SVG Map View */
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <pattern
                id="field-map-grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              </pattern>
              <radialGradient id="field-map-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width={VIEW_W} height={VIEW_H} fill="url(#field-map-grid)" />
            <rect width={VIEW_W} height={VIEW_H} fill="url(#field-map-glow)" />

            <g opacity="0.6">
              <path
                d="M 100 350 L 450 300 L 500 550 L 150 550 Z"
                fill="#f1f5f9"
                stroke="#e2e8f0"
                strokeWidth="1.5"
              />
              <path
                d="M 550 300 L 850 280 L 880 550 L 580 550 Z"
                fill="#f1f5f9"
                stroke="#e2e8f0"
                strokeWidth="1.5"
              />
            </g>

            <g fill="#94a3b8" fontSize="12" fontWeight="600">
              <text x="260" y="450">Sector C (Valley Approach)</text>
              <text x="680" y="380">Sector D (Mountain Corridor)</text>
            </g>

            {/* 1. Alternate Route (ALT-104) */}
            <g
              className="cursor-pointer"
              onClick={() =>
                setActiveHighlight(
                  activeHighlight === 'alternate-route' ? null : 'alternate-route',
                )
              }
            >
              <path
                d={pointsToPath(alternateRoutePoints)}
                fill="none"
                stroke="transparent"
                strokeWidth="26"
              />
              <path
                d={pointsToPath(alternateRoutePoints)}
                fill="none"
                stroke="#059669"
                strokeWidth={activeHighlight === 'alternate-route' ? 10 : 7}
                strokeOpacity={activeHighlight === 'alternate-route' ? 0.35 : 0.2}
                strokeLinecap="round"
              />
              <path
                d={pointsToPath(alternateRoutePoints)}
                fill="none"
                stroke="#059669"
                strokeWidth="4.5"
                strokeDasharray="9 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g transform="translate(680, 560)">
                <rect
                  x="-90"
                  y="-14"
                  width="180"
                  height="22"
                  rx="6"
                  fill="#059669"
                  stroke="#047857"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                >
                  ALT-104 Bypass (Accessible)
                </text>
              </g>
            </g>

            {/* 2. Assigned Route (RTE-104) */}
            <g
              className="cursor-pointer"
              onClick={() =>
                setActiveHighlight(
                  activeHighlight === 'assigned-route' ? null : 'assigned-route',
                )
              }
            >
              <path
                d={pointsToPath(assignedRoutePoints)}
                fill="none"
                stroke="transparent"
                strokeWidth="26"
              />
              <path
                d={pointsToPath(assignedRoutePoints)}
                fill="none"
                stroke="#dc2626"
                strokeWidth={activeHighlight === 'assigned-route' ? 10 : 7}
                strokeOpacity={activeHighlight === 'assigned-route' ? 0.35 : 0.25}
                strokeLinecap="round"
              />
              <path
                d={pointsToPath(assignedRoutePoints)}
                fill="none"
                stroke="#dc2626"
                strokeWidth="5"
                strokeDasharray="4 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g transform="translate(620, 435)">
                <rect
                  x="-95"
                  y="-14"
                  width="190"
                  height="22"
                  rx="6"
                  fill="#dc2626"
                  stroke="#b91c1c"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                >
                  RTE-104: Corridor Delta (Blocked)
                </text>
              </g>
            </g>

            {/* Terminals */}
            <g transform="translate(500, 480)">
              <circle r="12" fill="#0f172a" opacity="0.15" />
              <circle r="7" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
              <rect
                x="-65"
                y="-32"
                width="130"
                height="20"
                rx="4"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <text
                x="0"
                y="-18"
                textAnchor="middle"
                fill="#0f172a"
                fontSize="10"
                fontWeight="700"
              >
                Westfield Center (Start)
              </text>
            </g>

            <g transform="translate(900, 360)">
              <circle r="12" fill="#0f172a" opacity="0.15" />
              <circle r="7" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
              <rect
                x="-75"
                y="-32"
                width="150"
                height="20"
                rx="4"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <text
                x="0"
                y="-18"
                textAnchor="middle"
                fill="#0f172a"
                fontSize="10"
                fontWeight="700"
              >
                Southport Depot (Destination)
              </text>
            </g>

            {/* Incident */}
            <g
              transform={`translate(${incidentPos.x} ${incidentPos.y})`}
              className="cursor-pointer"
              onClick={() => {
                setActiveHighlight(
                  activeHighlight === 'incident' ? null : 'incident',
                );
                if (incidentOnRoute?.id && onSelectIncident) {
                  onSelectIncident(incidentOnRoute.id);
                }
              }}
            >
              <circle
                r="24"
                fill="#dc2626"
                fillOpacity="0.25"
                stroke="#dc2626"
                strokeWidth="1.5"
              />
              <circle
                r="15"
                fill="#dc2626"
                stroke="#991b1b"
                strokeWidth="2"
              />
              <line
                x1="-6"
                y1="-6"
                x2="6"
                y2="6"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="6"
                y1="-6"
                x2="-6"
                y2="6"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <g transform="translate(0, -32)">
                <rect
                  x="-70"
                  y="-12"
                  width="140"
                  height="22"
                  rx="6"
                  fill="#dc2626"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="800"
                >
                  Mile 42 Blockage (INC-3401)
                </text>
              </g>
            </g>

            {/* Vehicle Location */}
            <g
              transform={`translate(${telemetry.x} ${telemetry.y})`}
              className="cursor-pointer"
              onClick={() =>
                setActiveHighlight(
                  activeHighlight === 'current-location' ? null : 'current-location',
                )
              }
            >
              <circle
                r="28"
                fill="#0f172a"
                fillOpacity="0.15"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <circle
                r="16"
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <g transform="translate(-7, -7)">
                <rect
                  x="1"
                  y="3"
                  width="10"
                  height="7"
                  rx="1"
                  fill="#ffffff"
                />
                <rect x="2" y="4" width="8" height="3" rx="0.5" fill="#0f172a" />
                <circle cx="3.5" cy="11" r="1.3" fill="#ffffff" />
                <circle cx="8.5" cy="11" r="1.3" fill="#ffffff" />
              </g>
              <g transform="translate(0, -36)">
                <rect
                  x="-82"
                  y="-13"
                  width="164"
                  height="24"
                  rx="6"
                  fill="#0f172a"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <polygon points="-5,11 5,11 0,16" fill="#0f172a" />
                <circle cx="-64" cy="-1" r="3.5" fill="#10b981" />
                <text
                  x="6"
                  y="3"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="800"
                  letterSpacing="0.4"
                >
                  YOU ARE HERE • VHC-2044
                </text>
              </g>
            </g>
          </svg>
        )}

        {/* Collapsible Legend Overlay */}
        {isLegendOpen && (
          <div className="absolute top-2 right-2 z-20 w-64 max-w-[calc(100%-1rem)] rounded-xl border border-neutral-200 bg-white/95 p-3 text-xs shadow-md backdrop-blur-md transition-all">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-neutral-600">
                Navigation Legend
              </span>
              <button
                type="button"
                onClick={() => setIsLegendOpen(false)}
                aria-label="Close legend"
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="flex h-3.5 w-5 shrink-0 items-center justify-center">
                  <div className="h-[3px] w-full border-t-2 border-dashed border-[#dc2626]" />
                </div>
                <span className="font-medium text-neutral-800">
                  Assigned Route: Blocked (RTE-104)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-3.5 w-5 shrink-0 items-center justify-center">
                  <div className="h-[3px] w-full rounded-full bg-[#10b981]" />
                </div>
                <span className="font-medium text-neutral-800">
                  Alternate Bypass: Open (ALT-104)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <Truck className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="font-medium text-neutral-800">
                  Current Location (VHC-2044)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-bold text-[9px]">
                  ✕
                </div>
                <span className="font-medium text-neutral-800">
                  Confirmed Blockage (Mile 42)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                  <div className="h-2 w-2 rounded-full bg-neutral-900" />
                </div>
                <span className="font-medium text-neutral-800">
                  Depots (Westfield / Southport)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Left: Location Telemetry & MapTiler Connection */}
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col gap-1 max-w-[85%] sm:max-w-none z-10">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200/90 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-neutral-800 shadow-xs backdrop-blur-sm">
            <Crosshair className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="truncate">
              Position: Sector C • Mile 28.5 (VHC-2044)
            </span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-md bg-neutral-900/85 px-2 py-0.5 text-[9px] font-mono text-neutral-200 backdrop-blur-sm w-fit">
            <span>MapTiler API fix ({telemetry.latitude}° N, {telemetry.longitude}° E, ±{telemetry.accuracyMeters}m)</span>
          </div>
        </div>
      </div>

      {/* Interactive Selection Feedback Banner */}
      {activeHighlight && (
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-neutral-600 shrink-0" />
            <span className="text-neutral-700">
              {activeHighlight === 'current-location' && (
                <>
                  <strong>Your Position:</strong> Vehicle VHC-2044 stationary on
                  Corridor Delta Mile 28.5 pull-off.
                </>
              )}
              {activeHighlight === 'assigned-route' && (
                <>
                  <strong>Assigned Corridor (RTE-104):</strong> Blocked at Mile
                  42. Risk Score 96/100 (Critical).
                </>
              )}
              {activeHighlight === 'alternate-route' && (
                <>
                  <strong>Recommended Bypass (ALT-104):</strong> Lowland route
                  open & clear. Risk Score 24/100 (Low).
                </>
              )}
              {activeHighlight === 'incident' && (
                <>
                  <strong>Active Hazard (INC-3401):</strong> Mile 42 boulder
                  rockfall across both carriageways. Detour via ALT-104.
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveHighlight(null)}
            className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}



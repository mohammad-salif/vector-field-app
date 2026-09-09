import {
  AlertTriangle,
  BarChart3,
  Info,
  Package,
  Route as RouteIcon,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsDistributionItem } from '@/services/analyticsService';
import { getAnalyticsSnapshot } from '@/services/analyticsService';

const CHART_COLORS = {
  blue: '#0079F2',
  purple: '#795EFF',
  green: '#009118',
  red: '#A60808',
  amber: '#B78203',
};

const chartGridColor = '#e5e7eb';
const chartTickColor = '#737373';

const distributionColors: Record<string, string> = {
  Accessible: CHART_COLORS.green,
  'Partially Accessible': CHART_COLORS.amber,
  Blocked: CHART_COLORS.red,
  Active: CHART_COLORS.green,
  Delayed: CHART_COLORS.amber,
  Offline: CHART_COLORS.red,
  Low: CHART_COLORS.blue,
  Medium: CHART_COLORS.purple,
  High: CHART_COLORS.amber,
  Critical: CHART_COLORS.red,
  Planned: CHART_COLORS.blue,
  'In Transit': CHART_COLORS.purple,
  Delivered: CHART_COLORS.green,
  'At Risk': CHART_COLORS.red,
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; color?: string; name?: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[140px] rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 shadow-xl">
      <p className="mb-2 font-bold text-neutral-900">{label}</p>
      {payload.map((entry) => (
        <div className="flex items-center justify-between gap-4" key={`${entry.name}-${entry.value}`}>
          <span className="flex items-center gap-2 text-neutral-600">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: entry.color ?? CHART_COLORS.blue }}
            />
            {entry.name ?? 'Count'}
          </span>
          <span className="font-mono font-bold tabular-nums text-neutral-900">{entry.value ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

function DistributionLegend({ data }: { data: AnalyticsDistributionItem[] }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 border-t border-neutral-100 pt-3 min-[430px]:grid-cols-2">
      {data.map((item) => (
        <div className="flex items-center justify-between gap-2 text-xs" key={item.label}>
          <span className="flex min-w-0 items-center gap-2 text-neutral-600">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: distributionColors[item.label] ?? CHART_COLORS.blue }}
            />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="shrink-0 font-mono tabular-nums font-semibold text-neutral-900">
            {item.count}{' '}
            <span className="font-normal text-neutral-400">({formatPercent(item.percentage)})</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function DistributionChart({
  data,
  dataName,
  height = 230,
}: {
  data: AnalyticsDistributionItem[];
  dataName: string;
  height?: number;
}) {
  return (
    <div className="h-[230px] w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" debounce={0}>
        <BarChart data={data} margin={{ top: 20, right: 6, left: -18, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={chartGridColor} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            interval={0}
            tick={{ fill: chartTickColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chartGridColor }}
            tickFormatter={(label: string) =>
              label === 'Partially Accessible' ? 'Partial' : label
            }
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: chartTickColor, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<DarkTooltip />}
            cursor={false}
            isAnimationActive={false}
          />
          <Bar
            dataKey="count"
            name={dataName}
            fill={CHART_COLORS.blue}
            fillOpacity={0.82}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="count"
              position="top"
              fill="#262626"
              fontSize={12}
              fontWeight={600}
            />
            {data.map((item) => (
              <Cell
                key={item.label}
                fill={distributionColors[item.label] ?? CHART_COLORS.blue}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalyticsCard({
  icon: Icon,
  title,
  description,
  total,
  data,
  dataName,
  height,
}: {
  icon: typeof RouteIcon;
  title: string;
  description: string;
  total: number;
  data: AnalyticsDistributionItem[];
  dataName: string;
  height?: number;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-xl font-bold tabular-nums text-neutral-900">{total}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">total</p>
        </div>
      </div>
      {total === 0 ? (
        <div className="mt-5 flex h-[230px] items-center justify-center rounded-lg border border-dashed border-neutral-200 text-sm text-neutral-500">
          No simulated records available
        </div>
      ) : (
        <>
          <DistributionChart data={data} dataName={dataName} height={height} />
          <DistributionLegend data={data} />
        </>
      )}
    </section>
  );
}

function RouteRiskChart({ data }: { data: ReturnType<typeof getAnalyticsSnapshot>['routeRiskSnapshot'] }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs lg:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
            <BarChart3 className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Current route risk snapshot</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
              Risk score by existing route ID, on a 0–100 scale. Higher scores indicate greater
              simulated operational risk.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
          <Info className="h-3.5 w-3.5 text-neutral-500" />
          Snapshot only
        </span>
      </div>
      {data.length === 0 ? (
        <div className="mt-5 flex h-[300px] items-center justify-center rounded-lg border border-dashed border-neutral-200 text-sm text-neutral-500">
          No route risk records available
        </div>
      ) : (
        <div className="mt-4 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" debounce={0}>
            <BarChart data={data} margin={{ top: 24, right: 12, left: -10, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke={chartGridColor} strokeDasharray="3 3" />
              <XAxis
                dataKey="routeId"
                tick={{ fill: chartTickColor, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: chartGridColor }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: chartTickColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${value}`}
              />
              <Tooltip
                content={<DarkTooltip />}
                cursor={false}
                isAnimationActive={false}
                formatter={(value: number) => [value, 'Risk score']}
              />
              <Bar
                dataKey="score"
                name="Risk score"
                fill={CHART_COLORS.blue}
                fillOpacity={0.82}
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              >
                <LabelList dataKey="score" position="top" fill="#262626" fontSize={12} />
                {data.map((item) => (
                  <Cell
                    key={item.routeId}
                    fill={
                      item.score >= 80
                        ? CHART_COLORS.red
                        : item.score >= 50
                          ? CHART_COLORS.amber
                          : CHART_COLORS.blue
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-3 flex items-start gap-2 border-t border-neutral-100 pt-3 text-xs leading-5 text-neutral-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <p>
          The route dataset has no timestamped risk history. This is a current snapshot, not a
          historical trend.
        </p>
      </div>
    </section>
  );
}

export function AnalyticsPage() {
  const analytics = getAnalyticsSnapshot();
  const totalRoutes = analytics.routeAccessibility.reduce((sum, item) => sum + item.count, 0);
  const totalVehicles = analytics.vehicleStatus.reduce((sum, item) => sum + item.count, 0);
  const totalIncidents = analytics.incidentSeverity.reduce((sum, item) => sum + item.count, 0);
  const totalDeliveries = analytics.deliveryStatus.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex min-h-full flex-col gap-5 p-4 lg:p-6">
      <header className="flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Analytics</h1>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              Analytics based on simulated application data. Scan current route, fleet, incident,
              and delivery conditions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <ShieldCheck className="h-4 w-4 text-neutral-400" />
          <span>Source-aligned demo view</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard
          icon={RouteIcon}
          title="Route accessibility"
          description="Accessible, at-risk shown as Partially Accessible, or blocked."
          total={totalRoutes}
          data={analytics.routeAccessibility}
          dataName="Routes"
        />
        <AnalyticsCard
          icon={Truck}
          title="Vehicle status"
          description="Fleet status from the Vehicles page source."
          total={totalVehicles}
          data={analytics.vehicleStatus}
          dataName="Vehicles"
        />
        <AnalyticsCard
          icon={AlertTriangle}
          title="Incident severity"
          description="Reported incidents grouped by severity."
          total={totalIncidents}
          data={analytics.incidentSeverity}
          dataName="Incidents"
        />
        <AnalyticsCard
          icon={Package}
          title="Delivery status"
          description="Delivery records grouped by their current status."
          total={totalDeliveries}
          data={analytics.deliveryStatus}
          dataName="Deliveries"
          height={250}
        />
      </div>

      <RouteRiskChart data={analytics.routeRiskSnapshot} />

      <footer className="flex items-center justify-center gap-2 pb-1 text-center text-xs text-neutral-500">
        <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
        <span>Simulated analytics only — not live operational measurements</span>
      </footer>
    </div>
  );
}
import { Check, CircleDot, Truck } from 'lucide-react';
import type { DeliveryStatus } from '@/types';

const stages: DeliveryStatus[] = ['Planned', 'In Transit', 'Delivered'];

function stageIndex(status: DeliveryStatus) {
  if (status === 'Delivered') return 2;
  if (status === 'Planned') return 0;
  return 1;
}

export function DeliveryProgress({ status }: { status: DeliveryStatus }) {
  const activeStage = stageIndex(status);

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3" data-testid="delivery-progress">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Delivery stage</p>
        <p className="text-xs text-neutral-400">Based on simulated status</p>
      </div>
      <div className="flex items-start">
        {stages.map((stage, index) => {
          const isComplete = index < activeStage || status === 'Delivered';
          const isCurrent = index === activeStage;
          const Icon = index === 0 ? CircleDot : index === 1 ? Truck : Check;
          return (
            <div key={stage} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                    isComplete || isCurrent
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className={`text-center text-[11px] ${isCurrent ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}>
                  {stage}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div className={`mt-3.5 h-px flex-1 ${index < activeStage ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {status === 'Delayed' || status === 'At Risk' ? (
        <p className="mt-3 border-t border-neutral-200 pt-2 text-xs font-medium text-amber-700">
          Exception status: {status}. This stage view is a static demo indicator, not live tracking.
        </p>
      ) : null}
    </div>
  );
}
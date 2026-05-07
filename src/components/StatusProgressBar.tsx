import { LeadStatus } from '../api/apiSlice';

export const leadStatusSteps: { value: LeadStatus; label: string; colorClass: string; activeClass: string }[] = [
  {
    value: LeadStatus.New,
    label: 'New',
    colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
    activeClass: 'bg-blue-600 text-white border-blue-600',
  },
  {
    value: LeadStatus.Contacted,
    label: 'Contacted',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
    activeClass: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: LeadStatus.Scheduled,
    label: 'Scheduled',
    colorClass: 'text-purple-700 bg-purple-50 border-purple-200',
    activeClass: 'bg-purple-600 text-white border-purple-600',
  },
  {
    value: LeadStatus.Converted,
    label: 'Converted',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    activeClass: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    value: LeadStatus.Lost,
    label: 'Lost',
    colorClass: 'text-red-700 bg-red-50 border-red-200',
    activeClass: 'bg-red-600 text-white border-red-600',
  },
];

export const getLeadStatusMeta = (status: LeadStatus) =>
  leadStatusSteps.find((step) => step.value === status) ?? leadStatusSteps[0];

type StatusProgressBarProps = {
  currentStatus: LeadStatus;
  disabled?: boolean;
  onStatusChange: (status: LeadStatus) => void;
};

const StatusProgressBar = ({ currentStatus, disabled, onStatusChange }: StatusProgressBarProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {leadStatusSteps.map((step) => {
        const isActive = step.value === currentStatus;

        return (
          <button
            key={step.value}
            type="button"
            disabled={disabled}
            onClick={() => onStatusChange(step.value)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
              isActive ? step.activeClass : step.colorClass
            } ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90'}`}
          >
            {step.label}
          </button>
        );
      })}
    </div>
  );
};

export default StatusProgressBar;

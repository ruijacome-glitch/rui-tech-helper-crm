type StepperStep = { value: string; label: string };

export function Stepper({
  steps,
  current,
  onAdvance,
  advancing,
}: {
  steps: readonly StepperStep[];
  current: string;
  onAdvance: (nextValue: string) => void;
  advancing: boolean;
}) {
  const currentIndex = steps.findIndex((s) => s.value === current);
  const nextStep = currentIndex >= 0 && currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {steps.map((step, index) => (
          <div key={step.value} className="flex items-center">
            <div className="flex min-w-[90px] flex-col items-center">
              <div
                className={
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ' +
                  (index < currentIndex
                    ? 'bg-emerald-500 text-white'
                    : index === currentIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground')
                }
              >
                {index < currentIndex ? '✓' : index + 1}
              </div>
              <span
                className={
                  'mt-1 text-center text-[11px] ' + (index === currentIndex ? 'font-semibold text-foreground' : 'text-muted-foreground')
                }
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={'mx-1 h-0.5 w-8 ' + (index < currentIndex ? 'bg-emerald-500' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>
      {nextStep && (
        <button
          onClick={() => onAdvance(nextStep.value)}
          disabled={advancing}
          className="mt-2 cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {advancing ? 'A avançar...' : `Avançar → ${nextStep.label}`}
        </button>
      )}
    </div>
  );
}

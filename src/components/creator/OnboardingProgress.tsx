'use client';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = [
  'Eligibility',
  'Category',
  'Profile',
  'Pricing',
  'Review',
  'Verify',
  'Payout',
  'Done',
];

export const OnboardingProgress = ({ currentStep, totalSteps }: OnboardingProgressProps) => {
  return (
    <div className="mb-6">
      {/* Step indicator */}
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">
          Step {currentStep} of {totalSteps}: {STEP_LABELS[currentStep - 1] || 'Unknown'}
        </span>
        <span className="text-muted-foreground">
          {Math.round((currentStep / totalSteps) * 100)}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="mt-3 flex justify-between">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              i + 1 < currentStep
                ? 'bg-primary text-primary-foreground'
                : i + 1 === currentStep
                  ? 'bg-primary/20 text-primary ring-2 ring-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1 < currentStep ? '✓' : i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

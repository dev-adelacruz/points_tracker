import React from 'react';

const STEP_PRESETS = [100, 1_000, 5_000];

interface CoinStepperProps {
  value: string;
  onChange: (value: string) => void;
  /** Default step increment. Defaults to 1000. */
  defaultStep?: number;
}

const CoinStepper: React.FC<CoinStepperProps> = ({ value, onChange, defaultStep = 1_000 }) => {
  const [step, setStep] = React.useState(defaultStep);
  const numeric = Math.max(0, Number(value) || 0);

  const decrement = () => onChange(String(Math.max(0, numeric - step)));
  const increment = () => onChange(String(numeric + step));

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* Stepper row */}
      <div className="flex items-center gap-1">
        {/* Decrement */}
        <button
          type="button"
          onClick={decrement}
          disabled={numeric <= 0}
          aria-label="Decrease coins"
          className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-100 text-base font-bold select-none"
        >
          −
        </button>

        {/* Editable value — acts as both display and raw input */}
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || Number(v) >= 0) onChange(v);
          }}
          className="w-20 sm:w-24 text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
          aria-label="Coin value"
        />

        {/* Increment */}
        <button
          type="button"
          onClick={increment}
          aria-label="Increase coins"
          className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-100 text-base font-bold select-none"
        >
          +
        </button>
      </div>

      {/* Step presets */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-400 mr-0.5">step:</span>
        {STEP_PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
              step === s
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {s >= 1_000 ? `${s / 1_000}k` : s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoinStepper;

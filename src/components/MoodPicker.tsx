import React from 'react';
import { Frown, Annoyed, Meh, Smile, Laugh, type LucideIcon } from 'lucide-react';
import { moodLabels, type MoodValue } from '../services/wellbeingService';

export const moodIcons: Record<MoodValue, LucideIcon> = {
  1: Frown,
  2: Annoyed,
  3: Meh,
  4: Smile,
  5: Laugh,
};

interface MoodPickerProps {
  value: MoodValue | null;
  onSelect: (mood: MoodValue) => void;
  disabled?: boolean;
}

export const MoodPicker: React.FC<MoodPickerProps> = ({ value, onSelect, disabled }) => (
  <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="How are you feeling?">
    {([1, 2, 3, 4, 5] as MoodValue[]).map(mood => {
      const Icon = moodIcons[mood];
      const selected = value === mood;
      return (
        <button
          key={mood}
          type="button"
          role="radio"
          aria-checked={selected}
          disabled={disabled}
          onClick={() => onSelect(mood)}
          className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed ${
            selected
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-line bg-surface text-ink-muted hover:border-brand-200 hover:text-ink'
          }`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
          {moodLabels[mood]}
        </button>
      );
    })}
  </div>
);

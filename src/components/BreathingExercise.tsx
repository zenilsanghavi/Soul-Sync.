import React, { useEffect, useRef, useState } from 'react';
import { X, Wind } from 'lucide-react';

// A longer out-breath than in-breath is a common, gentle calming pattern
const phases = [
  { name: 'Breathe in', seconds: 4, scale: 1 },
  { name: 'Hold', seconds: 4, scale: 1 },
  { name: 'Breathe out', seconds: 6, scale: 0.55 },
] as const;

const TOTAL_ROUNDS = 5;

interface BreathingExerciseProps {
  open: boolean;
  onClose: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  // Phase, countdown and round change together, so they live in one state object
  const [tick, setTick] = useState({ phaseIndex: 0, secondsLeft: phases[0].seconds as number, round: 1 });
  const { phaseIndex, secondsLeft, round } = tick;

  // Native <dialog> gives focus trapping and Escape-to-close for free
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const reset = () => setTick({ phaseIndex: 0, secondsLeft: phases[0].seconds, round: 1 });

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setFinished(false);
      reset();
    }
  }, [open]);

  // One tick per second drives the countdown, phase changes and rounds
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTick(prev => {
        if (prev.secondsLeft > 1) return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        const nextPhase = (prev.phaseIndex + 1) % phases.length;
        const nextRound = nextPhase === 0 ? prev.round + 1 : prev.round;
        return { phaseIndex: nextPhase, secondsLeft: phases[nextPhase].seconds, round: nextRound };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  // Stop after the last out-breath
  useEffect(() => {
    if (running && round > TOTAL_ROUNDS) {
      setRunning(false);
      setFinished(true);
      reset();
    }
  }, [running, round]);

  const start = () => {
    setFinished(false);
    reset();
    setRunning(true);
  };

  const phase = phases[phaseIndex];
  // Before starting, the circle rests small; while running it grows/holds/shrinks with the phase
  const scale = running ? phase.scale : 0.55;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      className="w-[min(92vw,420px)] rounded-3xl border border-line bg-surface p-0 text-ink shadow-soft backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      aria-labelledby="breathing-title"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="breathing-title" className="text-2xl font-semibold">Breathe with me</h2>
            <p className="mt-1 text-sm text-ink-muted">{TOTAL_ROUNDS} slow rounds, about a minute.</p>
          </div>
          <button onClick={onClose} className="btn-ghost -mr-2 -mt-1 h-11 w-11 px-0" aria-label="Close breathing exercise">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="relative mx-auto my-8 flex h-56 w-56 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-brand-50" aria-hidden="true" />
          <div
            className="absolute inset-4 rounded-full bg-brand-100 ease-in-out motion-reduce:!transform-none"
            style={{ transform: `scale(${scale})`, transitionProperty: 'transform', transitionDuration: running ? `${phase.seconds}s` : '600ms' }}
            aria-hidden="true"
          />
          <div className="relative text-center" aria-live="polite" aria-atomic="true">
            {finished ? (
              <p className="font-heading text-xl font-semibold text-brand-700">Well done</p>
            ) : running ? (
              <>
                <p className="font-heading text-xl font-semibold text-brand-700">{phase.name}</p>
                <p className="mt-1 text-sm text-ink-muted">{secondsLeft}</p>
              </>
            ) : (
              <Wind className="h-8 w-8 text-brand-600" aria-hidden="true" />
            )}
          </div>
        </div>

        <p className="text-center text-sm text-ink-muted" aria-live="polite">
          {finished
            ? 'Notice how you feel now. You can go again any time.'
            : running
              ? `Round ${round} of ${TOTAL_ROUNDS}`
              : 'In through your nose for 4, hold for 4, out slowly for 6.'}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          {running ? (
            <button onClick={() => setRunning(false)} className="btn-secondary">Pause</button>
          ) : (
            <button onClick={start} className="btn-primary">{finished ? 'Go again' : 'Start'}</button>
          )}
          {(finished || running) && <button onClick={onClose} className="btn-ghost">Back to chat</button>}
        </div>
      </div>
    </dialog>
  );
};

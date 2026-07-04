"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Timer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Instruction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CookingModeProps {
  title: string;
  instructions: Instruction[];
  onClose: () => void;
}

export function CookingMode({
  title,
  instructions,
  onClose,
}: CookingModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  const step = instructions[currentStep];

  useEffect(() => {
    if (!timerActive || timerSeconds === null) return;
    if (timerSeconds <= 0) {
      setTimerActive(false);
      if (typeof window !== "undefined" && "Notification" in window) {
        new Notification("Timer done!", {
          body: `Step ${currentStep + 1} timer finished`,
        });
      }
      return;
    }
    const interval = setInterval(() => {
      setTimerSeconds((s) => (s !== null ? s - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, currentStep]);

  const startTimer = useCallback((minutes: number) => {
    setTimerSeconds(minutes * 60);
    setTimerActive(true);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleComplete = () => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(currentStep)) {
        next.delete(currentStep);
      } else {
        next.add(currentStep);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-page cooking-mode flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border bg-elevated">
        <h1 className="font-serif text-xl font-semibold text-fg truncate flex-1">
          {title}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Exit cooking mode"
        >
          <X className="h-6 w-6" />
        </Button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <div className="text-sm text-fg-secondary mb-4">
          Step {currentStep + 1} of {instructions.length}
        </div>

        <div
          className={cn(
            "step-text text-center text-fg mb-8 transition-opacity",
            completedSteps.has(currentStep) && "opacity-50 line-through",
          )}
        >
          {step?.text}
        </div>

        {step?.timer_minutes && (
          <div className="mb-8">
            {timerActive && timerSeconds !== null ? (
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-accent mb-2">
                  {formatTimer(timerSeconds)}
                </div>
                <Button variant="outline" onClick={() => setTimerActive(false)}>
                  Pause
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => startTimer(step.timer_minutes!)}>
                <Timer className="h-5 w-5 mr-2" />
                Start {step.timer_minutes} min timer
              </Button>
            )}
          </div>
        )}

        <Button
          variant={completedSteps.has(currentStep) ? "secondary" : "outline"}
          size="lg"
          onClick={toggleComplete}
          className="mb-8"
        >
          <Check className="h-5 w-5 mr-2" />
          {completedSteps.has(currentStep) ? "Completed" : "Mark as done"}
        </Button>
      </div>

      <footer className="flex items-center justify-between p-4 border-t border-border bg-elevated gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="flex-1"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Previous
        </Button>
        <Button
          size="lg"
          onClick={() =>
            setCurrentStep((s) => Math.min(instructions.length - 1, s + 1))
          }
          disabled={currentStep === instructions.length - 1}
          className="flex-1"
        >
          Next
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </footer>
    </div>
  );
}

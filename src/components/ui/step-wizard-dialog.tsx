import * as React from "react"
import { createPortal } from "react-dom"
import { X, Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "cn"
import { Button } from "./button"

export interface WizardStep {
  id: string
  title: string
  shortTitle?: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface StepWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  badgeText?: string
  steps: WizardStep[]
  currentStep: number
  onStepChange: (stepIndex: number) => void
  onNext: () => Promise<boolean> | boolean
  onPrev: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  submitLabel?: string
  children: React.ReactNode
  maxWidth?: string
}

export function StepWizardDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  badgeText,
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save & Finish",
  children,
  maxWidth = "max-w-2xl",
}: StepWizardDialogProps) {
  // Lock body scroll and handle Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    if (open) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onOpenChange])

  if (!open) return null

  const isLastStep = currentStep === steps.length - 1
  const activeStep = steps[currentStep] || steps[0]
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100)

  const handleNextClick = async () => {
    const canAdvance = await onNext()
    if (canAdvance) {
      if (isLastStep) {
        onSubmit()
      } else {
        onStepChange(currentStep + 1)
      }
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop with subtle blur */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Stepper Card */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 flex flex-col w-full max-h-[92vh] rounded-xl border border-border bg-card shadow-2xl transition-all animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden",
          maxWidth
        )}
      >
        {/* Top Header: Title, Badge, Close */}
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  {title}
                </h3>
                {badgeText && (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.25 text-[10px] font-semibold text-primary">
                    {badgeText}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper Navigation Strip */}
        <div className="border-b border-border/60 bg-card px-4 sm:px-6 py-2.5">
          {/* Desktop Steps Display */}
          <div className="hidden sm:flex items-center justify-between">
            {steps.map((step, idx) => {
              const isDone = idx < currentStep
              const isCurrent = idx === currentStep

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    disabled={idx > currentStep}
                    onClick={() => {
                      if (idx < currentStep) onStepChange(idx)
                    }}
                    className={cn(
                      "flex items-center gap-2 group transition-all text-left",
                      idx <= currentStep ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all border",
                        isDone
                          ? "bg-primary text-primary-foreground border-primary"
                          : isCurrent
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-border bg-muted/40 text-muted-foreground"
                      )}
                    >
                      {isDone ? (
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-xs font-medium leading-none",
                          isCurrent
                            ? "text-foreground font-semibold"
                            : isDone
                            ? "text-muted-foreground"
                            : "text-muted-foreground/70"
                        )}
                      >
                        {step.shortTitle || step.title}
                      </span>
                    </div>
                  </button>

                  {idx < steps.length - 1 && (
                    <div className="mx-3 flex-1 h-[2px] rounded-full bg-border overflow-hidden">
                      <div
                        className={cn(
                          "h-full bg-primary transition-all duration-300",
                          idx < currentStep ? "w-full" : "w-0"
                        )}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile Steps Display */}
          <div className="sm:hidden space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {currentStep + 1}
                </span>
                <span>{activeStep.title}</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            {/* Progress track */}
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Guide / Context Banner */}
        <div className="px-5 py-2 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {activeStep.description}
          </p>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 hidden sm:inline">
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Dynamic Step Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Navigation Action Footer */}
        <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 bg-card mt-auto">
          <div>
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrev}
                className="gap-1 cursor-pointer text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs text-muted-foreground cursor-pointer"
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isLastStep ? "Ready to submit" : `Next: ${steps[currentStep + 1]?.shortTitle || steps[currentStep + 1]?.title}`}
            </span>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleNextClick}
              className="gap-1.5 cursor-pointer text-xs font-medium shadow-xs"
            >
              <span>{isLastStep ? submitLabel : "Continue"}</span>
              {!isLastStep && <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

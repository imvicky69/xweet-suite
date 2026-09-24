import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  AlertTriangle,
  Save,
  Trash2,
} from "lucide-react"
import { Button } from "./button"

export interface FlowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalSteps: number
  currentStep: number
  onNext: () => void | Promise<void>
  onPrev: () => void
  onSubmit: () => void | Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  badgeText?: string
  children: React.ReactNode
  hasUnsavedChanges?: boolean
  onDiscard?: () => void
  onSave?: () => void | Promise<void>
}

export function FlowDialog({
  open,
  onOpenChange,
  totalSteps,
  currentStep,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Create Lead",
  badgeText,
  children,
  hasUnsavedChanges = false,
  onDiscard,
  onSave,
}: FlowDialogProps) {
  const [showExitConfirm, setShowExitConfirm] = React.useState(false)

  const isLast = currentStep === totalSteps - 1
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100)

  // Reset confirmation state whenever dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setShowExitConfirm(false)
    }
  }, [open])

  // Intercept quit attempts when there are unsaved changes
  const handleRequestClose = React.useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true)
    } else {
      onOpenChange(false)
    }
  }, [hasUnsavedChanges, onOpenChange])

  // Escape key & body overflow management
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        if (showExitConfirm) {
          setShowExitConfirm(false)
        } else {
          handleRequestClose()
        }
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
  }, [open, showExitConfirm, handleRequestClose])

  if (!open) return null

  const handleNext = () => {
    if (isLast) {
      onSubmit()
    } else {
      onNext()
    }
  }

  const handleConfirmDiscard = () => {
    setShowExitConfirm(false)
    if (onDiscard) onDiscard()
    onOpenChange(false)
  }

  const handleConfirmSave = async () => {
    setShowExitConfirm(false)
    if (onSave) {
      await onSave()
    } else {
      await onSubmit()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-200"
        onClick={handleRequestClose}
        aria-hidden="true"
      />

      {/* Spacious Full-Focus Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-50 flex flex-col w-full max-w-2xl min-h-[460px] sm:min-h-[500px] rounded-2xl border border-border/80 bg-card shadow-2xl transition-all animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Sleek Minimal Top Progress Line (No ugly step bubbles!) */}
        <div className="h-1 w-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 shadow-[0_0_8px_var(--accent-glow)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              <span>{badgeText || "Step " + (currentStep + 1)}</span>
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {currentStep + 1} of {totalSteps}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Single-Focused Question Body */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-6 sm:py-8 overflow-y-auto">
          {children}
        </div>

        {/* Bottom Control Strip with Keyboard Hints */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-4 border-t border-border/50 bg-secondary/20">
          <div>
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onPrev}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground/60 hidden sm:inline">
                ESC to cancel
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
              <span>Press</span>
              <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono shadow-2xs">
                Enter ↵
              </kbd>
            </span>

            <Button
              type="button"
              size="default"
              disabled={isSubmitting}
              onClick={handleNext}
              className="gap-2 px-5 py-2 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <span>{isLast ? submitLabel : "Continue"}</span>
              {isLast ? (
                <CornerDownLeft className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Confirmation Overlay Modal */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-60 flex items-center justify-center p-4 sm:p-6 bg-background/85 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Unsaved Changes Detected
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You have made changes in this lead form. Do you want to save your progress before leaving or discard all changes?
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExitConfirm(false)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer order-3 sm:order-1"
                >
                  Keep Editing
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDiscard}
                  className="gap-1.5 text-xs font-medium cursor-pointer order-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Discard Changes</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmSave}
                  className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs order-1 sm:order-3"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Progress</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

import { cn } from "cn"

interface AppLogoProps {
  className?: string
  variant?: "dark" | "primary" | "plain"
  size?: "xs" | "sm" | "md" | "lg"
}

/**
 * AppLogo Component
 * Renders the official white XS clear mark (/clear.png).
 * Because /clear.png is pure white with transparent background, it is safely
 * framed inside a high-contrast container (dark-zinc or primary blue) to guarantee
 * perfect visibility across all light and dark themes.
 */
export function AppLogo({
  className,
  variant = "dark",
  size = "md",
}: AppLogoProps) {
  const containerSizes = {
    xs: "h-6 w-9 p-0.5 rounded",
    sm: "h-7 w-10 p-1 rounded-md",
    md: "h-8 w-12 p-1 rounded-md",
    lg: "h-9 w-14 p-1.5 rounded-lg",
  }[size]

  const imgSizes = {
    xs: "h-3.5 max-w-full",
    sm: "h-4.5 max-w-full",
    md: "h-5 max-w-full",
    lg: "h-6 max-w-full",
  }[size]

  if (variant === "plain") {
    return (
      <img
        src="/clear.png"
        alt="Xweet Suite Logo"
        className={cn(imgSizes, "w-auto object-contain filter drop-shadow-xs", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 select-none",
        variant === "dark"
          ? "bg-zinc-950 border border-zinc-800 text-white"
          : "bg-primary border border-primary/30 text-white",
        containerSizes,
        className
      )}
      title="Xweet Suite"
    >
      <img
        src="/clear.png"
        alt="Xweet Suite Logo"
        className={cn(imgSizes, "w-auto object-contain")}
      />
    </div>
  )
}

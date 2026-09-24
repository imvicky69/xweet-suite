import * as React from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLogo } from "@/components/ui/app-logo"
import { useWorkspace } from "@/context/WorkspaceContext"
import { toast } from "sonner"
import {
  ChevronLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Briefcase,
} from "lucide-react"

export function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}

interface AuthPageProps {
  initialMode?: "login" | "signup"
}

export default function AuthPage({ initialMode }: AuthPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { settings, updateSettings } = useWorkspace()

  // Determine mode from prop or URL
  const isSignUp = initialMode === "signup" || location.pathname.includes("signup")

  // Form states
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState(isSignUp ? "" : settings.accountEmail || "rajvi@xweet.io")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [accountType, setAccountType] = React.useState<"agency" | "client">("agency")
  const [rememberMe, setRememberMe] = React.useState(true)
  const [agreeTerms, setAgreeTerms] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState("")
  const [forgotSubmitted, setForgotSubmitted] = React.useState(false)

  // Password strength calculation for sign up
  const passwordStrength = React.useMemo(() => {
    if (!password) return { score: 0, label: "Empty", color: "bg-muted" }
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" }
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" }
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" }
    return { score: 4, label: "Strong", color: "bg-emerald-500" }
  }, [password])

  // Handle Google Login / Sign Up
  const handleGoogleAuth = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      const mockName = "Rajvi Sharma"
      const mockEmail = "rajvi.sharma@gmail.com"
      updateSettings({
        accountOwnerName: mockName,
        accountEmail: mockEmail,
      })
      toast.success(isSignUp ? "Account created with Google!" : "Logged in with Google!", {
        description: `Welcome to Xweet Suite, ${mockName}`,
      })
      navigate("/")
    }, 700)
  }

  // Handle Email + Password Submit
  const handleEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (isSignUp && !fullName.trim()) {
      toast.error("Please enter your full name")
      return
    }

    if (isSignUp && !agreeTerms) {
      toast.error("Please agree to the Terms of Service")
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      const name = isSignUp ? fullName.trim() : settings.accountOwnerName || "Rajvi S."
      updateSettings({
        accountOwnerName: name,
        accountEmail: email.trim(),
      })
      toast.success(isSignUp ? "Welcome to Xweet Suite!" : "Welcome back!", {
        description: `Signed in as ${email.trim()}`,
      })
      navigate("/")
    }, 600)
  }

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !forgotEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }
    setForgotSubmitted(true)
    toast.success("Password reset instructions sent to your email")
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between text-foreground antialiased selection:bg-primary/20">
      {/* 1. Upwork-Style Minimal Top Header */}
      <header className="w-full border-b border-border/70 bg-card/60 backdrop-blur-sm px-6 lg:px-12 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
          <AppLogo variant="dark" size="sm" />
          <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
            Xweet Suite
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-muted-foreground hidden sm:inline">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          <Link
            to={isSignUp ? "/login" : "/signup"}
            className="font-semibold text-primary hover:underline cursor-pointer ml-1"
          >
            {isSignUp ? "Log in" : "Sign up"}
          </Link>
        </div>
      </header>

      {/* 2. Main Centered Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[460px] bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Back button & Heading */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(isSignUp ? "/login" : "/")}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Go back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {isSignUp ? "Sign up to scale your deals" : "Log in to your workspace"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground pl-10">
              {isSignUp
                ? "Join India's premier freelance command center & agency pipeline HQ."
                : "Welcome back! Enter your credentials to access your active deals."}
            </p>
          </div>

          {/* Social Auth: Continue with Google (NO Apple per user instruction) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-border hover:border-border/80 bg-background hover:bg-secondary/40 text-foreground font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-60"
            >
              <GoogleIcon className="h-4 w-4 shrink-0" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold">
              <span className="bg-card px-3 text-muted-foreground tracking-wider">or</span>
            </div>
          </div>

          {/* Account Role Selector (on Sign Up) */}
          {isSignUp && (
            <div className="mb-4 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground block">
                I am signing up as:
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("agency")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    accountType === "agency"
                      ? "border-primary bg-primary/5 text-primary shadow-2xs font-semibold"
                      : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs leading-none">Freelancer / Agency</span>
                    <span className="text-[10px] opacity-75 leading-tight block mt-0.5">Manage Deals</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType("client")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    accountType === "client"
                      ? "border-primary bg-primary/5 text-primary shadow-2xs font-semibold"
                      : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <Building2 className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs leading-none">Client / Founder</span>
                    <span className="text-[10px] opacity-75 leading-tight block mt-0.5">Hire Talent</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* MAIN Email & Password Credentials Form */}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-3.5">
            {/* Full Name on Sign Up */}
            {isSignUp && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rajvi Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 pl-10 text-xs sm:text-sm bg-background"
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="rajvi@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 pl-10 text-xs sm:text-sm bg-background"
                  required
                  autoFocus={!isSignUp}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotSubmitted(false)
                      setForgotModalOpen(true)
                    }}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pl-10 pr-10 text-xs sm:text-sm bg-background"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength meter on sign up */}
              {isSignUp && password.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-foreground">{passwordStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${passwordStrength.score >= 1 ? passwordStrength.color : "bg-transparent"}`} />
                    <div className={`h-full ${passwordStrength.score >= 2 ? passwordStrength.color : "bg-transparent"}`} />
                    <div className={`h-full ${passwordStrength.score >= 3 ? passwordStrength.color : "bg-transparent"}`} />
                    <div className={`h-full ${passwordStrength.score >= 4 ? passwordStrength.color : "bg-transparent"}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Checkboxes */}
            {isSignUp ? (
              <div className="pt-1">
                <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 cursor-pointer shrink-0"
                    required
                  />
                  <span>
                    Yes, I understand and agree to the{" "}
                    <span className="text-primary hover:underline">Terms of Service</span> and{" "}
                    <span className="text-primary hover:underline">Privacy Policy</span>.
                  </span>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <span>Keep me logged in on this device</span>
                </label>
              </div>
            )}

            {/* Primary Action Button (Electric Blue) */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2 cursor-pointer shadow-xs active:scale-[0.99] mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isSignUp ? "Creating workspace..." : "Verifying credentials..."}</span>
                </div>
              ) : (
                <>
                  <span>{isSignUp ? "Create My Account" : "Log In to Workspace"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Bottom Security Assurance */}
          <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-bit encrypted authentication • Workspace isolated</span>
          </div>
        </div>
      </main>

      {/* 3. Upwork-Style Minimal Footer */}
      <footer className="w-full border-t border-border/70 py-4 px-6 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto">
        <p>© 2026 Xweet Suite Inc. Indian Freelance Command HQ.</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
          <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
          <span className="hover:text-foreground cursor-pointer">Support Desk</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Reset your password</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your verified account email to receive recovery instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Check your inbox</span>
                </div>
                <p>We've sent a secure password reset link to <strong>{forgotEmail}</strong>.</p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-full text-xs"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Account Email</Label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="rajvi@agency.com"
                    required
                    autoFocus
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForgotModalOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="text-xs cursor-pointer">
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

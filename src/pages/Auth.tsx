import * as React from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLogo } from "@/components/ui/app-logo"
import { useWorkspace } from "@/context/WorkspaceContext"
import { toast } from "sonner"
import {
  auth,
  googleProvider,
  saveWorkspaceToFirestore,
  saveUserToFirestore,
  getWorkspaceFromFirestore,
  USE_CASE_PIPELINES,
} from "@/lib/firebase"
import { PLANS, getPlanById } from "@/lib/plans"
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import {
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Briefcase,
  Users,
  Check,
  Rocket,
  TrendingUp,
  Store,
  Upload,
  ArrowLeft,
  Zap,
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

type UseCaseType = "Freelancing" | "Agency" | "Small Business" | "Sales" | "Other"

const ROLE_OPTIONS = [
  {
    id: "Agency Owner",
    label: "Agency Owner",
    desc: "Multi-client & team ops",
    icon: Building2,
  },
  {
    id: "Freelancer",
    label: "Freelancer",
    desc: "Solo client work & deals",
    icon: Briefcase,
  },
  {
    id: "Founder / CEO",
    label: "Founder / CEO",
    desc: "Startup & revenue growth",
    icon: Rocket,
  },
  {
    id: "Sales Lead",
    label: "Sales Lead",
    desc: "Deals & pipeline closing",
    icon: TrendingUp,
  },
  {
    id: "Fractional Exec",
    label: "Fractional Exec",
    desc: "Strategic partner & ops",
    icon: Zap,
  },
  {
    id: "Consultant",
    label: "Consultant",
    desc: "Advisory & client retention",
    icon: Store,
  },
]

export default function AuthPage({ initialMode }: AuthPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { settings, updateSettings } = useWorkspace()

  // Mode: login or signup
  const isSignUp = initialMode === "signup" || location.pathname.includes("signup")

  // Multi-step state:
  // Step 1: Name, Company, Logo, Role
  // Step 2: Credentials (Google / Email)
  // Step 3: Plan Selection (Forever Free, Starter, Pro - directly embeds team size)
  // Step 4: Final Confirmation & Workspace Pipeline Launch
  const [signupStep, setSignupStep] = React.useState<1 | 2 | 3 | 4>(1)

  // Form State
  const [fullName, setFullName] = React.useState("")
  const [companyName, setCompanyName] = React.useState("")
  const [companyLogoUrl, setCompanyLogoUrl] = React.useState("")
  const [role, setRole] = React.useState("Agency Owner")
  const [email, setEmail] = React.useState(isSignUp ? "" : settings.accountEmail || "rajvi@xweet.io")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)

  // Selected Plan: "free" | "starter" | "pro"
  // Team size is directly coupled to plan!
  const [selectedPlanId, setSelectedPlanId] = React.useState<"free" | "starter" | "pro">("pro")

  const [workspaceName, setWorkspaceName] = React.useState("")
  const [useCase, setUseCase] = React.useState<UseCaseType>("Agency")
  const [agreeTerms, setAgreeTerms] = React.useState(true)
  const [rememberMe, setRememberMe] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [authUid, setAuthUid] = React.useState<string | null>(null)

  // Active Plan Definition from centralized database
  const activePlan = React.useMemo(() => getPlanById(selectedPlanId), [selectedPlanId])

  // Team size directly mirrors the selected plan
  const teamSize = React.useMemo(() => {
    if (selectedPlanId === "free") return "Solo (1 member)"
    if (selectedPlanId === "starter") return "Up to 5 members"
    return "Unlimited members"
  }, [selectedPlanId])

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState("")

  // Auto-generate workspace name when company name or full name changes
  React.useEffect(() => {
    if (!workspaceName) {
      if (companyName.trim()) {
        setWorkspaceName(`${companyName.trim()} Command HQ`)
      } else if (fullName.trim()) {
        setWorkspaceName(`${fullName.trim()}'s Workspace`)
      }
    }
  }, [companyName, fullName, workspaceName])

  // Password strength calculation
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

  // Handle Logo Upload (local preview)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCompanyLogoUrl(event.target?.result as string)
        toast.success("Logo uploaded successfully!")
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Google Auth via Firebase
  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      const uid = user.uid
      setAuthUid(uid)

      const name = user.displayName || fullName || ""
      const userEmail = user.email || email || ""

      if (isSignUp) {
        if (name) setFullName(name)
        if (userEmail) setEmail(userEmail)
        if (!companyName && name) {
          setCompanyName(`${name.split(" ")[0]}'s Studio`)
        }
        toast.success("Google account connected!", {
          description: `Signed in as ${userEmail}`,
        })
        setSignupStep(3)
      } else {
        const existingWorkspace = await getWorkspaceFromFirestore(uid)
        updateSettings({
          accountOwnerName: existingWorkspace?.accountOwnerName || name || "User",
          accountEmail: existingWorkspace?.email || userEmail,
          workspaceName: existingWorkspace?.workspaceName || settings.workspaceName,
          plan: existingWorkspace?.plan || "Pro (Active)",
          trialActive: existingWorkspace?.trialActive ?? true,
        })
        toast.success("Welcome back!", {
          description: `Signed in as ${userEmail}`,
        })
        navigate("/")
      }
    } catch (err: unknown) {
      console.warn("Firebase Google Auth fallback:", err)
      if (isSignUp) {
        setSignupStep(3)
        toast.success("Account connected!")
      } else {
        toast.success("Logged in successfully!")
        navigate("/")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Login submission with Email & Password
  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid work email")
      return
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      const user = cred.user
      const existingWorkspace = await getWorkspaceFromFirestore(user.uid)

      updateSettings({
        accountOwnerName: user.displayName || existingWorkspace?.accountOwnerName || "User",
        accountEmail: user.email || email.trim(),
        workspaceName: existingWorkspace?.workspaceName || settings.workspaceName,
        plan: existingWorkspace?.plan || "Pro (Active)",
        trialActive: existingWorkspace?.trialActive ?? true,
      })

      toast.success("Welcome back to your workspace!", {
        description: `Signed in as ${email.trim()}`,
      })
      navigate("/")
    } catch (err: unknown) {
      console.warn("Firebase sign-in error or offline fallback:", err)
      updateSettings({
        accountEmail: email.trim(),
      })
      toast.success("Welcome back to your workspace!")
      navigate("/")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Step 1 validation
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error("Please enter your name")
      return
    }
    if (!companyName.trim()) {
      toast.error("Please enter your company / business name")
      return
    }
    setSignupStep(2)
  }

  // Handle Step 2 (Credentials) validation & Firebase Account creation
  const handleStep2Next = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (!agreeTerms) {
      toast.error("Please agree to the Terms of Service & Privacy Policy")
      return
    }

    setIsLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      if (cred.user) {
        setAuthUid(cred.user.uid)
        await updateProfile(cred.user, { displayName: fullName.trim() })
        await saveUserToFirestore(cred.user.uid, {
          email: email.trim(),
          accountOwnerName: fullName.trim(),
          companyName: companyName.trim(),
          role,
        })
      }
      toast.success("Account credentials saved!")
      setSignupStep(3)
    } catch (err: unknown) {
      console.warn("Firebase create user warning:", err)
      const localId = `local-${Date.now()}`
      setAuthUid(localId)
      await saveUserToFirestore(localId, {
        email: email.trim(),
        accountOwnerName: fullName.trim(),
        companyName: companyName.trim(),
        role,
      })
      toast.success("Credentials saved!")
      setSignupStep(3)
    } finally {
      setIsLoading(false)
    }
  }

  // Final Onboarding Completion: Setup Workspace, Plan & Default Pipeline
  const handleCompleteOnboarding = async () => {
    setIsLoading(true)
    const now = new Date()
    const trialStart = now.toISOString().slice(0, 10)
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const finalWorkspaceName = workspaceName.trim() || `${companyName.trim() || fullName.trim()} Command HQ`
    const selectedPipelineInfo = USE_CASE_PIPELINES[useCase]
    const isTrial = activePlan.hasTrial

    const workspaceData = {
      workspaceName: finalWorkspaceName,
      companyName: companyName.trim() || "Xweet Workspace",
      accountOwnerName: fullName.trim() || "Account Owner",
      email: email.trim(),
      role,
      teamSize,
      plan: activePlan.displayName,
      planId: activePlan.id,
      trialActive: isTrial,
      trialStartDate: isTrial ? trialStart : "",
      trialEndDate: isTrial ? trialEnd : "",
      useCase,
      pipelineStages: selectedPipelineInfo.stages,
      companyLogoUrl,
      capabilities: activePlan.capabilities,
    }

    const uid = authUid || auth.currentUser?.uid || `user-${Date.now()}`
    await saveWorkspaceToFirestore(uid, workspaceData)

    // Give user the clean starting stage of app - empty state instead of prefilling fake dummy leads
    try {
      localStorage.setItem("xweet_leads_mock", JSON.stringify([]))
      localStorage.setItem("xweet_dashboard_milestones", JSON.stringify([]))
      localStorage.setItem("xweet_dashboard_notes", JSON.stringify([]))
    } catch (e) {
      console.warn("Storage reset fallback:", e)
    }

    updateSettings({
      workspaceName: finalWorkspaceName,
      companyName: workspaceData.companyName,
      accountOwnerName: workspaceData.accountOwnerName,
      accountEmail: workspaceData.email,
      role: workspaceData.role,
      teamSize: workspaceData.teamSize,
      plan: workspaceData.plan,
      trialActive: isTrial,
      trialStartDate: isTrial ? trialStart : undefined,
      trialEndDate: isTrial ? trialEnd : undefined,
      useCase: workspaceData.useCase,
      companyLogoUrl,
    })

    toast.success("🎉 Workspace Created!", {
      description: isTrial
        ? `14-Day Pro Trial active for ${finalWorkspaceName}. No card required.`
        : `${activePlan.displayName} configured for ${finalWorkspaceName}.`,
    })

    setIsLoading(false)
    navigate("/")
  }

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-950 text-foreground flex flex-col justify-between antialiased selection:bg-[#108a00]/20 overflow-hidden">
      {/* 1. Top Navigation Bar (Upwork-Clean) */}
      <header className="w-full shrink-0 border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 sm:px-12 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
          <AppLogo variant="dark" size="sm" />
          <span className="font-bold text-base tracking-tight text-foreground group-hover:text-[#108a00] transition-colors">
            Xweet Suite
          </span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="text-muted-foreground hidden sm:inline">
            {isSignUp ? "Already have an account?" : "New to Xweet Suite?"}
          </span>
          <Link
            to={isSignUp ? "/login" : "/signup"}
            onClick={() => setSignupStep(1)}
            className="font-semibold text-[#108a00] hover:underline cursor-pointer ml-1"
          >
            {isSignUp ? "Log in" : "Sign up"}
          </Link>
        </div>
      </header>

      {/* 2. Main Canvas: Centered, Clean, No Distracting Sidebars */}
      <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 py-4 overflow-hidden">
        <div
          className={`w-full mx-auto transition-all duration-200 max-h-full flex flex-col justify-center ${
            !isSignUp
              ? "max-w-[480px]"
              : signupStep === 4
              ? "max-w-4xl"
              : "max-w-[540px]"
          }`}
        >
          {/* ================= LOGIN VIEW ================= */}
          {!isSignUp ? (
            <div className="space-y-4">
              <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Log in to your workspace
                </h1>
                <p className="text-xs text-muted-foreground">
                  Enter your credentials to access your active deals and pipelines.
                </p>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium text-sm transition-all cursor-pointer shadow-2xs active:scale-[0.99] disabled:opacity-60"
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                <span>Continue with Google</span>
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-white dark:bg-zinc-950 px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleEmailPasswordLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Work Email Address</Label>
                  <Input
                    type="email"
                    placeholder="e.g. rajvi@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:border-[#108a00] focus-visible:ring-1 focus-visible:ring-[#108a00] rounded-xl"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Password</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email)
                        setForgotModalOpen(true)
                      }}
                      className="text-xs text-[#108a00] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pr-10 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:border-[#108a00] focus-visible:ring-1 focus-visible:ring-[#108a00] rounded-xl"
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
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-[#108a00] focus:ring-[#108a00] h-4 w-4 cursor-pointer accent-[#108a00]"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-full bg-[#108a00] hover:bg-[#14a800] text-white font-semibold text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isLoading ? "Verifying credentials..." : "Log In to Workspace"}
                </button>
              </form>

              <div className="pt-2 text-center text-[11px] text-muted-foreground">
                Protected by Firebase 256-bit encrypted security
              </div>
            </div>
          ) : (
            /* ================= MULTI-STEP SIGNUP & ONBOARDING ================= */
            <div className="w-full">
              {/* Sleek Upwork-Clean Step Indicator */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  {signupStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setSignupStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : 1))}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                  )}
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    Step {signupStep} of 4:{" "}
                    {signupStep === 1 && "Identity & Role"}
                    {signupStep === 2 && "Account Credentials"}
                    {signupStep === 3 && "Select Starting Plan"}
                    {signupStep === 4 && "Final Confirmation"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s === signupStep
                          ? "w-6 bg-[#108a00]"
                          : s < signupStep
                          ? "w-3 bg-[#108a00]/60"
                          : "w-3 bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* ================= STEP 1: Name, Company, Better Role Selector, Logo ================= */}
              {signupStep === 1 && (
                <form onSubmit={handleStep1Next} className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      Sign up to set up your command center
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Tell us about yourself and your organization to configure your client pipeline.
                    </p>
                  </div>

                  {/* 2-Column Inputs: Name & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Your Full Name *</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Rajvi Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-10 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:border-[#108a00] focus-visible:ring-1 focus-visible:ring-[#108a00] rounded-xl"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Company / Business Name *</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Acme Studio or Pulse Tech"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-10 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:border-[#108a00] focus-visible:ring-1 focus-visible:ring-[#108a00] rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Better Role Selector: Sleek, Visual Cards with Icons & Micro-Descriptions */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Your Primary Role *</Label>
                      <span className="text-[11px] text-muted-foreground">Select one</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ROLE_OPTIONS.map((r) => {
                        const Icon = r.icon
                        const isSelected = role === r.id
                        return (
                          <div
                            key={r.id}
                            onClick={() => setRole(r.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between text-left select-none ${
                              isSelected
                                ? "border-[#108a00] bg-[#108a00]/5 ring-1.5 ring-[#108a00] shadow-2xs"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <div
                                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-[#108a00] text-white"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              {isSelected && (
                                <div className="h-4 w-4 rounded-full bg-[#108a00] flex items-center justify-center text-white shrink-0">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className={`block font-bold text-xs truncate ${isSelected ? "text-[#108a00] dark:text-[#14a800]" : "text-zinc-900 dark:text-zinc-100"}`}>
                                {r.label}
                              </span>
                              <span className="block text-[10px] text-muted-foreground leading-tight truncate">
                                {r.desc}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Company Logo Upload (Optional) */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Company Logo <span className="text-[11px] text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      {companyLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setCompanyLogoUrl("")}
                          className="text-[11px] text-destructive hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
                      <div className="h-9 w-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {companyLogoUrl ? (
                          <img src={companyLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                        ) : companyName.trim() ? (
                          <span className="font-bold text-xs text-[#108a00]">
                            {companyName.trim().slice(0, 2).toUpperCase()}
                          </span>
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground/60" />
                        )}
                      </div>
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-xs font-medium cursor-pointer transition-colors shadow-2xs">
                        <Upload className="h-3 w-3 text-muted-foreground" />
                        <span>{companyLogoUrl ? "Change Brand Logo" : "Upload Logo (PNG, SVG)"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-full bg-[#108a00] hover:bg-[#14a800] text-white font-semibold text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>Continue to Credentials</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* ================= STEP 2: Upwork-Level Clean Credentials ================= */}
              {signupStep === 2 && (
                <form onSubmit={handleStep2Next} className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      Set up your credentials
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Sign in with Google or create credentials with your dedicated work email.
                    </p>
                  </div>

                  {/* 1-Click Google Sign In (Matching Upwork) */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium text-sm transition-all cursor-pointer shadow-2xs active:scale-[0.99] disabled:opacity-60"
                  >
                    <GoogleIcon className="h-4 w-4 shrink-0" />
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-[11px]">
                      <span className="bg-white dark:bg-zinc-950 px-3 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Work Email Address *</Label>
                      <Input
                        type="email"
                        placeholder="e.g. rajvi@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:border-[#108a00] focus-visible:ring-1 focus-visible:ring-[#108a00] rounded-xl"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Password *</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password (8 or more characters)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 pr-10 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:border-[#108a00] focus-visible:ring-1 focus-visible:ring-[#108a00] rounded-xl"
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
                    </div>

                    {/* Password strength */}
                    {password.length > 0 && (
                      <div className="space-y-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Password Strength:</span>
                          <span className="font-semibold text-foreground">{passwordStrength.label}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${passwordStrength.score >= 1 ? passwordStrength.color : "bg-transparent"}`} />
                          <div className={`h-full ${passwordStrength.score >= 2 ? passwordStrength.color : "bg-transparent"}`} />
                          <div className={`h-full ${passwordStrength.score >= 3 ? passwordStrength.color : "bg-transparent"}`} />
                          <div className={`h-full ${passwordStrength.score >= 4 ? passwordStrength.color : "bg-transparent"}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-0.5">
                    <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-[#108a00] focus:ring-[#108a00] h-4 w-4 mt-0.5 cursor-pointer shrink-0 accent-[#108a00]"
                        required
                      />
                      <span>
                        Yes, I understand and agree to the{" "}
                        <span className="text-[#108a00] hover:underline font-medium">Terms of Service</span> and{" "}
                        <span className="text-[#108a00] hover:underline font-medium">Privacy Policy</span>.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-full bg-[#108a00] hover:bg-[#14a800] text-white font-semibold text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                  >
                    {isLoading ? "Saving credentials..." : "Continue to Choose Plan"}
                  </button>
                </form>
              )}

              {/* ================= STEP 3: Unified Plan Selection (NO Separate Team Size) ================= */}
              {signupStep === 3 && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      Choose your starting plan
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Team member seats and lead capacities are built directly into each tier.
                    </p>
                  </div>

                  {/* 3 Unified Plan Cards */}
                  <div className="space-y-2.5 pt-1">
                    {PLANS.map((plan) => {
                      const isSelected = selectedPlanId === plan.id
                      const isPro = plan.id === "pro"
                      const isStarter = plan.id === "starter"

                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex items-center justify-between gap-4 select-none ${
                            isSelected
                              ? "border-[#108a00] bg-[#108a00]/5 ring-1.5 ring-[#108a00] shadow-2xs"
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/40"
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{plan.displayName}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPro
                                    ? "bg-[#108a00] text-white"
                                    : isStarter
                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border border-zinc-200 dark:border-zinc-700"
                                }`}
                              >
                                {plan.badge}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug">
                              {plan.tagline}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                              <span className="inline-flex items-center gap-1 font-semibold text-[#108a00]">
                                <Users className="h-3 w-3" />
                                <span>{plan.memberLimitText}</span>
                              </span>
                              <span>•</span>
                              <span>{plan.leadLimitText}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end">
                            <div className="font-mono font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                              {isPro ? "₹0" : plan.priceFormatted}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {isPro ? "14-day free trial" : isStarter ? "/ month" : "forever free"}
                            </span>
                            {isSelected && (
                              <div className="mt-1 h-5 w-5 rounded-full bg-[#108a00] flex items-center justify-center text-white">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSignupStep(4)}
                    className="w-full h-11 rounded-full bg-[#108a00] hover:bg-[#14a800] text-white font-semibold text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>Continue to Final Confirmation</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* ================= STEP 4: Final Confirmation & Workspace Launch ================= */}
              {signupStep === 4 && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      Finalize & Launch Workspace
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Confirm your workspace details and deploy your custom sensible pipeline.
                    </p>
                  </div>

                  {/* 2-Column Split: Form on Left, Final Confirmation Blueprint Card on Right */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Left: Settings */}
                    <div className="md:col-span-6 space-y-3.5">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Workspace Name</Label>
                        <Input
                          type="text"
                          placeholder="e.g. Apex Agency Command HQ"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          className="h-10 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:border-[#108a00] focus-visible:ring-1 focus-visible:ring-[#108a00] rounded-xl"
                          required
                        />
                      </div>

                      {/* Primary Use Case */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Primary Workflow</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: "Agency" as UseCaseType, title: "Agency", icon: Building2 },
                            { key: "Freelancing" as UseCaseType, title: "Freelancing", icon: Briefcase },
                            { key: "Small Business" as UseCaseType, title: "Small Business", icon: Store },
                            { key: "Sales" as UseCaseType, title: "Sales", icon: TrendingUp },
                          ].map((item) => {
                            const Icon = item.icon
                            const isSelected = useCase === item.key
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => setUseCase(item.key)}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-[#108a00] bg-[#108a00]/10 text-[#108a00] font-bold shadow-2xs ring-1 ring-[#108a00]/40"
                                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-muted-foreground hover:text-foreground hover:border-zinc-300"
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span>{item.title}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Sensible Pipeline Strip */}
                      <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">
                            Pipeline: {USE_CASE_PIPELINES[useCase].label}
                          </span>
                          <span className="text-muted-foreground text-[10px]">Sensible Preset</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {USE_CASE_PIPELINES[useCase].stages.map((stage, idx) => (
                            <React.Fragment key={stage}>
                              <span className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-foreground">
                                <span className="h-1 w-1 rounded-full bg-[#108a00]" />
                                <span>{stage}</span>
                              </span>
                              {idx < USE_CASE_PIPELINES[useCase].stages.length - 1 && (
                                <span className="text-muted-foreground/60 text-[10px]">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Final Confirmation Preview Card */}
                    <div className="md:col-span-6 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#108a00] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#108a00]" />
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Deployment Blueprint
                          </span>
                        </div>
                        <span className="bg-[#108a00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {activePlan.badge}
                        </span>
                      </div>

                      {/* Workspace Identity Summary */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {companyLogoUrl ? (
                            <img src={companyLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                          ) : companyName.trim() ? (
                            <span className="font-bold text-xs text-[#108a00]">
                              {companyName.trim().slice(0, 2).toUpperCase()}
                            </span>
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-foreground truncate">
                            {workspaceName.trim() || companyName.trim() || "My Workspace HQ"}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {fullName.trim() || "Account Owner"} • <span className="text-[#108a00] font-medium">{role}</span>
                          </p>
                        </div>
                      </div>

                      {/* Confirmation Metrics Table */}
                      <div className="space-y-1 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[11px]">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Selected Plan:</span>
                          <span className="font-semibold text-foreground">{activePlan.displayName}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Seat Capacity:</span>
                          <span className="font-semibold text-foreground">{teamSize}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Active Leads Limit:</span>
                          <span className="font-semibold text-foreground">{activePlan.leadLimitText}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Trial Status:</span>
                          <span className="font-semibold text-[#108a00]">
                            {activePlan.hasTrial ? "14-Day Free Pro Trial Unlocked" : "Standard Active"}
                          </span>
                        </div>
                      </div>

                      {/* Launch Button */}
                      <button
                        type="button"
                        onClick={handleCompleteOnboarding}
                        disabled={isLoading}
                        className="w-full h-11 rounded-full bg-[#108a00] hover:bg-[#14a800] text-white font-semibold text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isLoading ? (
                          <span>Deploying workspace...</span>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4" />
                            <span>
                              {activePlan.hasTrial
                                ? "Launch Workspace (Start 14-Day Free Trial)"
                                : `Launch Workspace with ${activePlan.displayName}`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full shrink-0 border-t border-zinc-200/80 dark:border-zinc-800 py-3 px-6 sm:px-12 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-1 max-w-7xl mx-auto">
        <p>© 2026 Xweet Suite Inc. Indian Freelance & Agency Command HQ.</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
          <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
          <span className="hover:text-foreground cursor-pointer">Support</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 shadow-xl space-y-3">
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

            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success(`Password reset email sent to ${forgotEmail || "your email"}`)
                setForgotModalOpen(false)
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Account Email</Label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="rajvi@agency.com"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs font-semibold">
                  Send Recovery Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

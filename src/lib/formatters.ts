/**
 * Formats a number into Indian Rupee currency string (e.g. ₹12,50,000)
 */
export function formatINR(value: number): string {
  if (isNaN(value)) return "₹0"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats a number into compact Indian Rupee notation (e.g. ₹12.5L, ₹3.2Cr, ₹85K)
 */
export function formatCompactINR(value: number): string {
  if (isNaN(value) || value === 0) return "₹0"
  const abs = Math.abs(value)
  if (abs >= 10000000) {
    const cr = (value / 10000000).toFixed(1).replace(/\.0$/, "")
    return `₹${cr} Cr`
  }
  if (abs >= 100000) {
    const lakh = (value / 100000).toFixed(1).replace(/\.0$/, "")
    return `₹${lakh}L`
  }
  if (abs >= 1000) {
    const k = (value / 1000).toFixed(1).replace(/\.0$/, "")
    return `₹${k}K`
  }
  return formatINR(value)
}

/**
 * Formats date into Indian business standard (e.g. "25 Sep 2026")
 */
export function formatISTDate(dateStr: string): string {
  if (!dateStr) return "N/A"
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(date)
  } catch {
    return dateStr
  }
}

/**
 * Formats time string into 12-hour IST format (e.g. "04:30 PM IST")
 */
export function formatISTTime(timeStr: string): string {
  if (!timeStr) return ""
  // If already contains IST, return as is
  if (timeStr.includes("IST")) return timeStr
  // If time is in "HH:mm" format
  const parts = timeStr.split(":")
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10)
    const minutes = parts[1].padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12 // hour '0' should be '12'
    return `${hours}:${minutes} ${ampm} IST`
  }
  return `${timeStr} IST`
}

/**
 * Checks follow-up urgency relative to today (IST)
 */
export function getFollowUpStatus(dateStr: string, timeStr?: string): {
  label: string
  isUrgent: boolean
  isToday: boolean
  isPast: boolean
} {
  if (!dateStr) {
    return { label: "Not Scheduled", isUrgent: false, isToday: false, isPast: false }
  }

  try {
    // Current IST date
    const now = new Date()
    const istNowStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now)

    const targetDateStr = dateStr.slice(0, 10)
    const timeFormatted = timeStr ? formatISTTime(timeStr) : ""

    if (targetDateStr === istNowStr) {
      return {
        label: timeFormatted ? `Today, ${timeFormatted}` : "Today (IST)",
        isUrgent: true,
        isToday: true,
        isPast: false,
      }
    }

    const todayDate = new Date(istNowStr)
    const targetDate = new Date(targetDateStr)
    const diffTime = targetDate.getTime() - todayDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return {
        label: timeFormatted ? `Tomorrow, ${timeFormatted}` : "Tomorrow (IST)",
        isUrgent: false,
        isToday: false,
        isPast: false,
      }
    }

    if (diffDays < 0) {
      return {
        label: `Overdue (${Math.abs(diffDays)}d ago)`,
        isUrgent: true,
        isToday: false,
        isPast: true,
      }
    }

    return {
      label: timeFormatted ? `${formatISTDate(targetDateStr)}, ${timeFormatted}` : formatISTDate(targetDateStr),
      isUrgent: false,
      isToday: false,
      isPast: false,
    }
  } catch {
    return { label: dateStr, isUrgent: false, isToday: false, isPast: false }
  }
}

/**
 * Generates direct WhatsApp chat URL for Indian numbers
 */
export function getWhatsAppUrl(phone: string, leadName?: string): string {
  if (!phone) return ""
  // Strip non-digits
  const clean = phone.replace(/[^\d]/g, "")
  // Normalize India number
  let fullNumber = clean
  if (clean.length === 10) {
    fullNumber = `91${clean}`
  } else if (clean.startsWith("0")) {
    fullNumber = `91${clean.slice(1)}`
  }

  const message = leadName
    ? `Hi ${leadName}, connecting from Xweet Suite regarding your project.`
    : `Hello, connecting from Xweet Suite.`

  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`
}


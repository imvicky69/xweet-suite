import { PageContainer, PageHeader } from "@/components/layout/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Plus,
  MoreHorizontal,
  Clock,
  Briefcase,
} from "lucide-react"

interface Deal {
  id: string
  client: string
  project: string
  value: string
  daysInStage: string
  tag: string
  tagVariant: "indigo" | "neutral" | "success" | "warning"
}

interface Column {
  id: string
  title: string
  totalValue: string
  deals: Deal[]
}

const pipelineData: Column[] = [
  {
    id: "discovery",
    title: "Discovery",
    totalValue: "₹16,00,000",
    deals: [
      {
        id: "d-1",
        client: "Hyperion Cloud SaaS",
        project: "Full-Stack MVP",
        value: "₹12,50,000",
        daysInStage: "3d ago",
        tag: "Engineering",
        tagVariant: "neutral",
      },
      {
        id: "d-2",
        client: "Solaria D2C Studio",
        project: "E-Commerce Strategy",
        value: "₹3,50,000",
        daysInStage: "5d ago",
        tag: "Design",
        tagVariant: "neutral",
      },
    ],
  },
  {
    id: "proposal",
    title: "Proposal Sent",
    totalValue: "₹26,30,000",
    deals: [
      {
        id: "d-3",
        client: "Aura Design Co.",
        project: "Design System Architecture",
        value: "₹6,50,000",
        daysInStage: "1d ago",
        tag: "High Priority",
        tagVariant: "indigo",
      },
      {
        id: "d-4",
        client: "Kite Fintech Ventures",
        project: "Brand Refresh & Webflow",
        value: "₹4,80,000",
        daysInStage: "4d ago",
        tag: "Marketing",
        tagVariant: "neutral",
      },
      {
        id: "d-5",
        client: "Vektor AI Diagnostics",
        project: "AI Dashboard Prototyping",
        value: "₹15,00,000",
        daysInStage: "6d ago",
        tag: "Design",
        tagVariant: "neutral",
      },
    ],
  },
  {
    id: "negotiation",
    title: "Negotiation",
    totalValue: "₹13,20,000",
    deals: [
      {
        id: "d-6",
        client: "Northwind Health Tech",
        project: "Patient Dashboard Redesign",
        value: "₹8,20,000",
        daysInStage: "2d ago",
        tag: "Contract Ready",
        tagVariant: "indigo",
      },
      {
        id: "d-7",
        client: "Apex Retail Solutions",
        project: "Inventory Content Platform",
        value: "₹5,00,000",
        daysInStage: "1w ago",
        tag: "Legal Review",
        tagVariant: "warning",
      },
    ],
  },
  {
    id: "won",
    title: "Closed Won",
    totalValue: "₹9,50,000",
    deals: [
      {
        id: "d-8",
        client: "Zenith EduVentures",
        project: "Multi-tenant Mobile App",
        value: "₹9,50,000",
        daysInStage: "Today",
        tag: "Active Project",
        tagVariant: "success",
      },
    ],
  },
]

export default function Pipeline() {
  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title="Pipeline"
        description="Visual deal flow and sales stages for client engagements."
        badge={
          <Badge variant="indigo" size="sm">
            ₹65,00,000 Expected Value
          </Badge>
        }
        actions={
          <Button size="sm" className="gap-1.5 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Deal</span>
          </Button>
        }
      />

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {pipelineData.map((column) => (
          <div
            key={column.id}
            className="flex flex-col rounded-lg border border-border/70 bg-muted/20"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-border/60 p-3 bg-muted/40 rounded-t-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {column.title}
                </span>
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-medium text-muted-foreground border border-border/80">
                  {column.deals.length}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground font-mono">
                {column.totalValue}
              </span>
            </div>

            {/* Column Deals List */}
            <div className="flex flex-col gap-2 p-2.5 min-h-[120px] md:min-h-[350px]">
              {column.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="rounded-md border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] hover:border-border/80 transition-colors group cursor-grab space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {deal.client}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {deal.project}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground/60 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      <span>{deal.value}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={deal.tagVariant} size="sm">
                        {deal.tag}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {deal.daysInStage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add deal to column */}
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border/80 py-2 text-xs text-muted-foreground hover:bg-card hover:border-border hover:text-foreground transition-colors cursor-pointer mt-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add deal</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}

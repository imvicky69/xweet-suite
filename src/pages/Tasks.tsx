import * as React from "react"
import { PageContainer, PageHeader } from "@/components/layout/PageContainer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Trash2,
} from "lucide-react"

interface TaskItem {
  id: string
  title: string
  client: string
  due: string
  priority: "urgent" | "high" | "normal"
  completed: boolean
}

const initialTasks: TaskItem[] = [
  {
    id: "t-1",
    title: "Finalize brand guidelines presentation PDF",
    client: "Aura Design Co.",
    due: "Today, 5:00 PM",
    priority: "urgent",
    completed: false,
  },
  {
    id: "t-2",
    title: "Code review for Supabase Auth migration PR",
    client: "Hyperion SaaS",
    due: "Today, 7:00 PM",
    priority: "high",
    completed: false,
  },
  {
    id: "t-3",
    title: "Draft scope of work & milestone schedule",
    client: "Northwind Health",
    due: "Tomorrow, 12:00 PM",
    priority: "normal",
    completed: false,
  },
  {
    id: "t-4",
    title: "Send monthly retainer invoice #1042",
    client: "Northwind Health",
    due: "Sep 26",
    priority: "normal",
    completed: false,
  },
  {
    id: "t-5",
    title: "Set up staging environment on Cloudflare Pages",
    client: "Zephyr Cloud",
    due: "Sep 28",
    priority: "normal",
    completed: false,
  },
  {
    id: "t-6",
    title: "Initial kickoff & discovery call notes",
    client: "Kite Ventures",
    due: "Yesterday",
    priority: "normal",
    completed: true,
  },
  {
    id: "t-7",
    title: "Export Figma vector assets for mobile app",
    client: "Solaria Studio",
    due: "Sep 20",
    priority: "normal",
    completed: true,
  },
]

export default function Tasks() {
  const [tasks, setTasks] = React.useState<TaskItem[]>(initialTasks)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "pending" | "completed">("all")

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      client: "General Client",
      due: "Due soon",
      priority: "normal",
      completed: false,
    }

    setTasks([newTask, ...tasks])
    setNewTaskTitle("")
  }

  const pendingCount = tasks.filter((t) => !t.completed).length

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed
    if (filter === "completed") return t.completed
    return true
  })

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Daily action items, deliverables, and project milestones."
        badge={
          <Badge variant="indigo" size="sm">
            {pendingCount} Pending
          </Badge>
        }
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              variant={filter === "all" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setFilter("all")}
              className="cursor-pointer text-xs"
            >
              All ({tasks.length})
            </Button>
            <Button
              variant={filter === "pending" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setFilter("pending")}
              className="cursor-pointer text-xs"
            >
              Pending ({pendingCount})
            </Button>
            <Button
              variant={filter === "completed" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setFilter("completed")}
              className="cursor-pointer text-xs"
            >
              Completed ({tasks.length - pendingCount})
            </Button>
          </div>
        }
      />

      {/* Quick Add Task Input */}
      <Card>
        <CardContent className="p-2 sm:p-2.5">
          <form onSubmit={handleAddTask} className="flex items-center gap-2">
            <Input
              placeholder="Add a new milestone or task... (Press Enter to save)"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="h-8 border-none bg-transparent shadow-none text-xs focus-visible:ring-0 placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="xs"
              disabled={!newTaskTitle.trim()}
              className="gap-1 text-xs shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No tasks found in this view.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-0.5">
                      <p
                        className={`text-xs font-medium truncate ${
                          task.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">{task.client}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.due}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.priority === "urgent" && (
                      <Badge variant="warning" size="sm">
                        Urgent
                      </Badge>
                    )}
                    {task.priority === "high" && (
                      <Badge variant="indigo" size="sm">
                        High
                      </Badge>
                    )}
                    {task.priority === "normal" && (
                      <Badge variant="neutral" size="sm">
                        Normal
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteTask(task.id)}
                      className="text-muted-foreground/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  Brain,
  Code2,
  Database,
  FileCode2,
  FileJson,
  FileText,
  FolderGit2,
  FolderKanban,
  GitBranch,
  GitPullRequest,
  HardDrive,
  LayoutDashboard,
  MessageSquare,
  MonitorDot,
  Network,
  Puzzle,
  Server,
  Settings,
  Shield,
  TestTube,
  Webhook,
  Clock,
  Users,
  Blocks,
  Dumbbell,
  Cpu,
  Eye,
  FileSearch,
  PanelsTopLeft,
  ClipboardList,
} from "lucide-react"
import type { ServiceDeliverable } from '@/lib/getServices'
import { Checkbox } from "@/components/ui/checkbox"

interface CustomServiceCardProps {
  service: ServiceDeliverable
  isSelected: boolean
  onToggle: (isSelected: boolean) => void
  useVariedIcons?: boolean
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CustomServiceCard({ service, isSelected, onToggle, useVariedIcons = false }: CustomServiceCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Use only the new ServiceDeliverable structure
  const deliverableName = service.Deliverable;
  const description = service["Service Description"];
  const timeInWeeks = service["Time (in Weeks)"];
  const price = service.price || 0;
  const layer = service.layer || "";
  const resources = service.Resources;

  // Get appropriate icon based on service layer and name
  const getServiceIcon = () => {
    if (!useVariedIcons) {
      // If not using varied icons, return the emoji icon (original behavior)
      return (
        <span className="text-xl" aria-hidden="true">
          {getServiceEmoji(layer)}
        </span>
      )
    }

    // Use the same logic as AgentSidebar
    const layerLower = layer.toLowerCase()
    const nameLower = deliverableName.toLowerCase()

    if (layerLower.includes("infrastructure") || layerLower.includes("cloud")) {
      return <Server className="h-5 w-5 text-indigo-500" />
    }
    if (layerLower.includes("data ingestion")) {
      return <Database className="h-5 w-5 text-orange-500" />
    }
    if (layerLower.includes("rag")) {
      return <FileSearch className="h-5 w-5 text-amber-500" />
    }
    if (layerLower.includes("llm training")) {
      return <Dumbbell className="h-5 w-5 text-black-500" />
    }
    if (layerLower.includes("inference")) {
      return <Cpu className="h-5 w-5 text-cyan-500" />
    }
    if (layerLower.includes("reasoning")) {
      return <Brain className="h-5 w-5 text-pink-500" />
    }
    if (layerLower.includes("integration")) {
      return <Blocks className="h-5 w-5 text-green-500" />
    }
    if (layerLower.includes("frontend")) {
      return <PanelsTopLeft className="h-5 w-5 text-purple-500" />
    }
    if (layerLower.includes("deployment")) {
      return <Server className="h-5 w-5 text-blue-500" />
    }
    if (layerLower.includes("management")) {
      return <ClipboardList className="h-5 w-5 text-gray-500" />
    }
    if (layerLower.includes("observability")) {
      return <Eye className="h-5 w-5 text-yellow-500" />
    }
    // Default icon if no match
    return <Server className="h-5 w-5 text-slate-500" />
  }

  // Keep the original emoji function for fallback
  const getServiceEmoji = (layer: string) => {
    const layerLower = layer.toLowerCase()
    if (layerLower.includes("infrastructure")) return "🖥️"
    if (layerLower.includes("data ingestion")) return "📊"
    if (layerLower.includes("integrations")) return "🔄"
    if (layerLower.includes("llm training")) return "🧠"
    if (layerLower.includes("reasoning")) return "⚙️"
    if (layerLower.includes("observability")) return "📈"
    if (layerLower.includes("rag")) return "🔍"
    if (layerLower.includes("inference")) return "🤖"
    if (layerLower.includes("frontend")) return "🖼️"
    if (layerLower.includes("management")) return "📋"
    return "📦"
  }

  // Generate a unique ID for the service
  const serviceId = service.id || `service-${layer}-${deliverableName}`.replace(/\s+/g, "-").toLowerCase()

  return (
    <Card id={serviceId} className={`transition-all ${isSelected ? "border-primary shadow-sm" : ""} hover:shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="pt-0.5">
            <Checkbox
              id={`service-${serviceId}`}
              checked={isSelected}
              onCheckedChange={(checked) => {
                console.log("Checkbox changed:", checked)
                onToggle(checked === true)
              }}
            />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {getServiceIcon()}
                <label
                  htmlFor={`service-${serviceId}`}
                  className="font-medium text-base cursor-pointer hover:text-primary"
                >
                  {deliverableName}
                </label>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{timeInWeeks} {timeInWeeks === 1 ? "week" : "weeks"}</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="leading-relaxed">{description}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                ${price?.toLocaleString() || "N/A"}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              {"Resources" in service && service.Resources && service.Resources.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {service.Resources.map((r) => `${r.Role} (${Math.round(r["% time"] * 100)}%)`).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

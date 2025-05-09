"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Clock, Code2, DollarSign, ChevronDown, Users } from "lucide-react"
import { useState } from "react"
import type { AgentService } from "@/lib/types"

interface ServiceCardProps {
  service: AgentService
  compact?: boolean
}

export function ServiceCard({ service, compact = false }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className={cn("overflow-hidden transition-all", isExpanded ? "shadow-md" : "")}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <h3 className={cn("font-medium", compact ? "text-sm" : "text-base")}>{service.name}</h3>
              </div>
              <p className={cn("text-slate-600 mt-1", compact ? "text-xs" : "text-sm")}>{service.description}</p>
            </div>
            <CollapsibleTrigger asChild>
              <button className="p-1 rounded-full hover:bg-slate-100">
                <ChevronDown
                  className={cn("h-5 w-5 text-slate-400 transition-transform", isExpanded && "rotate-180")}
                />
              </button>
            </CollapsibleTrigger>
          </div>

          <div className="flex flex-wrap gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5" />
              <span>{service.timeInWeeks} weeks</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <DollarSign className="h-3.5 w-3.5" />
              <span>${service.cost.toLocaleString()}</span>
            </div>
          </div>

          <CollapsibleContent>
            <Separator className="my-3" />
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium mb-2 flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Resource Allocation
                </h4>
                <div className="space-y-2">
                  {service.resources.map((resource) => (
                    <div key={resource.role} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{resource.role}</span>
                        <span>{resource.percentage}%</span>
                      </div>
                      <Progress value={resource.percentage} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-slate-500">Estimated Time:</span>
                  <div className="font-medium mt-1">{service.timeInWeeks} weeks</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-slate-500">Cost:</span>
                  <div className="font-medium mt-1">${service.cost.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, ChevronDown, ChevronRight, Clock, DollarSign, Info, Layers, Plus, Users } from "lucide-react"
import type { Agent } from "@/lib/types"
import { ServiceCard } from "@/components/service-card"
import { getAgentAvatar } from "@/lib/avatar-mapping"

interface AgentCatalogItemProps {
  agent: Agent
  onAddToQuote?: (agent: Agent) => void
  isInQuote?: boolean
}

export function AgentCatalogItem({ agent, onAddToQuote, isInQuote = false }: AgentCatalogItemProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedTasks, setExpandedTasks] = useState(false)

  // Calculate total cost and time
  const totalCost = agent.services.reduce((sum, service) => sum + service.cost, 0)
  const totalTime = agent.services.reduce((sum, service) => sum + service.timeInWeeks, 0)

  // Calculate resource allocation
  const resourceAllocation: Record<string, number> = {}
  let totalResourceTime = 0

  agent.services.forEach((service) => {
    service.resources.forEach((resource) => {
      const weightedValue = (resource.percentage / 100) * service.timeInWeeks
      resourceAllocation[resource.role] = (resourceAllocation[resource.role] || 0) + weightedValue
      totalResourceTime += weightedValue
    })
  })

  // Convert to percentages
  Object.keys(resourceAllocation).forEach((role) => {
    resourceAllocation[role] = Math.round((resourceAllocation[role] / totalResourceTime) * 100)
  })

  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-primary/10">
              <AvatarImage src={getAgentAvatar(agent.type) || "/placeholder.svg"} alt={agent.name} />
              <AvatarFallback className="text-lg">{agent.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{agent.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                <Badge variant="outline" className="mr-2">
                  {agent.type}
                </Badge>
                <Badge variant="secondary">{agent.category === "horizontal" ? "Horizontal" : "Industry"}</Badge>
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => onAddToQuote?.(agent)}
            variant={isInQuote ? "secondary" : "default"}
            size="sm"
            className="flex items-center gap-1"
          >
            {isInQuote ? (
              <>
                <Info className="h-4 w-4" />
                <span>In Quote</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add to Quote</span>
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-slate-600 mt-2">{agent.description}</p>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services ({agent.services.length})</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="pt-2">
          <CardContent className="pb-3">
            {agent.tasks && agent.tasks.length > 0 && (
              <div className="mb-4">
                <Collapsible open={expandedTasks} onOpenChange={setExpandedTasks}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium flex items-center">
                      <Layers className="h-4 w-4 mr-1 text-primary" />
                      Tasks & Automations
                    </h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {expandedTasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1">
                      {agent.tasks.map((task, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{task}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-primary" />
                    Implementation Timeline
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600">Estimated Time</span>
                      <span className="font-medium">{totalTime} weeks</span>
                    </div>
                    <Progress value={Math.min((totalTime / 12) * 100, 100)} className="h-2" />
                    <p className="text-xs text-slate-500 mt-2">
                      Average implementation time across all services and dependencies
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-primary" />
                    Investment
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Total Cost</span>
                      <span className="font-medium">${totalCost.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Includes all services and required dependencies</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-primary" />
                  Resource Allocation
                </h3>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="space-y-3">
                    {Object.entries(resourceAllocation)
                      .sort((a, b) => b[1] - a[1])
                      .map(([role, percentage]) => (
                        <div key={role} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{role}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-1.5" />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="services">
          <CardContent className="pb-3">
            <div className="space-y-4">
              {agent.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="resources">
          <CardContent className="pb-3">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Resource Requirements</h3>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    {Object.entries(resourceAllocation)
                      .sort((a, b) => b[1] - a[1])
                      .map(([role, percentage]) => (
                        <div key={role}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium">{role}</span>
                            <span>{percentage}% of project time</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <p className="text-xs text-slate-500 mt-1">{getResourceDescription(role)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {agent.dependencies && agent.dependencies.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Required Infrastructure & Dependencies</h3>
                  <div className="space-y-2">
                    {agent.dependencies.map((dependency) => (
                      <div key={dependency.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{dependency.name}</h4>
                            <p className="text-xs text-slate-500 mt-1">{dependency.description}</p>
                          </div>
                          {dependency.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{dependency.timeInWeeks} weeks</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>${dependency.cost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-between items-center border-t p-4 bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">{totalTime} weeks</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">${totalCost.toLocaleString()}</span>
          </div>
        </div>
        <Button onClick={() => onAddToQuote?.(agent)} variant={isInQuote ? "secondary" : "default"} size="sm">
          {isInQuote ? "View in Quote" : "Add to Quote"}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Helper function to get resource descriptions
function getResourceDescription(role: string): string {
  const descriptions: Record<string, string> = {
    "AI Engineer": "Specializes in designing and implementing AI models and algorithms",
    "Data Engineer": "Focuses on data infrastructure, pipelines, and integration",
    DevOps: "Manages deployment, infrastructure, and operational aspects",
    QA: "Ensures quality and testing of AI systems",
    "Finance SME": "Subject matter expert in financial processes and regulations",
    "HR SME": "Subject matter expert in human resources practices and policies",
    "Legal SME": "Subject matter expert in legal compliance and documentation",
    "Customer Support SME": "Subject matter expert in customer service operations",
    "Healthcare SME": "Subject matter expert in healthcare processes and regulations",
    "Manufacturing SME": "Subject matter expert in manufacturing operations",
    "Backend Developer": "Develops server-side logic and integrations",
    "FullStack Dev": "Works on both frontend and backend development",
    "Project Manager": "Oversees project planning, execution, and delivery",
  }

  return descriptions[role] || "Specialist resource for implementation and support"
}

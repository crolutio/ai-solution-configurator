"use client"

import { useMemo, useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { SelectedAgent } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  DollarSign,
  Download,
  Send,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CalendarDays,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { agentCategories } from "@/lib/agents-data" // Updated import from data.ts to agents-data.ts
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { QuoteSubmissionForm } from "@/components/quote-submission-form"
import { getAllDeliverables } from "@/lib/getServices"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { ServiceLayer } from '@/lib/getServices'

interface QuoteSummaryProps {
  selectedAgents: SelectedAgent[]
  isOpen: boolean
  onToggle: () => void
  customServices: {
    selectedIds: string[]
    totalCost: number
  }
  setSelectedAgents: (agents: SelectedAgent[]) => void
  setSelectedCustomServices: (services: string[]) => void
  serviceLayers: ServiceLayer[]
}

export const QuoteSummary = forwardRef<{
  requestRemoveAgent: (agentId: string) => void
  requestRemoveService: (agentId: string, serviceId: string) => void
  requestRemoveDependency: (agentId: string, dependencyId: string) => void
  requestRemoveCustomService: (serviceId: string) => void
}, QuoteSummaryProps>(({
  selectedAgents,
  isOpen,
  onToggle,
  customServices,
  setSelectedAgents,
  setSelectedCustomServices,
  serviceLayers
}, ref) => {
  const allAgents = agentCategories.flatMap((c) => c.agents)
  const allDeliverables = getAllDeliverables(serviceLayers)

  const [showQuoteForm, setShowQuoteForm] = useState(false)

  // Timeline adjustment state and calculations
  const [deliveryDays, setDeliveryDays] = useState(0)
  const [defaultDays, setDefaultDays] = useState(0)
  const [priceMultiplier, setPriceMultiplier] = useState(1)
  const [adjustedPrice, setAdjustedPrice] = useState(0)

  const [removingAgentIds, setRemovingAgentIds] = useState<string[]>([])
  const [removingServiceIds, setRemovingServiceIds] = useState<string[]>([])
  const [removingDependencyIds, setRemovingDependencyIds] = useState<string[]>([])
  const [removingCustomServiceIds, setRemovingCustomServiceIds] = useState<string[]>([])

  const [justAddedAgentIds, setJustAddedAgentIds] = useState<string[]>([])
  const [justAddedServiceIds, setJustAddedServiceIds] = useState<string[]>([])
  const [justAddedDependencyIds, setJustAddedDependencyIds] = useState<string[]>([])
  const [justAddedCustomServiceIds, setJustAddedCustomServiceIds] = useState<string[]>([])

  const prevAgentIds = useRef<string[]>([])
  const prevServiceIds = useRef<string[]>([])
  const prevDependencyIds = useRef<string[]>([])
  const prevCustomServiceIds = useRef<string[]>([])

  const { totalPrice, totalTime, resourceAllocation, serviceCount, dependencyCount } = useMemo(() => {
    let totalPrice = 0
    let totalTime = 0
    let serviceCount = 0
    let dependencyCount = 0
    const resourcesMap: Record<string, number> = {}
    let totalPersonWeeks = 0;

    // Calculate for selected agents
    if (selectedAgents.length > 0) {
      selectedAgents.forEach((selectedAgent) => {
        const agent = allAgents.find((a) => a.id === selectedAgent.id)
        if (!agent) return
        selectedAgent.selectedServices.forEach((serviceId) => {
          const service = agent.services.find((s) => s.id === serviceId)
          if (service) {
            totalPrice += service.cost
            totalTime += service.timeInWeeks
            serviceCount++
            service.resources.forEach((resource) => {
              const personWeeks = (resource.percentage / 100) * service.timeInWeeks
              resourcesMap[resource.role] = (resourcesMap[resource.role] || 0) + personWeeks
              totalPersonWeeks += personWeeks
            })
          }
        })
        if (agent.dependencies && selectedAgent.selectedDependencies) {
          agent.dependencies.forEach((dependency) => {
            if (selectedAgent.selectedDependencies?.includes(dependency.id)) {
              totalPrice += dependency.cost
              totalTime += dependency.timeInWeeks
              dependencyCount++
              dependency.resources.forEach((resource) => {
                const personWeeks = (resource.percentage / 100) * dependency.timeInWeeks
                resourcesMap[resource.role] = (resourcesMap[resource.role] || 0) + personWeeks
                totalPersonWeeks += personWeeks
              })
            }
          })
        }
      })
    }

    // Add custom services to the total
    if (customServices && customServices.selectedIds.length > 0) {
      customServices.selectedIds.forEach((serviceId) => {
        const service = allDeliverables.find((s) => s.id === serviceId)
        if (service) {
          totalPrice += service.price || 0
          totalTime += service["Time (in Weeks)"] || 0
          serviceCount++
          if (service.Resources && Array.isArray(service.Resources)) {
            const weeks = service["Time (in Weeks)"] || 0;
            service.Resources.forEach((resource) => {
              const personWeeks = (resource["% time"] || 0) * weeks;
              resourcesMap[resource.Role] = (resourcesMap[resource.Role] || 0) + personWeeks;
              totalPersonWeeks += personWeeks;
            })
          }
        }
      })
    }

    const resourceAllocation: Record<string, number> = {}
    if (totalPersonWeeks > 0) {
      Object.entries(resourcesMap).forEach(([role, value]) => {
        resourceAllocation[role] = Math.round((value / totalPersonWeeks) * 100)
      })
    }
    return { totalPrice, totalTime: Math.round(totalTime * 10) / 10, resourceAllocation, serviceCount, dependencyCount }
  }, [selectedAgents, allAgents, customServices, allDeliverables])

  // Calculate default days based on total time in weeks
  useEffect(() => {
    const calculatedDefaultDays = Math.round(totalTime) // Use weeks directly instead of converting to days
    setDefaultDays(calculatedDefaultDays)
    setDeliveryDays(calculatedDefaultDays) // Reset to default when total changes
  }, [totalTime])

  // Calculate price multiplier and adjusted price
  useEffect(() => {
    if (deliveryDays === 0 || defaultDays === 0) {
      setPriceMultiplier(1)
      setAdjustedPrice(totalPrice)
      return
    }

    let multiplier = 1

    if (deliveryDays < defaultDays) {
      // Expedited pricing: price increases quadratically as timeline shortens
      const reduction = (defaultDays - deliveryDays) / defaultDays
      multiplier = 1 + reduction * reduction
    } else if (deliveryDays > defaultDays) {
      // Extended pricing: price decreases linearly as timeline extends, with a floor
      const extension = (deliveryDays - defaultDays) / (2 * defaultDays)
      multiplier = Math.max(0.75, 1 - extension)
    }

    setPriceMultiplier(multiplier)
    setAdjustedPrice(Math.round(totalPrice * multiplier))
  }, [deliveryDays, defaultDays, totalPrice])

  useEffect(() => {
    // Detect new agents
    const currentAgentIds = selectedAgents.map(agent => agent.id)
    const newAgentIds = currentAgentIds.filter(id => !prevAgentIds.current.includes(id))
    if (newAgentIds.length > 0) {
      setJustAddedAgentIds(ids => [...ids, ...newAgentIds])
      setTimeout(() => setJustAddedAgentIds(ids => ids.filter(id => !newAgentIds.includes(id))), 400)
    }
    prevAgentIds.current = currentAgentIds

    // Detect new services
    const currentServiceIds = selectedAgents.flatMap(agent => agent.selectedServices.map(id => `${agent.id}::${id}`))
    const newServiceIds = currentServiceIds.filter(id => !prevServiceIds.current.includes(id))
    if (newServiceIds.length > 0) {
      setJustAddedServiceIds(ids => [...ids, ...newServiceIds])
      setTimeout(() => setJustAddedServiceIds(ids => ids.filter(id => !newServiceIds.includes(id))), 400)
    }
    prevServiceIds.current = currentServiceIds

    // Detect new dependencies
    const currentDependencyIds = selectedAgents.flatMap(agent => (agent.selectedDependencies || []).map(id => `${agent.id}::${id}`))
    const newDependencyIds = currentDependencyIds.filter(id => !prevDependencyIds.current.includes(id))
    if (newDependencyIds.length > 0) {
      setJustAddedDependencyIds(ids => [...ids, ...newDependencyIds])
      setTimeout(() => setJustAddedDependencyIds(ids => ids.filter(id => !newDependencyIds.includes(id))), 400)
    }
    prevDependencyIds.current = currentDependencyIds

    // Detect new custom services
    const currentCustomServiceIds = customServices?.selectedIds || []
    const newCustomServiceIds = currentCustomServiceIds.filter(id => !prevCustomServiceIds.current.includes(id))
    if (newCustomServiceIds.length > 0) {
      setJustAddedCustomServiceIds(ids => [...ids, ...newCustomServiceIds])
      setTimeout(() => setJustAddedCustomServiceIds(ids => ids.filter(id => !newCustomServiceIds.includes(id))), 400)
    }
    prevCustomServiceIds.current = currentCustomServiceIds
  }, [selectedAgents, customServices])

  // Removal functions for outside use
  useImperativeHandle(ref, () => ({
    requestRemoveAgent: (agentId: string) => {
      setRemovingAgentIds(ids => [...ids, agentId])
      setTimeout(() => {
        setSelectedAgents(selectedAgents.filter(a => a.id !== agentId))
        setRemovingAgentIds(ids => ids.filter(id => id !== agentId))
      }, 400)
    },
    requestRemoveService: (agentId: string, serviceId: string) => {
      const key = `${agentId}::${serviceId}`
      setRemovingServiceIds(ids => [...ids, key])
      setTimeout(() => {
        setSelectedAgents(selectedAgents
          .map(a => a.id === agentId ? { ...a, selectedServices: a.selectedServices.filter(id => id !== serviceId) } : a)
          .filter(a => a.selectedServices.length > 0)
        )
        setRemovingServiceIds(ids => ids.filter(id => id !== key))
      }, 400)
    },
    requestRemoveDependency: (agentId: string, dependencyId: string) => {
      const key = `${agentId}::${dependencyId}`
      setRemovingDependencyIds(ids => [...ids, key])
      setTimeout(() => {
        setSelectedAgents(selectedAgents
          .map(a => a.id === agentId ? { ...a, selectedDependencies: a.selectedDependencies?.filter(id => id !== dependencyId) || [] } : a)
        )
        setRemovingDependencyIds(ids => ids.filter(id => id !== key))
      }, 400)
    },
    requestRemoveCustomService: (serviceId: string) => {
      setRemovingCustomServiceIds(ids => [...ids, serviceId])
      setTimeout(() => {
        setSelectedCustomServices((customServices?.selectedIds || []).filter(id => id !== serviceId))
        setRemovingCustomServiceIds(ids => ids.filter(id => id !== serviceId))
      }, 400)
    },
  }))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Helper to safely call imperative handle methods
  function safeCallRef(ref: any, method: string, ...args: any[]) {
    if (ref && typeof ref !== 'function' && ref.current && typeof ref.current[method] === 'function') {
      ref.current[method](...args);
    }
  }

  // Treat as no adjustment if difference is less than or equal to 1
  const isStandardPrice = Math.abs((adjustedPrice || totalPrice) - totalPrice) <= 1;

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center border-l bg-slate-50 p-2 transition-all duration-300 ease-in-out w-[40px] opacity-80">
        <Button variant="ghost" size="sm" onClick={onToggle} className="h-full w-6 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full lg:w-[384px] lg:flex-none border-l overflow-y-auto transition-all duration-300 ease-in-out transform">
      <Card className="border-0 rounded-none h-full animate-in fade-in-0 duration-300 shadow-none bg-background text-foreground">
        <CardHeader className="sticky top-0 bg-background z-10 border-b flex flex-row items-center justify-between">
          <CardTitle>Quote Summary</CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 p-4 bg-background text-foreground">
          {selectedAgents.length === 0 && (!customServices || customServices.selectedIds.length === 0) ? (
            <div className="text-center py-6">
              <p className="text-slate-500 dark:text-neutral-300 mb-2">No items selected</p>
              <p className="text-sm text-slate-400 dark:text-neutral-300">Select agents, services, or custom services to build your quote</p>
            </div>
          ) : (
            <>
              {selectedAgents.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Selected Agents</h3>
                  <AnimatePresence>
                    {selectedAgents.map((selectedAgent) => {
                      const agent = allAgents.find((a) => a.id === selectedAgent.id)
                      if (!agent) return null
                      // Calculate total cost for this agent
                      let agentCost = 0
                      selectedAgent.selectedServices.forEach((serviceId) => {
                        const service = agent.services.find((s) => s.id === serviceId)
                        if (service) {
                          agentCost += service.cost
                        }
                      })
                      if (agent.dependencies && selectedAgent.selectedDependencies) {
                        agent.dependencies.forEach((dependency) => {
                          if (selectedAgent.selectedDependencies?.includes(dependency.id)) {
                            agentCost += dependency.cost
                          }
                        })
                      }
                      const isRemoving = removingAgentIds.includes(agent.id)
                      const wasJustAdded = justAddedAgentIds.includes(agent.id)
                      if (isRemoving) return null
                      return (
                        <motion.div
                          key={`agent-wrapper-${agent.id}`}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          transition={{ duration: 0.4 }}
                          className={`transition-all duration-400 ${wasJustAdded ? 'animate-quote-in' : ''}`}
                          data-agent
                        >
                          <Collapsible defaultOpen={true}>
                            <div className="space-y-2 group">
                              <div className="flex justify-between items-center">
                                <CollapsibleTrigger asChild>
                                  <button className="flex items-center gap-1 font-medium hover:text-primary group">
                                    <h3>{agent.name}</h3>
                                    <ChevronDown className="h-4 w-4 text-slate-500 dark:text-neutral-200 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                  </button>
                                </CollapsibleTrigger>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{formatCurrency(agentCost)}</span>
                                  <button
                                    className="text-slate-400 dark:text-neutral-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setRemovingAgentIds(ids => [...ids, agent.id])
                                      setTimeout(() => {
                                        setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id))
                                        setRemovingAgentIds(ids => ids.filter(id => id !== agent.id))
                                      }, 400)
                                    }}
                                    title="Remove agent"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <CollapsibleContent className="overflow-hidden transition-all data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                                <div className="pl-4 border-l border-slate-200">
                                  <h4 className="text-xs font-medium text-slate-500 dark:text-neutral-200 mb-1">Selected Services:</h4>
                                  <ul className="text-xs text-slate-600 dark:text-neutral-100 space-y-1 mb-2">
                                    <AnimatePresence>
                                      {agent.services
                                        .filter((service) => selectedAgent.selectedServices.includes(service.id))
                                        .map((service) => {
                                          const key = `${agent.id}::${service.id}`
                                          const isRemoving = removingServiceIds.includes(key)
                                          if (isRemoving) return null;
                                          return (
                                            <motion.li
                                              key={key}
                                              initial={{ opacity: 0, x: -16 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              exit={{ opacity: 0, x: -16 }}
                                              transition={{ duration: 0.4 }}
                                              className="flex items-start gap-1 group/service"
                                              data-service
                                            >
                                              <span className="h-1 w-1 rounded-full bg-slate-400 mt-1.5"></span>
                                              <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                  <span>{service.name}</span>
                                                  <button
                                                    className="text-slate-400 dark:text-neutral-300 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 ml-1"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      setRemovingServiceIds(ids => [...ids, key])
                                                      setTimeout(() => {
                                                        setSelectedAgents(selectedAgents
                                                          .map(a => a.id === agent.id ? { ...a, selectedServices: a.selectedServices.filter(id => id !== service.id) } : a)
                                                          .filter(a => a.selectedServices.length > 0)
                                                        )
                                                        setRemovingServiceIds(ids => ids.filter(id => id !== key))
                                                      }, 400)
                                                    }}
                                                    title="Remove service"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </div>
                                                <div className="text-slate-400 dark:text-neutral-300 flex items-center gap-2 mt-0.5">
                                                  <span className="flex items-center gap-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {service.timeInWeeks} wk
                                                  </span>
                                                  <span className="flex items-center gap-0.5">
                                                    <DollarSign className="h-3 w-3" />
                                                    {formatCurrency(service.cost)}
                                                  </span>
                                                </div>
                                              </div>
                                            </motion.li>
                                          )
                                        })}
                                    </AnimatePresence>
                                  </ul>

                                  {selectedAgent.selectedDependencies && selectedAgent.selectedDependencies.length > 0 && (
                                    <>
                                      <h4 className="text-xs font-medium text-slate-500 dark:text-neutral-200 mb-1">
                                        Infrastructure & Dependencies:
                                      </h4>
                                      <ul className="text-xs text-slate-600 dark:text-neutral-100 space-y-1">
                                        <AnimatePresence>
                                          {agent.dependencies
                                            ?.filter((dependency) =>
                                              selectedAgent.selectedDependencies?.includes(dependency.id),
                                            )
                                            .map((dependency) => {
                                              const key = `${agent.id}::${dependency.id}`
                                              const isRemoving = removingDependencyIds.includes(key)
                                              if (isRemoving) return null;
                                              return (
                                                <motion.li
                                                  key={key}
                                                  initial={{ opacity: 0, x: -16 }}
                                                  animate={{ opacity: 1, x: 0 }}
                                                  exit={{ opacity: 0, x: -16 }}
                                                  transition={{ duration: 0.4 }}
                                                  className="flex items-start gap-1 group/dependency"
                                                  data-dependency
                                                >
                                                  <span className="h-1 w-1 rounded-full bg-slate-400 mt-1.5"></span>
                                                  <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                      <span>{dependency.name}</span>
                                                      {!dependency.required && (
                                                        <button
                                                          className="text-slate-400 dark:text-neutral-300 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 ml-1"
                                                          onClick={(e) => {
                                                            e.stopPropagation()
                                                            const key = `${agent.id}::${dependency.id}`
                                                            setRemovingDependencyIds(ids => [...ids, key])
                                                            setTimeout(() => {
                                                              setSelectedAgents(selectedAgents
                                                                .map(a => a.id === agent.id ? { ...a, selectedDependencies: a.selectedDependencies?.filter(id => id !== dependency.id) || [] } : a)
                                                              )
                                                              setRemovingDependencyIds(ids => ids.filter(id => id !== key))
                                                            }, 400)
                                                          }}
                                                          title="Remove dependency"
                                                        >
                                                          <Trash2 className="h-3 w-3" />
                                                        </button>
                                                      )}
                                                    </div>
                                                    <div className="text-slate-400 dark:text-neutral-300 flex items-center gap-2 mt-0.5">
                                                      <span className="flex items-center gap-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {dependency.timeInWeeks} wk
                                                      </span>
                                                      <span className="flex items-center gap-0.5">
                                                        <DollarSign className="h-3 w-3" />
                                                        {formatCurrency(dependency.cost)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </motion.li>
                                              )
                                            })}
                                        </AnimatePresence>
                                      </ul>
                                    </>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}

              {customServices && customServices.selectedIds.length > 0 && (
                <div
                  key={`services-wrapper`}
                  className=""
                  data-custom-services
                >
                  <div className="space-y-4">
                    <Collapsible defaultOpen={true}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center gap-1 font-medium hover:text-primary group">
                              <h3>Selected Services</h3>
                              <ChevronDown className="h-4 w-4 text-slate-500 dark:text-neutral-200 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </button>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{formatCurrency(customServices.totalCost)}</span>
                            <button
                              className="text-slate-400 dark:text-neutral-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                const idsToRemove = [...customServices.selectedIds];
                                setRemovingCustomServiceIds(idsToRemove);
                                setTimeout(() => {
                                  setSelectedCustomServices([]);
                                  setRemovingCustomServiceIds([]);
                                }, 400);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <CollapsibleContent className="overflow-hidden transition-all data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                          <div className="space-y-2 pl-4">
                            {customServices.selectedIds.map((serviceId, index) => {
                              const service = allDeliverables.find((s) => s.id === serviceId)
                              if (!service) return null
                              const isRemoving = removingCustomServiceIds.includes(serviceId)
                              const wasJustAdded = justAddedCustomServiceIds.includes(serviceId)
                              // Create a unique key by combining serviceId with index
                              const uniqueServiceKey = `custom-service-${serviceId}-${index}`
                              
                              return (
                                <AnimatePresence key={uniqueServiceKey}>
                                  {!isRemoving && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -16 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -16 }}
                                      transition={{ duration: 0.4 }}
                                      data-custom-service
                                    >
                                      <div className="flex items-start justify-between gap-4 group">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm">{service.Deliverable}</span>
                                            <button
                                              className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-neutral-300 hover:text-red-500 transition-colors"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setRemovingCustomServiceIds(ids => [...ids, serviceId])
                                                setTimeout(() => {
                                                  setSelectedCustomServices((customServices?.selectedIds || []).filter(id => id !== serviceId))
                                                  setRemovingCustomServiceIds(ids => ids.filter(id => id !== serviceId))
                                                }, 400)
                                              }}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-300">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{service["Time (in Weeks)"]} wk</span>
                                            <span>•</span>
                                            <DollarSign className="h-3.5 w-3.5" />
                                            <span>{formatCurrency(service.price || 0)}</span>
                                          </div>
                                          {service.Resources && service.Resources.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-300">
                                              <Users className="h-3.5 w-3.5" />
                                              <span>
                                                {service.Resources.map(
                                                  (r) => `${r.Role} (${Math.round(r["% time"] * 100)}%)`
                                                ).join(", ")}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              )
                            })}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500 dark:text-neutral-200" />
                    <span className="font-medium">Total Time</span>
                  </div>
                  <span>{Math.ceil(totalTime)} weeks</span>
                </div>

                {/* Timeline Control */}
                {totalTime > 0 && (
                  <div className="space-y-3 bg-muted p-3 rounded-lg border border-slate-200 dark:bg-[#222] dark:text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <Label htmlFor="delivery-time" className="text-sm font-medium">
                          Delivery Timeline
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="delivery-time"
                          type="number"
                          className="w-16 h-8 text-center"
                          value={deliveryDays}
                          step={1}
                          onChange={(e) => {
                            const value = Math.round(Number(e.target.value))
                            if (!isNaN(value) && value > 0) {
                              setDeliveryDays(value)
                            }
                          }}
                        />
                        <span className="text-sm">weeks</span>
                      </div>
                    </div>

                    <Slider
                      value={[deliveryDays]}
                      min={Math.max(1, Math.round(defaultDays * 0.5))}
                      max={Math.round(defaultDays * 1.5)}
                      step={1}
                      onValueChange={(value) => setDeliveryDays(Math.round(value[0]))}
                      className="my-2 h-1.5 bg-muted dark:bg-[#444] dark:text-white"
                    />

                    <div className="flex justify-between text-xs text-slate-500 dark:text-neutral-300">
                      <span>Expedited</span>
                      <span>Standard ({defaultDays} weeks)</span>
                      <span>Extended</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1">
                        {priceMultiplier > 1 ? (
                          <TrendingUp className="h-4 w-4 text-amber-500" />
                        ) : priceMultiplier < 1 ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-slate-500 dark:text-neutral-200" />
                        )}
                        <span className="text-sm">Adjustment:</span>
                      </div>
                      <div className="flex flex-col items-end">
                        {!isStandardPrice ? (
                          <span className={cn("font-bold", {
                            "text-[#dea13c]": (adjustedPrice - totalPrice) > 0,
                            "text-green-500": (adjustedPrice - totalPrice) < 0
                          })}>
                            {(adjustedPrice - totalPrice) > 0 ? '+' : ''}{formatCurrency(adjustedPrice - totalPrice)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-neutral-300">No adjustment</span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-neutral-300">
                          {priceMultiplier > 1
                            ? `+${((priceMultiplier - 1) * 100).toFixed(0)}% expedited fee`
                            : priceMultiplier < 1
                              ? `${((1 - priceMultiplier) * 100).toFixed(0)}% discount`
                              : "Standard price"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500 dark:text-neutral-200" />
                      <span className="font-medium">Total Cost</span>
                    </div>
                    <span className="font-bold">{formatCurrency(adjustedPrice || totalPrice)}</span>
                  </div>
                  {!isStandardPrice && (
                    <div className="text-sm text-slate-500 dark:text-neutral-300 flex flex-col items-end">
                      <span>{formatCurrency(totalPrice)} (standard)</span>
                      <span className={cn({
                        "text-[#dea13c]": (adjustedPrice - totalPrice) > 0,
                        "text-green-500": (adjustedPrice - totalPrice) < 0
                      })}>
                        {(adjustedPrice - totalPrice) > 0 ? '+' : ''}{formatCurrency(adjustedPrice - totalPrice)} (adjustment)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-slate-500 dark:text-neutral-300">
                  <span>Services: {serviceCount}</span>
                  <span>Dependencies: {dependencyCount}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500 dark:text-neutral-200" />
                  <span className="font-medium">Resource Allocation</span>
                </div>

                {Object.entries(resourceAllocation).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(resourceAllocation)
                      .sort((a, b) => b[1] - a[1])
                      .map(([role, percentage]) => (
                        <div key={role} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{role}</span>
                            <span>{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-neutral-300">No resources allocated yet</p>
                )}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-4 border-t sticky bottom-0 bg-background z-10">
          <Button
            className="w-full"
            onClick={() => setShowQuoteForm(true)}
            disabled={
              selectedAgents.length === 0 && (!customServices || customServices.selectedIds.length === 0)
            }
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Quote
          </Button>

          <Button
            variant="outline"
            className="w-full"
            disabled={
              selectedAgents.length === 0 && (!customServices || customServices.selectedIds.length === 0)
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Download Quote
          </Button>
        </CardFooter>
      </Card>
      <QuoteSubmissionForm
        open={showQuoteForm}
        onOpenChange={setShowQuoteForm}
        quoteData={{
          totalPrice: adjustedPrice || totalPrice,
          totalTime,
          serviceCount: serviceCount + dependencyCount,
          deliveryDays,
          priceMultiplier,
        }}
      />
    </div>
  )
})

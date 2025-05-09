"use client"
import { QuoteSummary } from "./quote-summary"
import { calculateTotalCost, calculateTotalTime, getAllDeliverables, type ServiceLayer } from "@/lib/getServices"
import type { SelectedAgent } from "@/lib/types"

interface IntegratedQuoteSummaryProps {
  selectedAgents: SelectedAgent[]
  selectedServices: string[]
  isOpen: boolean
  onToggle: () => void
  setSelectedAgents: (agents: SelectedAgent[]) => void
  setSelectedServices: (services: string[]) => void
  serviceLayers: ServiceLayer[]
}

export function IntegratedQuoteSummary({
  selectedAgents,
  selectedServices,
  isOpen,
  onToggle,
  setSelectedAgents,
  setSelectedServices,
  serviceLayers
}: IntegratedQuoteSummaryProps) {
  // Calculate total cost and time for selected services
  const totalCost = calculateTotalCost(serviceLayers, selectedServices)
  const totalTime = calculateTotalTime(serviceLayers, selectedServices)

  // Get all selected service objects
  const selectedServiceObjects = getAllDeliverables(serviceLayers).filter((d) => selectedServices.includes(d.id || ""))

  return (
    <QuoteSummary
      selectedAgents={selectedAgents}
      isOpen={isOpen}
      onToggle={onToggle}
      customServices={{
        selectedIds: selectedServices,
        totalCost: totalCost,
      }}
      setSelectedAgents={setSelectedAgents}
      setSelectedCustomServices={setSelectedServices}
      serviceLayers={serviceLayers}
    />
  )
}

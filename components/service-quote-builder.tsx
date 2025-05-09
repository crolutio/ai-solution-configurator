"use client"

import { useState } from "react"
import { ServiceBrowser } from "@/components/service-browser"
import { IntegratedQuoteSummary } from "@/components/integrated-quote-summary"
import {
  calculateTotalCost,
  calculateTotalTime,
  getAllDeliverables
} from "@/lib/getServices"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { ServiceLayer } from '@/lib/getServices'

interface ServiceQuoteBuilderProps {
  serviceLayers: ServiceLayer[];
}

export function ServiceQuoteBuilder({ serviceLayers }: ServiceQuoteBuilderProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isSummaryOpen, setIsSummaryOpen] = useState(true)

  // Update the handleToggleService function to log the selection and ensure it's working
  const handleToggleService = (serviceId: string, isSelected: boolean) => {
    console.log("Service toggled:", serviceId, isSelected)
    setSelectedServices((prev) => {
      if (isSelected) {
        return [...prev, serviceId]
      } else {
        return prev.filter((id) => id !== serviceId)
      }
    })
  }

  // Calculate total cost and time for selected services
  const totalCost = calculateTotalCost(serviceLayers, selectedServices)
  const totalTime = calculateTotalTime(serviceLayers, selectedServices)

  // Get all selected service objects
  const selectedServiceObjects = getAllDeliverables(serviceLayers).filter((d) => selectedServices.includes(d.id || ""))

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="flex flex-col w-full overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden border-r">
              <ServiceBrowser
                serviceLayers={serviceLayers}
                selectedServices={selectedServices}
                onToggleService={(serviceId, isSelected) => {
                  setSelectedServices((prev) =>
                    isSelected ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
                  )
                }}
              />
            </div>

            {/* Also make sure we're passing the correct props to the QuoteSummary component */}
            <IntegratedQuoteSummary
              selectedAgents={[]}
              selectedServices={selectedServices}
              isOpen={isSummaryOpen}
              onToggle={() => setIsSummaryOpen(!isSummaryOpen)}
              setSelectedAgents={() => {}}
              setSelectedServices={setSelectedServices}
              totalCost={totalCost}
              totalTime={totalTime}
              onRemoveService={(serviceId) => {
                setSelectedServices((prev) => prev.filter((id) => id !== serviceId))
              }}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

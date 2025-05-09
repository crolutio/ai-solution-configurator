"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Clock, Search, Users } from "lucide-react"
import { ServiceDetail } from "@/components/service-detail"
import type { ServiceDeliverable, ServiceLayer } from '@/lib/getServices'

interface ServiceCatalogProps {
  serviceLayers: ServiceLayer[]
  selectedServices: string[]
  onToggleService: (serviceId: string, isSelected: boolean) => void
}

export function ServiceCatalog({
  serviceLayers,
  selectedServices,
  onToggleService,
}: ServiceCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Filter services based on search query and active tab
  const filteredLayers = serviceLayers
    .map((layer) => {
      // Filter deliverables based on search
      const filteredDeliverables = layer.Deliverables.filter((deliverable) => {
        const matchesSearch =
          searchQuery === "" ||
          deliverable.Deliverable.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deliverable["Service Description"].toLowerCase().includes(searchQuery.toLowerCase()) ||
          layer.Layer.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesSearch
      })

      return {
        ...layer,
        Deliverables: filteredDeliverables,
      }
    })
    .filter((layer) => {
      // Filter layers based on active tab and if they have deliverables
      if (layer.Deliverables.length === 0) return false
      if (activeTab === "all") return true

      // Map tabs to layer categories
      switch (activeTab) {
        case "infrastructure":
          return layer.Layer.includes("Infrastructure") || layer.Layer.includes("Cloud") || layer.Layer.includes("Deployment")
        case "data":
          return layer.Layer.includes("Data") || layer.Layer.includes("RAG") || layer.Layer.includes("Observability") || layer.Layer.includes("Vectorial")
        case "ai":
          return layer.Layer.includes("LLM") || layer.Layer.includes("Inference") || layer.Layer.includes("Reasoning") || layer.Layer.includes("Training")
        case "integration":
          return layer.Layer.includes("Integration") || layer.Layer.includes("Connection") || layer.Layer.includes("API")
        case "frontend":
          return layer.Layer.includes("FrontEnd") || layer.Layer.includes("UI") || layer.Layer.includes("UX")
        default:
          return false
      }
    })

  // Group layers into categories for tabs
  const infrastructureTab = ["Infrastructure", "Cloud", "Deployment"]
  const dataTab = ["Data", "Ingestion", "RAG", "Observability"]
  const aiTab = ["LLM", "Training", "Inference", "Reasoning"]
  const integrationTab = ["Integration", "API", "Connection"]
  const frontendTab = ["FrontEnd", "UI", "UX"]

  // Get all services for a specific category
  const getServicesForCategory = (category: string) => {
    let relevantLayers: string[] = []
    switch (category) {
      case "infrastructure":
        relevantLayers = infrastructureTab
        break
      case "data":
        relevantLayers = dataTab
        break
      case "ai":
        relevantLayers = aiTab
        break
      case "integration":
        relevantLayers = integrationTab
        break
      case "frontend":
        relevantLayers = frontendTab
        break
      default:
        return []
    }

    return serviceLayers
      .filter(layer => 
        relevantLayers.some(term => 
          layer.Layer.toLowerCase().includes(term.toLowerCase())
        )
      )
      .flatMap(layer => layer.Deliverables)
      .filter(deliverable => 
        searchQuery === "" ||
        deliverable.Deliverable.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deliverable["Service Description"].toLowerCase().includes(searchQuery.toLowerCase())
      )
  }

  // Get filtered services based on active tab
  const filteredServices = activeTab === "all" 
    ? serviceLayers
        .flatMap(layer => layer.Deliverables)
        .filter(deliverable =>
          searchQuery === "" ||
          deliverable.Deliverable.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deliverable["Service Description"].toLowerCase().includes(searchQuery.toLowerCase())
        )
    : getServicesForCategory(activeTab)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">AI Services Catalog</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search services..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="ai">AI & ML</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="frontend">Frontend</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-500">No services match your search criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === "all" ? (
            // Show layers when "all" is selected
            filteredLayers.map((layer) => (
              <div key={layer.Layer} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{layer.Layer}</h3>
                </div>
                <div className="space-y-4">
                  {layer.Deliverables.map((deliverable) => (
                    <ServiceDeliverableCard
                      key={deliverable.id || deliverable.Deliverable}
                      deliverable={deliverable}
                      isSelected={selectedServices.includes(deliverable.id || "")}
                      onToggle={(isSelected) => onToggleService(deliverable.id || "", isSelected)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Show services directly when a specific category is selected
            <div className="grid grid-cols-1 gap-4">
              {filteredServices.map((deliverable) => (
                <ServiceDeliverableCard
                  key={deliverable.id || deliverable.Deliverable}
                  deliverable={deliverable}
                  isSelected={selectedServices.includes(deliverable.id || "")}
                  onToggle={(isSelected) => onToggleService(deliverable.id || "", isSelected)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ServiceDeliverableCardProps {
  deliverable: ServiceDeliverable
  isSelected: boolean
  onToggle: (isSelected: boolean) => void
}

function ServiceDeliverableCard({ deliverable, isSelected, onToggle }: ServiceDeliverableCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`transition-all ${isSelected ? "border-primary shadow-sm" : ""} hover:shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="pt-0.5">
            <Checkbox
              id={`service-${deliverable.id || deliverable.Deliverable}`}
              checked={isSelected}
              onCheckedChange={(checked) => onToggle(checked === true)}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <label
                  htmlFor={`service-${deliverable.id || deliverable.Deliverable}`}
                  className="font-medium text-base cursor-pointer hover:text-primary"
                >
                  {deliverable.Deliverable}
                </label>
              </div>
              <span className="font-bold text-right whitespace-nowrap">
                ${deliverable.price?.toLocaleString() || "Price on request"}
              </span>
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              <p>{deliverable["Service Description"]}</p>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {deliverable["Time (in Weeks)"]} {deliverable["Time (in Weeks)"] === 1 ? "week" : "weeks"}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {deliverable.Resources.map((r) => `${r.Role} (${Math.round(r["% time"] * 100)}%)`).join(", ")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

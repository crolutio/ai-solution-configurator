"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { QuoteSidebar } from "@/components/quote-sidebar"
import { QuoteContent } from "@/components/quote-content"
import { QuoteSummary } from "@/components/quote-summary"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { DeliverableItem } from "@/lib/types"
import { serviceLayers } from "@/lib/data"

export function QuoteBuilder() {
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSelected, setShowSelected] = useState(false)
  const [activeLayer, setActiveLayer] = useState<string | null>(null)

  const toggleDeliverable = (id: string) => {
    setSelectedDeliverables((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const filteredLayers = useMemo(() => {
    return serviceLayers
      .map((layer) => {
        const filteredDeliverables = layer.deliverables.filter((deliverable) => {
          const matchesSearch =
            deliverable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deliverable.description.toLowerCase().includes(searchQuery.toLowerCase())
          const matchesSelected = !showSelected || selectedDeliverables.includes(deliverable.id)
          return matchesSearch && matchesSelected
        })

        return {
          ...layer,
          deliverables: filteredDeliverables,
        }
      })
      .filter((layer) => !activeLayer || layer.id === activeLayer)
  }, [serviceLayers, searchQuery, showSelected, selectedDeliverables, activeLayer])

  const selectedItems = useMemo(() => {
    const items: DeliverableItem[] = []
    serviceLayers.forEach((layer) => {
      layer.deliverables.forEach((deliverable) => {
        if (selectedDeliverables.includes(deliverable.id)) {
          items.push(deliverable)
        }
      })
    })
    return items
  }, [selectedDeliverables])

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <QuoteSidebar layers={serviceLayers} activeLayer={activeLayer} setActiveLayer={setActiveLayer} />

        <div className="flex flex-col w-full overflow-hidden">
          <div className="border-b p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search deliverables..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showSelected}
                  onChange={() => setShowSelected(!showSelected)}
                  className="rounded border-gray-300"
                />
                Show selected only
              </label>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <QuoteContent
              layers={filteredLayers}
              selectedDeliverables={selectedDeliverables}
              toggleDeliverable={toggleDeliverable}
            />
            <QuoteSummary selectedItems={selectedItems} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

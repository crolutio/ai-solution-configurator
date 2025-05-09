"use client"

import type { ServiceLayer } from "@/lib/types"
import { DeliverableCard } from "@/components/deliverable-card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface QuoteContentProps {
  layers: ServiceLayer[]
  selectedDeliverables: string[]
  toggleDeliverable: (id: string) => void
}

export function QuoteContent({ layers, selectedDeliverables, toggleDeliverable }: QuoteContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {layers.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No deliverables match your criteria</p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={layers.map((layer) => layer.id)} className="space-y-4">
          {layers.map((layer) => (
            <AccordionItem key={layer.id} value={layer.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{layer.name}</span>
                  <span className="text-xs text-muted-foreground">({layer.deliverables.length} deliverables)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {layer.deliverables.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No deliverables match your criteria in this layer
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {layer.deliverables.map((deliverable) => (
                      <DeliverableCard
                        key={deliverable.id}
                        deliverable={deliverable}
                        isSelected={selectedDeliverables.includes(deliverable.id)}
                        onToggle={() => toggleDeliverable(deliverable.id)}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

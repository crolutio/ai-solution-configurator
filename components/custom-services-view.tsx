"use client"

import { useEffect, useRef } from "react"
import { CustomServiceCard } from "@/components/custom-service-card"
import type { ServiceLayer } from '@/lib/getServices'
import { getDeliverablesByLayer } from '@/lib/getServices'

interface CustomServicesViewProps {
  selectedServices: string[]
  onToggleService: (serviceId: string, isSelected: boolean) => void
  useVariedIcons?: boolean
  singleColumn?: boolean
  activeLayer: string | null
  registerLayerRef?: (layerName: string, ref: HTMLElement | null) => void
  serviceLayers: ServiceLayer[]
}

export function CustomServicesView({
  selectedServices,
  onToggleService,
  useVariedIcons = false,
  singleColumn = false,
  activeLayer,
  registerLayerRef,
  serviceLayers
}: CustomServicesViewProps) {
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (registerLayerRef) {
      Object.entries(layerRefs.current).forEach(([layerName, ref]) => {
        registerLayerRef(layerName, ref)
      })
    }
  }, [registerLayerRef])

  return (
    <div className="space-y-8">
      {serviceLayers.map((layer) => (
        <div
          key={layer.Layer}
          id={`service-layer-${layer.Layer.toLowerCase().replace(/\s+/g, "-")}`}
          ref={(ref) => {
            layerRefs.current[layer.Layer] = ref;
            return undefined;
          }}
          className={`${!activeLayer || activeLayer === layer.Layer ? "" : "hidden"}`}
        >
          <h3 className="text-lg font-semibold mb-4">{layer.Layer}</h3>
          <div className={`grid ${singleColumn ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"} gap-4`}>
            {layer.Deliverables.map((service) => (
              <CustomServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServices.includes(service.id || "")}
                onToggle={(isSelected) => onToggleService(service.id || "", isSelected)}
                useVariedIcons={useVariedIcons}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

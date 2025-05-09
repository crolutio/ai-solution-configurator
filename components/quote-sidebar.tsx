"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Layers, ChevronRight } from "lucide-react"
import type { ServiceLayer } from "@/lib/types"

interface QuoteSidebarProps {
  layers: ServiceLayer[]
  activeLayer: string | null
  setActiveLayer: (id: string | null) => void
}

export function QuoteSidebar({ layers, activeLayer, setActiveLayer }: QuoteSidebarProps) {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex items-center h-16 px-4 border-b">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          <span className="font-semibold">AI Services Quote</span>
        </div>
        <div className="ml-auto md:hidden">
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeLayer === null}
              onClick={() => setActiveLayer(null)}
              tooltip="All Layers"
            >
              <Layers className="h-4 w-4" />
              <span>All Layers</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {layers.map((layer) => (
            <SidebarMenuItem key={layer.id}>
              <SidebarMenuButton
                isActive={activeLayer === layer.id}
                onClick={() => setActiveLayer(layer.id === activeLayer ? null : layer.id)}
                tooltip={layer.name}
              >
                <ChevronRight className="h-4 w-4" />
                <span>{layer.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}

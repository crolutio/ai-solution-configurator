"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Layers,
  Briefcase,
  Blocks,
  Clock,
  DollarSign,
  Building,
  Users,
  HeartPulse,
  Landmark,
  HardHat,
  Lightbulb,
  ShoppingBag,
  Scale,
  Headphones,
  Database,
  Server,
  Brain,
  Code,
  Layout,
  Bot,
  Cpu,
  Zap,
  ScanEye,
  Search,
  ClipboardList,
  RefreshCw,
  BarChart,
  BrainCog,
  Wrench,
  Eye,
  Dumbbell,
  Flame,
  FileSearch,
  PanelsTopLeft,
} from "lucide-react"
import type { AgentCategory } from "@/lib/types"
import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAgentAvatar } from "@/lib/avatar-mapping"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { ServiceLayer } from '@/lib/getServices'
import Image from "next/image"

interface AgentSidebarProps {
  categories: AgentCategory[]
  activeCategory: string
  setActiveCategory: (category: string) => void
  activeType: string | null
  setActiveType: (type: string | null) => void
  onServiceClick: (categoryId: string, serviceId?: string, specificServiceId?: string) => void
  searchQuery: string
  serviceLayers: ServiceLayer[]
}

export function AgentSidebar({
  categories,
  activeCategory,
  setActiveCategory,
  activeType,
  setActiveType,
  onServiceClick,
  searchQuery,
  serviceLayers
}: AgentSidebarProps) {
  // Get unique agent types for the active category
  const activeAgentTypes = Array.from(
    new Set(
      categories
        .find((category) => category.id === activeCategory)
        ?.agents.map((agent) => agent.type)
    )
  ).filter(Boolean)

  // Handle category click
  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === activeCategory) {
      // If clicking the same category, clear the type
      setActiveType(null)
    } else {
      // If clicking a different category, set it and clear the type
      setActiveCategory(categoryId)
      setActiveType(null)
    }
    // Always trigger the service click with just the category
    onServiceClick(categoryId)
  }

  // Handle type click
  const handleTypeClick = (categoryId: string, type: string) => {
    if (type === activeType) {
      // If clicking the same type, clear it
      setActiveType(null)
      onServiceClick(categoryId)
    } else {
      // If clicking a different type, set it
      setActiveType(type)
      onServiceClick(categoryId, type)
    }
  }

  const handleServiceLayerClick = (layerName: string, serviceId?: string) => {
    // Only prevent click if we're on this layer AND there's no search active
    if (activeCategory === "custom" && activeType === layerName && !searchQuery.trim()) {
      return;
    }
    if (onServiceClick) {
      onServiceClick("custom", layerName, serviceId)
    }
  }

  const getAgentByType = (categoryId: string, type: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return null

    return category.agents.find((agent) => agent.type === type)
  }

  // Replace the getAgentAvatarByType function with this updated version
  const getAgentAvatarByType = (categoryId: string, type: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return null

    // Use our new avatar mapping
    return getAgentAvatar(type)
  }

  return (
    <SidebarProvider>
      <Sidebar 
        variant="sidebar" 
        collapsible="icon"
        className="flex flex-col h-full"
      >
        <SidebarHeader className="flex flex-col items-center justify-center h-28 px-4 py-8 border-b">
          <div className="flex flex-col items-center w-full gap-3">
            <Image
              src="/aideology-logo.png"
              alt="Aideology"
              width={160}
              height={160}
              className="mx-auto ml-6 block dark:hidden"
            />
            <Image
              src="/aideology-logo-white.png"
              alt="Aideology"
              width={160}
              height={160}
              className="mx-auto ml-6 hidden dark:block"
            />
            <span className="font-semibold text-lg text-center text-black dark:text-white">AI Agents and Services</span>
          </div>
          <div className="ml-auto md:hidden">
            <SidebarTrigger />
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* All Services section with consistent padding */}
          <SidebarGroup>
            <SidebarGroupLabel>Custom Services</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem key="all-services">
                  <SidebarMenuButton
                    isActive={activeCategory === "custom" && activeType === null}
                    onClick={() => {
                      setActiveCategory("custom");
                      setActiveType(null);
                      onServiceClick("custom");
                    }}
                    tooltip="All Services"
                  >
                    <Wrench className="h-4 w-4 text-black dark:text-white" />
                    <span>All Services</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* Service layers with consistent indentation */}
                {serviceLayers.map((layer) => {
                  // Choose icon based on layer name
                  let LayerIcon = Database;
                  let iconColorClass = "";
                  if (layer.Layer.toLowerCase().includes("infrastructure") || layer.Layer.toLowerCase().includes("cloud")) {
                    LayerIcon = Server;
                    iconColorClass = "text-indigo-500";
                  } else if (layer.Layer.toLowerCase().includes("data ingestion")) {
                    LayerIcon = Database;
                    iconColorClass = "text-orange-500";
                  } else if (layer.Layer.toLowerCase().includes("rag")) {
                    LayerIcon = FileSearch;
                    iconColorClass = "text-amber-500";
                  } else if (layer.Layer.toLowerCase().includes("llm training")) {
                    LayerIcon = Dumbbell;
                    iconColorClass = "text-black-500";
                  } else if (layer.Layer.toLowerCase().includes("inference")) {
                    LayerIcon = Cpu;
                    iconColorClass = "text-cyan-500";
                  } else if (layer.Layer.toLowerCase().includes("reasoning")) {
                    LayerIcon = Brain;
                    iconColorClass = "text-pink-500";
                  } else if (layer.Layer.toLowerCase().includes("integration")) {
                    LayerIcon = Blocks;
                    iconColorClass = "text-green-500";
                  } else if (layer.Layer.toLowerCase().includes("frontend")) {
                    LayerIcon = PanelsTopLeft;
                    iconColorClass = "text-purple-500";
                  } else if (layer.Layer.toLowerCase().includes("deployment")) {
                    LayerIcon = Server;
                    iconColorClass = "text-blue-500";
                  } else if (layer.Layer.toLowerCase().includes("frontend")) {
                    LayerIcon = Layout;
                    iconColorClass = "text-pink-500";
                  } else if (layer.Layer.toLowerCase().includes("management")) {
                    LayerIcon = ClipboardList;
                    iconColorClass = "text-gray-500";
                  } else if (layer.Layer.toLowerCase().includes("observability")) {
                    LayerIcon = Eye;
                    iconColorClass = "text-yellow-500";
                  }
                  const displayName = layer.Layer.toLowerCase().includes("management") 
                    ? "Management"
                    : layer.Layer;
                  return (
                    <SidebarMenuItem key={layer.Layer}>
                      <SidebarMenuButton
                        isActive={activeCategory === "custom" && activeType === layer.Layer}
                        onClick={() => handleServiceLayerClick(layer.Layer)}
                        tooltip={layer.Layer}
                        className="pl-6"
                      >
                        <LayerIcon className={`h-4 w-4 ${iconColorClass}`} />
                        <span>{displayName}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {categories
            .sort((a, b) => {
              // Put custom category first
              if (a.id === "custom") return -1
              if (b.id === "custom") return 1
              return 0
            })
            .map((category) => {
              if (category.id === "custom") return null;
              let groupLabel = category.name;
              if (category.id === "horizontal") groupLabel = "Horizontal Enterprise Agents";
              if (category.id === "industry") groupLabel = "Industry-Specific Agents";
              return (
                <SidebarGroup key={category.id}>
                  <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {/* Always show agent subcategories for horizontal and industry, even if custom is active */}
                      {category.id === "horizontal" && (
                        <>
                          {[null, ...category.agents.map(agent => agent.type)].map((type) =>
                            type === null ? (
                              <SidebarMenuItem key="all-horizontal-agents">
                                <SidebarMenuButton
                                  isActive={activeCategory === category.id && activeType === null}
                                  onClick={() => { setActiveCategory(category.id); setActiveType(null); }}
                                  tooltip="All Agents"
                                >
                                  <Briefcase className="h-4 w-4" />
                                  <span>All Horizontal Agents</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ) : (
                              <SidebarMenuItem key={type}>
                                <div className="flex items-center w-full">
                                  <SidebarMenuButton
                                    isActive={activeCategory === category.id && activeType === type}
                                    onClick={() => { setActiveCategory(category.id); setActiveType(type); }}
                                    tooltip={type}
                                    className="flex-1 pl-6"
                                  >
                                    <Avatar className="h-5 w-5 mr-1">
                                      <AvatarImage src={getAgentAvatarByType(category.id, type) || ""} alt={type} />
                                      <AvatarFallback className="text-[10px] bg-primary/10">
                                        {(() => {
                                          let TypeIcon = Briefcase;
                                          if (type === "Finance") TypeIcon = DollarSign;
                                          else if (type === "Human Resources") TypeIcon = Users;
                                          else if (type === "Customer Support") TypeIcon = Headphones;
                                          else if (type === "Marketing & Sales") TypeIcon = ShoppingBag;
                                          else if (type === "Legal") TypeIcon = Scale;
                                          return <TypeIcon className="h-3 w-3" />;
                                        })()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{type}</span>
                                  </SidebarMenuButton>
                                </div>
                              </SidebarMenuItem>
                            )
                          )}
                        </>
                      )}
                      {category.id === "industry" && (
                        <>
                          <SidebarMenuItem key="all-industry-agents">
                            <SidebarMenuButton
                              isActive={activeCategory === category.id && activeType === null}
                              onClick={() => { setActiveCategory(category.id); setActiveType(null); }}
                              tooltip="All Industry Agents"
                            >
                              <Building className="h-4 w-4" />
                              <span>All Industry Agents</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          {[...new Set(category.agents.map(agent => agent.type))].map(industryType => {
                            const agent = category.agents.find(a => a.type === industryType);
                            return (
                              <SidebarMenuItem key={industryType}>
                                <div className="flex items-center w-full">
                                  <SidebarMenuButton
                                    isActive={activeCategory === category.id && activeType === industryType}
                                    onClick={() => { setActiveCategory(category.id); setActiveType(industryType); }}
                                    tooltip={industryType}
                                    className="flex-1 pl-6"
                                  >
                                    <Avatar className="h-5 w-5 mr-1">
                                      <AvatarImage src={getAgentAvatarByType(category.id, industryType) || ""} alt={industryType} />
                                      <AvatarFallback className="text-[10px] bg-primary/10">
                                        {industryType.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{industryType}</span>
                                  </SidebarMenuButton>
                                </div>
                              </SidebarMenuItem>
                            );
                          })}
                        </>
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            }).filter(Boolean)}
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

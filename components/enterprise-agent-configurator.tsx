"use client"

import { useState, useEffect, useRef } from "react"
import { AgentGrid } from "@/components/agent-grid"
import { QuoteSummary } from "@/components/quote-summary"
import { AgentSidebar } from "@/components/agent-sidebar"
import { Input } from "@/components/ui/input"
import { Search, Sun, Moon, Plus, Minus, RefreshCw, Server, Database, FileSearch, Dumbbell, Cpu, Brain, Blocks, PanelsTopLeft, ClipboardList, Eye, Clock, Users, DollarSign } from "lucide-react"
import type { Agent, SelectedAgent } from "@/lib/types"
import { enhancedAgentCategories } from "@/lib/enhanced-agent-data" // Updated import
import { CustomServicesView } from "@/components/custom-services-view"
import { UserSessionDropdown } from "@/components/user-session-dropdown"
import { CustomServiceCard } from "@/components/custom-service-card"
import type { ServiceLayer } from '@/lib/getServices';
import {
  getAllDeliverables,
  calculateTotalCost,
} from '@/lib/getServices';
import { AnimatePresence, motion } from "framer-motion"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { AgentCard } from "@/components/agent-card"
import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronRight } from "lucide-react"
import { getAgentAvatar } from "@/lib/avatar-mapping"
import { Progress } from "@/components/ui/progress"

interface EnterpriseAgentConfiguratorProps {
  initialServiceLayers: ServiceLayer[];
}

export function EnterpriseAgentConfigurator({ initialServiceLayers }: EnterpriseAgentConfiguratorProps) {
  const [selectedAgents, setSelectedAgents] = useState<SelectedAgent[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("horizontal")
  const [activeType, setActiveType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSummaryOpen, setIsSummaryOpen] = useState(true)
  const [selectedCustomServices, setSelectedCustomServices] = useState<string[]>([])
  const [activeServiceLayer, setActiveServiceLayer] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [serviceLayers] = useState<ServiceLayer[]>(initialServiceLayers);
  const [zoom, setZoom] = useState(1)
  const [isDark, setIsDark] = useState(false)
  const [configuratorAgentId, setConfiguratorAgentId] = useState<string | null>(null)
  const [configStep, setConfigStep] = useState<number>(0)

  // Ref for scrolling to service sections
  const contentRef = useRef<HTMLDivElement>(null)
  const serviceRefs = useRef<Record<string, HTMLElement | null>>({})
  const quoteSummaryRef = useRef<any>(null);

  // Add highlight style on client only
  useEffect(() => {
    const highlightStyle = document.createElement("style");
    highlightStyle.innerHTML = `
      .highlight-service {
        animation: highlight-pulse 2s ease-in-out;
      }
      @keyframes highlight-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3); }
      }
    `;
    document.head.appendChild(highlightStyle);
    return () => {
      document.head.removeChild(highlightStyle);
    };
  }, []);

  // Initialize service refs
  useEffect(() => {
    // Create refs for each service layer
    serviceLayers.forEach((layer) => {
      serviceRefs.current[layer.Layer] = document.getElementById(
        `service-layer-${layer.Layer.replace(/\s+/g, "-").toLowerCase()}`,
      )
    })
  }, [activeCategory])

  // Apply zoom to html element
  useEffect(() => {
    document.documentElement.style.fontSize = `${zoom * 100}%`
  }, [zoom])

  // Apply dark mode to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  const handleViewTransition = async (callback: () => void) => {
    setIsTransitioning(true)
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for leave animation
    callback()
    setIsTransitioning(false)
  }

  const handleServiceClick = (categoryId: string, serviceId?: string, specificServiceId?: string) => {
    // If clicking the same category/type with a search query active, just clear the search
    if (searchQuery && categoryId === activeCategory && serviceId === activeType) {
      setSearchQuery("");
      return;
    }

    handleViewTransition(() => {
      // Clear search whenever sidebar navigation happens
      setSearchQuery("")
      
      // Always set these first
      setActiveCategory(categoryId)
      setActiveType(serviceId || null)
      
      // Handle custom services differently
      if (categoryId === "custom") {
        if (serviceId) {
          setActiveServiceLayer(serviceId)
          // Scroll to the specific service layer section
          setTimeout(() => {
            const element = serviceRefs.current[serviceId]
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" })
              if (specificServiceId) {
                const serviceElement = document.getElementById(specificServiceId)
                if (serviceElement) {
                  serviceElement.scrollIntoView({ behavior: "smooth", block: "center" })
                  serviceElement.classList.add("highlight-service")
                  setTimeout(() => {
                    serviceElement.classList.remove("highlight-service")
                  }, 2000)
                }
              }
            } else if (contentRef.current) {
              contentRef.current.scrollTop = 0
            }
          }, 100)
        } else {
          setActiveServiceLayer(null)
        }
      } else {
        // For non-custom categories
        setActiveServiceLayer(null)
        if (contentRef.current) {
          contentRef.current.scrollTop = 0
        }
      }
    })
  }

  const toggleAgent = (agent: Agent, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAgents((prev) => {
        const existing = prev.find((a) => a.id === agent.id);
        if (existing) {
          // Reset to all services
          return prev.map((a) =>
            a.id === agent.id
              ? {
                  ...a,
                  selectedServices: agent.services.map((service) => service.id),
                  selectedDependencies: agent.dependencies?.filter((dep) => dep.required).map((dep) => dep.id) || [],
                }
              : a
          );
        } else {
          // Add agent with all services selected
          return [
            ...prev,
            {
              ...agent,
              selectedServices: agent.services.map((service) => service.id),
              selectedDependencies: agent.dependencies?.filter((dep) => dep.required).map((dep) => dep.id) || [],
            },
          ];
        }
      });
    } else {
      // Animate out
      quoteSummaryRef.current?.requestRemoveAgent(agent.id);
    }
  };

  const toggleService = (agentId: string, serviceId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAgents((prev) => {
        const agentIndex = prev.findIndex((a) => a.id === agentId)
        // If agent is not selected yet, add it with just this service
        if (agentIndex === -1 && isSelected) {
          const agent = enhancedAgentCategories.flatMap((c) => c.agents).find((a) => a.id === agentId)
          if (!agent) return prev
          return [
            ...prev,
            {
              ...agent,
              selectedServices: [serviceId],
              selectedDependencies: agent.dependencies?.filter((dep) => dep.required).map((dep) => dep.id) || [],
            },
          ]
        }
        // If agent exists, update its selected services
        if (agentIndex >= 0) {
          const updatedAgents = [...prev]
          // Add service
          updatedAgents[agentIndex] = {
            ...updatedAgents[agentIndex],
            selectedServices: [...updatedAgents[agentIndex].selectedServices, serviceId],
          }
          return updatedAgents
        }
        return prev
      })
    } else {
      // Animate out
      quoteSummaryRef.current?.requestRemoveService(agentId, serviceId);
    }
  }

  const toggleDependency = (agentId: string, dependencyId: string, isSelected: boolean) => {
    setSelectedAgents((prev) => {
      const agentIndex = prev.findIndex((a) => a.id === agentId)
      if (agentIndex === -1) return prev

      const updatedAgents = [...prev]
      if (isSelected) {
        // Add dependency
        updatedAgents[agentIndex] = {
          ...updatedAgents[agentIndex],
          selectedDependencies: [...(updatedAgents[agentIndex].selectedDependencies || []), dependencyId],
        }
      } else {
        // Check if dependency is required
        const agent = enhancedAgentCategories.flatMap((c) => c.agents).find((a) => a.id === agentId)
        const dependency = agent?.dependencies?.find((d) => d.id === dependencyId)

        // If dependency is required, don't allow deselection
        if (dependency?.required) return prev

        // Remove dependency
        updatedAgents[agentIndex] = {
          ...updatedAgents[agentIndex],
          selectedDependencies: (updatedAgents[agentIndex].selectedDependencies || []).filter(
            (id) => id !== dependencyId,
          ),
        }
      }
      return updatedAgents
    })
  }

  const toggleCustomService = (serviceId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCustomServices((prev) => [...prev, serviceId])
    } else {
      // Animate out
      quoteSummaryRef.current?.requestRemoveCustomService(serviceId);
    }
  }

  const isAgentSelected = (agentId: string) => {
    return selectedAgents.some((agent) => agent.id === agentId)
  }

  const isServiceSelected = (agentId: string, serviceId: string) => {
    const agent = selectedAgents.find((a) => a.id === agentId)
    return agent ? agent.selectedServices.includes(serviceId) : false
  }

  const isDependencySelected = (agentId: string, dependencyId: string) => {
    const agent = selectedAgents.find((a) => a.id === agentId)
    return agent ? agent.selectedDependencies?.includes(dependencyId) || false : false
  }

  const areAllServicesSelected = (agentId: string) => {
    const agent = selectedAgents.find((a) => a.id === agentId)
    if (!agent) return false

    const fullAgent = enhancedAgentCategories.flatMap((c) => c.agents).find((a) => a.id === agentId)
    return fullAgent ? agent.selectedServices.length === fullAgent.services.length : false
  }

  // Filter agents based on search query and active type
  const horizontalAgents = enhancedAgentCategories.find(cat => cat.id === "horizontal")?.agents ?? [];
  const industryAgents = enhancedAgentCategories.find(cat => cat.id === "industry")?.agents ?? [];
  let filteredAgents: Agent[] = [];
  if (searchQuery.trim() === "") {
    if (activeCategory === "horizontal") {
      filteredAgents = horizontalAgents.filter((agent) => {
        if (activeType === null) return true;
        return agent.type === activeType;
      });
    } else if (activeCategory === "industry") {
      filteredAgents = industryAgents.filter((agent) => {
        if (activeType === null) return true;
        return agent.type === activeType;
      });
    } else {
      filteredAgents = [];
    }
  } else {
    filteredAgents = [...horizontalAgents, ...industryAgents].filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.services.some((service) => service.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (agent.tasks && agent.tasks.some((task) => task.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesSearch;
    });
  }

  // Debug logs to diagnose filtering
  console.log('DEBUG: activeCategory:', activeCategory);
  console.log('DEBUG: activeType:', activeType);
  console.log('DEBUG: filteredAgents:', filteredAgents);

  // Filter services based on search query
  const filteredServices =
    searchQuery.trim() === ""
      ? []
      : getAllDeliverables(serviceLayers).filter((service) => {
          return (
            service.Deliverable.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service["Service Description"].toLowerCase().includes(searchQuery.toLowerCase()) ||
            (service.layer && service.layer.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        })

  // Calculate total cost of selected custom services
  const customServicesTotalCost = calculateTotalCost(serviceLayers, selectedCustomServices)

  // Find the configurator agent for displaying in the modal
  const configuratorAgent = configuratorAgentId
    ? enhancedAgentCategories.flatMap((c) => c.agents).find((a) => a.id === configuratorAgentId)
    : null

  // Get icon based on service layer
  const getServiceIcon = (layerName: string) => {
    const layerLower = layerName.toLowerCase();
    
    if (layerLower.includes("infrastructure") || layerLower.includes("cloud") || layerLower.includes("deployment")) {
      return <Server className="h-5 w-5 text-blue-500" />;
    }
    if (layerLower.includes("data") || layerLower.includes("ingestion")) {
      return <Database className="h-5 w-5 text-orange-500" />;
    }
    if (layerLower.includes("rag")) {
      return <FileSearch className="h-5 w-5 text-amber-500" />;
    }
    if (layerLower.includes("llm") || layerLower.includes("training")) {
      return <Dumbbell className="h-5 w-5 text-black-500" />;
    }
    if (layerLower.includes("inference")) {
      return <Cpu className="h-5 w-5 text-cyan-500" />;
    }
    if (layerLower.includes("reasoning")) {
      return <Brain className="h-5 w-5 text-pink-500" />;
    }
    if (layerLower.includes("integration")) {
      return <Blocks className="h-5 w-5 text-green-500" />;
    }
    if (layerLower.includes("frontend") || layerLower.includes("ui")) {
      return <PanelsTopLeft className="h-5 w-5 text-purple-500" />;
    }
    if (layerLower.includes("management")) {
      return <ClipboardList className="h-5 w-5 text-gray-500" />;
    }
    if (layerLower.includes("observability")) {
      return <Eye className="h-5 w-5 text-yellow-500" />;
    }
    // Default icon
    return <Server className="h-5 w-5 text-slate-500" />;
  };
  
  // Get service category mapping
  const getServiceCategory = (service: any) => {
    const layer = (service.layer || "").toLowerCase();
    
    if (layer.includes("deployment") || layer.includes("infrastructure") || layer.includes("cloud")) {
      return "Deployment";
    }
    if (layer.includes("data") || layer.includes("ingestion")) {
      return "Data Ingestion";
    }
    if (layer.includes("inference") || layer.includes("llm")) {
      return "Inference";
    }
    if (layer.includes("rag") || layer.includes("retrieval")) {
      return "RAG";
    }
    if (layer.includes("integration") || layer.includes("api")) {
      return "Integrations";
    }
    if (layer.includes("frontend") || layer.includes("ui")) {
      return "Frontend";
    }
    return "Other";
  };
  
  // Group all services by category
  const getGroupedServices = () => {
    const allServices = serviceLayers.flatMap(layer => 
      layer.Deliverables.map(service => ({
        ...service,
        category: getServiceCategory(service)
      }))
    );
    
    // Group by category
    return allServices.reduce((groups, service) => {
      const category = service.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
      return groups;
    }, {} as Record<string, any[]>);
  };
  
  const groupedServices = getGroupedServices();
  const categories = ["Deployment", "Data Ingestion", "Inference", "RAG", "Integrations", "Frontend"];

  // Category titles as questions
  const categoryQuestions = [
    "Where will the agent be deployed?", // Deployment
    "How will the agent ingest data?", // Data Ingestion
    "How will inference be handled?", // Inference
    "What RAG capabilities are needed?", // RAG
    "Which systems will the agent integrate with?", // Integrations
    "What frontend components are required?" // Frontend
  ];
  
  // Calculate current progress percentage
  const getCurrentProgress = () => {
    // Count available categories (those with services)
    const availableCategories = categories.filter(
      cat => groupedServices[cat] && groupedServices[cat].length > 0
    );
    
    if (availableCategories.length === 0) return 0;
    
    // Find current step index within available categories
    const currentCategoryIndex = availableCategories.indexOf(categories[configStep]);
    if (currentCategoryIndex === -1) return 0;
    
    return ((currentCategoryIndex + 1) / availableCategories.length) * 100;
  };
  
  const [selectedConfigServices, setSelectedConfigServices] = useState<Record<string, string[]>>({});
  
  // Track which services were added during the current configuration session
  const [newlyAddedServices, setNewlyAddedServices] = useState<string[]>([]);

  // Handle service selection in configurator
  const handleServiceSelection = (service: any) => {
    setSelectedConfigServices(prev => {
      const category = service.category;
      const serviceId = service.id || service.firestoreId;
      
      // Create a unique composite key for the service
      const uniqueKey = `${serviceId}_${category}`;
      
      if (!prev[category]) {
        prev[category] = [];
      }
      
      const newServices = [...prev[category]];
      
      // Toggle selection
      const serviceIndex = newServices.indexOf(serviceId);
      if (serviceIndex === -1) {
        // Add service
        newServices.push(serviceId);
        // Also add to actual selected custom services (only if not already included)
        if (!selectedCustomServices.includes(serviceId)) {
          // Track this as a newly added service
          setNewlyAddedServices(prev => [...prev, serviceId]);
          // Add to selected services
          setSelectedCustomServices(prev => [...prev, serviceId]);
        }
      } else {
        // Remove service
        newServices.splice(serviceIndex, 1);
        // Also remove from actual selected custom services
        if (selectedCustomServices.includes(serviceId)) {
          // Remove from newly added services tracking if it was just added
          setNewlyAddedServices(prev => prev.filter(id => id !== serviceId));
          // Remove from selected services
          setSelectedCustomServices(prev => prev.filter(id => id !== serviceId));
        }
      }
      
      return {
        ...prev,
        [category]: newServices
      };
    });
  };
  
  // Check if service is selected in configurator
  const isServiceSelectedInConfig = (service: any) => {
    const category = service.category;
    const serviceId = service.id || service.firestoreId;
    
    return selectedConfigServices[category]?.includes(serviceId) || false;
  };

  // Create a function to reset the configurator state
  const resetConfigurator = () => {
    setConfiguratorAgentId(null);
    setConfigStep(0);
    setSelectedConfigServices({});
  };

  // Handler for Configure button clicks
  const handleAgentCardConfigure = (agent: Agent) => {
    console.log("🔍 Configure button clicked for agent:", agent.name);
    // Reset any tracking of newly added services
    setNewlyAddedServices([]);
    // Open the configurator
    setConfiguratorAgentId(agent.id);
  };
  
  // Handle next step in the wizard
  const handleNextStep = () => {
    let nextStep = configStep + 1;
    
    // Skip empty categories
    while (nextStep < categories.length && 
           (!groupedServices[categories[nextStep]] || groupedServices[categories[nextStep]].length === 0)) {
      nextStep++;
    }
    
    if (nextStep >= categories.length) {
      // Last step, close modal and clean up
      // Before closing, clean up any duplicate selections to prevent duplicates in quote summary
      cleanupDuplicateSelections();
      // Clear the newly added services tracking since we're keeping these services
      setNewlyAddedServices([]);
      resetConfigurator();
    } else {
      setConfigStep(nextStep);
    }
  };
  
  // Clean up duplicate selections before updating the main state
  const cleanupDuplicateSelections = () => {
    // Get unique service IDs and remove any duplicates
    const uniqueServiceIds = [...new Set(selectedCustomServices)];
    
    // Only update if there's a difference (duplicates were found)
    if (uniqueServiceIds.length !== selectedCustomServices.length) {
      setSelectedCustomServices(uniqueServiceIds);
    }
  };

  // Remove newly added services if closing without finishing
  const handleCloseWithoutFinish = () => {
    // Remove any services that were added during this configuration session
    if (newlyAddedServices.length > 0) {
      setSelectedCustomServices(prev => 
        prev.filter(serviceId => !newlyAddedServices.includes(serviceId))
      );
    }
    // Reset the configurator state
    resetConfigurator();
    // Clear the tracking of newly added services
    setNewlyAddedServices([]);
  };

  // Handle previous step in the wizard
  const handlePrevStep = () => {
    let prevStep = configStep - 1;
    
    // Skip empty categories
    while (prevStep >= 0 && 
           (!groupedServices[categories[prevStep]] || groupedServices[categories[prevStep]].length === 0)) {
      prevStep--;
    }
    
    if (prevStep < 0) {
      prevStep = 0;
    }
    
    setConfigStep(prevStep);
  };

  // Reset step when opening the configurator
  useEffect(() => {
    if (configuratorAgentId) {
      setConfigStep(0);
      
      // Find the first category that has services
      let startStep = 0;
      while (startStep < categories.length && 
             (!groupedServices[categories[startStep]] || groupedServices[categories[startStep]].length === 0)) {
        startStep++;
      }
      
      if (startStep < categories.length) {
        setConfigStep(startStep);
      }
    }
  }, [configuratorAgentId]);

  // Calculate total time for selected services
  const calculateTotalTime = () => {
    let totalWeeks = 0;
    
    // Add up all weeks from selected services
    Object.entries(selectedConfigServices).forEach(([category, serviceIds]) => {
      serviceIds.forEach(serviceId => {
        const service = groupedServices[category]?.find(s => 
          (s.id === serviceId) || (s.firestoreId === serviceId)
        );
        if (service) {
          totalWeeks += service["Time (in Weeks)"] || 0;
        }
      });
    });
    
    // Return as whole number of weeks
    return Math.max(1, Math.ceil(totalWeeks));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AgentSidebar
        categories={enhancedAgentCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeType={activeType}
        setActiveType={setActiveType}
        onServiceClick={handleServiceClick}
        searchQuery={searchQuery}
        serviceLayers={serviceLayers}
      />

      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        {/* Main Heading and Controls */}
        <div className="flex flex-col gap-2 px-6 pt-8 pb-4 border-b bg-background sticky top-0 z-50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-1">Enterprise AI Solution Configurator</h1>
              <p className="text-lg text-muted-foreground mb-2">Build your custom AI solution by selecting the agents and services that best fit your organization's needs.</p>
              <div className="relative max-w-md mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search agents and services..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-4 self-start">
              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  className="p-1 rounded hover:bg-accent"
                  title="Zoom out"
                  onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  className="p-1 rounded hover:bg-accent"
                  title="Zoom in"
                  onClick={() => setZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  className="p-1 rounded hover:bg-accent"
                  title="Reset zoom"
                  onClick={() => setZoom(1)}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              {/* Dark Mode Toggle */}
              <button
                className="p-1 rounded hover:bg-accent"
                title="Toggle dark mode"
                onClick={() => setIsDark(d => !d)}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${activeType}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-semibold mb-4">
                  {searchQuery.trim() !== "" ? "Search Results" :
                    activeCategory === null ? null :
                    activeType ? (
                      activeCategory === "custom" && activeServiceLayer
                        ? `Custom Agent Services - ${activeServiceLayer.toLowerCase().includes("management") ? "Management" : activeServiceLayer}`
                        : `${activeCategory === "horizontal" ? "Horizontal" : "Industry"} Enterprise Agents - ${activeType}`
                    ) : null}
                </h2>

                {searchQuery.trim() !== "" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {filteredAgents.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Matching Agents</h3>
                        <AgentGrid
                          agents={filteredAgents}
                          toggleAgent={toggleAgent}
                          toggleService={toggleService}
                          toggleDependency={toggleDependency}
                          isAgentSelected={isAgentSelected}
                          isServiceSelected={isServiceSelected}
                          isDependencySelected={isDependencySelected}
                          areAllServicesSelected={areAllServicesSelected}
                          singleColumn={true}
                          onConfigure={handleAgentCardConfigure}
                          configureButtonClass="bg-black hover:bg-gray-800 text-white"
                        />
                      </div>
                    )}
                    {filteredServices.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-2">Matching Services</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {filteredServices.map((service) => (
                            <CustomServiceCard
                              key={service.id}
                              service={service}
                              isSelected={selectedCustomServices.includes(service.id || "")}
                              onToggle={(isSelected) => toggleCustomService(service.id || "", isSelected)}
                              useVariedIcons={true}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : activeCategory === "custom" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CustomServicesView
                      selectedServices={selectedCustomServices}
                      onToggleService={toggleCustomService}
                      useVariedIcons={true}
                      singleColumn={true}
                      activeLayer={activeServiceLayer}
                      registerLayerRef={(layerName, ref) => {
                        serviceRefs.current[layerName] = ref
                      }}
                      serviceLayers={serviceLayers}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <AgentGrid
                      agents={filteredAgents}
                      toggleAgent={toggleAgent}
                      toggleService={toggleService}
                      toggleDependency={toggleDependency}
                      isAgentSelected={isAgentSelected}
                      isServiceSelected={isServiceSelected}
                      isDependencySelected={isDependencySelected}
                      areAllServicesSelected={areAllServicesSelected}
                      singleColumn={true}
                      onConfigure={handleAgentCardConfigure}
                      configureButtonClass="bg-black hover:bg-gray-800 text-white"
                    />
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <QuoteSummary
            ref={quoteSummaryRef}
            selectedAgents={selectedAgents}
            isOpen={isSummaryOpen}
            onToggle={() => setIsSummaryOpen(!isSummaryOpen)}
            customServices={{
              selectedIds: selectedCustomServices,
              totalCost: customServicesTotalCost,
            }}
            setSelectedAgents={setSelectedAgents}
            setSelectedCustomServices={setSelectedCustomServices}
            serviceLayers={serviceLayers}
          />
        </div>
      </div>

      {/* Configurator Modal */}
      <Dialog open={!!configuratorAgent} onOpenChange={open => {
        if (!open) {
          // If dialog is closed without pressing Finish, remove any newly added services
          handleCloseWithoutFinish();
        }
      }}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 flex flex-col bg-white rounded-lg shadow-xl border border-gray-200 z-[100] smooth-transition overflow-hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {configuratorAgent ? `Configure ${configuratorAgent.name}` : 'Agent Configuration'}
            </DialogTitle>
          </DialogHeader>
          {configuratorAgent && (
            <div className="w-full h-full flex gap-6">
              {/* Left column - Agent Card (thinner) */}
              <div className="w-1/5 min-w-[200px] overflow-y-auto border rounded-lg shadow-sm">
                <div className="bg-white flex flex-col h-full">
                  <CardHeader className="pb-3 bg-gray-50 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={getAgentAvatar(configuratorAgent.type) || "/placeholder.svg"} alt={configuratorAgent.name} />
                        <AvatarFallback className="bg-primary/10">{configuratorAgent.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{configuratorAgent.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 py-4 text-sm">
                    <p className="text-slate-600 mb-4">{configuratorAgent.description}</p>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold mb-2">Services</h3>
                        <div className="space-y-3">
                          {Object.entries(configuratorAgent.services.reduce(
                            (acc, service) => {
                              // Determine the layer based on service name or description
                              let layer = "Core Layer"
                              const serviceName = service.name.toLowerCase()
                              const serviceDesc = service.description.toLowerCase()

                              if (serviceName.includes("data") || serviceDesc.includes("data")) {
                                layer = "Data Layer"
                              } else if (serviceName.includes("interface") || serviceDesc.includes("interface")) {
                                layer = "Interface Layer"
                              } else if (serviceName.includes("logic") || serviceDesc.includes("logic")) {
                                layer = "Logic Layer"
                              }

                              if (!acc[layer]) {
                                acc[layer] = []
                              }
                              acc[layer].push(service)
                              return acc
                            },
                            {} as Record<string, typeof configuratorAgent.services>,
                          )).map(([layer, services]) => (
                            <div key={layer} className="space-y-1">
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{layer}</h4>
                              <ul className="space-y-1 pl-2">
                                {services.map((service) => (
                                  <li key={service.id} className="flex items-start gap-1">
                                    <span className="text-sm">{service.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                      {configuratorAgent.tasks && configuratorAgent.tasks.length > 0 && (
                        <div>
                          <h3 className="font-bold mb-2">Tasks & Automations</h3>
                          <ul className="space-y-1 pl-2">
                            {configuratorAgent.tasks.map((task, index) => (
                              <li key={index} className="text-sm flex items-start gap-1">
                                <ChevronRight className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </div>
              
              {/* Middle column - Configurator */}
              <div className="flex-1 border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b px-6 py-4">
                  <h2 className="text-xl font-bold text-gray-800">{categoryQuestions[configStep]}</h2>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    {(groupedServices[categories[configStep]] || []).map((service, serviceIndex) => {
                      const isSelected = isServiceSelectedInConfig(service);
                      return (
                        <div 
                          key={`${categories[configStep]}-${serviceIndex}-${service.id || service.firestoreId}`} 
                          className={`border rounded-md p-3 ${isSelected ? 'bg-primary/5 border-primary' : 'bg-white hover:bg-slate-50'} cursor-pointer transition-colors flex flex-col`}
                          onClick={() => handleServiceSelection(service)}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {getServiceIcon(service.layer || "")}
                            </div>
                            <div className="font-medium" title={service.Deliverable}>
                              {service.Deliverable}
                            </div>
                          </div>
                          
                          <div className="text-sm text-slate-600 mb-2">
                            {service["Service Description"]}
                          </div>
                          
                          <div className="mt-auto pt-2 flex justify-between items-center border-t border-slate-200">
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{service["Time (in Weeks)"]} {service["Time (in Weeks)"] === 1 ? "week" : "weeks"}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs font-medium">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>${service.price?.toLocaleString() || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <Button 
                      variant="outline" 
                      onClick={handlePrevStep}
                      disabled={configStep === 0}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex-1 mx-6">
                      <Progress value={getCurrentProgress()} className="h-2" />
                    </div>
                    
                    <Button 
                      onClick={handleNextStep}
                    >
                      {configStep >= categories.length - 1 || 
                       !categories.slice(configStep + 1).some(cat => 
                         groupedServices[cat] && groupedServices[cat].length > 0) 
                       ? "Finish" : "Next"}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Right column - Quote Summary */}
              <div className="w-1/4 min-w-[250px] border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b px-4 py-3">
                  <h2 className="text-lg font-bold">Quote Summary</h2>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Selected Services</h3>
                      {Object.entries(selectedConfigServices).flatMap(([category, serviceIds], catIndex) => 
                        serviceIds.map((serviceId, serviceIndex) => {
                          // Find the service in the grouped services
                          const service = groupedServices[category]?.find(s => 
                            (s.id === serviceId) || (s.firestoreId === serviceId)
                          );
                          
                          if (!service) return null;
                          
                          // Create a truly unique key
                          const uniqueKey = `summary-${catIndex}-${category}-${serviceId}-${serviceIndex}`;
                          
                          return (
                            <div key={uniqueKey} className="flex items-start py-2 border-b border-gray-100 last:border-0 gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                {getServiceIcon(service.layer || "")}
                              </div>
                              <div className="flex-grow min-w-0 pr-4">
                                <span className="text-sm">{service.Deliverable}</span>
                              </div>
                              <div className="flex-shrink-0 text-sm font-medium whitespace-nowrap">${service.price?.toLocaleString()}</div>
                            </div>
                          );
                        })
                      ).filter(Boolean)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Total Cost</h3>
                      <div className="text-lg font-bold">
                        ${calculateTotalCost(serviceLayers, selectedCustomServices).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Timeline</h3>
                      <div className="text-base">
                        {calculateTotalTime()} weeks
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add custom fade-in-center animation and dialog styling */}
      <style jsx global>{`
        .smooth-transition {
          animation: smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        
        @keyframes smoothFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        /* Update the AgentCard's Configure button to be black with white text */
        .agent-grid-card .configure-button {
          background-color: black !important;
          color: white !important;
        }
        
        .agent-grid-card .configure-button:hover {
          background-color: #333 !important;
        }
        
        /* Style dialog backdrop and content */
        [data-radix-popper-content-wrapper] {
          background-color: rgba(0, 0, 0, 0.6) !important;
        }
        
        /* Add a subtle background color to the dialog */
        .DialogOverlay {
          background-color: rgba(0, 0, 0, 0.6) !important;
        }
        
        /* Fill the entire viewport with the dialog background */
        [data-radix-dialog-overlay] {
          background-color: rgba(0, 0, 0, 0.6) !important;
          opacity: 1 !important;
          animation: fadeBackdrop 0.3s ease-out !important;
        }
        
        @keyframes fadeBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Force animation on dialog content */
        [role="dialog"] {
          animation: smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          will-change: transform, opacity !important;
        }
        
        /* Override any existing animations to ensure ours takes precedence */
        .radix-side-top,
        .radix-side-right,
        .radix-side-bottom,
        .radix-side-left {
          animation: smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
      `}</style>
    </div>
  )
}

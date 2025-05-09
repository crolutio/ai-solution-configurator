"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgentGrid } from "@/components/agent-grid"
import { QuoteSummary } from "@/components/quote-summary"
import type { Agent, SelectedAgent, Dependency } from "@/lib/types"
import { horizontalAgents, businessAgents } from "@/lib/agents-data"
import { AgentCard } from "@/components/agent-card"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function AgentConfigurator() {
  const [selectedAgents, setSelectedAgents] = useState<SelectedAgent[]>([])
  const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null)
  const [configuratorAgentId, setConfiguratorAgentId] = useState<string | null>(null)

  // Automatically focus the agent when selected
  useEffect(() => {
    if (selectedAgents.length === 1) {
      setFocusedAgentId(selectedAgents[0].id)
    } else {
      setFocusedAgentId(null)
    }
  }, [selectedAgents])

  const toggleAgent = (agent: Agent, isSelected: boolean) => {
    if (isSelected) {
      // Add agent with all services and required dependencies selected
      setSelectedAgents((prev) => [
        ...prev,
        {
          ...agent,
          selectedServices: agent.services.map((service) => service.id),
          selectedDependencies: (agent.dependencies || []).filter((dep: Dependency) => dep.required).map((dep: Dependency) => dep.id),
        },
      ])
    } else {
      // Remove agent
      setSelectedAgents((prev) => prev.filter((a) => a.id !== agent.id))
    }
  }

  const toggleService = (agentId: string, serviceId: string, isSelected: boolean) => {
    setSelectedAgents((prev) => {
      const agentIndex = prev.findIndex((a) => a.id === agentId)

      // If agent is not selected yet, add it with just this service and required dependencies
      if (agentIndex === -1 && isSelected) {
        const agent = [...horizontalAgents, ...businessAgents].find((a) => a.id === agentId)
        if (!agent) return prev

        return [
          ...prev,
          {
            ...agent,
            selectedServices: [serviceId],
            selectedDependencies: (agent.dependencies || []).filter((dep: Dependency) => dep.required).map((dep: Dependency) => dep.id),
          },
        ]
      }

      // If agent exists, update its selected services
      if (agentIndex >= 0) {
        const updatedAgents = [...prev]
        if (isSelected) {
          // Add service
          updatedAgents[agentIndex] = {
            ...updatedAgents[agentIndex],
            selectedServices: [...updatedAgents[agentIndex].selectedServices, serviceId],
          }
        } else {
          // Remove service
          updatedAgents[agentIndex] = {
            ...updatedAgents[agentIndex],
            selectedServices: updatedAgents[agentIndex].selectedServices.filter((id) => id !== serviceId),
          }

          // If no services left, remove the agent
          if (updatedAgents[agentIndex].selectedServices.length === 0) {
            return updatedAgents.filter((a) => a.id !== agentId)
          }
        }
        return updatedAgents
      }

      return prev
    })
  }

  const toggleDependency = (agentId: string, dependencyId: string, isSelected: boolean) => {
    setSelectedAgents((prev) => {
      const agentIndex = prev.findIndex((a) => a.id === agentId)
      if (agentIndex === -1) return prev
      const updatedAgents = [...prev]
      const agent = updatedAgents[agentIndex]
      if (isSelected) {
        // Add dependency
        updatedAgents[agentIndex] = {
          ...agent,
          selectedDependencies: [...(agent.selectedDependencies || []), dependencyId],
        }
      } else {
        // Remove dependency (unless required)
        const fullAgent = [...horizontalAgents, ...businessAgents].find((a) => a.id === agentId)
        const dependency = fullAgent?.dependencies?.find((d: Dependency) => d.id === dependencyId)
        if (dependency?.required) return prev
        updatedAgents[agentIndex] = {
          ...agent,
          selectedDependencies: (agent.selectedDependencies || []).filter((id) => id !== dependencyId),
        }
      }
      return updatedAgents
    })
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
    return agent ? (agent.selectedDependencies || []).includes(dependencyId) : false
  }

  const areAllServicesSelected = (agentId: string) => {
    const agent = selectedAgents.find((a) => a.id === agentId)
    if (!agent) return false

    const fullAgent = [...horizontalAgents, ...businessAgents].find((a) => a.id === agentId)
    return fullAgent ? agent.selectedServices.length === fullAgent.services.length : false
  }

  // Find the focused agent
  const focusedAgent = focusedAgentId
    ? [...horizontalAgents, ...businessAgents].find((a) => a.id === focusedAgentId)
    : null

  // Handler to set focused agent by id
  const handleFocusAgent = (agent: Agent) => setFocusedAgentId(agent.id)

  // Find the configurator agent
  const configuratorAgent = configuratorAgentId
    ? [...horizontalAgents, ...businessAgents].find((a) => a.id === configuratorAgentId)
    : null

  // Debug logs
  console.log("🔍 configuratorAgentId:", configuratorAgentId);
  console.log("🔍 configuratorAgent:", configuratorAgent ? configuratorAgent.name : "null");

  // Fix handler to explicitly set configuratorAgentId with log
  const handleConfigureAgent = (agent: Agent) => {
    console.log("🔍 Configure button clicked for agent:", agent.name);
    // Force an immediate state update
    setConfiguratorAgentId(null); // Reset first to ensure the state changes
    setTimeout(() => {
      setConfiguratorAgentId(agent.id); // Then set the new value
      console.log("🔍 Set configuratorAgentId to:", agent.id);
    }, 10);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Enterprise AI Agent Configurator</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Build your custom AI solution by selecting the agents and services that best fit your organization's needs.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Tabs defaultValue="horizontal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="horizontal">Horizontal Enterprise Agent Pack</TabsTrigger>
              <TabsTrigger value="industry">Industry-Specific Agent Pack</TabsTrigger>
            </TabsList>

            <TabsContent value="horizontal" className="mt-0">
              <AgentGrid
                agents={horizontalAgents}
                toggleAgent={toggleAgent}
                toggleService={toggleService}
                toggleDependency={toggleDependency}
                isAgentSelected={() => false}
                isServiceSelected={() => false}
                isDependencySelected={() => false}
                areAllServicesSelected={() => false}
                onConfigure={handleConfigureAgent}
              />
            </TabsContent>

            <TabsContent value="industry" className="mt-0">
              <AgentGrid
                agents={businessAgents}
                toggleAgent={toggleAgent}
                toggleService={toggleService}
                toggleDependency={toggleDependency}
                isAgentSelected={() => false}
                isServiceSelected={() => false}
                isDependencySelected={() => false}
                areAllServicesSelected={() => false}
                onConfigure={handleConfigureAgent}
              />
            </TabsContent>
          </Tabs>
        </div>

        <QuoteSummary 
          selectedAgents={selectedAgents}
          isOpen={true}
          onToggle={() => {}}
          customServices={{ selectedIds: [], totalCost: 0 }}
          setSelectedAgents={setSelectedAgents}
          setSelectedCustomServices={() => {}}
          serviceLayers={[]}
        />
      </div>

      {/* Configurator Modal */}
      <Dialog open={!!configuratorAgent} onOpenChange={open => !open && setConfiguratorAgentId(null)}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-0 flex flex-col bg-white rounded-lg shadow-xl border border-gray-200 z-[100]">
          {configuratorAgent && (
            <div className="w-full h-full flex flex-col p-8 overflow-auto">
              <AgentCard
                agent={configuratorAgent}
                isAgentSelected={() => false}
                isServiceSelected={() => false}
                isDependencySelected={() => false}
                areAllServicesSelected={() => false}
                toggleAgent={() => {}}
                toggleService={() => {}}
                toggleDependency={() => {}}
                isFocused={true}
                onConfigure={(agent) => console.log("Modal configure button clicked", agent.name)}
              >
                <div id="agent-configurator-panel" className="mt-8">
                  <div className="p-6 border rounded-lg bg-slate-50">
                    <h2 className="text-lg font-bold mb-4 text-primary">Agent Configurator</h2>
                    <ul className="space-y-2 text-left">
                      <li className="font-semibold">Deployment</li>
                      <li className="font-semibold">Data Ingestion</li>
                      <li className="font-semibold">Inference</li>
                      <li className="font-semibold">RAG</li>
                      <li className="font-semibold">Integrations</li>
                      <li className="font-semibold">Frontend</li>
                    </ul>
                  </div>
                </div>
              </AgentCard>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

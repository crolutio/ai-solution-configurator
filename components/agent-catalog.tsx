"use client"

import { useState } from "react"
import { AgentCatalogItem } from "@/components/agent-catalog-item"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { enhancedAgentCategories } from "@/lib/enhanced-agent-data"
import { Search } from "lucide-react"
import type { Agent } from "@/lib/types"

const horizontalAgents = enhancedAgentCategories.find(cat => cat.id === "horizontal")?.agents ?? [];
const industryAgents = enhancedAgentCategories.find(cat => cat.id === "industry")?.agents ?? [];
const allAgents = [...horizontalAgents, ...industryAgents];

export function AgentCatalog() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([])
  const [activeTab, setActiveTab] = useState("all")

  // Filter agents based on search query and active tab
  const filteredAgents = allAgents.filter((agent) => {
    const matchesSearch =
      searchQuery === "" ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.tasks && agent.tasks.some((task) => task.toLowerCase().includes(searchQuery.toLowerCase())))

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "horizontal" && agent.category === "horizontal") ||
      (activeTab === "industry" && agent.category === "industry")

    return matchesSearch && matchesTab
  })

  const handleAddToQuote = (agent: Agent) => {
    if (selectedAgents.some((a) => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter((a) => a.id !== agent.id))
    } else {
      setSelectedAgents([...selectedAgents, agent])
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Agent Catalog</h1>
          <p className="text-slate-600 mt-1">
            Explore our comprehensive collection of AI agents for your enterprise needs
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search agents..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
          <TabsTrigger value="all">All Agents</TabsTrigger>
          <TabsTrigger value="horizontal">Horizontal</TabsTrigger>
          <TabsTrigger value="industry">Industry-Specific</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-8">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-500">No agents match your search criteria</p>
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <AgentCatalogItem
              key={agent.id}
              agent={agent}
              onAddToQuote={handleAddToQuote}
              isInQuote={selectedAgents.some((a) => a.id === agent.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

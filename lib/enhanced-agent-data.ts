import type { AgentCategory } from "./types"
import { horizontalAgents, businessAgents } from "./agents-data"

// Create enhanced agent categories
export const enhancedAgentCategories: AgentCategory[] = [
  {
    id: "custom",
    name: "All Services",
    agents: [],
  },
  {
    id: "horizontal",
    name: "Horizontal Enterprise Services",
    agents: horizontalAgents,
  },
  {
    id: "industry",
    name: "Industry-Specific Services",
    agents: businessAgents,
  },
]

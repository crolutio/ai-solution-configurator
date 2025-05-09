// Map agent types to avatar images
export const agentAvatarMap: Record<string, string> = {
  // Horizontal agents
  Finance: "/avatars/jorge-finance.png",
  "Human Resources": "/avatars/jorge-hr.png",
  "Customer Support": "/avatars/jorge-customer-service.png",
  "Marketing & Sales": "/avatars/jorge-sales.png",
  Legal: "/avatars/jorge-lawyer.png",

  // Industry agents
  Healthcare: "/avatars/jorge-doctor.png",
  Government: "/avatars/jorge-urban-planning.png",
  "Financial Services": "/avatars/jorge-finance.png",
  Manufacturing: "/avatars/jorge-infrastructure.png",
  Energy: "/avatars/jorge-infrastructure.png",
  Retail: "/avatars/jorge-marketing.png",

  // Default fallback
  default: "/thoughtful-gaze.png",
}

// Get avatar for a specific agent type
export function getAgentAvatar(agentType: string): string {
  return agentAvatarMap[agentType] || agentAvatarMap.default
}

// Get avatar for a specific agent
export function getAgentAvatarByName(agentName: string): string {
  // Map specific agent names to avatars if needed
  if (agentName.includes("Healthcare")) return agentAvatarMap["Healthcare"]
  if (agentName.includes("Finance")) return agentAvatarMap["Finance"]
  if (agentName.includes("HR")) return agentAvatarMap["Human Resources"]
  if (agentName.includes("Legal")) return agentAvatarMap["Legal"]
  if (agentName.includes("Customer")) return agentAvatarMap["Customer Support"]
  if (agentName.includes("Marketing") || agentName.includes("Sales")) return agentAvatarMap["Marketing & Sales"]
  if (agentName.includes("Urban") || agentName.includes("Government")) return agentAvatarMap["Government"]
  if (agentName.includes("Manufacturing")) return agentAvatarMap["Manufacturing"]
  if (agentName.includes("Energy")) return agentAvatarMap["Energy"]
  if (agentName.includes("Retail")) return agentAvatarMap["Retail"]

  return agentAvatarMap.default
}

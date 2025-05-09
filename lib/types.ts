export interface Resource {
  role: string
  percentage: number
}

export interface AgentService {
  id: string
  name: string
  description: string
  timeInWeeks: number
  cost: number
  resources: Resource[]
}

export interface Dependency {
  id: string
  name: string
  description: string
  timeInWeeks: number
  cost: number
  resources: Resource[]
  required?: boolean
}

export interface Agent {
  id: string
  name: string
  category: "horizontal" | "industry"
  type: string
  description: string
  avatar: string
  services: AgentService[]
  dependencies?: Dependency[]
  price: number
  timeInWeeks: number
  resources: Resource[]
  defaultSelected?: boolean
  tasks?: string[] // New field for tasks
}

export interface SelectedAgent extends Agent {
  selectedServices: string[]
  selectedDependencies?: string[]
}

export interface AgentCategory {
  id: string
  name: string
  agents: Agent[]
}

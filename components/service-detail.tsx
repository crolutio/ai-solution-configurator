"use client"

import type { ServiceDeliverable } from '@/lib/getServices'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, DollarSign, Users, Plus, Check } from "lucide-react"

interface ServiceDetailProps {
  service: ServiceDeliverable
  isSelected?: boolean
  onAddToQuote?: (service: ServiceDeliverable) => void
}

export function ServiceDetail({ service, isSelected = false, onAddToQuote }: ServiceDetailProps) {
  // Calculate total resource allocation
  const totalResourceAllocation = service.Resources.reduce((sum, resource) => sum + resource["% time"], 0)

  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{service.Deliverable}</CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="outline" className="mr-2">
                {service.layer || "Service"}
              </Badge>
              <Badge variant="secondary">
                {service["Time (in Weeks)"]} {service["Time (in Weeks)"] === 1 ? "week" : "weeks"}
              </Badge>
            </CardDescription>
          </div>
          <div className="text-xl font-bold">${service.price?.toLocaleString() || "Price on request"}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Description</h3>
          <p className="text-sm text-slate-600 whitespace-pre-line">{service["Service Description"]}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Users className="h-4 w-4 mr-1 text-primary" />
            Resource Allocation
          </h3>
          <div className="space-y-3">
            {service.Resources.map((resource) => (
              <div key={resource.Role} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{resource.Role}</span>
                  <span className="font-medium">{Math.round(resource["% time"] * 100)}%</span>
                </div>
                <Progress value={resource["% time"] * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-medium">Timeline</h3>
            </div>
            <p className="text-2xl font-bold">{service["Time (in Weeks)"]} weeks</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-medium">Investment</h3>
            </div>
            <p className="text-2xl font-bold">${service.price?.toLocaleString() || "N/A"}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t p-4 bg-slate-50">
        <Button
          onClick={() => onAddToQuote?.(service)}
          variant={isSelected ? "secondary" : "default"}
          className="w-full"
        >
          {isSelected ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Added to Quote
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add to Quote
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

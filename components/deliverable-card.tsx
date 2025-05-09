"use client"

import type { DeliverableItem } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface DeliverableCardProps {
  deliverable: DeliverableItem
  isSelected: boolean
  onToggle: () => void
}

export function DeliverableCard({ deliverable, isSelected, onToggle }: DeliverableCardProps) {
  const { name, description, timeInWeeks, cost, resources } = deliverable
  const [showFullDescription, setShowFullDescription] = useState(false)

  const truncatedDescription = description.length > 120 ? `${description.substring(0, 120)}...` : description

  return (
    <Card className={`transition-all ${isSelected ? "border-primary" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id={`deliverable-${deliverable.id}`}
            checked={isSelected}
            onCheckedChange={onToggle}
            className="mt-1"
          />
          <div className="flex-1">
            <label htmlFor={`deliverable-${deliverable.id}`} className="font-medium cursor-pointer hover:text-primary">
              {name}
            </label>
            <div className="text-sm text-muted-foreground">
              {showFullDescription ? (
                <>
                  <p>{description}</p>
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setShowFullDescription(false)}>
                    Show less
                  </Button>
                </>
              ) : (
                <>
                  <p>{truncatedDescription}</p>
                  {description.length > 120 && (
                    <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setShowFullDescription(true)}>
                      Show more
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {timeInWeeks} week{timeInWeeks !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span>${cost.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full">
          <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Resources:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(resources).map(([role, percentage]) => (
              <Badge key={role} variant="outline" className="text-xs">
                {role}: {percentage}%
              </Badge>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

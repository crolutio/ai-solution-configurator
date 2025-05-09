"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

// Form validation schema
const quoteFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(6, { message: "Please enter a valid phone number." }),
  additionalNotes: z.string().optional(),
})

type QuoteFormValues = z.infer<typeof quoteFormSchema>

interface QuoteSubmissionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteData: {
    totalPrice: number
    totalTime: number
    serviceCount: number
    deliveryDays?: number
    priceMultiplier?: number
  }
}

export function QuoteSubmissionForm({ open, onOpenChange, quoteData }: QuoteSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      email: "",
      phone: "",
      additionalNotes: "",
    },
  })

  const onSubmit = async (data: QuoteFormValues) => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Combine form data with quote data
    const submissionData = {
      ...data,
      quoteDetails: quoteData,
    }

    console.log("Quote submission data:", submissionData)

    setIsSubmitting(false)
    onOpenChange(false)

    // Reset form
    form.reset()

    // Show success toast
    toast({
      title: "Quote submitted successfully",
      description: "We'll get back to you with a detailed proposal shortly.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Quote Request</DialogTitle>
          <DialogDescription>
            Please provide your contact information to receive a detailed proposal for your AI solution.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone number" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific requirements or questions about your AI solution"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional: Include any additional information or questions.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-slate-50 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">Quote Summary</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Price</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                    }).format(quoteData.totalPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timeline</p>
                  <p className="font-medium">{quoteData.totalTime} weeks</p>
                  {quoteData.deliveryDays && (
                    <p className="text-xs text-muted-foreground">
                      {quoteData.deliveryDays} days delivery
                      {quoteData.priceMultiplier && quoteData.priceMultiplier !== 1 && (
                        <span className="ml-1">({quoteData.priceMultiplier > 1 ? "expedited" : "extended"})</span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Services</p>
                  <p className="font-medium">{quoteData.serviceCount} items</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="submit-quote-btn"
                style={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? { color: '#000' } : {}}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Quote"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils" // if you have a classNames helper

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"



export function ShadcnDatePicker({
  label = "Select Date",
  value,
  onChange,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Label htmlFor="date" className="px-1">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            {value ? value.toLocaleDateString() : "Select date"}
            <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(date) => {
              onChange(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

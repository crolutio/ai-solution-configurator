"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, Clock, User } from "lucide-react"
import { useRouter } from "next/navigation"

// Mock user data - in a real app, this would come from your auth system
const mockUser = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  avatarUrl: "/thoughtful-gaze.png",
  loginTime: new Date(),
}

// Temporarily remove the profile picture/avatar dropdown from rendering in the UI
export function UserSessionDropdown() {
  return null;
}

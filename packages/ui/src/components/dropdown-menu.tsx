"use client"

import * as React from "react"
import { Menu } from "@base-ui/react"
import { cn } from "../lib/utils"
import "./dropdown-menu.css"

function DropdownMenu(props: Menu.Root.Props) {
  return <Menu.Root {...props} />
}

function DropdownMenuTrigger(props: Menu.Trigger.Props) {
  return <Menu.Trigger {...props} />
}

function DropdownMenuPortal(props: Menu.Portal.Props) {
  return <Menu.Portal {...props} />
}

function DropdownMenuPositioner({ className, ...props }: Menu.Positioner.Props) {
  return (
    <Menu.Positioner
      className={cn("z-50 outline-none", className)}
      {...props}
    />
  )
}

function DropdownMenuPopup({ className, ...props }: Menu.Popup.Props) {
  return (
    <Menu.Popup
      className={cn(
        "dropdown-popup min-w-[140px] rounded-lg bg-card p-1 text-sm text-card-foreground shadow-lg ring-1 ring-foreground/10",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({ className, ...props }: Menu.Item.Props) {
  return (
    <Menu.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-md px-3 py-1.5 outline-none",
        "hover:bg-muted focus:bg-muted",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: Menu.Separator.Props) {
  return (
    <Menu.Separator
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuPopup,
  DropdownMenuItem,
  DropdownMenuSeparator,
}

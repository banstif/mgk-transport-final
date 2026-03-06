"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { ChauffeursContent } from "@/components/chauffeurs/chauffeurs-content"
import { VehiculesContent } from "@/components/vehicules/vehicules-content"
import { AlertesContent } from "@/components/alertes/alertes-content"
import { ParametresContent } from "@/components/parametres/parametres-content"

// Module types
type Module = "dashboard" | "chauffeurs" | "vehicules" | "clients" | "facturation" | "alertes" | "parametres"

export default function AppPage() {
  const [mounted, setMounted] = React.useState(false)
  const [currentModule, setCurrentModule] = React.useState<Module>("dashboard")

  // Handle hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for navigation events from sidebar
  React.useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      setCurrentModule(event.detail as Module)
    }
    
    window.addEventListener("navigate", handleNavigate as EventListener)
    return () => {
      window.removeEventListener("navigate", handleNavigate as EventListener)
    }
  }, [])

  // Get the path for the current module
  const getActivePath = () => {
    const paths: Record<Module, string> = {
      dashboard: "/",
      chauffeurs: "/chauffeurs",
      vehicules: "/vehicules",
      clients: "/clients",
      facturation: "/facturation",
      alertes: "/alertes",
      parametres: "/parametres",
    }
    return paths[currentModule]
  }

  // Render the current module content
  const renderContent = () => {
    switch (currentModule) {
      case "dashboard":
        return <DashboardContent />
      case "chauffeurs":
        return <ChauffeursContent />
      case "vehicules":
        return <VehiculesContent />
      case "clients":
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Gestion des Clients</h1>
              <p className="text-muted-foreground">Module en cours de développement...</p>
            </div>
          </div>
        )
      case "facturation":
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
              <p className="text-muted-foreground">Module en cours de développement...</p>
            </div>
          </div>
        )
      case "alertes":
        return <AlertesContent />
      case "parametres":
        return <ParametresContent />
      default:
        return <DashboardContent />
    }
  }

  // Loading state before hydration
  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout activePath={getActivePath()}>
      {renderContent()}
    </MainLayout>
  )
}

"use client"

import * as React from "react"
import {
  AlertTriangle,
  FileWarning,
  Calendar,
  Fuel,
  Wrench,
  ArrowRight,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AlertPriority = "high" | "medium" | "low"

interface AlertItem {
  id: string
  title: string
  description: string
  time: string
  priority: AlertPriority
  icon: React.ElementType
}

const alertsData: AlertItem[] = [
  {
    id: "1",
    title: "Maintenance urgente requise",
    description: "Le véhicule V-2024-15 nécessite une révision immédiate",
    time: "Il y a 15 min",
    priority: "high",
    icon: Wrench,
  },
  {
    id: "2",
    title: "Assurance expire bientôt",
    description: "L'assurance du véhicule V-2024-08 expire dans 3 jours",
    time: "Il y a 1h",
    priority: "high",
    icon: FileWarning,
  },
  {
    id: "3",
    title: "Niveau de carburant bas",
    description: "Le véhicule V-2024-22 a un niveau de carburant critique",
    time: "Il y a 2h",
    priority: "medium",
    icon: Fuel,
  },
  {
    id: "4",
    title: "Contrôle technique à planifier",
    description: "Le contrôle technique de V-2024-03 est dû le mois prochain",
    time: "Il y a 3h",
    priority: "medium",
    icon: Calendar,
  },
  {
    id: "5",
    title: "Permis chauffeur à renouveler",
    description: "Le permis du chauffeur M. Dupont expire dans 30 jours",
    time: "Hier",
    priority: "low",
    icon: FileWarning,
  },
]

const getPriorityStyles = (priority: AlertPriority) => {
  switch (priority) {
    case "high":
      return {
        container: "bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500",
        icon: "text-red-500",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        badgeText: "Haute",
      }
    case "medium":
      return {
        container: "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500",
        icon: "text-orange-500",
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        badgeText: "Moyenne",
      }
    case "low":
      return {
        container: "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500",
        icon: "text-yellow-500",
        badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        badgeText: "Basse",
      }
    default:
      return {
        container: "",
        icon: "",
        badge: "",
        badgeText: "",
      }
  }
}

interface AlertCardProps {
  alert: AlertItem
}

function AlertCard({ alert }: AlertCardProps) {
  const Icon = alert.icon
  const styles = getPriorityStyles(alert.priority)

  return (
    <div
      className={cn(
        "group cursor-pointer rounded-lg p-3 transition-all duration-200 hover:shadow-md",
        styles.container
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm",
            styles.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground truncate">
              {alert.title}
            </h4>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                styles.badge
              )}
            >
              {styles.badgeText}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {alert.description}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{alert.time}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AlertsWidget() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Alertes récentes</CardTitle>
          <CardDescription>
            Les 5 dernières alertes nécessitant votre attention
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[var(--mgk-primary)] hover:text-[var(--mgk-primary-dark)] hover:bg-[var(--mgk-primary)]/10"
        >
          Voir tout
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertsData.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </CardContent>
    </Card>
  )
}

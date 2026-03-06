"use client"

import * as React from "react"
import { useState } from "react"
import {
  Fuel,
  Wrench,
  Users,
  TrendingUp,
  DollarSign,
  Truck,
  FileText,
  AlertTriangle,
  UserCheck,
  Car,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  totalChauffeurs: number
  chauffeursActifs: number
  totalVehicules: number
  vehiculesActifs: number
  totalClients: number
  clientsActifs: number
  facturesEnAttente: number
  facturesEnRetard: number
  alertesNonLues: number
  alertesHautePriorite: number
  entretiensAVenir: number
  documentsExpires: number
}

interface StatCardData {
  id: string
  title: string
  value: string | number
  subValue?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon: React.ElementType
  iconBgColor: string
}

interface StatCardProps {
  data: StatCardData
  isLoading?: boolean
}

function StatCard({ data, isLoading }: StatCardProps) {
  const Icon = data.icon
  const TrendIcon = data.trend?.isPositive ? ArrowUpRight : ArrowDownRight

  if (isLoading) {
    return (
      <div className="stat-card mgk-card-hover">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    )
  }

  return (
    <div className="stat-card mgk-card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {data.title}
          </p>
          <p className="text-2xl font-bold text-foreground">{data.value}</p>
          {data.subValue && (
            <p className="text-xs text-muted-foreground mt-1">{data.subValue}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
            data.iconBgColor
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {data.trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              data.trend.isPositive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span>{data.trend.value}%</span>
          </div>
          <span className="text-xs text-muted-foreground">
            vs. mois précédent
          </span>
        </div>
      )}
    </div>
  )
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fuelStats, setFuelStats] = useState({ total: 0, count: 0 })

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch dashboard stats
        const response = await fetch('/api/dashboard/stats')
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        }

        // Fetch fuel stats
        const fuelResponse = await fetch('/api/stats/carburant')
        const fuelData = await fuelResponse.json()
        if (fuelData.success) {
          setFuelStats({
            total: fuelData.data?.totalMois || 0,
            count: fuelData.data?.countMois || 0,
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' DH'
  }

  // Generate stats based on real data
  const statsData: StatCardData[] = stats ? [
    {
      id: "chauffeurs",
      title: "Chauffeurs actifs",
      value: stats.chauffeursActifs,
      subValue: `sur ${stats.totalChauffeurs} total`,
      icon: UserCheck,
      iconBgColor: "bg-[#0066cc]",
    },
    {
      id: "vehicules",
      title: "Véhicules actifs",
      value: stats.vehiculesActifs,
      subValue: `sur ${stats.totalVehicules} total`,
      icon: Truck,
      iconBgColor: "bg-[#003d7a]",
    },
    {
      id: "clients",
      title: "Clients actifs",
      value: stats.clientsActifs,
      subValue: `sur ${stats.totalClients} total`,
      icon: Users,
      iconBgColor: "bg-emerald-600",
    },
    {
      id: "fuel",
      title: "Dépenses carburant (mois)",
      value: formatCurrency(fuelStats.total),
      subValue: `${fuelStats.count} pleins ce mois`,
      icon: Fuel,
      iconBgColor: "bg-orange-500",
    },
    {
      id: "factures",
      title: "Factures en attente",
      value: stats.facturesEnAttente + stats.facturesEnRetard,
      subValue: stats.facturesEnRetard > 0 ? `${stats.facturesEnRetard} en retard` : undefined,
      icon: FileText,
      iconBgColor: "bg-amber-600",
    },
    {
      id: "alerts",
      title: "Alertes actives",
      value: stats.alertesNonLues,
      subValue: stats.alertesHautePriorite > 0 ? `${stats.alertesHautePriorite} haute priorité` : undefined,
      icon: AlertTriangle,
      iconBgColor: "bg-red-500",
    },
  ] : []

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        <>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <StatCard key={i} data={{ id: String(i), title: '', value: '', icon: Truck, iconBgColor: '' }} isLoading />
          ))}
        </>
      ) : (
        statsData.map((stat) => (
          <StatCard key={stat.id} data={stat} />
        ))
      )}
    </div>
  )
}

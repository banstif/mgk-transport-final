"use client"

import * as React from "react"
import {
  Fuel,
  Wrench,
  Users,
  TrendingUp,
  DollarSign,
  Truck,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardData {
  id: string
  title: string
  value: string
  trend: {
    value: number
    isPositive: boolean
  }
  icon: React.ElementType
  iconBgColor: string
}

const statsData: StatCardData[] = [
  {
    id: "fuel",
    title: "Total dépenses carburant",
    value: "45 230,00 DH",
    trend: { value: 12.5, isPositive: false },
    icon: Fuel,
    iconBgColor: "bg-[var(--mgk-primary)]",
  },
  {
    id: "maintenance",
    title: "Total coûts d'entretien",
    value: "18 450,00 DH",
    trend: { value: 8.3, isPositive: true },
    icon: Wrench,
    iconBgColor: "bg-[var(--mgk-accent)]",
  },
  {
    id: "payroll",
    title: "Masse salariale mensuelle",
    value: "62 500,00 DH",
    trend: { value: 3.2, isPositive: false },
    icon: Users,
    iconBgColor: "bg-[var(--mgk-primary-dark)]",
  },
  {
    id: "revenue",
    title: "Chiffre d'affaires mensuel",
    value: "185 600,00 DH",
    trend: { value: 15.8, isPositive: true },
    icon: TrendingUp,
    iconBgColor: "bg-green-600",
  },
  {
    id: "profit",
    title: "Bénéfice net",
    value: "59 420,00 DH",
    trend: { value: 22.4, isPositive: true },
    icon: DollarSign,
    iconBgColor: "bg-emerald-600",
  },
  {
    id: "vehicles",
    title: "Nombre de véhicules actifs",
    value: "24",
    trend: { value: 4.2, isPositive: true },
    icon: Truck,
    iconBgColor: "bg-[var(--mgk-primary)]",
  },
]

interface StatCardProps {
  data: StatCardData
}

function StatCard({ data }: StatCardProps) {
  const Icon = data.icon
  const TrendIcon = data.trend.isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="stat-card mgk-card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {data.title}
          </p>
          <p className="text-2xl font-bold text-foreground">{data.value}</p>
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
    </div>
  )
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statsData.map((stat) => (
        <StatCard key={stat.id} data={stat} />
      ))}
    </div>
  )
}

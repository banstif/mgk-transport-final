"use client"

import * as React from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { TopClients } from "@/components/dashboard/top-clients"
import { AlertsWidget } from "@/components/dashboard/alerts-widget"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Fuel, Calendar } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"

// Données pour le graphique de rentabilité des véhicules
const vehicleProfitData = [
  { name: "V-2024-01", profit: 4500, costs: 1200 },
  { name: "V-2024-02", profit: 3800, costs: 1500 },
  { name: "V-2024-03", profit: 5200, costs: 900 },
  { name: "V-2024-04", profit: 2900, costs: 1800 },
  { name: "V-2024-05", profit: 4100, costs: 1100 },
]

// Données pour la répartition des dépenses
const expenseDistribution = [
  { name: "Carburant", value: 45, color: "#0066cc" },
  { name: "Entretien", value: 25, color: "#ff6600" },
  { name: "Salaires", value: 20, color: "#003d7a" },
  { name: "Assurances", value: 10, color: "#10b981" },
]

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
  return `${formatted} DH`
}

// Composant pour le graphique de rentabilité des véhicules
function VehicleProfitChart() {
  const chartConfig = {
    profit: {
      label: "Bénéfice",
      color: "#0066cc",
    },
    costs: {
      label: "Coûts",
      color: "#ff6600",
    },
  } satisfies ChartConfig

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5 text-[#0066cc]" />
          Rentabilité par véhicule
        </CardTitle>
        <CardDescription>
          Top 5 véhicules les plus rentables ce mois
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={vehicleProfitData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--border)"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              width={80}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
            />
            <Bar
              dataKey="profit"
              fill="var(--color-profit)"
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="costs"
              fill="var(--color-costs)"
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Composant pour la répartition des dépenses
function ExpenseDistributionChart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Fuel className="h-5 w-5 text-[#ff6600]" />
          Répartition des dépenses
        </CardTitle>
        <CardDescription>
          Distribution des coûts du mois en cours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {expenseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `${value}%`}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour les prochains événements
function UpcomingEvents() {
  const events = [
    { id: 1, type: "entretien", vehicle: "V-2024-15", date: "15 Jan 2025", icon: Calendar },
    { id: 2, type: "visite", vehicle: "V-2024-08", date: "20 Jan 2025", icon: Calendar },
    { id: 3, type: "assurance", vehicle: "V-2024-22", date: "25 Jan 2025", icon: Calendar },
    { id: 4, type: "entretien", vehicle: "V-2024-03", date: "02 Fév 2025", icon: Calendar },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#0066cc]" />
          Prochains événements
        </CardTitle>
        <CardDescription>
          Entretiens et échéances à venir
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0066cc]/10">
                <event.icon className="h-5 w-5 text-[#0066cc]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{event.vehicle}</p>
                <p className="text-xs text-muted-foreground capitalize">{event.type}</p>
              </div>
              <div className="text-sm text-muted-foreground">{event.date}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre espace de gestion MGK Transport. Voici un aperçu de votre activité.
        </p>
      </div>

      {/* Statistiques */}
      <StatsCards />

      {/* Onglets pour les graphiques */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <div className="space-y-4">
              <AlertsWidget />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TopClients />
            <VehicleProfitChart />
            <div className="space-y-4">
              <ExpenseDistributionChart />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <VehicleProfitChart />
            <ExpenseDistributionChart />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <UpcomingEvents />
            <TopClients />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

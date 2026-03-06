"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Jan", revenue: 145000, expenses: 98000 },
  { month: "Fév", revenue: 152000, expenses: 102000 },
  { month: "Mar", revenue: 168000, expenses: 105000 },
  { month: "Avr", revenue: 175000, expenses: 112000 },
  { month: "Mai", revenue: 162000, expenses: 108000 },
  { month: "Juin", revenue: 180000, expenses: 115000 },
  { month: "Juil", revenue: 195000, expenses: 125000 },
  { month: "Août", revenue: 172000, expenses: 118000 },
  { month: "Sep", revenue: 188000, expenses: 122000 },
  { month: "Oct", revenue: 192000, expenses: 128000 },
  { month: "Nov", revenue: 178000, expenses: 119000 },
  { month: "Déc", revenue: 185600, expenses: 126180 },
]

const chartConfig = {
  revenue: {
    label: "Chiffre d'affaires",
    color: "var(--mgk-primary)",
  },
  expenses: {
    label: "Dépenses",
    color: "var(--mgk-accent)",
  },
} satisfies ChartConfig

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} DH`;
}

export function RevenueChart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Revenus vs Dépenses</CardTitle>
        <CardDescription>
          Comparaison mensuelle sur les 12 derniers mois
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(value as number)}
                />
              }
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="expenses"
              fill="var(--color-expenses)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

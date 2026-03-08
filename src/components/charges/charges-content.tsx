"use client"

import * as React from "react"
import { CreditCard, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChargesList } from "./charges-list"
import { ChargeForm } from "./charge-form"

// Types
type TypeCharge = 'VEHICULE' | 'SOCIETE'
type CategorieCharge =
  | 'CARBURANT'
  | 'ASSURANCE_VEHICULE'
  | 'ENTRETIEN_VEHICULE'
  | 'REPARATION'
  | 'VISITE_TECHNIQUE'
  | 'PNEUS'
  | 'PEAGE'
  | 'STATIONNEMENT'
  | 'AMENDE'
  | 'LOYER'
  | 'ELECTRICITE'
  | 'EAU'
  | 'TELEPHONE_INTERNET'
  | 'SALAIRES'
  | 'CHARGES_SOCIALES'
  | 'ASSURANCE_SOCIETE'
  | 'COMPTABILITE'
  | 'FOURNITURES_BUREAU'
  | 'PUBLICITE'
  | 'FORMATION'
  | 'AUTRE'

type StatutCharge = 'EN_ATTENTE' | 'PAYEE' | 'PARTIELLEMENT' | 'ANNULEE' | 'EN_RETARD'
type ModePaiementCharge = 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'CARTE' | 'PRELEVEMENT'
type FrequenceRecurrence = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL'

interface Charge {
  id: string
  type: TypeCharge
  categorie: CategorieCharge
  description: string
  montant: number
  dateCharge: Date | string
  dateEcheance?: string | null
  statut: StatutCharge
  vehiculeId?: string | null
  vehicule?: { id: string; immatriculation: string; marque: string; modele: string } | null
  fournisseur?: string | null
  numeroFacture?: string | null
  modePaiement?: ModePaiementCharge | null
  referencePaiement?: string | null
  datePaiement?: Date | string | null
  fichier?: string | null
  recurrente: boolean
  frequenceRecurrence?: FrequenceRecurrence | null
  prochaineEcheance?: Date | string | null
  notes?: string | null
}

export function ChargesContent() {
  const [charges, setCharges] = React.useState<Charge[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingCharge, setEditingCharge] = React.useState<Charge | null>(null)
  const [viewingCharge, setViewingCharge] = React.useState<Charge | null>(null)
  const [filters, setFilters] = React.useState({
    type: '',
    statut: '',
    categorie: '',
    search: '',
    vehiculeId: '',
  })

  // Fetch charges
  const fetchCharges = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type) params.set('type', filters.type)
      if (filters.statut) params.set('statut', filters.statut)
      if (filters.categorie) params.set('categorie', filters.categorie)
      if (filters.vehiculeId) params.set('vehiculeId', filters.vehiculeId)
      if (filters.search) params.set('search', filters.search)

      const response = await fetch(`/api/charges?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setCharges(data.data)
      }
    } catch (error) {
      console.error("Erreur récupération charges:", error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  React.useEffect(() => {
    fetchCharges()
  }, [fetchCharges, refreshKey])

  const handleAdd = () => {
    setEditingCharge(null)
    setFormOpen(true)
  }

  const handleEdit = (charge: Charge) => {
    setEditingCharge(charge)
    setFormOpen(true)
  }

  const handleView = (charge: Charge) => {
    setViewingCharge(charge)
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/charges/${id}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    
    if (data.success) {
      setRefreshKey(prev => prev + 1)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleFormSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[#0066cc]" />
            Gestion des Charges
          </h1>
          <p className="text-muted-foreground">
            Gérez les charges véhicules et société
          </p>
        </div>
      </div>

      {/* Charges List */}
      <ChargesList
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        filters={filters}
        setFilters={setFilters}
        charges={charges}
        isLoading={isLoading}
        total={charges.length}
        totalPages={1}
      />

      {/* Add/Edit Form */}
      <ChargeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
        editingCharge={editingCharge}
      />
    </div>
  )
}

"use client"

import * as React from "react"
import { Plus, CreditCard, Building2, Truck, FileText, AlertTriangle, Clock, Filter, Search, CheckCircle, Loader2, MoreHorizontal, RefreshCw, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/format"
import { useVehicules } from "@/hooks/use-queries"
import { cn } from "@/lib/utils"

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

// Labels
const TYPE_CHARGE_LABELS: Record<TypeCharge, string> = {
  VEHICULE: 'Véhicule',
  SOCIETE: 'Société',
}

const CATEGORIE_LABELS: Record<CategorieCharge, string> = {
  CARBURANT: 'Carburant',
  ASSURANCE_VEHICULE: 'Assurance véhicule',
  ENTRETIEN_VEHICULE: 'Entretien véhicule',
  REPARATION: 'Réparation',
  VISITE_TECHNIQUE: 'Visite technique',
  PNEUS: 'Pneus',
  PEAGE: 'Péage',
  STATIONNEMENT: 'Stationnement',
  AMENDE: 'Amende',
  LOYER: 'Loyer',
  ELECTRICITE: 'Électricité',
  EAU: 'Eau',
  TELEPHONE_INTERNET: 'Téléphone/Internet',
  SALAIRES: 'Salaires',
  CHARGES_SOCIALES: 'Charges sociales',
  ASSURANCE_SOCIETE: 'Assurance société',
  COMPTABILITE: 'Comptabilité',
  FOURNITURES_BUREAU: 'Fournitures bureau',
  PUBLICITE: 'Publicité',
  FORMATION: 'Formation',
  AUTRE: 'Autre',
}

const STATUT_CHARGE_LABELS: Record<StatutCharge, string> = {
  EN_ATTENTE: 'En attente',
  PAYEE: 'Payée',
  PARTIELLEMENT: 'Partiellement',
  ANNULEE: 'Annulée',
  EN_RETARD: 'En retard',
}

const STATUT_COLORS: Record<StatutCharge, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  PAYEE: 'bg-green-100 text-green-800',
  PARTIELLEMENT: 'bg-orange-100 text-orange-800',
  ANNULEE: 'bg-gray-100 text-gray-800',
  EN_RETARD: 'bg-red-100 text-red-800',
}

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

interface ChargesListProps {
  onAdd: () => void
  onEdit: (charge: Charge) => void
  onView: (charge: Charge) => void
  onDelete: (id: string) => void
  onRefresh?: () => void
  filters: {
    type: string
    statut: string
    categorie: string
    search: string
    vehiculeId: string
  }
  setFilters: React.Dispatch<React.SetStateAction<typeof ChargesListProps['filters']>>
  charges: Charge[]
  isLoading: boolean
  total: number
  totalPages: number
}

export function ChargesList({
  onAdd,
  onEdit,
  onView,
  onDelete,
  onRefresh,
  filters,
  setFilters,
  charges,
  isLoading,
  total,
  totalPages
}: ChargesListProps) {
  const { toast } = useToast()
  const { data: vehiculesData } = useVehicules({ page: 1, pageSize: 100 })
  const vehicules = vehiculesData?.data || []

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [chargeToDelete, setChargeToDelete] = React.useState<Charge | null>(null)

  const handleDeleteConfirm = async () => {
    if (!chargeToDelete) return
    try {
      await onDelete(chargeToDelete.id)
      toast({
        title: "Succès",
        description: "Charge supprimée avec succès",
      })
      setDeleteDialogOpen(false)
      setChargeToDelete(null)
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la suppression de la charge",
      })
    }
  }

  const filteredCharges = React.useMemo(() => {
    return charges.filter(charge => {
      if (filters.type && charge.type !== filters.type) return false
      if (filters.statut && charge.statut !== filters.statut) return false
      if (filters.categorie && charge.categorie !== filters.categorie) return false
      if (filters.vehiculeId && charge.vehiculeId !== filters.vehiculeId) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          charge.description.toLowerCase().includes(searchLower) ||
          (charge.fournisseur?.toLowerCase().includes(searchLower)) ||
          (charge.numeroFacture?.toLowerCase().includes(searchLower))
        )
      }
      return true
    })
  }, [charges, filters])

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalCharges = charges.length
    const totalAmount = charges.reduce((sum, c) => sum + c.montant, 0)
    const pending = charges.filter(c => c.statut === 'EN_ATTENTE').length
    const inRetard = charges.filter(c => c.statut === 'EN_RETARD').length
    const vehiculeCharges = charges.filter(c => c.type === 'VEHICULE').length
    const societeCharges = charges.filter(c => c.type === 'SOCIETE').length

    return { totalCharges, totalAmount, pending, inRetard, vehiculeCharges, societeCharges }
  }, [charges])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
          <Select value={filters.type || "all"} onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? "" : value })}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="VEHICULE">Véhicule</SelectItem>
              <SelectItem value="SOCIETE">Société</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.statut || "all"} onValueChange={(value) => setFilters({ ...filters, statut: value === "all" ? "" : value })}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="PAYEE">Payée</SelectItem>
              <SelectItem value="EN_RETARD">En retard</SelectItem>
              <SelectItem value="ANNULEE">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.categorie || "all"} onValueChange={(value) => setFilters({ ...filters, categorie: value === "all" ? "" : value })}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {Object.entries(CATEGORIE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAdd} className="bg-[#0066cc] hover:bg-[#0052a3]">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une charge
          </Button>
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <CreditCard className="h-5 w-5 text-[#0066cc] mx-auto mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <Truck className="h-5 w-5 text-[#0066cc] mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.vehiculeCharges}</p>
          <p className="text-sm text-muted-foreground">Véhicules</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <Building2 className="h-5 w-5 text-[#ff6600] mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.societeCharges}</p>
          <p className="text-sm text-muted-foreground">Société</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">En attente</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.inRetard}</p>
          <p className="text-sm text-muted-foreground">En retard</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredCharges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune charge trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredCharges.map((charge) => (
                <TableRow
                  key={charge.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onView(charge)}
                >
                  <TableCell>
                    {charge.type === 'VEHICULE' ? (
                      <Truck className="h-4 w-4 text-[#0066cc]" />
                    ) : (
                      <Building2 className="h-4 w-4 text-[#ff6600]" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{charge.description}</p>
                      {charge.fournisseur && (
                        <p className="text-xs text-muted-foreground">{charge.fournisseur}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{CATEGORIE_LABELS[charge.categorie]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {TYPE_CHARGE_LABELS[charge.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(charge.montant)}
                  </TableCell>
                  <TableCell>
                    {formatDate(charge.dateCharge)}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUT_COLORS[charge.statut]}>
                      {STATUT_CHARGE_LABELS[charge.statut]}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(charge)}>
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(charge)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setChargeToDelete(charge)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Total: {total} charges
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette charge ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette charge ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

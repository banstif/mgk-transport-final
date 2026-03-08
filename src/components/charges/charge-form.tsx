"use client"

import * as React from "react"
import { Plus, Loader2, Truck, Building2, Upload, X, FileText, Calendar, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useVehicules } from "@/hooks/use-queries"
import { formatCurrency } from "@/lib/format"
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

const FREQUENCE_RECURRENCE_LABELS: Record<FrequenceRecurrence, string> = {
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  SEMESTRIEL: 'Semestriel',
  ANNUEL: 'Annuel',
}

// Categories for vehicles
const VEHICULE_CATEGORIES: CategorieCharge[] = [
  'CARBURANT',
  'ASSURANCE_VEHICULE',
  'ENTRETIEN_VEHICULE',
  'REPARATION',
  'VISITE_TECHNIQUE',
  'PNEUS',
  'PEAGE',
  'STATIONNEMENT',
  'AMENDE',
]

// Categories for company
const SOCIETE_CATEGORIES: CategorieCharge[] = [
  'LOYER',
  'ELECTRICITE',
  'EAU',
  'TELEPHONE_INTERNET',
  'SALAIRES',
  'CHARGES_SOCIALES',
  'ASSURANCE_SOCIETE',
  'COMPTABILITE',
  'FOURNITURES_BUREAU',
  'PUBLICITE',
  'FORMATION',
  'AUTRE',
]

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

interface ChargeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingCharge?: Charge | null
}

export function ChargeForm({ open, onOpenChange, onSuccess, editingCharge }: ChargeFormProps) {
  const { toast } = useToast()
  const { data: vehiculesData } = useVehicules({ page: 1, pageSize: 100 })
  const vehicules = vehiculesData?.data || []
  const [isLoading, setIsLoading] = React.useState(false)
  const [fichierName, setFichierName] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const isEditMode = !!editingCharge
  
  const [formData, setFormData] = React.useState({
    type: 'SOCIETE' as TypeCharge,
    categorie: 'AUTRE' as CategorieCharge,
    description: '',
    montant: '',
    dateCharge: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    vehiculeId: '',
    fournisseur: '',
    numeroFacture: '',
    notes: '',
    recurrente: false,
    frequenceRecurrence: '' as FrequenceRecurrence | '',
  statut: 'EN_ATTENTE' as StatutCharge,
  modePaiement: '' as ModePaiementCharge | '',
  referencePaiement: '',
    datePaiement: '',
  })

  // Load editing data
  React.useEffect(() => {
    if (open && editingCharge) {
      setFormData({
        type: editingCharge.type,
        categorie: editingCharge.categorie,
        description: editingCharge.description,
        montant: editingCharge.montant.toString(),
        dateCharge: new Date(editingCharge.dateCharge).toISOString().split('T')[0],
        dateEcheance: editingCharge.dateEcheance 
          ? new Date(editingCharge.dateEcheance).toISOString().split('T')[0] 
          : '',
        vehiculeId: editingCharge.vehiculeId || '',
        fournisseur: editingCharge.fournisseur || '',
        numeroFacture: editingCharge.numeroFacture || '',
        notes: editingCharge.notes || '',
        recurrente: editingCharge.recurrente,
        frequenceRecurrence: editingCharge.frequenceRecurrence || '',
        statut: editingCharge.statut,
        modePaiement: editingCharge.modePaiement || '',
        referencePaiement: editingCharge.referencePaiement || '',
        datePaiement: editingCharge.datePaiement 
          ? new Date(editingCharge.datePaiement).toISOString().split('T')[0] 
          : '',
      })
      setFichierName(editingCharge.fichier || null)
    } else if (open) {
      setFormData({
        type: 'SOCIETE',
        categorie: 'AUTRE',
        description: '',
        montant: '',
        dateCharge: new Date().toISOString().split('T')[0],
        dateEcheance: '',
        vehiculeId: '',
        fournisseur: '',
        numeroFacture: '',
        notes: '',
        recurrente: false,
        frequenceRecurrence: '',
        statut: 'EN_ATTENTE',
        modePaiement: '',
        referencePaiement: '',
        datePaiement: '',
      })
      setFichierName(null)
    }
  }, [open, editingCharge])
  
  // Update categorie when type changes
  React.useEffect(() => {
    if (formData.type === 'VEHICULE') {
      setFormData(prev => ({ ...prev, categorie: 'CARBURANT' }))
    } else {
      setFormData(prev => ({ ...prev, categorie: 'AUTRE' }))
    }
  }, [formData.type])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "Le fichier ne doit pas dépasser 5MB",
          variant: "destructive",
        })
        return
      }
      setFichierName(file.name)
    }
  }
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.description || !formData.montant || !formData.dateCharge) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    if (formData.type === 'VEHICULE' && !formData.vehiculeId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un véhicule",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      const formDataToSend = new FormData()
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value.toString())
        }
      })
      
      if (fichierName) {
        formDataToSend.append('fichierName', fichierName)
      }
      
      const url = editingCharge 
        ? `/api/charges/${editingCharge.id}` 
        : '/api/charges'
      
      const method = editingCharge ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Succès",
          description: editingCharge 
            ? "Charge modifiée avec succès" 
            : "Charge ajoutée avec succès",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error(result.error || "Erreur lors de l'enregistrement")
      }
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement de la charge",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingCharge ? (
              <RefreshCw className="h-5 w-5 text-[#0066cc]" />
            ) : (
              <Plus className="h-5 w-5 text-[#0066cc]" />
            )}
            {editingCharge ? "Modifier la charge" : "Ajouter une charge"}
          </DialogTitle>
          <DialogDescription>
            {editingCharge
              ? "Modifiez les informations de la charge."
              : "Remplissez les informations de la nouvelle charge."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de charge */}
          <div className="space-y-2">
            <Label>Type de charge *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === 'VEHICULE' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  formData.type === 'VEHICULE' 
                    ? "bg-[#0066cc] hover:bg-[#0052a3]" 
                    : "border-[#0066cc]"
                )}
                onClick={() => setFormData(prev => ({ ...prev, type: 'VEHICULE' }))}
              >
                <Truck className="h-4 w-4 mr-2" />
                Véhicule
              </Button>
              <Button
                type="button"
                variant={formData.type === 'SOCIETE' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  formData.type === 'SOCIETE' 
                    ? "bg-[#ff6600] hover:bg-[#ff6600]/90 border-[#ff6600]"
                    : "border-[#ff6600]"
                )}
                onClick={() => setFormData(prev => ({ ...prev, type: 'SOCIETE' }))}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Société
              </Button>
            </div>
          </div>
          
          {/* Véhicule (si type VEHICULE) */}
          {formData.type === 'VEHICULE' && (
            <div className="space-y-2">
              <Label>Véhicule associé *</Label>
              <Select 
                value={formData.vehiculeId || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, vehiculeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicules.filter((v: any) => v.actif).map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.immatriculation} - {v.marque} {v.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select 
              value={formData.categorie} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, categorie: value as CategorieCharge }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {(formData.type === 'VEHICULE' ? VEHICULE_CATEGORIES : SOCIETE_CATEGORIES).map((cat) => (
                  <SelectItem key={cat} value={cat}>{CATEGORIE_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input
              placeholder="Description de la charge"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          {/* Montant et dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (DH) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de la charge *</Label>
              <Input
                type="date"
                value={formData.dateCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, dateCharge: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                placeholder="Optionnel"
                value={formData.dateEcheance}
                onChange={(e) => setFormData(prev => ({ ...prev, dateEcheance: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select 
                value={formData.statut} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, statut: value as StatutCharge }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                  <SelectItem value="PAYEE">Payée</SelectItem>
                  <SelectItem value="PARTIELLEMENT">Partiellement payée</SelectItem>
                  <SelectItem value="EN_RETARD">En retard</SelectItem>
                  <SelectItem value="ANNULEE">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Fournisseur et Facture */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <Input
                placeholder="Nom du fournisseur"
                value={formData.fournisseur}
                onChange={(e) => setFormData(prev => ({ ...prev, fournisseur: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>N° Facture</Label>
              <Input
                placeholder="Numéro de facture"
                value={formData.numeroFacture}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroFacture: e.target.value }))}
              />
            </div>
          </div>
          
          {/* Paiement (si statut PAYEE ou PARTIELLEMENT) */}
          {(formData.statut === 'PAYEE' || formData.statut === 'PARTIELLEMENT') && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium">Informations de paiement</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <Select 
                    value={formData.modePaiement || ""} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, modePaiement: value as ModePaiementCharge || '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESPECES">Espèces</SelectItem>
                      <SelectItem value="CHEQUE">Chèque</SelectItem>
                      <SelectItem value="VIREMENT">Virement</SelectItem>
                      <SelectItem value="CARTE">Carte</SelectItem>
                      <SelectItem value="PRELEVEMENT">Prélèvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Référence</Label>
                  <Input
                    placeholder="N° chèque, virement..."
                    value={formData.referencePaiement}
                    onChange={(e) => setFormData(prev => ({ ...prev, referencePaiement: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de paiement</Label>
                  <Input
                    type="date"
                    value={formData.datePaiement}
                    onChange={(e) => setFormData(prev => ({ ...prev, datePaiement: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Charge récurrente */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="recurrente" className="text-base font-medium cursor-pointer">
                Charge récurrente
              </Label>
              <p className="text-sm text-muted-foreground">
                Cette charge se répète automatiquement
              </p>
            </div>
            <Switch
              id="recurrente"
              checked={formData.recurrente}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recurrente: checked }))}
            />
          </div>
          
          {formData.recurrente && (
            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select 
                value={formData.frequenceRecurrence || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequenceRecurrence: value as FrequenceRecurrence || '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCE_RECURRENCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Fichier */}
          <div className="space-y-2">
            <Label>Justificatif (optionnel)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {fichierName ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{fichierName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setFichierName(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Télécharger un justificatif
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG (max 5MB)
                  </p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Parcourir
              </Button>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Notes additionnelles..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#0066cc] hover:bg-[#0052a3]"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCharge ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

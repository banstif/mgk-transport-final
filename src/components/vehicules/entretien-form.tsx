"use client"

import * as React from "react"
import { Wrench, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface EntretienFormProps {
  vehiculeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingId?: string | null
}

interface TypeEntretien {
  code: string
  nom: string
  description?: string | null
  personnalise: boolean
  id?: string
}

export function EntretienForm({ vehiculeId, open, onOpenChange, onSuccess, editingId }: EntretienFormProps) {
  const [loading, setLoading] = React.useState(false)
  const [loadingTypes, setLoadingTypes] = React.useState(false)
  const [loadingEntretien, setLoadingEntretien] = React.useState(false)
  const [typesEntretien, setTypesEntretien] = React.useState<TypeEntretien[]>([])
  const [formData, setFormData] = React.useState({
    type: "",
    description: "",
    cout: "",
    kilometrage: "",
    dateIntervention: new Date().toISOString().split('T')[0],
    prochainKm: "",
    prochaineDate: "",
  })

  // Charger les types d'entretien
  React.useEffect(() => {
    const fetchTypes = async () => {
      if (open) {
        setLoadingTypes(true)
        try {
          const response = await fetch("/api/types-entretien")
          const data = await response.json()
          if (data.success) {
            setTypesEntretien(data.data)
          }
        } catch (error) {
          console.error("Erreur chargement types:", error)
        } finally {
          setLoadingTypes(false)
        }
      }
    }
    fetchTypes()
  }, [open])

  // Charger les données de l'entretien si mode édition
  React.useEffect(() => {
    const fetchEntretien = async () => {
      if (open && editingId) {
        setLoadingEntretien(true)
        try {
          const response = await fetch(`/api/entretiens/${editingId}`)
          const data = await response.json()
          if (data.success && data.data) {
            const entretien = data.data
            setFormData({
              type: entretien.type,
              description: entretien.description || "",
              cout: entretien.cout.toString(),
              kilometrage: entretien.kilometrage?.toString() || "",
              dateIntervention: new Date(entretien.dateIntervention).toISOString().split('T')[0],
              prochainKm: entretien.prochainKm?.toString() || "",
              prochaineDate: entretien.prochaineDate 
                ? new Date(entretien.prochaineDate).toISOString().split('T')[0] 
                : "",
            })
          }
        } catch (error) {
          console.error("Erreur chargement entretien:", error)
        } finally {
          setLoadingEntretien(false)
        }
      }
    }
    fetchEntretien()
  }, [open, editingId])

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        type: "",
        description: "",
        cout: "",
        kilometrage: "",
        dateIntervention: new Date().toISOString().split('T')[0],
        prochainKm: "",
        prochaineDate: "",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type || !formData.cout || !formData.dateIntervention) {
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // Mode édition - PUT
        const response = await fetch(`/api/entretiens/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            description: formData.description || null,
            cout: parseFloat(formData.cout),
            kilometrage: formData.kilometrage ? parseInt(formData.kilometrage) : null,
            dateIntervention: formData.dateIntervention,
            prochainKm: formData.prochainKm ? parseInt(formData.prochainKm) : null,
            prochaineDate: formData.prochaineDate || null,
          }),
        })

        if (response.ok) {
          onSuccess()
          onOpenChange(false)
        }
      } else {
        // Mode création - POST
        const response = await fetch(`/api/vehicules/${vehiculeId}/entretiens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            description: formData.description || null,
            cout: parseFloat(formData.cout),
            kilometrage: formData.kilometrage ? parseInt(formData.kilometrage) : null,
            dateIntervention: formData.dateIntervention,
            prochainKm: formData.prochainKm ? parseInt(formData.prochainKm) : null,
            prochaineDate: formData.prochaineDate || null,
          }),
        })

        if (response.ok) {
          onSuccess()
          onOpenChange(false)
        }
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingId ? (
              <>
                <Pencil className="h-5 w-5 text-[#0066cc]" />
                Modifier l&apos;entretien
              </>
            ) : (
              <>
                <Wrench className="h-5 w-5 text-[#0066cc]" />
                Ajouter un entretien
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editingId 
              ? "Modifiez les informations de l'entretien."
              : "Enregistrez un nouvel entretien pour ce véhicule."
            }
          </DialogDescription>
        </DialogHeader>

        {loadingEntretien ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type d&apos;entretien *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  disabled={loadingTypes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTypes ? "Chargement..." : "Sélectionner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {typesEntretien.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        <div className="flex items-center gap-2">
                          {type.nom}
                          {type.personnalise && (
                            <Badge variant="outline" className="text-xs ml-1">
                              Perso
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cout">Coût (MAD) *</Label>
                <Input
                  id="cout"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cout}
                  onChange={(e) => setFormData(prev => ({ ...prev, cout: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateIntervention">Date d&apos;intervention *</Label>
              <Input
                id="dateIntervention"
                type="date"
                value={formData.dateIntervention}
                onChange={(e) => setFormData(prev => ({ ...prev, dateIntervention: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kilometrage">Kilométrage</Label>
              <Input
                id="kilometrage"
                type="number"
                placeholder="Kilométrage actuel"
                value={formData.kilometrage}
                onChange={(e) => setFormData(prev => ({ ...prev, kilometrage: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Détails de l'entretien..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prochaineDate">Prochaine date</Label>
                <Input
                  id="prochaineDate"
                  type="date"
                  value={formData.prochaineDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, prochaineDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prochainKm">Prochain km</Label>
                <Input
                  id="prochainKm"
                  type="number"
                  placeholder="Ex: 150000"
                  value={formData.prochainKm}
                  onChange={(e) => setFormData(prev => ({ ...prev, prochainKm: e.target.value }))}
                />
              </div>
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
                disabled={loading || !formData.type || !formData.cout}
                className="bg-[#0066cc] hover:bg-[#0052a3]"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Modifier" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import * as React from "react"
import { Truck, Loader2 } from "lucide-react"
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
import { useChauffeurs } from "@/hooks/use-queries"

interface VehiculeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingId?: string | null
}

export function VehiculeForm({ open, onOpenChange, onSuccess, editingId }: VehiculeFormProps) {
  const [loading, setLoading] = React.useState(false)
  const [loadingVehicule, setLoadingVehicule] = React.useState(false)
  const [formData, setFormData] = React.useState({
    immatriculation: "",
    marque: "",
    modele: "",
    annee: "",
    capacite: "",
    kilometrage: "",
    chauffeurId: "",
  })

  const { data: chauffeursData } = useChauffeurs({ page: 1, pageSize: 100 })
  const chauffeurs = chauffeursData?.data || []

  // Charger les données du véhicule si mode édition
  React.useEffect(() => {
    const fetchVehicule = async () => {
      if (open && editingId) {
        setLoadingVehicule(true)
        try {
          const response = await fetch(`/api/vehicules/${editingId}`)
          const data = await response.json()
          if (data.success && data.data) {
            const v = data.data
            setFormData({
              immatriculation: v.immatriculation,
              marque: v.marque,
              modele: v.modele,
              annee: v.annee.toString(),
              capacite: v.capacite.toString(),
              kilometrage: v.kilometrage?.toString() || "",
              chauffeurId: v.chauffeurId || "",
            })
          }
        } catch (error) {
          console.error("Erreur chargement véhicule:", error)
        } finally {
          setLoadingVehicule(false)
        }
      }
    }
    fetchVehicule()
  }, [open, editingId])

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        immatriculation: "",
        marque: "",
        modele: "",
        annee: "",
        capacite: "",
        kilometrage: "",
        chauffeurId: "",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.immatriculation || !formData.marque || !formData.modele || !formData.annee || !formData.capacite) {
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // Mode édition
        const response = await fetch(`/api/vehicules/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          onSuccess()
          onOpenChange(false)
        }
      } else {
        // Mode création
        const response = await fetch("/api/vehicules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
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
            <Truck className="h-5 w-5 text-[#0066cc]" />
            {editingId ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </DialogTitle>
          <DialogDescription>
            {editingId
              ? "Modifiez les informations du véhicule."
              : "Remplissez les informations du nouveau véhicule."}
          </DialogDescription>
        </DialogHeader>

        {loadingVehicule ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="immatriculation">Immatriculation *</Label>
                <Input
                  id="immatriculation"
                  placeholder="EX: 12345-A-1"
                  value={formData.immatriculation}
                  onChange={(e) => setFormData(prev => ({ ...prev, immatriculation: e.target.value.toUpperCase() }))}
                  className="font-mono uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annee">Année *</Label>
                <Input
                  id="annee"
                  type="number"
                  placeholder="2024"
                  value={formData.annee}
                  onChange={(e) => setFormData(prev => ({ ...prev, annee: e.target.value }))}
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marque">Marque *</Label>
                <Input
                  id="marque"
                  placeholder="Mercedes, Iveco..."
                  value={formData.marque}
                  onChange={(e) => setFormData(prev => ({ ...prev, marque: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modele">Modèle *</Label>
                <Input
                  id="modele"
                  placeholder="Sprinter, Daily..."
                  value={formData.modele}
                  onChange={(e) => setFormData(prev => ({ ...prev, modele: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacite">Capacité (places) *</Label>
                <Input
                  id="capacite"
                  type="number"
                  placeholder="20"
                  value={formData.capacite}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacite: e.target.value }))}
                  min={1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kilometrage">Kilométrage</Label>
                <Input
                  id="kilometrage"
                  type="number"
                  placeholder="0"
                  value={formData.kilometrage}
                  onChange={(e) => setFormData(prev => ({ ...prev, kilometrage: e.target.value }))}
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chauffeur">Chauffeur assigné</Label>
              <Select
                value={formData.chauffeurId || "__none__"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, chauffeurId: value === "__none__" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucun chauffeur</SelectItem>
                  {chauffeurs
                    .filter((c: any) => c.actif)
                    .map((chauffeur: any) => (
                      <SelectItem key={chauffeur.id} value={chauffeur.id}>
                        {chauffeur.nom} {chauffeur.prenom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                disabled={loading || !formData.immatriculation || !formData.marque || !formData.modele}
                className="bg-[#0066cc] hover:bg-[#0052a3]"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

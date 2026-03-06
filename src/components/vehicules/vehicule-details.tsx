"use client"

import * as React from "react"
import {
  Truck,
  Pencil,
  Trash2,
  User,
  Gauge,
  Users,
  Fuel,
  Wrench,
  FileText,
  Plus,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Separator } from "@/components/ui/separator"
import { useVehicule, useDeleteVehicule } from "@/hooks/use-queries"
import { formatCurrency, formatDate } from "@/lib/format"
import { EntretienForm } from "./entretien-form"
import { CarburantForm } from "./carburant-form"

// Fonction pour calculer la consommation moyenne (L/100km)
function calculerConsommationMoyenne(pleins: any[]): string {
  if (!pleins || pleins.length < 2) return "-"
  
  const pleinsWithKm = pleins.filter(p => p.kilometrage > 0)
  if (pleinsWithKm.length < 2) return "-"
  
  const sorted = [...pleinsWithKm].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  const kmParcourus = sorted[sorted.length - 1].kilometrage - sorted[0].kilometrage
  const litresConsommes = sorted.slice(1).reduce((sum, p) => sum + p.quantite, 0)
  
  if (kmParcourus <= 0 || litresConsommes <= 0) return "-"
  
  const consommation = (litresConsommes / kmParcourus) * 100
  return consommation.toFixed(1)
}

// Fonction pour calculer le coût par km
function calculerCoutKm(pleins: any[], totalPrix: number): string {
  if (!pleins || pleins.length < 2) return "-"
  
  const pleinsWithKm = pleins.filter(p => p.kilometrage > 0)
  if (pleinsWithKm.length < 2) return "-"
  
  const sorted = [...pleinsWithKm].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  const kmParcourus = sorted[sorted.length - 1].kilometrage - sorted[0].kilometrage
  
  if (kmParcourus <= 0 || totalPrix <= 0) return "-"
  
  const coutKm = totalPrix / kmParcourus
  return coutKm.toFixed(2)
}

interface VehiculeDetailsProps {
  vehiculeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
  onRefresh?: () => void
}

export function VehiculeDetails({ vehiculeId, open, onOpenChange, onEdit, onRefresh }: VehiculeDetailsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [entretienFormOpen, setEntretienFormOpen] = React.useState(false)
  const [carburantFormOpen, setCarburantFormOpen] = React.useState(false)
  const [editingCarburantId, setEditingCarburantId] = React.useState<string | null>(null)
  const [deleteCarburantId, setDeleteCarburantId] = React.useState<string | null>(null)
  const [deleteCarburantDialogOpen, setDeleteCarburantDialogOpen] = React.useState(false)
  const [editingEntretienId, setEditingEntretienId] = React.useState<string | null>(null)
  const [deleteEntretienId, setDeleteEntretienId] = React.useState<string | null>(null)
  const [deleteEntretienDialogOpen, setDeleteEntretienDialogOpen] = React.useState(false)
  
  const { data: response, isLoading, refetch } = useVehicule(vehiculeId || "")
  const deleteVehicule = useDeleteVehicule()
  
  const vehicule = response?.data
  
  React.useEffect(() => {
    if (open && vehiculeId) {
      refetch()
    }
  }, [open, vehiculeId, refetch])

  const handleRefreshData = () => {
    refetch()
    onRefresh?.()
  }
  
  const handleDelete = async () => {
    if (!vehiculeId) return
    try {
      await deleteVehicule.mutateAsync(vehiculeId)
      setDeleteDialogOpen(false)
      onOpenChange(false)
      onRefresh?.()
    } catch (error) {
      console.error("Erreur suppression:", error)
    }
  }

  const handleEditCarburant = (id: string) => {
    setEditingCarburantId(id)
    setCarburantFormOpen(true)
  }

  const handleEditEntretien = (id: string) => {
    setEditingEntretienId(id)
    setEntretienFormOpen(true)
  }

  const handleDeleteEntretien = async () => {
    if (!deleteEntretienId) return
    try {
      const response = await fetch(`/api/entretiens/${deleteEntretienId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        handleRefreshData()
      }
    } catch (error) {
      console.error("Erreur suppression entretien:", error)
    } finally {
      setDeleteEntretienDialogOpen(false)
      setDeleteEntretienId(null)
    }
  }

  const handleDeleteCarburant = async () => {
    if (!deleteCarburantId) return
    try {
      const response = await fetch(`/api/carburant/${deleteCarburantId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        handleRefreshData()
      }
    } catch (error) {
      console.error("Erreur suppression carburant:", error)
    } finally {
      setDeleteCarburantDialogOpen(false)
      setDeleteCarburantId(null)
    }
  }
  
  const getTypeEntretienLabel = (type: string) => {
    const labels: Record<string, string> = {
      VIDANGE: "Vidange",
      PNEUS: "Pneus",
      FREINS: "Freins",
      ASSURANCE_VEHICULE: "Assurance",
      VISITE_TECHNIQUE: "Visite technique",
      REPARATION: "Réparation",
    }
    return labels[type] || type
  }
  
  const getDocumentStatusLabel = (status: string, daysRemaining: number | null) => {
    if (status === "expired") return { label: "Expiré", color: "bg-red-500" }
    if (status === "critical") return { label: `${daysRemaining}j restant`, color: "bg-orange-500" }
    if (status === "warning") return { label: `${daysRemaining}j restant`, color: "bg-yellow-500" }
    return { label: "Valide", color: "bg-green-500" }
  }
  
  // Calculer le kilométrage du dernier plein
  const dernierPleinKm = React.useMemo(() => {
    if (!vehicule?.pleinsCarburant || vehicule.pleinsCarburant.length === 0) {
      return null
    }
    const dernierPlein = vehicule.pleinsCarburant[0]
    return dernierPlein.kilometrage > 0 ? dernierPlein.kilometrage : null
  }, [vehicule?.pleinsCarburant])
  
  if (!vehiculeId) return null
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !vehicule ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Véhicule non trouvé</p>
          </div>
        ) : (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-[#0066cc] flex items-center justify-center">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-mono">
                      {vehicule.immatriculation}
                    </SheetTitle>
                    <SheetDescription>
                      {vehicule.marque} {vehicule.modele} - {vehicule.annee}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {vehicule.actif ? (
                    <Badge className="bg-green-500">Actif</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-500 text-white">Inactif</Badge>
                  )}
                </div>
              </div>
            </SheetHeader>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Gauge className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-semibold">{vehicule.kilometrage?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Kilomètres</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-semibold">{vehicule.capacite}</p>
                <p className="text-xs text-muted-foreground">Places</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Wrench className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-semibold">{vehicule._count?.entretiens || 0}</p>
                <p className="text-xs text-muted-foreground">Entretiens</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Fuel className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-semibold">{vehicule._count?.pleinsCarburant || 0}</p>
                <p className="text-xs text-muted-foreground">Pleins</p>
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs defaultValue="informations" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="informations">Infos</TabsTrigger>
                <TabsTrigger value="entretiens">Entretiens</TabsTrigger>
                <TabsTrigger value="carburant">Carburant</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              {/* Informations Tab */}
              <TabsContent value="informations" className="mt-4 space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Informations du véhicule
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Immatriculation:</span>
                      <p className="font-mono font-medium">{vehicule.immatriculation}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Marque / Modèle:</span>
                      <p className="font-medium">{vehicule.marque} {vehicule.modele}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Année:</span>
                      <p className="font-medium">{vehicule.annee}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Capacité:</span>
                      <p className="font-medium">{vehicule.capacite} places</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kilométrage:</span>
                      <p className="font-medium">{vehicule.kilometrage?.toLocaleString()} km</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date d&apos;ajout:</span>
                      <p className="font-medium">{formatDate(vehicule.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Chauffeur */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Chauffeur assigné
                  </h3>
                  {vehicule.chauffeur ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#0066cc] flex items-center justify-center text-white font-semibold">
                        {vehicule.chauffeur.nom[0]}{vehicule.chauffeur.prenom[0]}
                      </div>
                      <div>
                        <p className="font-medium">{vehicule.chauffeur.nom} {vehicule.chauffeur.prenom}</p>
                        <p className="text-sm text-muted-foreground">{vehicule.chauffeur.telephone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun chauffeur assigné</p>
                  )}
                </div>
                
                {/* Statistiques */}
                {vehicule.stats && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Statistiques
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-background rounded p-2">
                        <span className="text-muted-foreground">Total carburant:</span>
                        <p className="font-semibold text-[#ff6600]">
                          {formatCurrency(vehicule.stats.totalCarburantPrix)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ({vehicule.stats.totalCarburantLitres?.toFixed(0)} L)
                        </p>
                      </div>
                      <div className="bg-background rounded p-2">
                        <span className="text-muted-foreground">Total entretiens:</span>
                        <p className="font-semibold text-[#ff6600]">
                          {formatCurrency(vehicule.stats.totalEntretiensCout)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Entretiens Tab */}
              <TabsContent value="entretiens" className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Historique des entretiens</h3>
                  <Button 
                    size="sm" 
                    className="bg-[#0066cc] hover:bg-[#0052a3]"
                    onClick={() => {
                      setEditingEntretienId(null)
                      setEntretienFormOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
                
                {vehicule.entretiens?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun entretien enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicule.entretiens?.map((entretien: any) => (
                      <div key={entretien.id} className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getTypeEntretienLabel(entretien.type)}</Badge>
                            {entretien.prochaineDate && new Date(entretien.prochaineDate) < new Date() && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#ff6600]">
                              {formatCurrency(entretien.cout)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditEntretien(entretien.id)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteEntretienId(entretien.id)
                                setDeleteEntretienDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(entretien.dateIntervention)}
                          {entretien.kilometrage && ` - ${entretien.kilometrage.toLocaleString()} km`}
                        </p>
                        {entretien.description && (
                          <p className="text-sm mt-1">{entretien.description}</p>
                        )}
                        {entretien.prochaineDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Prochain: {formatDate(entretien.prochaineDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Carburant Tab */}
              <TabsContent value="carburant" className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Historique du carburant</h3>
                  <Button 
                    size="sm" 
                    className="bg-[#0066cc] hover:bg-[#0052a3]"
                    onClick={() => {
                      setEditingCarburantId(null)
                      setCarburantFormOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>

                {/* Statistiques Carburant */}
                {vehicule.pleinsCarburant && vehicule.pleinsCarburant.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-800">
                      <Fuel className="h-5 w-5 mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                      <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                        {vehicule.stats?.totalCarburantLitres?.toFixed(0) || 0}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Litres total</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 text-center border border-orange-200 dark:border-orange-800">
                      <p className="h-5 w-5 mx-auto text-orange-600 dark:text-orange-400 mb-1 font-bold">DH</p>
                      <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                        {formatCurrency(vehicule.stats?.totalCarburantPrix || 0)}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Coût total</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center border border-green-200 dark:border-green-800">
                      <Gauge className="h-5 w-5 mx-auto text-green-600 dark:text-green-400 mb-1" />
                      <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                        {calculerConsommationMoyenne(vehicule.pleinsCarburant)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">L/100km</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 text-center border border-purple-200 dark:border-purple-800">
                      <p className="h-5 w-5 mx-auto text-purple-600 dark:text-purple-400 mb-1 font-bold text-lg">≈</p>
                      <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                        {calculerCoutKm(vehicule.pleinsCarburant, vehicule.stats?.totalCarburantPrix || 0)}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">DH/km</p>
                    </div>
                  </div>
                )}
                
                {vehicule.pleinsCarburant?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Fuel className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun plein enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicule.pleinsCarburant?.map((plein: any) => (
                      <div key={plein.id} className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{plein.quantite.toFixed(2)} L</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#ff6600]">
                              {formatCurrency(plein.prixTotal)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditCarburant(plein.id)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteCarburantId(plein.id)
                                setDeleteCarburantDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(plein.date)}
                          {plein.kilometrage > 0 && ` - ${plein.kilometrage.toLocaleString()} km`}
                        </p>
                        {plein.station && (
                          <p className="text-xs text-muted-foreground">{plein.station}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Documents</h3>
                </div>
                
                {vehicule.documents?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun document enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicule.documents?.map((doc: any) => {
                      const status = getDocumentStatusLabel(doc.status, doc.daysRemaining)
                      return (
                        <div key={doc.id} className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{doc.type}</span>
                            </div>
                            <Badge className={`${status.color} text-white`}>
                              {status.label}
                            </Badge>
                          </div>
                          {doc.numero && (
                            <p className="text-sm text-muted-foreground mt-1">N° {doc.numero}</p>
                          )}
                          {doc.dateExpiration && (
                            <p className="text-xs text-muted-foreground">
                              Expire le {formatDate(doc.dateExpiration)}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <Separator className="my-4" />
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(vehicule.id)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
      
      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le véhicule ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le véhicule{" "}
              <strong>{vehicule?.immatriculation}</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forms */}
      {vehiculeId && vehicule && (
        <>
          <EntretienForm
            vehiculeId={vehiculeId}
            editingId={editingEntretienId}
            open={entretienFormOpen}
            onOpenChange={(open) => {
              setEntretienFormOpen(open)
              if (!open) setEditingEntretienId(null)
            }}
            onSuccess={handleRefreshData}
          />
          <CarburantForm
            vehiculeId={vehiculeId}
            vehiculeKilometrage={vehicule.kilometrage || 0}
            dernierPleinKm={dernierPleinKm}
            editingId={editingCarburantId}
            open={carburantFormOpen}
            onOpenChange={(open) => {
              setCarburantFormOpen(open)
              if (!open) setEditingCarburantId(null)
            }}
            onSuccess={handleRefreshData}
          />
        </>
      )}

      {/* Delete carburant confirmation */}
      <AlertDialog open={deleteCarburantDialogOpen} onOpenChange={setDeleteCarburantDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le plein ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce plein de carburant ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCarburant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete entretien confirmation */}
      <AlertDialog open={deleteEntretienDialogOpen} onOpenChange={setDeleteEntretienDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;entretien ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet entretien ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntretien}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

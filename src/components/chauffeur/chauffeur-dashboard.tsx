"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChangePasswordModal } from "@/components/auth/change-password-modal";
import {
  Truck,
  MapPin,
  Clock,
  Building2,
  Phone,
  CheckCircle,
  Circle,
  Calendar,
  Car,
  User,
  RefreshCw,
  Eye,
  X,
  Lock,
  Play,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";

// Types
interface ChauffeurProfile {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  cin: string;
  vehicules: Array<{
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
  }>;
}

type StatutService = "EN_ATTENTE" | "EN_COURS" | "TERMINE";

interface ChauffeurService {
  id: string;
  dateHeureDepart: Date | string;
  nombreSalaries: number;
  statut: StatutService;
  completed: boolean;
  notes: string | null;
  client: {
    id: string;
    nomEntreprise: string;
    telephone: string;
    adresse: string | null;
  };
  service: {
    id: string;
    nomService: string;
    lieuDepart: string | null;
    lieuArrive: string | null;
    heureDepart: string | null;
  };
  vehicule: {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
  };
}

interface ClientForExploitation {
  id: string;
  nomEntreprise: string;
  telephone: string;
  services: Array<{
    id: string;
    nomService: string;
    typeService: string;
    lieuDepart: string | null;
    lieuArrive: string | null;
    heureDepart: string | null;
  }>;
}

interface VehiculeForExploitation {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
}

// Fetch functions
async function fetchChauffeurProfile(): Promise<ChauffeurProfile> {
  const res = await fetch("/api/chauffeur/me");
  if (!res.ok) throw new Error("Erreur lors de la récupération du profil");
  const data = await res.json();
  return data.data;
}

async function fetchChauffeurServices(params: { today?: boolean }): Promise<{ data: ChauffeurService[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.today) searchParams.append("today", "true");

  const res = await fetch(`/api/chauffeur/services?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Erreur lors de la récupération des services");
  return res.json();
}

async function updateServiceStatus(id: string, statut: StatutService, notes?: string): Promise<ChauffeurService> {
  const res = await fetch(`/api/chauffeur/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut, notes }),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour");
  const data = await res.json();
  return data.data;
}

async function fetchExploitationData(): Promise<{
  clients: ClientForExploitation[];
  vehicules: VehiculeForExploitation[];
  chauffeurId: string;
}> {
  const res = await fetch("/api/chauffeur/exploitations");
  if (!res.ok) throw new Error("Erreur lors de la récupération des données");
  const data = await res.json();
  return data.data;
}

async function createExploitation(formData: {
  clientId: string;
  serviceId: string;
  vehiculeId: string;
  dateHeureDepart: string;
  nombreSalaries: number;
  notes?: string;
}): Promise<ChauffeurService> {
  const res = await fetch("/api/chauffeur/exploitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erreur lors de la création");
  }
  const data = await res.json();
  return data.data;
}

// Format time
function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// Status badge component
function StatusBadge({ statut }: { statut: StatutService }) {
  const config: Record<StatutService, { label: string; className: string; icon: React.ReactNode }> = {
    EN_ATTENTE: {
      label: "En attente",
      className: "bg-orange-100 text-orange-700 border-orange-200",
      icon: <Circle className="h-3 w-3" />,
    },
    EN_COURS: {
      label: "En cours",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <Play className="h-3 w-3" />,
    },
    TERMINE: {
      label: "Terminé",
      className: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle className="h-3 w-3" />,
    },
  };

  const { label, className, icon } = config[statut];

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      {icon}
      {label}
    </Badge>
  );
}

// Service Card Component
function ServiceCard({
  service,
  onStart,
  onComplete,
  isUpdating,
}: {
  service: ChauffeurService;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  isUpdating: boolean;
}) {
  const [showDetails, setShowDetails] = React.useState(false);

  const getStatusColor = (statut: StatutService) => {
    switch (statut) {
      case "EN_COURS":
        return "bg-blue-50 border-blue-200";
      case "TERMINE":
        return "bg-green-50 border-green-200";
      default:
        return "bg-white";
    }
  };

  const getStatusIcon = (statut: StatutService) => {
    switch (statut) {
      case "EN_COURS":
        return <Play className="h-5 w-5 text-blue-600" />;
      case "TERMINE":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <>
      <Card className={`${getStatusColor(service.statut)}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon(service.statut)}
                {service.service.nomService}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {service.client.nomEntreprise}
              </CardDescription>
            </div>
            <StatusBadge statut={service.statut} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(service.dateHeureDepart)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{service.nombreSalaries} salarié(s)</span>
            </div>
            {service.service.lieuDepart && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span>{service.service.lieuDepart}</span>
                {service.service.lieuArrive && (
                  <>
                    <span className="text-gray-400">→</span>
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span>{service.service.lieuArrive}</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>{service.vehicule.immatriculation}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{service.client.telephone}</span>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDetails(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Détails
            </Button>

            {service.statut === "EN_ATTENTE" && (
              <Button
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => onStart(service.id)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Démarrer
              </Button>
            )}

            {service.statut === "EN_COURS" && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onComplete(service.id)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Terminer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Détails du service</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="font-semibold">{service.client.nomEntreprise}</p>
                {service.client.adresse && (
                  <p className="text-sm text-muted-foreground">{service.client.adresse}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service</p>
                <p>{service.service.nomService}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Départ</p>
                  <p>{service.service.lieuDepart || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Arrivée</p>
                  <p>{service.service.lieuArrive || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Heure</p>
                  <p>{formatTime(service.dateHeureDepart)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Passagers</p>
                  <p>{service.nombreSalaries} salarié(s)</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Véhicule</p>
                <p>{service.vehicule.marque} {service.vehicule.modele} ({service.vehicule.immatriculation})</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact client</p>
                <p>{service.client.telephone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut</p>
                <StatusBadge statut={service.statut} />
              </div>
              {service.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p>{service.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// New Exploitation Form Modal
function NewExploitationModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = React.useState("");
  const [selectedServiceId, setSelectedServiceId] = React.useState("");
  const [selectedVehiculeId, setSelectedVehiculeId] = React.useState("");
  const [dateHeureDepart, setDateHeureDepart] = React.useState(
    new Date().toISOString().slice(0, 16)
  );
  const [nombreSalaries, setNombreSalaries] = React.useState("1");
  const [notes, setNotes] = React.useState("");

  // Fetch exploitation data (clients, vehicules)
  const { data: exploitationData, isLoading: isLoadingData } = useQuery({
    queryKey: ["chauffeur-exploitation-data"],
    queryFn: fetchExploitationData,
    enabled: open,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createExploitation,
    onSuccess: () => {
      toast({ title: "Succès", description: "Exploitation créée avec succès" });
      onSuccess();
      onOpenChange(false);
      // Reset form
      setSelectedClientId("");
      setSelectedServiceId("");
      setSelectedVehiculeId("");
      setDateHeureDepart(new Date().toISOString().slice(0, 16));
      setNombreSalaries("1");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get selected client's services
  const selectedClient = exploitationData?.clients.find((c) => c.id === selectedClientId);
  const services = selectedClient?.services || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId || !selectedServiceId || !selectedVehiculeId || !dateHeureDepart || !nombreSalaries) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      clientId: selectedClientId,
      serviceId: selectedServiceId,
      vehiculeId: selectedVehiculeId,
      dateHeureDepart,
      nombreSalaries: parseInt(nombreSalaries),
      notes: notes || undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Nouvelle exploitation
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Créez une nouvelle exploitation de service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={selectedClientId} onValueChange={(value) => {
                  setSelectedClientId(value);
                  setSelectedServiceId("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {exploitationData?.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {client.nomEntreprise}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service">Service / Trajet *</Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                  disabled={!selectedClientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedClientId ? "Sélectionnez un service" : "Sélectionnez d'abord un client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex flex-col">
                          <span>{service.nomService}</span>
                          {service.lieuDepart && (
                            <span className="text-xs text-muted-foreground">
                              {service.lieuDepart} → {service.lieuArrive || "N/A"}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {services.length === 0 && selectedClientId && (
                  <p className="text-sm text-muted-foreground">Aucun service disponible pour ce client</p>
                )}
              </div>

              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label htmlFor="vehicule">Véhicule *</Label>
                <Select value={selectedVehiculeId} onValueChange={setSelectedVehiculeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {exploitationData?.vehicules.map((vehicule) => (
                      <SelectItem key={vehicule.id} value={vehicule.id}>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          {vehicule.immatriculation} - {vehicule.marque} {vehicule.modele}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {exploitationData?.vehicules.length === 0 && (
                  <p className="text-sm text-orange-600">Aucun véhicule assigné à votre profil</p>
                )}
              </div>

              {/* Date/Time and Number of Employees */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateHeure">Date et heure *</Label>
                  <Input
                    id="dateHeure"
                    type="datetime-local"
                    value={dateHeureDepart}
                    onChange={(e) => setDateHeureDepart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombreSalaries">Nb. salariés *</Label>
                  <Input
                    id="nombreSalaries"
                    type="number"
                    min="1"
                    value={nombreSalaries}
                    onChange={(e) => setNombreSalaries(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes optionnelles..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer l&apos;exploitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ChauffeurDashboard() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showTodayOnly, setShowTodayOnly] = React.useState(true);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [showNewExploitationModal, setShowNewExploitationModal] = React.useState(false);

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["chauffeur-profile"],
    queryFn: fetchChauffeurProfile,
  });

  // Fetch services
  const { data: servicesData, isLoading: servicesLoading, refetch } = useQuery({
    queryKey: ["chauffeur-services", showTodayOnly],
    queryFn: () => fetchChauffeurServices({ today: showTodayOnly }),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: StatutService }) =>
      updateServiceStatus(id, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chauffeur-services"] });
      toast({ title: "Succès", description: "Service mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const handleStart = (id: string) => {
    updateMutation.mutate({ id, statut: "EN_COURS" });
  };

  const handleComplete = (id: string) => {
    updateMutation.mutate({ id, statut: "TERMINE" });
  };

  const todayDate = formatDate(new Date());

  // Group services by status
  const enAttenteServices = servicesData?.data?.filter(s => s.statut === "EN_ATTENTE") || [];
  const enCoursServices = servicesData?.data?.filter(s => s.statut === "EN_COURS") || [];
  const termineServices = servicesData?.data?.filter(s => s.statut === "TERMINE") || [];

  if (profileLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0066cc] to-[#003d7a] text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MGK Transport</h1>
                <p className="text-sm text-white/80">Espace Chauffeur</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => setShowNewExploitationModal(true)}
                className="bg-white text-blue-700 hover:bg-white/90"
                size="sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nouvelle exploitation</span>
              </Button>
              <div className="text-right hidden sm:block">
                <p className="font-medium">{profile?.nom} {profile?.prenom}</p>
                <p className="text-xs text-white/80">{profile?.telephone}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
              >
                <Lock className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Mot de passe</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Mon Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nom complet</p>
                <p className="font-medium">{profile?.nom} {profile?.prenom}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Téléphone</p>
                <p className="font-medium">{profile?.telephone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CIN</p>
                <p className="font-medium">{profile?.cin}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Véhicule(s)</p>
                <p className="font-medium">{profile?.vehicules?.length || 0} assigné(s)</p>
              </div>
            </div>
            {profile?.vehicules && profile.vehicules.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Véhicules assignés:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.vehicules.map((v) => (
                    <Badge key={v.id} variant="outline" className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {v.immatriculation} - {v.marque} {v.modele}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {showTodayOnly ? "Services du jour" : "Tous mes services"}
              </h2>
              <p className="text-sm text-muted-foreground">{todayDate}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button
                variant={showTodayOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTodayOnly(!showTodayOnly)}
              >
                {showTodayOnly ? "Voir tout" : "Aujourd'hui"}
              </Button>
            </div>
          </div>

          {servicesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : servicesData?.data?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium">Aucun service prévu</h3>
                <p className="text-muted-foreground mb-4">
                  {showTodayOnly
                    ? "Vous n'avez pas de service prévu aujourd'hui"
                    : "Aucun service à afficher"}
                </p>
                <Button onClick={() => setShowNewExploitationModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle exploitation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* En Cours Services - Priority! */}
              {enCoursServices.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-600 flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    En cours ({enCoursServices.length})
                  </h3>
                  {enCoursServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onStart={handleStart}
                      onComplete={handleComplete}
                      isUpdating={updateMutation.isPending}
                    />
                  ))}
                </div>
              )}

              {/* En Attente Services */}
              {enAttenteServices.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-orange-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    En attente ({enAttenteServices.length})
                  </h3>
                  {enAttenteServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onStart={handleStart}
                      onComplete={handleComplete}
                      isUpdating={updateMutation.isPending}
                    />
                  ))}
                </div>
              )}

              {/* Terminé Services */}
              {termineServices.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Terminés ({termineServices.length})
                  </h3>
                  {termineServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onStart={handleStart}
                      onComplete={handleComplete}
                      isUpdating={updateMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {!servicesLoading && servicesData?.data && (
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="py-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{servicesData.data.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{enAttenteServices.length}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{enCoursServices.length}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{termineServices.length}</p>
                  <p className="text-xs text-muted-foreground">Terminés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />

      {/* New Exploitation Modal */}
      <NewExploitationModal
        open={showNewExploitationModal}
        onOpenChange={setShowNewExploitationModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["chauffeur-services"] });
        }}
      />
    </div>
  );
}

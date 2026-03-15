"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCreateFacture, useUpdateFacture, useClients } from "@/hooks/use-queries";
import { type Facture, type FactureFormData } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calculator, Sparkles, FileText, Check, Loader2, Truck, User, MapPin, List } from "lucide-react";

interface FactureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facture?: Facture | null;
  onSuccess?: (facture: Facture) => void;
}

// Type for unpaid exploitation data
interface UnpaidExploitation {
  id: string;
  dateHeureDepart: string;
  service: {
    id: string;
    nomService: string;
    tarif: number;
    typeService: string;
  };
  vehicule: {
    immatriculation: string;
  };
  chauffeur: {
    nom: string;
    prenom: string;
  };
}

interface ClientWithUnpaid {
  client: {
    id: string;
    nomEntreprise: string;
    telephone?: string;
    email?: string;
  };
  exploitations: UnpaidExploitation[];
  totalServices: number;
  montantTotal: number;
}

interface UnpaidDataResponse {
  clients: ClientWithUnpaid[];
  totalExploitations: number;
  montantTotal: number;
}

// Fetch unpaid exploitations
async function fetchUnpaidExploitations(clientId?: string): Promise<{ success: boolean; data: UnpaidDataResponse }> {
  const url = clientId 
    ? `/api/exploitations/non-facturees?clientId=${clientId}`
    : '/api/exploitations/non-facturees';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur lors du chargement');
  return res.json();
}

// Generate facture from unpaid services
async function generateFacture(data: {
  clientId: string;
  dateEcheance: string;
  tauxTVA: number;
  exploitationIds?: string[];
}) {
  const res = await fetch('/api/factures/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erreur lors de la génération');
  }
  return res.json();
}

export function FactureForm({
  open,
  onOpenChange,
  facture,
  onSuccess,
}: FactureFormProps) {
  const isEditing = !!facture;
  const [mode, setMode] = React.useState<"auto" | "manual">("auto");
  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [selectedExploitationIds, setSelectedExploitationIds] = React.useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FactureFormData & { tauxTVA?: number }>({
    defaultValues: {
      clientId: "",
      dateEmission: new Date().toISOString().split("T")[0],
      dateEcheance: "",
      montantHT: 0,
      tauxTVA: 0,
    },
  });

  const { data: clientsData } = useClients({ pageSize: 100 });

  // Fetch unpaid exploitations
  const { data: unpaidData, isLoading: loadingUnpaid } = useQuery({
    queryKey: ['unpaid-exploitations', selectedClientId],
    queryFn: () => fetchUnpaidExploitations(selectedClientId || undefined),
    enabled: open && mode === "auto",
  });

  // Generate facture mutation
  const generateMutation = useMutation({
    mutationFn: generateFacture,
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast.success(result.message || "Facture générée avec succès");
        queryClient.invalidateQueries({ queryKey: ['factures'] });
        queryClient.invalidateQueries({ queryKey: ['unpaid-exploitations'] });
        queryClient.invalidateQueries({ queryKey: ['exploitations'] });
        onSuccess?.(result.data);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reset form when dialog opens with facture data
  React.useEffect(() => {
    if (open) {
      if (facture) {
        // Editing mode - use manual mode
        setMode("manual");
        reset({
          clientId: facture.clientId,
          dateEmission: new Date(facture.dateEmission).toISOString().split("T")[0],
          dateEcheance: new Date(facture.dateEcheance).toISOString().split("T")[0],
          montantHT: facture.montantHT,
          tauxTVA: facture.tauxTVA,
        });
      } else {
        // New facture - reset to auto mode
        setMode("auto");
        setSelectedClientId("");
        setSelectedExploitationIds(new Set());
        reset({
          clientId: "",
          dateEmission: new Date().toISOString().split("T")[0],
          dateEcheance: "",
          montantHT: 0,
          tauxTVA: 0,
        });
      }
    }
  }, [open, facture, reset]);

  const createMutation = useCreateFacture();
  const updateMutation = useUpdateFacture();

  const montantHT = watch("montantHT") || 0;
  const tauxTVA = watch("tauxTVA") || 0;
  const montantTVA = montantHT * (tauxTVA / 100);
  const montantTTC = montantHT + montantTVA;

  // Get clients with unpaid services
  const clientsWithUnpaid = React.useMemo(() => {
    return unpaidData?.data?.clients || [];
  }, [unpaidData]);

  // Get selected client's unpaid data
  const selectedClientUnpaid = React.useMemo(() => {
    if (!clientsWithUnpaid || !selectedClientId) return null;
    return clientsWithUnpaid.find((c) => c.client.id === selectedClientId);
  }, [clientsWithUnpaid, selectedClientId]);

  // Calculate total from selected exploitations
  const selectedTotal = React.useMemo(() => {
    if (!selectedClientUnpaid) return 0;
    return selectedClientUnpaid.exploitations
      .filter((exp) => selectedExploitationIds.has(exp.id))
      .reduce((sum, exp) => sum + exp.service.tarif, 0);
  }, [selectedClientUnpaid, selectedExploitationIds]);

  // Toggle exploitation selection
  const toggleExploitation = (id: string) => {
    const newSet = new Set(selectedExploitationIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedExploitationIds(newSet);
  };

  // Select/deselect all for a client
  const toggleSelectAll = () => {
    if (!selectedClientUnpaid) return;
    
    if (selectedExploitationIds.size === selectedClientUnpaid.exploitations.length) {
      setSelectedExploitationIds(new Set());
    } else {
      setSelectedExploitationIds(new Set(selectedClientUnpaid.exploitations.map((e) => e.id)));
    }
  };

  // Manual form submit
  const onSubmit = async (data: FactureFormData & { tauxTVA?: number }) => {
    try {
      if (isEditing && facture) {
        const result = await updateMutation.mutateAsync({
          id: facture.id,
          data,
        });
        if (result.success && result.data) {
          toast.success("Facture modifiée avec succès");
          onSuccess?.(result.data);
        }
      } else {
        const result = await createMutation.mutateAsync(data);
        if (result.success && result.data) {
          toast.success("Facture créée avec succès");
          onSuccess?.(result.data);
        }
      }
    } catch (error) {
      console.error("Error saving facture:", error);
      toast.error(
        isEditing
          ? "Erreur lors de la modification de la facture"
          : "Erreur lors de la création de la facture"
      );
    }
  };

  // Auto generate submit
  const onAutoGenerate = () => {
    if (!selectedClientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (selectedExploitationIds.size === 0) {
      toast.error("Veuillez sélectionner au moins un service");
      return;
    }
    const dateEcheance = watch("dateEcheance");
    if (!dateEcheance) {
      toast.error("Veuillez définir une date d'échéance");
      return;
    }

    generateMutation.mutate({
      clientId: selectedClientId,
      dateEcheance,
      tauxTVA: tauxTVA,
      exploitationIds: Array.from(selectedExploitationIds),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la facture" : "Nouvelle facture"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de la facture."
              : "Créez une facture manuellement ou générez-la automatiquement à partir des services non facturés."}
          </DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "auto" | "manual")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Automatique
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manuel
              </TabsTrigger>
            </TabsList>

            {/* Auto Mode */}
            <TabsContent value="auto" className="space-y-4 mt-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={(value) => {
                    setSelectedClientId(value);
                    setSelectedExploitationIds(new Set());
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingUnpaid ? (
                      <SelectItem value="_loading" disabled>
                        Chargement...
                      </SelectItem>
                    ) : clientsWithUnpaid.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Aucun client avec des services non facturés
                      </SelectItem>
                    ) : (
                      clientsWithUnpaid.map((c) => (
                        <SelectItem key={c.client.id} value={c.client.id}>
                          <div className="flex items-center gap-2">
                            <span>{c.client.nomEntreprise}</span>
                            <Badge variant="secondary" className="ml-2">
                              {c.totalServices} service(s) - {formatCurrency(c.montantTotal)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Services List */}
              {selectedClientUnpaid && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Services non facturés</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {selectedExploitationIds.size === selectedClientUnpaid.exploitations.length
                        ? "Tout désélectionner"
                        : "Tout sélectionner"}
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border">
                    <div className="p-2 space-y-1">
                      {selectedClientUnpaid.exploitations.map((exp) => (
                        <div
                          key={exp.id}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                            selectedExploitationIds.has(exp.id)
                              ? "bg-[#0066cc]/10 border border-[#0066cc]/30"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleExploitation(exp.id)}
                        >
                          <Checkbox
                            checked={selectedExploitationIds.has(exp.id)}
                            onCheckedChange={() => toggleExploitation(exp.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{exp.service.nomService}</span>
                              <Badge variant="outline" className="shrink-0">
                                {formatCurrency(exp.service.tarif)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(exp.dateHeureDepart).toLocaleDateString('fr-FR')} • {exp.vehicule.immatriculation}
                            </div>
                          </div>
                          {selectedExploitationIds.has(exp.id) && (
                            <Check className="h-4 w-4 text-[#0066cc]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Date and TVA */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateEcheanceAuto">
                    Date d&apos;échéance <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dateEcheanceAuto"
                    type="date"
                    value={watch("dateEcheance") || ""}
                    onChange={(e) => setValue("dateEcheance", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taux TVA (%)</Label>
                  <Select
                    value={String(tauxTVA)}
                    onValueChange={(value) => setValue("tauxTVA", Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="7">7%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="14">14%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary */}
              {selectedExploitationIds.size > 0 && (
                <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Services sélectionnés:</span>
                    <span className="font-medium">{selectedExploitationIds.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Montant HT:</span>
                    <span className="font-medium">{formatCurrency(selectedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Montant TVA ({tauxTVA}%):</span>
                    <span className="font-medium">{formatCurrency(selectedTotal * tauxTVA / 100)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t">
                    <span>Montant TTC:</span>
                    <span className="text-[#0066cc]">{formatCurrency(selectedTotal * (1 + tauxTVA / 100))}</span>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={onAutoGenerate}
                  disabled={generateMutation.isPending || selectedExploitationIds.size === 0}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Générer la facture
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Manual Mode */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <ManualForm
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                clientsData={clientsData}
                montantHT={montantHT}
                tauxTVA={tauxTVA}
                montantTTC={montantTTC}
                montantTVA={montantTVA}
                isSubmitting={isSubmitting}
                createMutation={createMutation}
                updateMutation={updateMutation}
                isEditing={isEditing}
                onOpenChange={onOpenChange}
                onSubmit={handleSubmit(onSubmit)}
                exploitations={facture?.exploitations}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Editing mode - only manual */}
        {isEditing && (
          <ManualForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            clientsData={clientsData}
            montantHT={montantHT}
            tauxTVA={tauxTVA}
            montantTTC={montantTTC}
            montantTVA={montantTVA}
            isSubmitting={isSubmitting}
            createMutation={createMutation}
            updateMutation={updateMutation}
            isEditing={isEditing}
            onOpenChange={onOpenChange}
            onSubmit={handleSubmit(onSubmit)}
            exploitations={facture?.exploitations}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Separate manual form component
function ManualForm({
  register,
  errors,
  watch,
  setValue,
  clientsData,
  montantHT,
  tauxTVA,
  montantTTC,
  montantTVA,
  isSubmitting,
  createMutation,
  updateMutation,
  isEditing,
  onOpenChange,
  onSubmit,
  exploitations,
}: {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  clientsData: any;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  montantTVA: number;
  isSubmitting: boolean;
  createMutation: any;
  updateMutation: any;
  isEditing: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  exploitations?: any[];
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Client */}
      <div className="space-y-2">
        <Label htmlFor="clientId">
          Client <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch("clientId")}
          onValueChange={(value: string) => setValue("clientId", value)}
          disabled={isEditing}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un client" />
          </SelectTrigger>
          <SelectContent>
            {clientsData?.data?.map((client: any) => (
              <SelectItem key={client.id} value={client.id}>
                {client.nomEntreprise}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.clientId && (
          <p className="text-sm text-destructive">
            {errors.clientId.message}
          </p>
        )}
      </div>

      {/* Services facturés (en mode édition) */}
      {isEditing && exploitations && exploitations.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Services facturés ({exploitations.length})
          </Label>
          <ScrollArea className="h-[180px] rounded-md border">
            <div className="p-2 space-y-2">
              {exploitations.map((exp: any) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {exp.service?.nomService}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatCurrency(exp.service?.tarif || 0)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatDate(exp.dateHeureDepart)}</span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {exp.vehicule?.immatriculation}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {exp.chauffeur?.nom} {exp.chauffeur?.prenom}
                      </span>
                    </div>
                    {exp.service?.lieuDepart && exp.service?.lieuArrive && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {exp.service.lieuDepart} → {exp.service.lieuArrive}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-between text-sm p-2 bg-[#0066cc]/5 rounded border">
            <span>Total services:</span>
            <span className="font-medium text-[#0066cc]">
              {formatCurrency(
                exploitations.reduce((sum: number, exp: any) => sum + (exp.service?.tarif || 0), 0)
              )}
            </span>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateEmission">
            Date d&apos;émission <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dateEmission"
            type="date"
            {...register("dateEmission", {
              required: "La date d'émission est requise",
            })}
          />
          {errors.dateEmission && (
            <p className="text-sm text-destructive">
              {errors.dateEmission.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateEcheance">
            Date d&apos;échéance <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dateEcheance"
            type="date"
            {...register("dateEcheance", {
              required: "La date d'échéance est requise",
            })}
          />
          {errors.dateEcheance && (
            <p className="text-sm text-destructive">
              {errors.dateEcheance.message}
            </p>
          )}
        </div>
      </div>

      {/* Montants */}
      <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calculator className="h-4 w-4" />
          Calcul des montants
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="montantHT">
              Montant HT <span className="text-destructive">*</span>
            </Label>
            <Input
              id="montantHT"
              type="number"
              step="0.01"
              min="0"
              {...register("montantHT", {
                required: "Le montant HT est requis",
                min: { value: 0, message: "Le montant doit être positif" },
                valueAsNumber: true,
              })}
            />
            {errors.montantHT && (
              <p className="text-sm text-destructive">
                {errors.montantHT.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tauxTVA">Taux TVA (%)</Label>
            <Select
              value={String(tauxTVA)}
              onValueChange={(value) => setValue("tauxTVA", Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Taux TVA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="7">7%</SelectItem>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="14">14%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2 border-t space-y-1">
          <div className="flex justify-between text-sm">
            <span>Montant TVA:</span>
            <span className="font-medium">{formatCurrency(montantTVA)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Montant TTC:</span>
            <span className="text-[#0066cc]">{formatCurrency(montantTTC)}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          className="bg-[#0066cc] hover:bg-[#0066cc]/90"
        >
          {isSubmitting || createMutation.isPending || updateMutation.isPending
            ? "Enregistrement..."
            : isEditing
            ? "Modifier"
            : "Créer"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default FactureForm;

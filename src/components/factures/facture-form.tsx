"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useCreateFacture, useUpdateFacture, useClients } from "@/hooks/use-queries";
import { StatutFacture, TypeContratClient, type Facture, type FactureFormData } from "@/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Calculator } from "lucide-react";

interface FactureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facture?: Facture | null;
  onSuccess?: (facture: Facture) => void;
}

export function FactureForm({
  open,
  onOpenChange,
  facture,
  onSuccess,
}: FactureFormProps) {
  const isEditing = !!facture;

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
      tauxTVA: 20,
    },
  });

  const { data: clientsData } = useClients({ pageSize: 100 });

  // Reset form when dialog opens with facture data
  React.useEffect(() => {
    if (open) {
      if (facture) {
        reset({
          clientId: facture.clientId,
          dateEmission: new Date(facture.dateEmission).toISOString().split("T")[0],
          dateEcheance: new Date(facture.dateEcheance).toISOString().split("T")[0],
          montantHT: facture.montantHT,
          tauxTVA: facture.tauxTVA,
        });
      } else {
        reset({
          clientId: "",
          dateEmission: new Date().toISOString().split("T")[0],
          dateEcheance: "",
          montantHT: 0,
          tauxTVA: 20,
        });
      }
    }
  }, [open, facture, reset]);

  const createMutation = useCreateFacture();
  const updateMutation = useUpdateFacture();

  const montantHT = watch("montantHT") || 0;
  const tauxTVA = watch("tauxTVA") || 20;
  const montantTVA = montantHT * (tauxTVA / 100);
  const montantTTC = montantHT + montantTVA;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la facture" : "Nouvelle facture"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de la facture."
              : "Remplissez les informations pour créer une nouvelle facture."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="clientId">
              Client <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("clientId")}
              onValueChange={(value) => setValue("clientId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un client" />
              </SelectTrigger>
              <SelectContent>
                {clientsData?.data?.map((client) => (
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
      </DialogContent>
    </Dialog>
  );
}

export default FactureForm;

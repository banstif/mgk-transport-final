"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useCreatePaiement, useFacture } from "@/hooks/use-queries";
import { ModePaiement, type PaiementFormData } from "@/types";
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
import { CreditCard, Wallet, Receipt, Loader2 } from "lucide-react";

interface PaiementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factureId: string;
  onSuccess?: () => void;
}

export function PaiementForm({
  open,
  onOpenChange,
  factureId,
  onSuccess,
}: PaiementFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaiementFormData>({
    defaultValues: {
      factureId: "",
      montant: 0,
      mode: ModePaiement.ESPECES,
      reference: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  // Le hook useFacture retourne déjà les données directement (pas de .data)
  const { data: facture, isLoading: loadingFacture } = useFacture(factureId);
  const createMutation = useCreatePaiement();

  // Calculate amounts
  const montantTTC = facture?.montantTTC || 0;
  const totalPaid = facture?.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0;
  const remainingAmount = montantTTC - totalPaid;

  // Reset form when dialog opens with facture data loaded
  React.useEffect(() => {
    if (open && factureId && facture && remainingAmount > 0) {
      reset({
        factureId,
        montant: remainingAmount, // Par défaut le montant total restant
        mode: ModePaiement.ESPECES,
        reference: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, factureId, facture, remainingAmount, reset]);

  const onSubmit = async (data: PaiementFormData) => {
    try {
      const result = await createMutation.mutateAsync({
        factureId,
        data: {
          montant: data.montant,
          mode: data.mode,
          reference: data.reference,
          date: data.date,
        },
      });
      if (result.success) {
        toast.success("Paiement enregistré avec succès");
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error creating paiement:", error);
      toast.error("Erreur lors de l'enregistrement du paiement");
    }
  };

  const montant = watch("montant") || 0;
  const mode = watch("mode") || ModePaiement.ESPECES;

  // Don't render form content if facture is loading
  if (!facture && loadingFacture) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#0066cc]" />
              Chargement...
            </DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#0066cc]" />
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            Facture: {facture?.numero} - {facture?.client?.nomEntreprise}
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Montant TTC:</span>
            <span className="font-medium">{formatCurrency(montantTTC)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Déjà payé:</span>
            <span className="text-green-600">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold border-t pt-2">
            <span>Reste à payer:</span>
            <span className="text-[#ff6600]">{formatCurrency(remainingAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">
              Montant du paiement <span className="text-destructive">*</span>
            </Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              {...register("montant", {
                required: "Le montant est requis",
                min: { value: 0.01, message: "Le montant doit être supérieur à 0" },
                max: { value: remainingAmount, message: `Le montant ne peut pas dépasser ${formatCurrency(remainingAmount)}` },
                valueAsNumber: true,
              })}
            />
            {errors.montant && (
              <p className="text-sm text-destructive">{errors.montant.message}</p>
            )}
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label htmlFor="mode">
              Mode de paiement <span className="text-destructive">*</span>
            </Label>
            <Select
              value={mode}
              onValueChange={(value) => setValue("mode", value as ModePaiement)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ModePaiement.ESPECES}>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Espèces
                  </div>
                </SelectItem>
                <SelectItem value={ModePaiement.VIREMENT}>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Virement bancaire
                  </div>
                </SelectItem>
                <SelectItem value={ModePaiement.CHEQUE}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Chèque
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Référence (for virement/cheque) */}
          {(mode === ModePaiement.VIREMENT || mode === ModePaiement.CHEQUE) && (
            <div className="space-y-2">
              <Label htmlFor="reference">
                Référence {mode === ModePaiement.CHEQUE && "(N° Chèque)"}
              </Label>
              <Input
                id="reference"
                {...register("reference")}
                placeholder="Ex: CHQ-123456"
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              Date du paiement <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              {...register("date", {
                required: "La date est requise",
              })}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Preview */}
          {montant > 0 && (
            <div className="rounded-lg border p-3 bg-green-50 border-green-200">
              <div className="flex justify-between text-sm">
                <span>Nouveau reste à payer:</span>
                <span className="font-medium text-green-700">
                  {formatCurrency(Math.max(0, remainingAmount - montant))}
                </span>
              </div>
              {remainingAmount - montant <= 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ La facture sera marquée comme payée
                </p>
              )}
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
              type="submit"
              disabled={createMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer le paiement"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PaiementForm;

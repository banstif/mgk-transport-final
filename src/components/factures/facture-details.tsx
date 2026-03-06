"use client";

import * as React from "react";
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  CreditCard,
  Edit,
  Printer,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useFacture } from "@/hooks/use-queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatutFacture, ModePaiement } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Status Badge
function StatusBadge({ statut }: { statut: StatutFacture }) {
  const colors: Record<StatutFacture, string> = {
    EN_ATTENTE: "bg-blue-100 text-blue-800",
    PAYEE: "bg-green-100 text-green-800",
    EN_RETARD: "bg-red-100 text-red-800",
    ANNULEE: "bg-gray-100 text-gray-600",
  };

  const labels: Record<StatutFacture, string> = {
    EN_ATTENTE: "En attente",
    PAYEE: "Payée",
    EN_RETARD: "En retard",
    ANNULEE: "Annulée",
  };

  const icons: Record<StatutFacture, React.ReactNode> = {
    EN_ATTENTE: <Clock className="h-3 w-3 mr-1" />,
    PAYEE: <CheckCircle className="h-3 w-3 mr-1" />,
    EN_RETARD: <AlertCircle className="h-3 w-3 mr-1" />,
    ANNULEE: <AlertCircle className="h-3 w-3 mr-1" />,
  };

  return (
    <Badge variant="outline" className={`${colors[statut]} flex items-center`}>
      {icons[statut]}
      {labels[statut]}
    </Badge>
  );
}

// Mode Paiement Label
function getModePaiementLabel(mode: ModePaiement): string {
  const labels: Record<ModePaiement, string> = {
    ESPECES: "Espèces",
    VIREMENT: "Virement",
    CHEQUE: "Chèque",
  };
  return labels[mode];
}

interface FactureDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factureId?: string | null;
  onEdit?: (facture: any) => void;
  onAddPaiement?: (factureId: string) => void;
}

export function FactureDetails({
  open,
  onOpenChange,
  factureId,
  onEdit,
  onAddPaiement,
}: FactureDetailsProps) {
  const { data: response, isLoading } = useFacture(factureId || "");
  const facture = response?.data;

  const handleEdit = () => {
    if (facture && onEdit && facture.statut !== StatutFacture.PAYEE && facture.statut !== StatutFacture.ANNULEE) {
      onEdit(facture);
      onOpenChange(false);
    }
  };

  const handleAddPaiement = () => {
    if (facture && onAddPaiement && facture.statut !== StatutFacture.PAYEE && facture.statut !== StatutFacture.ANNULEE) {
      onAddPaiement(facture.id);
    }
  };

  // Calculate payment progress
  const totalPaid = facture?.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0;
  const remainingAmount = facture ? facture.montantTTC - totalPaid : 0;
  const paymentProgress = facture ? (totalPaid / facture.montantTTC) * 100 : 0;

  // Loading skeleton
  if (isLoading && factureId) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!facture) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#ff6600]/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#ff6600]" />
              </div>
              <div>
                <SheetTitle className="text-xl font-mono">
                  {facture.numero}
                </SheetTitle>
                <SheetDescription>
                  Détails de la facture
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge statut={facture.statut} />
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{facture.client?.nomEntreprise}</span>
              </div>
              {facture.client?.telephone && (
                <p className="text-sm text-muted-foreground mt-1">
                  Tél: {facture.client.telephone}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date d&apos;émission</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(facture.dateEmission)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date d&apos;échéance</p>
                  <p className={`font-medium flex items-center gap-1 ${facture.statut === StatutFacture.EN_RETARD ? 'text-red-600' : ''}`}>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(facture.dateEcheance)}
                    {facture.statut === StatutFacture.EN_RETARD && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Montants */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Détail des montants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Montant HT</span>
                <span className="font-medium">{formatCurrency(facture.montantHT)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA ({facture.tauxTVA}%)</span>
                <span>{formatCurrency(facture.montantTVA)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Montant TTC</span>
                <span className="text-[#0066cc]">{formatCurrency(facture.montantTTC)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Progress */}
          {facture.statut !== StatutFacture.ANNULEE && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Suivi des paiements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(100, paymentProgress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">{formatCurrency(totalPaid)} payé</span>
                    <span className={remainingAmount > 0 ? 'text-[#ff6600]' : 'text-green-600'}>
                      {formatCurrency(remainingAmount)} restant
                    </span>
                  </div>
                </div>

                {/* Add payment button */}
                {remainingAmount > 0 && (
                  <Button
                    onClick={handleAddPaiement}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ajouter un paiement
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Paiements */}
          {facture.paiements && facture.paiements.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Historique des paiements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Réf.</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facture.paiements.map((paiement) => (
                      <TableRow key={paiement.id}>
                        <TableCell>{formatDate(paiement.date)}</TableCell>
                        <TableCell>{getModePaiementLabel(paiement.mode)}</TableCell>
                        <TableCell className="font-mono text-xs">{paiement.reference || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(paiement.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {facture.statut !== StatutFacture.PAYEE && facture.statut !== StatutFacture.ANNULEE && (
              <Button variant="outline" onClick={handleEdit} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            )}
            <Button variant="outline" className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FactureDetails;

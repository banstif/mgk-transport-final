"use client";

import * as React from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  X,
  Edit,
  CreditCard,
} from "lucide-react";
import { useClient } from "@/hooks/use-queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { TypeContratClient, StatutFacture, ModePaiement } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Contract Type Badge
function ContractBadge({ type }: { type: TypeContratClient }) {
  const colors: Record<TypeContratClient, string> = {
    MENSUEL: "bg-blue-100 text-blue-800",
    ANNUEL: "bg-purple-100 text-purple-800",
    PONCTUEL: "bg-amber-100 text-amber-800",
  };

  const labels: Record<TypeContratClient, string> = {
    MENSUEL: "Mensuel",
    ANNUEL: "Annuel",
    PONCTUEL: "Ponctuel",
  };

  return (
    <Badge variant="outline" className={colors[type]}>
      {labels[type]}
    </Badge>
  );
}

// Status Badge
function StatusBadge({ actif }: { actif: boolean }) {
  return (
    <Badge
      variant={actif ? "default" : "secondary"}
      className={
        actif
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-600"
      }
    >
      {actif ? "Actif" : "Inactif"}
    </Badge>
  );
}

// Facture Status Badge
function FactureStatusBadge({ statut }: { statut: StatutFacture }) {
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

  return (
    <Badge variant="outline" className={colors[statut]}>
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

interface ClientDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string | null;
  onEdit?: (client: any) => void;
}

export function ClientDetails({
  open,
  onOpenChange,
  clientId,
  onEdit,
}: ClientDetailsProps) {
  const { data: response, isLoading, error } = useClient(clientId || "");
  const client = response?.data;

  const handleEdit = () => {
    if (client && onEdit) {
      onEdit(client);
      onOpenChange(false);
    }
  };

  // Loading skeleton
  if (isLoading && clientId) {
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

  if (!client) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#0066cc]/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#0066cc]" />
              </div>
              <div>
                <SheetTitle className="text-xl">
                  {client.nomEntreprise}
                </SheetTitle>
                <SheetDescription>
                  Détails du client
                </SheetDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Info Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.telephone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                )}
              </div>
              
              {client.contact && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Contact:</span>
                  <span className="text-sm">{client.contact}</span>
                </div>
              )}
              
              {client.adresse && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{client.adresse}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type de contrat:</span>
                  <ContractBadge type={client.typeContrat} />
                </div>
                <StatusBadge actif={client.actif} />
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Services, Factures, Paiements */}
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="services">
                Services ({client.services?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="factures">
                Factures ({client.factures?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="paiements">
                Paiements ({client.paiements?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {client.services && client.services.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ligne</TableHead>
                          <TableHead>Trajet</TableHead>
                          <TableHead>Salariés</TableHead>
                          <TableHead className="text-right">Tarif</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.services.map((service: any) => (
                          <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.ligne}</TableCell>
                            <TableCell>{service.trajet}</TableCell>
                            <TableCell>{service.nombreSalaries}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(service.tarif)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>Aucun service associé</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Factures Tab */}
            <TabsContent value="factures" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {client.factures && client.factures.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Facture</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Montant TTC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.factures.map((facture: any) => (
                          <TableRow key={facture.id}>
                            <TableCell className="font-mono text-sm">{facture.numero}</TableCell>
                            <TableCell>{formatDate(facture.dateEmission)}</TableCell>
                            <TableCell>
                              <FactureStatusBadge statut={facture.statut} />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(facture.montantTTC)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>Aucune facture</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Paiements Tab */}
            <TabsContent value="paiements" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {client.paiements && client.paiements.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.paiements.map((paiement: any) => (
                          <TableRow key={paiement.id}>
                            <TableCell>{formatDate(paiement.date)}</TableCell>
                            <TableCell>{getModePaiementLabel(paiement.mode)}</TableCell>
                            <TableCell>{paiement.reference || "-"}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatCurrency(paiement.montant)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CreditCard className="h-8 w-8 mb-2" />
                      <p>Aucun paiement</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ClientDetails;

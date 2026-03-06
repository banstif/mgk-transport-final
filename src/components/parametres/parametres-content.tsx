"use client";

import * as React from "react";
import { useState, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  FileText,
  FilePlus,
  Bell,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Building2,
  Phone,
  CreditCard,
  MapPin,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { 
  useParametres, 
  useCreateParametre, 
  useUpdateParametre,
  useTypesDocuments,
  useCreateTypeDocument,
  useUpdateTypeDocument,
  useDeleteTypeDocument,
  useCheckDocumentAlerts,
  queryKeys,
} from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { clearSettingsCache } from "@/lib/notification-service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { TypeDocumentPersonnalise } from "@/types";

// Form Schema for Document Types
const typeDocumentFormSchema = z.object({
  code: z.string()
    .min(2, "Le code doit contenir au moins 2 caractères")
    .max(50, "Le code ne peut pas dépasser 50 caractères")
    .regex(/^[A-Z0-9_]+$/, "Le code doit contenir uniquement des lettres majuscules, chiffres et underscores"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  actif: z.boolean().default(true),
});

type TypeDocumentFormValues = z.infer<typeof typeDocumentFormSchema>;

// Document Type Card Component
function DocumentTypeCard({
  type,
  onEdit,
  onDelete,
}: {
  type: TypeDocumentPersonnalise;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${!type.actif ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-green-100">
              <FilePlus className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{type.nom}</h4>
                {!type.actif && (
                  <Badge variant="secondary" className="text-xs">Inactif</Badge>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Code: {type.code}
              </p>
              {type.description && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {type.description}
                </p>
              )}
              <Badge variant="outline" className="text-xs mt-2">
                {type.categorie === 'CHAUFFEUR' ? 'Chauffeur' : 'Véhicule'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Notification Settings Component
function NotificationsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification settings state
  const [settings, setSettings] = useState({
    alertDocumentExpiration: true,
    alertDocumentDays: 30,
    alertFactureRetard: true,
    alertFactureDays: 7,
    alertEntretien: true,
    alertEntretienDays: 15,
    emailNotifications: false,
    emailRecipient: "",
    pushNotifications: true,
    soundEnabled: true,
  });

  // Load settings from parametres
  const { data: parametres } = useParametres();
  
  React.useEffect(() => {
    if (parametres) {
      const loadSetting = (key: string, defaultValue: unknown) => {
        const param = parametres.find(p => p.cle === key);
        if (param) {
          if (typeof defaultValue === 'boolean') {
            return param.valeur === 'true';
          }
          if (typeof defaultValue === 'number') {
            return parseInt(param.valeur) || defaultValue;
          }
          return param.valeur;
        }
        return defaultValue;
      };

      setSettings({
        alertDocumentExpiration: loadSetting('NOTIF_DOCUMENT_EXPIRATION', true),
        alertDocumentDays: loadSetting('NOTIF_DOCUMENT_DAYS', 30),
        alertFactureRetard: loadSetting('NOTIF_FACTURE_RETARD', true),
        alertFactureDays: loadSetting('NOTIF_FACTURE_DAYS', 7),
        alertEntretien: loadSetting('NOTIF_ENTRETIEN', true),
        alertEntretienDays: loadSetting('NOTIF_ENTRETIEN_DAYS', 15),
        emailNotifications: loadSetting('NOTIF_EMAIL_ENABLED', false),
        emailRecipient: loadSetting('NOTIF_EMAIL_RECIPIENT', ''),
        pushNotifications: loadSetting('NOTIF_PUSH_ENABLED', true),
        soundEnabled: loadSetting('NOTIF_SOUND_ENABLED', true),
      });
    }
  }, [parametres]);

  // Create/Update mutation
  const createMutation = useCreateParametre();
  const updateMutation = useUpdateParametre();
  const checkAlertsMutation = useCheckDocumentAlerts();

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = [
        { cle: 'NOTIF_DOCUMENT_EXPIRATION', valeur: String(settings.alertDocumentExpiration) },
        { cle: 'NOTIF_DOCUMENT_DAYS', valeur: String(settings.alertDocumentDays) },
        { cle: 'NOTIF_FACTURE_RETARD', valeur: String(settings.alertFactureRetard) },
        { cle: 'NOTIF_FACTURE_DAYS', valeur: String(settings.alertFactureDays) },
        { cle: 'NOTIF_ENTRETIEN', valeur: String(settings.alertEntretien) },
        { cle: 'NOTIF_ENTRETIEN_DAYS', valeur: String(settings.alertEntretienDays) },
        { cle: 'NOTIF_EMAIL_ENABLED', valeur: String(settings.emailNotifications) },
        { cle: 'NOTIF_EMAIL_RECIPIENT', valeur: settings.emailRecipient },
        { cle: 'NOTIF_PUSH_ENABLED', valeur: String(settings.pushNotifications) },
        { cle: 'NOTIF_SOUND_ENABLED', valeur: String(settings.soundEnabled) },
      ];

      for (const setting of settingsToSave) {
        const existing = parametres?.find(p => p.cle === setting.cle);
        if (existing) {
          await updateMutation.mutateAsync({ id: existing.id, data: setting });
        } else {
          await createMutation.mutateAsync(setting);
        }
      }

      clearSettingsCache();

      try {
        const result = await checkAlertsMutation.mutateAsync();
        
        if (result.success && result.data) {
          const data = result.data;
          const parts = [];
          if (data.documents > 0) parts.push(`${data.documents} document(s)`);
          if (data.factures > 0) parts.push(`${data.factures} facture(s)`);
          if (data.entretiens > 0) parts.push(`${data.entretiens} entretien(s)`);
          
          queryClient.invalidateQueries({ queryKey: queryKeys.alertes });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
          
          toast({
            title: "Succès",
            description: data.total > 0 
              ? `Paramètres enregistrés. ${data.total} alerte(s) mise(s) à jour: ${parts.join(', ')}.`
              : "Paramètres enregistrés. Alertes mises à jour selon les nouveaux critères.",
          });
        } else {
          toast({
            title: "Succès",
            description: "Paramètres de notifications enregistrés",
          });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: queryKeys.alertes });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
        
        toast({
          title: "Succès",
          description: "Paramètres de notifications enregistrés",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Paramètres des notifications
          </h3>
          <p className="text-sm text-muted-foreground">
            Gérez comment et quand vous recevez les alertes
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90"
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les paramètres
        </Button>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documents & Expirations
          </CardTitle>
          <CardDescription>
            Alertes pour les documents arrivant à expiration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Alertes d'expiration de documents</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir une alerte avant l'expiration des documents
              </p>
            </div>
            <Switch
              checked={settings.alertDocumentExpiration}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, alertDocumentExpiration: checked }))
              }
            />
          </div>
          
          {settings.alertDocumentExpiration && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-primary/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Jours avant expiration</Label>
                <p className="text-xs text-muted-foreground">
                  Nombre de jours pour l'alerte anticipée
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={90}
                  className="w-20"
                  value={settings.alertDocumentDays}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, alertDocumentDays: parseInt(e.target.value) || 30 }))
                  }
                />
                <span className="text-sm text-muted-foreground">jours</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Factures Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Factures impayées
          </CardTitle>
          <CardDescription>
            Alertes pour les factures en retard de paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Alertes de retard de paiement</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir une alerte pour les factures impayées
              </p>
            </div>
            <Switch
              checked={settings.alertFactureRetard}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, alertFactureRetard: checked }))
              }
            />
          </div>
          
          {settings.alertFactureRetard && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-orange-200">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Jours de retard</Label>
                <p className="text-xs text-muted-foreground">
                  Alerte après X jours de retard
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  className="w-20"
                  value={settings.alertFactureDays}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, alertFactureDays: parseInt(e.target.value) || 7 }))
                  }
                />
                <span className="text-sm text-muted-foreground">jours</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entretien Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Entretiens véhicules
          </CardTitle>
          <CardDescription>
            Alertes pour les entretiens programmés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Alertes d'entretien</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir une alerte avant les échéances d'entretien
              </p>
            </div>
            <Switch
              checked={settings.alertEntretien}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, alertEntretien: checked }))
              }
            />
          </div>
          
          {settings.alertEntretien && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-green-200">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Jours avant l'échéance</Label>
                <p className="text-xs text-muted-foreground">
                  Nombre de jours pour l'alerte anticipée
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  className="w-20"
                  value={settings.alertEntretienDays}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, alertEntretienDays: parseInt(e.target.value) || 15 }))
                  }
                />
                <span className="text-sm text-muted-foreground">jours</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Methods */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-500" />
            Méthodes de notification
          </CardTitle>
          <CardDescription>
            Comment vous souhaitez recevoir les alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Notifications push</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Afficher les notifications dans l'application
              </p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, pushNotifications: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">🔊</span>
                <Label className="text-sm font-medium">Son de notification</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Jouer un son lors des nouvelles alertes
              </p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, soundEnabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Notifications par email</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Recevoir les alertes par email (optionnel)
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, emailNotifications: checked }))
              }
            />
          </div>

          {settings.emailNotifications && (
            <div className="pl-4 border-l-2 border-purple-200 space-y-2">
              <Label className="text-sm font-medium">Adresse email</Label>
              <Input
                type="email"
                placeholder="exemple@email.com"
                value={settings.emailRecipient}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, emailRecipient: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Les alertes importantes seront envoyées à cette adresse
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Résumé des paramètres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings.alertDocumentExpiration ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings.alertFactureRetard ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Factures</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings.alertEntretien ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Entretiens</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings.emailNotifications ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Email</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Company Information Settings Component
function EntrepriseSettings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [entreprise, setEntreprise] = useState({
    nom: "",
    ice: "",
    adresse: "",
    telephone: "",
    email: "",
    rc: "",
    if: "",
    compteBancaire: "",
    siteWeb: "",
    logo: "",
  });

  const { data: parametres } = useParametres();
  
  React.useEffect(() => {
    if (parametres) {
      const loadSetting = (key: string, defaultValue: string) => {
        const param = parametres.find(p => p.cle === key);
        return param ? param.valeur : defaultValue;
      };

      setEntreprise({
        nom: loadSetting('ENTREPRISE_NOM', ''),
        ice: loadSetting('ENTREPRISE_ICE', ''),
        adresse: loadSetting('ENTREPRISE_ADRESSE', ''),
        telephone: loadSetting('ENTREPRISE_TELEPHONE', ''),
        email: loadSetting('ENTREPRISE_EMAIL', ''),
        rc: loadSetting('ENTREPRISE_RC', ''),
        if: loadSetting('ENTREPRISE_IF', ''),
        compteBancaire: loadSetting('ENTREPRISE_COMPTE_BANCAIRE', ''),
        siteWeb: loadSetting('ENTREPRISE_SITE_WEB', ''),
        logo: loadSetting('ENTREPRISE_LOGO', ''),
      });
      
      const logoValue = loadSetting('ENTREPRISE_LOGO', '');
      if (logoValue) {
        setLogoPreview(logoValue);
      }
    }
  }, [parametres]);

  const createMutation = useCreateParametre();
  const updateMutation = useUpdateParametre();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "Le fichier ne doit pas dépasser 2 Mo",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setEntreprise(prev => ({ ...prev, logo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = [
        { cle: 'ENTREPRISE_NOM', valeur: entreprise.nom },
        { cle: 'ENTREPRISE_ICE', valeur: entreprise.ice },
        { cle: 'ENTREPRISE_ADRESSE', valeur: entreprise.adresse },
        { cle: 'ENTREPRISE_TELEPHONE', valeur: entreprise.telephone },
        { cle: 'ENTREPRISE_EMAIL', valeur: entreprise.email },
        { cle: 'ENTREPRISE_RC', valeur: entreprise.rc },
        { cle: 'ENTREPRISE_IF', valeur: entreprise.if },
        { cle: 'ENTREPRISE_COMPTE_BANCAIRE', valeur: entreprise.compteBancaire },
        { cle: 'ENTREPRISE_SITE_WEB', valeur: entreprise.siteWeb },
        { cle: 'ENTREPRISE_LOGO', valeur: entreprise.logo },
      ];

      for (const setting of settingsToSave) {
        const existing = parametres?.find(p => p.cle === setting.cle);
        if (existing) {
          await updateMutation.mutateAsync({ id: existing.id, data: setting });
        } else {
          await createMutation.mutateAsync(setting);
        }
      }

      toast({
        title: "Succès",
        description: "Informations de l'entreprise enregistrées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de l'entreprise
          </h3>
          <p className="text-sm text-muted-foreground">
            Ces informations apparaîtront sur vos factures et documents officiels
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90"
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les informations
        </Button>
      </div>

      {/* Logo Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Logo de l'entreprise
          </CardTitle>
          <CardDescription>
            Le logo apparaîtra sur vos factures et documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              {logoPreview ? (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img 
                    src={logoPreview} 
                    alt="Logo entreprise" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center">
                  <Building2 className="h-10 w-10 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-2">Aucun logo</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choisir un logo
              </Button>
              {logoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setLogoPreview(null);
                    setEntreprise(prev => ({ ...prev, logo: '' }));
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou SVG. Max 2 Mo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Informations générales
          </CardTitle>
          <CardDescription>
            Nom et identifiants de l'entreprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nom de l'entreprise</Label>
              <Input
                placeholder="MGK Transport"
                value={entreprise.nom}
                onChange={(e) => setEntreprise(prev => ({ ...prev, nom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Numéro ICE</Label>
              <Input
                placeholder="001234567890123"
                value={entreprise.ice}
                onChange={(e) => setEntreprise(prev => ({ ...prev, ice: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Adresse</Label>
            <Textarea
              placeholder="123 Rue Example, Casablanca, Maroc"
              value={entreprise.adresse}
              onChange={(e) => setEntreprise(prev => ({ ...prev, adresse: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-500" />
            Coordonnées
          </CardTitle>
          <CardDescription>
            Téléphone, email et site web
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Téléphone</Label>
              <Input
                placeholder="+212 5XX XXX XXX"
                value={entreprise.telephone}
                onChange={(e) => setEntreprise(prev => ({ ...prev, telephone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                placeholder="contact@entreprise.com"
                value={entreprise.email}
                onChange={(e) => setEntreprise(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Site Web</Label>
            <Input
              placeholder="https://www.entreprise.com"
              value={entreprise.siteWeb}
              onChange={(e) => setEntreprise(prev => ({ ...prev, siteWeb: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal & Financial Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-500" />
            Informations légales et bancaires
          </CardTitle>
          <CardDescription>
            Registre de commerce, identifiant fiscal et compte bancaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">RC (Registre de Commerce)</Label>
              <Input
                placeholder="123456"
                value={entreprise.rc}
                onChange={(e) => setEntreprise(prev => ({ ...prev, rc: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">IF (Identifiant Fiscal)</Label>
              <Input
                placeholder="123456789"
                value={entreprise.if}
                onChange={(e) => setEntreprise(prev => ({ ...prev, if: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">N° Compte Bancaire (RIB)</Label>
            <Input
              placeholder="XXXX XXXX XXXX XXXX XXXX XXXX"
              maxLength={29}
              value={entreprise.compteBancaire}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
                setEntreprise(prev => ({ ...prev, compteBancaire: formatted }));
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Numéro RIB complet (24 chiffres)
              </p>
              <p className="text-xs text-muted-foreground">
                {entreprise.compteBancaire.replace(/\s/g, '').length}/24 chiffres
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Aperçu sur les documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-start gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-lg">{entreprise.nom || 'Nom de l\'entreprise'}</h4>
                {entreprise.adresse && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {entreprise.adresse}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  {entreprise.telephone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {entreprise.telephone}
                    </span>
                  )}
                  {entreprise.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {entreprise.email}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  {entreprise.ice && <span>ICE: {entreprise.ice}</span>}
                  {entreprise.rc && <span>RC: {entreprise.rc}</span>}
                  {entreprise.if && <span>IF: {entreprise.if}</span>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Label component
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}

export function ParametresContent() {
  const { toast } = useToast();
  
  // Document Types state
  const [addTypeDialogOpen, setAddTypeDialogOpen] = useState(false);
  const [editTypeDialogOpen, setEditTypeDialogOpen] = useState(false);
  const [deleteTypeDialogOpen, setDeleteTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TypeDocumentPersonnalise | null>(null);

  // Queries
  const { data: typesDocuments, isLoading: isLoadingTypes } = useTypesDocuments('CHAUFFEUR');

  // Document Types Mutations
  const createTypeMutation = useCreateTypeDocument();
  const updateTypeMutation = useUpdateTypeDocument();
  const deleteTypeMutation = useDeleteTypeDocument();

  // Form for Document Types
  const typeForm = useForm<TypeDocumentFormValues>({
    resolver: zodResolver(typeDocumentFormSchema),
    defaultValues: {
      code: "",
      nom: "",
      description: "",
      actif: true,
    },
  });

  // Reset type form when dialog opens/closes
  React.useEffect(() => {
    if (addTypeDialogOpen) {
      typeForm.reset({ code: "", nom: "", description: "", actif: true });
    }
  }, [addTypeDialogOpen, typeForm]);

  React.useEffect(() => {
    if (editTypeDialogOpen && selectedType) {
      typeForm.reset({
        code: selectedType.code,
        nom: selectedType.nom,
        description: selectedType.description || "",
        actif: selectedType.actif,
      });
    }
  }, [editTypeDialogOpen, selectedType, typeForm]);

  // Handlers for Document Types
  const onAddTypeSubmit = async (values: TypeDocumentFormValues) => {
    try {
      await createTypeMutation.mutateAsync({
        ...values,
        categorie: 'CHAUFFEUR',
      });
      toast({ title: "Succès", description: "Type de document créé avec succès" });
      setAddTypeDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création",
        variant: "destructive",
      });
    }
  };

  const onEditTypeSubmit = async (values: TypeDocumentFormValues) => {
    if (!selectedType) return;
    try {
      await updateTypeMutation.mutateAsync({
        id: selectedType.id,
        data: values,
      });
      toast({ title: "Succès", description: "Type de document mis à jour avec succès" });
      setEditTypeDialogOpen(false);
      setSelectedType(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const handleDeleteType = async () => {
    if (!selectedType) return;
    try {
      await deleteTypeMutation.mutateAsync(selectedType.id);
      toast({ title: "Succès", description: "Type de document supprimé avec succès" });
      setDeleteTypeDialogOpen(false);
      setSelectedType(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="entreprise" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="entreprise" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Entreprise Tab */}
        <TabsContent value="entreprise" className="space-y-6 mt-4">
          <EntrepriseSettings />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-4">
          <NotificationsSettings />
        </TabsContent>

        {/* Document Types Tab */}
        <TabsContent value="documents" className="space-y-6 mt-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Types de Documents Chauffeur</h3>
              <p className="text-sm text-muted-foreground">
                Gérez les types de documents personnalisés pour le suivi et les alertes d'expiration
              </p>
            </div>
            <Button
              onClick={() => setAddTypeDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un type
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{typesDocuments?.length || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total types</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Actifs</Badge>
                  <span className="text-2xl font-bold">
                    {typesDocuments?.filter(t => t.actif).length || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Types actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Prédéfinis</Badge>
                  <span className="text-2xl font-bold">4</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Types de base</p>
              </CardContent>
            </Card>
          </div>

          {/* Predefined Types Info */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Types de documents prédéfinis
              </CardTitle>
              <CardDescription>
                Ces types sont disponibles par défaut dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">🪪 Permis de conduire</Badge>
                <Badge variant="outline" className="bg-white">🛡️ Assurance chauffeur</Badge>
                <Badge variant="outline" className="bg-white">🏥 Visite médicale</Badge>
                <Badge variant="outline" className="bg-white">🪪 Carte d'identité nationale</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Custom Types */}
          {isLoadingTypes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : typesDocuments && typesDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typesDocuments.map((type) => (
                <DocumentTypeCard
                  key={type.id}
                  type={type}
                  onEdit={() => {
                    setSelectedType(type);
                    setEditTypeDialogOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedType(type);
                    setDeleteTypeDialogOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FilePlus className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Aucun type de document personnalisé
                </p>
                <p className="text-muted-foreground text-sm text-center mt-1">
                  Ajoutez des types personnalisés pour le suivi de documents spécifiques
                </p>
                <Button
                  onClick={() => setAddTypeDialogOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un type
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Document Type Dialog */}
      <Dialog open={addTypeDialogOpen} onOpenChange={setAddTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un type de document</DialogTitle>
            <DialogDescription>
              Créer un nouveau type de document pour le suivi et les alertes
            </DialogDescription>
          </DialogHeader>
          <Form {...typeForm}>
            <form onSubmit={typeForm.handleSubmit(onAddTypeSubmit)} className="space-y-4">
              <FormField
                control={typeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: ATTESTATION_FORMATION" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Code unique (lettres majuscules, chiffres, underscores)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Attestation de formation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Description optionnelle du type de document"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="actif"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Actif</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Ce type sera disponible pour la création de documents
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddTypeDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={createTypeMutation.isPending}
                >
                  {createTypeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Ajouter
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Type Dialog */}
      <Dialog open={editTypeDialogOpen} onOpenChange={setEditTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le type de document</DialogTitle>
            <DialogDescription>
              Modifier les informations du type de document
            </DialogDescription>
          </DialogHeader>
          <Form {...typeForm}>
            <form onSubmit={typeForm.handleSubmit(onEditTypeSubmit)} className="space-y-4">
              <FormField
                control={typeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: ATTESTATION_FORMATION" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Attestation de formation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Description optionnelle du type de document"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="actif"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Actif</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Ce type sera disponible pour la création de documents
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTypeDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={updateTypeMutation.isPending}
                >
                  {updateTypeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Document Type Dialog */}
      <AlertDialog open={deleteTypeDialogOpen} onOpenChange={setDeleteTypeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le type de document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le type{" "}
              <strong>{selectedType?.nom}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteType}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTypeMutation.isPending}
            >
              {deleteTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

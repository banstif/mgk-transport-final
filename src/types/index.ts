// MGK Transport Management System - TypeScript Types

// ==================== ENUMS ====================

export enum Role {
  ADMIN = 'ADMIN',
  COMPTABLE = 'COMPTABLE',
  EXPLOITATION = 'EXPLOITATION',
}

export enum TypeContrat {
  CDI = 'CDI',
  CDD = 'CDD',
  JOURNALIER = 'JOURNALIER',
}

export enum TypeSalaire {
  FIXE = 'FIXE',
  HORAIRE = 'HORAIRE',
  PAR_TOURNEE = 'PAR_TOURNEE',
}

export enum TypeDocumentChauffeur {
  PERMIS_CONDUIRE = 'PERMIS_CONDUIRE',
  ASSURANCE_CHAUFFEUR = 'ASSURANCE_CHAUFFEUR',
  VISITE_MEDICALE = 'VISITE_MEDICALE',
  CIN = 'CIN',
}

export enum TypeDocumentVehicule {
  ASSURANCE = 'ASSURANCE',
  VISITE_TECHNIQUE = 'VISITE_TECHNIQUE',
  CARTE_GRISE = 'CARTE_GRISE',
  AUTRE = 'AUTRE',
}

export enum StatutFacture {
  EN_ATTENTE = 'EN_ATTENTE',
  PAYEE = 'PAYEE',
  EN_RETARD = 'EN_RETARD',
  ANNULEE = 'ANNULEE',
}

export enum ModePaiement {
  ESPECES = 'ESPECES',
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
}

export enum TypeContratClient {
  MENSUEL = 'MENSUEL',
  ANNUEL = 'ANNUEL',
  PONCTUEL = 'PONCTUEL',
}

export enum TypeAlerte {
  ASSURANCE_VEHICULE_EXPIREE = 'ASSURANCE_VEHICULE_EXPIREE',
  PERMIS_CHAUFFEUR_EXPIRE = 'PERMIS_CHAUFFEUR_EXPIRE',
  VISITE_TECHNIQUE_PROCHE = 'VISITE_TECHNIQUE_PROCHE',
  ENTRETIEN_A_VENIR = 'ENTRETIEN_A_VENIR',
  FACTURE_IMPAYEE = 'FACTURE_IMPAYEE',
  DOCUMENT_EXPIRE = 'DOCUMENT_EXPIRE',
}

export enum PrioriteAlerte {
  HAUTE = 'HAUTE',
  MOYENNE = 'MOYENNE',
  BASSE = 'BASSE',
}

// ==================== MODELS ====================

export interface Utilisateur {
  id: string;
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  role: Role;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
  logs?: Log[];
}

export interface Log {
  id: string;
  action: string;
  details?: string | null;
  utilisateurId: string;
  utilisateur?: Utilisateur;
  createdAt: Date;
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  cin: string;
  telephone: string;
  adresse?: string | null;
  dateEmbauche: Date;
  typeContrat: TypeContrat;
  typeSalaire: TypeSalaire;
  montantSalaire: number;
  montantCNSS: number;
  montantAssurance: number;
  ribCompte?: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
  vehicules?: Vehicule[];
  salaires?: Salaire[];
  primes?: Prime[];
  avances?: Avance[];
  documents?: DocumentChauffeur[];
  _count?: {
    salaires?: number;
    primes?: number;
    avances?: number;
    documents?: number;
  };
}

export interface Salaire {
  id: string;
  chauffeurId: string;
  chauffeur?: Chauffeur;
  mois: number;
  annee: number;
  heuresTravaillees?: number | null;
  joursTravailles?: number | null;
  montantBase: number;
  montantPrimes: number;
  montantAvances: number;
  montantNet: number;
  paye: boolean;
  datePaiement?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prime {
  id: string;
  chauffeurId: string;
  chauffeur?: Chauffeur;
  motif: string;
  montant: number;
  date: Date;
  comptabilise?: boolean;
  createdAt: Date;
}

export interface Avance {
  id: string;
  chauffeurId: string;
  chauffeur?: Chauffeur;
  montant: number;
  date: Date;
  rembourse: boolean;
  createdAt: Date;
}

export interface DocumentChauffeur {
  id: string;
  chauffeurId: string;
  chauffeur?: Chauffeur;
  type: string;
  numero?: string | null;
  dateEmission?: Date | null;
  dateExpiration?: Date | null;
  fichier?: string | null;
  alerteEnvoyee: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypeDocumentPersonnalise {
  id: string;
  code: string;
  nom: string;
  description?: string | null;
  categorie: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  capacite: number;
  kilometrage: number;
  actif: boolean;
  chauffeurId?: string | null;
  chauffeur?: Chauffeur | null;
  createdAt: Date;
  updatedAt: Date;
  entretiens?: Entretien[];
  pleinsCarburant?: PleinCarburant[];
  documents?: DocumentVehicule[];
  _count?: {
    entretiens?: number;
    pleinsCarburant?: number;
    documents?: number;
  };
}

export interface Entretien {
  id: string;
  vehiculeId: string;
  vehicule?: Vehicule;
  type: string;
  description?: string | null;
  cout: number;
  kilometrage?: number | null;
  dateIntervention: Date;
  prochainKm?: number | null;
  prochaineDate?: Date | null;
  alerteEnvoyee: boolean;
  createdAt: Date;
}

export interface TypeEntretienPersonnalise {
  id: string;
  code: string;
  nom: string;
  description?: string | null;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PleinCarburant {
  id: string;
  vehiculeId: string;
  vehicule?: Vehicule;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  station?: string | null;
  kilometrage: number;
  date: Date;
  createdAt: Date;
}

export interface DocumentVehicule {
  id: string;
  vehiculeId: string;
  vehicule?: Vehicule;
  type: TypeDocumentVehicule;
  numero?: string | null;
  dateEmission?: Date | null;
  dateExpiration?: Date | null;
  fichier?: string | null;
  alerteEnvoyee: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  nomEntreprise: string;
  contact?: string | null;
  telephone: string;
  email?: string | null;
  adresse?: string | null;
  typeContrat: TypeContratClient;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
  services?: Service[];
  factures?: Facture[];
  paiements?: Paiement[];
}

export interface Service {
  id: string;
  clientId: string;
  client?: Client;
  ligne: string;
  trajet: string;
  nombreSalaries: number;
  tarif: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
  tournées?: Tournee[];
}

export interface Tournee {
  id: string;
  serviceId: string;
  service?: Service;
  chauffeurId: string;
  chauffeur?: Chauffeur;
  date: Date;
  completed: boolean;
  notes?: string | null;
  createdAt: Date;
}

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  dateEmission: Date;
  dateEcheance: Date;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  statut: StatutFacture;
  rappelsEnvoyes: number;
  createdAt: Date;
  updatedAt: Date;
  paiements?: Paiement[];
}

export interface Paiement {
  id: string;
  factureId: string;
  facture?: Facture;
  clientId: string;
  client?: Client;
  montant: number;
  mode: ModePaiement;
  reference?: string | null;
  date: Date;
  createdAt: Date;
}

export interface Alerte {
  id: string;
  type: TypeAlerte;
  titre: string;
  message: string;
  priority: PrioriteAlerte;
  lu: boolean;
  resolute: boolean;
  referenceId?: string | null;
  createdAt: Date;
}

export interface Parametre {
  id: string;
  cle: string;
  valeur: string;
  updatedAt: Date;
}

// ==================== FORM DATA TYPES ====================

export interface ChauffeurFormData {
  nom: string;
  prenom: string;
  cin: string;
  telephone: string;
  adresse?: string;
  dateEmbauche: string;
  typeContrat: TypeContrat;
  typeSalaire: TypeSalaire;
  montantSalaire: number;
  montantCNSS?: number;
  montantAssurance?: number;
  ribCompte?: string;
  actif?: boolean;
  permisNumero?: string;
  permisDateExpiration?: string;
}

export interface VehiculeFormData {
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  capacite: number;
  kilometrage?: number;
  chauffeurId?: string;
  actif?: boolean;
}

export interface PrimeFormData {
  motif: string;
  montant: number;
  date: string;
}

export interface AvanceFormData {
  montant: number;
  date: string;
}

export interface EntretienFormData {
  type: string;
  description?: string;
  cout: number;
  kilometrage?: number;
  dateIntervention: string;
  prochainKm?: number;
  prochaineDate?: string;
}

export interface PleinCarburantFormData {
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  station?: string;
  kilometrage: number;
  date: string;
}

export interface ClientFormData {
  nomEntreprise: string;
  contact?: string;
  telephone: string;
  email?: string;
  adresse?: string;
  typeContrat: TypeContratClient;
  actif?: boolean;
}

export interface FactureFormData {
  clientId: string;
  dateEmission: string;
  dateEcheance: string;
  montantHT: number;
  tauxTVA?: number;
}

export interface ServiceFormData {
  clientId: string;
  ligne: string;
  trajet: string;
  nombreSalaries: number;
  tarif: number;
}

export interface PaiementFormData {
  factureId: string;
  montant: number;
  mode: ModePaiement;
  reference?: string;
  date: string;
}

export interface TypeDocumentPersonnaliseFormData {
  code: string;
  nom: string;
  description?: string;
  categorie: string;
}

export interface TypeEntretienPersonnaliseFormData {
  code: string;
  nom: string;
  description?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== DASHBOARD TYPES ====================

export interface DashboardStats {
  totalChauffeurs: number;
  chauffeursActifs: number;
  totalVehicules: number;
  vehiculesActifs: number;
  totalClients: number;
  clientsActifs: number;
  facturesEnAttente: number;
  facturesEnRetard: number;
  alertesNonLues: number;
  alertesHautePriorite: number;
  entretiensAVenir: number;
  documentsExpires: number;
}

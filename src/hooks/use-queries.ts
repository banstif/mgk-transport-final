// MGK Transport - React Query Hooks
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  DashboardStats,
  Chauffeur,
  Vehicule,
  Client,
  Facture,
  Alerte,
  Parametre,
  TypeDocumentPersonnalise,
  TypeEntretienPersonnalise,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

// ==================== QUERY KEYS ====================

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  dashboardStats: () => [...queryKeys.dashboard, 'stats'] as const,
  chauffeurs: ['chauffeurs'] as const,
  chauffeur: (id: string) => [...queryKeys.chauffeurs, id] as const,
  vehicules: ['vehicules'] as const,
  vehicule: (id: string) => [...queryKeys.vehicules, id] as const,
  clients: ['clients'] as const,
  client: (id: string) => [...queryKeys.clients, id] as const,
  factures: ['factures'] as const,
  facture: (id: string) => [...queryKeys.factures, id] as const,
  alertes: ['alertes'] as const,
  alerte: (id: string) => [...queryKeys.alertes, id] as const,
  parametres: ['parametres'] as const,
  typesDocuments: ['typesDocuments'] as const,
  typesEntretien: ['typesEntretien'] as const,
  primes: ['primes'] as const,
  avances: ['avances'] as const,
  salaires: ['salaires'] as const,
  documents: ['documents'] as const,
};

// ==================== API FETCHER UTILITIES ====================

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      success: false,
      error: 'Une erreur est survenue',
    }));
    throw new Error(error.error || 'Une erreur est survenue');
  }

  return response.json();
}

// ==================== DASHBOARD HOOKS ====================

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboardStats(),
    queryFn: () => fetchApi<DashboardStats>('/dashboard/stats'),
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== CHAUFFEUR HOOKS ====================

export function useChauffeurs(params?: {
  actif?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery<PaginatedResponse<Chauffeur>>({
    queryKey: ['chauffeurs', 'list', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.actif !== undefined) searchParams.set('actif', String(params.actif));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      return fetchApi<PaginatedResponse<Chauffeur>>(`/chauffeurs?${searchParams.toString()}`);
    },
    staleTime: 30 * 1000,
  });
}

export function useChauffeur(id: string) {
  return useQuery<Chauffeur>({
    queryKey: queryKeys.chauffeur(id),
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<Chauffeur>>(`/chauffeurs/${id}`);
      if (!response.data) throw new Error('Chauffeur non trouvé');
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateChauffeur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchApi<ApiResponse<Chauffeur>>('/chauffeurs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chauffeurs });
    },
  });
}

export function useUpdateChauffeur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi<ApiResponse<Chauffeur>>(`/chauffeurs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chauffeur(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chauffeurs });
    },
  });
}

export function useDeleteChauffeur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<void>>(`/chauffeurs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chauffeurs });
    },
  });
}

// ==================== VEHICULE HOOKS ====================

export function useVehicules(params?: { actif?: boolean; search?: string; page?: number }) {
  return useQuery<PaginatedResponse<Vehicule>>({
    queryKey: ['vehicules', 'list', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.actif !== undefined) searchParams.set('actif', String(params.actif));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.page) searchParams.set('page', String(params.page));
      return fetchApi<PaginatedResponse<Vehicule>>(`/vehicules?${searchParams.toString()}`);
    },
  });
}

export function useVehicule(id: string) {
  return useQuery<Vehicule>({
    queryKey: queryKeys.vehicule(id),
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<Vehicule>>(`/vehicules/${id}`);
      if (!response.data) throw new Error('Véhicule non trouvé');
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateVehicule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchApi<ApiResponse<Vehicule>>('/vehicules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicules });
    },
  });
}

export function useUpdateVehicule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi<ApiResponse<Vehicule>>(`/vehicules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicule(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicules });
    },
  });
}

export function useDeleteVehicule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<void>>(`/vehicules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicules });
    },
  });
}

// ==================== ALERTE HOOKS ====================

export function useAlertes(params?: { lu?: boolean }) {
  return useQuery<Alerte[]>({
    queryKey: ['alertes', 'list', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.lu !== undefined) searchParams.set('lu', String(params.lu));
      const response = await fetchApi<ApiResponse<Alerte[]>>(`/alertes?${searchParams.toString()}`);
      return response.data || [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<Alerte>>(`/alertes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ lu: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertes });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<Alerte>>(`/alertes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ resolute: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertes });
    },
  });
}

export function useUpdateAlerte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { lu?: boolean; resolute?: boolean } }) =>
      fetchApi<ApiResponse<Alerte>>(`/alertes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertes });
    },
  });
}

export function useDeleteAlerte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<void>>(`/alertes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertes });
    },
  });
}

export function useCheckDocumentAlerts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchApi<ApiResponse<{ documents: number; factures: number; entretiens: number; total: number }>>(
        '/alertes/check-documents',
        { method: 'POST' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertes });
    },
  });
}

// ==================== PRIMES HOOKS ====================

export function usePrimes(chauffeurId: string) {
  return useQuery({
    queryKey: [...queryKeys.primes, chauffeurId],
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<any[]>>(`/chauffeurs/${chauffeurId}/primes`);
      return response.data || [];
    },
    enabled: !!chauffeurId,
  });
}

export function useCreatePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chauffeurId, ...data }: { chauffeurId: string; motif: string; montant: number; date: string }) =>
      fetchApi<ApiResponse<any>>(`/chauffeurs/${chauffeurId}/primes`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.primes, chauffeurId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.chauffeur(chauffeurId) });
    },
  });
}

export function useUpdatePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chauffeurId, data }: { id: string; chauffeurId: string; data: any }) =>
      fetchApi<ApiResponse<any>>(`/chauffeurs/${chauffeurId}/primes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.primes, chauffeurId] });
    },
  });
}

export function useDeletePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chauffeurId }: { id: string; chauffeurId: string }) =>
      fetchApi<ApiResponse<void>>(`/chauffeurs/${chauffeurId}/primes/${id}`, { method: 'DELETE' }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.primes, chauffeurId] });
    },
  });
}

// ==================== AVANCES HOOKS ====================

export function useAvances(chauffeurId: string) {
  return useQuery({
    queryKey: [...queryKeys.avances, chauffeurId],
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<any[]>>(`/chauffeurs/${chauffeurId}/avances`);
      return response.data || [];
    },
    enabled: !!chauffeurId,
  });
}

export function useCreateAvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chauffeurId, ...data }: { chauffeurId: string; montant: number; date: string }) =>
      fetchApi<ApiResponse<any>>(`/chauffeurs/${chauffeurId}/avances`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.avances, chauffeurId] });
    },
  });
}

export function useUpdateAvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chauffeurId, data }: { id: string; chauffeurId: string; data: { montant?: number; date?: string; rembourse?: boolean } }) =>
      fetchApi<ApiResponse<any>>(`/chauffeurs/${chauffeurId}/avances/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.avances, chauffeurId] });
    },
  });
}

export function useDeleteAvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chauffeurId }: { id: string; chauffeurId: string }) =>
      fetchApi<ApiResponse<void>>(`/chauffeurs/${chauffeurId}/avances/${id}`, { method: 'DELETE' }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.avances, chauffeurId] });
    },
  });
}

// ==================== SALAIRES HOOKS ====================

export function useSalaires(chauffeurId: string) {
  return useQuery({
    queryKey: [...queryKeys.salaires, chauffeurId],
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<any[]>>(`/chauffeurs/${chauffeurId}/salaires`);
      return response.data || [];
    },
    enabled: !!chauffeurId,
  });
}

export function useSalairePreview(chauffeurId: string, mois: number, annee: number) {
  return useQuery({
    queryKey: [...queryKeys.salaires, 'preview', chauffeurId, mois, annee],
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<{
        montantPrimes: number;
        montantAvances: number;
        primes: Array<{ id: string; motif: string; montant: number; date: string }>;
        avances: Array<{ id: string; montant: number; date: string }>;
      }>>(`/chauffeurs/${chauffeurId}/salaires/preview?mois=${mois}&annee=${annee}`);
      return response.data || { montantPrimes: 0, montantAvances: 0, primes: [], avances: [] };
    },
    enabled: !!chauffeurId && mois > 0 && annee > 0,
  });
}

export function usePayerSalaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chauffeurId }: { id: string; chauffeurId: string }) =>
      fetchApi<ApiResponse<any>>(`/chauffeurs/${chauffeurId}/salaires/${id}/payer`, { method: 'PUT' }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.salaires, chauffeurId] });
    },
  });
}

export function useCreateSalaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chauffeurId, data }: { chauffeurId: string; data: any }) =>
      fetchApi<ApiResponse<any>>(`/chauffeurs/${chauffeurId}/salaires`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.salaires, chauffeurId] });
    },
  });
}

export function useUpdateSalaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chauffeurId, data }: { id: string; chauffeurId: string; data: any }) =>
      fetchApi<ApiResponse<any>>(`/chauffeurs/${chauffeurId}/salaires/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.salaires, chauffeurId] });
    },
  });
}

export function useDeleteSalaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chauffeurId }: { id: string; chauffeurId: string }) =>
      fetchApi<ApiResponse<void>>(`/chauffeurs/${chauffeurId}/salaires/${id}`, { method: 'DELETE' }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.salaires, chauffeurId] });
    },
  });
}

// ==================== DOCUMENTS HOOKS ====================

export function useDocuments(chauffeurId: string) {
  return useQuery({
    queryKey: [...queryKeys.documents, chauffeurId],
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<any[]>>(`/chauffeurs/${chauffeurId}/documents`);
      return response.data || [];
    },
    enabled: !!chauffeurId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chauffeurId, data }: { chauffeurId: string; data: FormData }) => {
      const response = await fetch(`/api/chauffeurs/${chauffeurId}/documents`, {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    },
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.documents, chauffeurId] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, chauffeurId, data }: { id: string; chauffeurId: string; data: FormData }) => {
      const response = await fetch(`/api/chauffeurs/${chauffeurId}/documents/${id}`, {
        method: 'PUT',
        body: data,
      });
      if (!response.ok) throw new Error('Erreur lors de la modification');
      return response.json();
    },
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.documents, chauffeurId] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chauffeurId }: { id: string; chauffeurId: string }) =>
      fetchApi<ApiResponse<void>>(`/chauffeurs/${chauffeurId}/documents/${id}`, { method: 'DELETE' }),
    onSuccess: (_, { chauffeurId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.documents, chauffeurId] });
    },
  });
}

// ==================== TYPES DOCUMENTS HOOKS ====================

export function useTypesDocuments(categorie?: string) {
  return useQuery<TypeDocumentPersonnalise[]>({
    queryKey: categorie ? ['typesDocuments', categorie] : ['typesDocuments'],
    queryFn: async () => {
      const params = categorie ? `?categorie=${categorie}` : '';
      const response = await fetchApi<ApiResponse<TypeDocumentPersonnalise[]>>(`/types-documents${params}`);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTypeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchApi<ApiResponse<TypeDocumentPersonnalise>>('/types-documents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesDocuments'] });
    },
  });
}

export function useUpdateTypeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi<ApiResponse<TypeDocumentPersonnalise>>(`/types-documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesDocuments'] });
    },
  });
}

export function useDeleteTypeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<void>>(`/types-documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesDocuments'] });
    },
  });
}

// ==================== TYPES ENTRETIEN HOOKS ====================

export function useTypesEntretien() {
  return useQuery<TypeEntretienPersonnalise[]>({
    queryKey: ['typesEntretien'],
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<TypeEntretienPersonnalise[]>>('/types-entretien');
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTypeEntretien() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchApi<ApiResponse<TypeEntretienPersonnalise>>('/types-entretien', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesEntretien'] });
    },
  });
}

export function useUpdateTypeEntretien() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi<ApiResponse<TypeEntretienPersonnalise>>(`/types-entretien/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesEntretien'] });
    },
  });
}

export function useDeleteTypeEntretien() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<void>>(`/types-entretien/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesEntretien'] });
    },
  });
}

// ==================== PARAMETRES HOOKS ====================

export function useParametres(cle?: string) {
  return useQuery<Parametre[]>({
    queryKey: cle ? ['parametres', 'search', cle] : ['parametres'],
    queryFn: async () => {
      const params = cle ? `?cle=${encodeURIComponent(cle)}` : '';
      const response = await fetchApi<ApiResponse<Parametre[]>>(`/parametres${params}`);
      return response.data || [];
    },
  });
}

export function useParametre(id: string) {
  return useQuery<Parametre>({
    queryKey: ['parametres', id],
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<Parametre>>(`/parametres/${id}`);
      if (!response.data) throw new Error('Paramètre non trouvé');
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateParametre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { cle: string; valeur: string }) =>
      fetchApi<ApiResponse<Parametre>>('/parametres', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametres'] });
    },
  });
}

export function useUpdateParametre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { cle?: string; valeur?: string } }) =>
      fetchApi<ApiResponse<Parametre>>(`/parametres/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametres'] });
    },
  });
}

export function useDeleteParametre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiResponse<void>>(`/parametres/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametres'] });
    },
  });
}

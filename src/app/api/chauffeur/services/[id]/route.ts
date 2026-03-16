// Chauffeur Service Detail API - Update service status
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import type { ApiResponse } from '@/types';

// PUT /api/chauffeur/services/[id] - Update service (start or complete)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Get session from database
    const session = await db.parametre.findUnique({
      where: { cle: `session_${sessionToken}` },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session invalide' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(session.valeur);

    if (new Date(sessionData.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session expirée' },
        { status: 401 }
      );
    }

    if (sessionData.role !== 'CHAUFFEUR') {
      return NextResponse.json(
        { success: false, error: 'Accès réservé aux chauffeurs' },
        { status: 403 }
      );
    }

    // Get chauffeur ID from user
    const utilisateur = await db.utilisateur.findUnique({
      where: { id: sessionData.userId },
      select: { chauffeurId: true },
    });

    if (!utilisateur?.chauffeurId) {
      return NextResponse.json(
        { success: false, error: 'Profil chauffeur non trouvé' },
        { status: 404 }
      );
    }

    // Verify the service belongs to this chauffeur
    const service = await db.exploitationService.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service non trouvé' },
        { status: 404 }
      );
    }

    if (service.chauffeurId !== utilisateur.chauffeurId) {
      return NextResponse.json(
        { success: false, error: 'Ce service ne vous appartient pas' },
        { status: 403 }
      );
    }

    // Get update data
    const body = await request.json();
    const { statut, notes } = body;

    // Determine completed based on statut
    // Note: statut field will be updated via raw query or default
    const isCompleted = statut === 'TERMINE';

    // Update service - using completed field only for now
    // statut is updated separately via raw SQL if needed
    const updateData: Record<string, unknown> = {
      completed: isCompleted,
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update the service
    const updatedService = await db.exploitationService.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            nomEntreprise: true,
            telephone: true,
          },
        },
        service: {
          select: {
            id: true,
            nomService: true,
            lieuDepart: true,
            lieuArrive: true,
            heureDepart: true,
          },
        },
        vehicule: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
          },
        },
      },
    });

    // Also update statut via raw query since Prisma client doesn't have it yet
    if (statut) {
      await db.$executeRaw`UPDATE ExploitationService SET statut = ${statut} WHERE id = ${id}`;
    }

    const messages: Record<string, string> = {
      'EN_ATTENTE': 'Service remis en attente',
      'EN_COURS': 'Service démarré',
      'TERMINE': 'Service terminé',
    };

    return NextResponse.json({
      success: true,
      data: updatedService,
      message: statut ? messages[statut] : 'Service mis à jour',
    });
  } catch (error) {
    console.error('Erreur mise à jour service:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du service' },
      { status: 500 }
    );
  }
}

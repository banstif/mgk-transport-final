import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiResponse, Salaire } from '@/types';

interface SalaireUpdateData {
  heuresTravaillees?: number;
  joursTravailles?: number;
  montantBase?: number;
  montantPrimes?: number;
  montantAvances?: number;
}

// GET /api/chauffeurs/[id]/salaires/[salaireId] - Get single salaire
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; salaireId: string }> }
): Promise<NextResponse<ApiResponse<Salaire>>> {
  try {
    const { id: chauffeurId, salaireId } = await params;

    const salaire = await db.salaire.findFirst({
      where: {
        id: salaireId,
        chauffeurId,
      },
    });

    if (!salaire) {
      return NextResponse.json(
        { success: false, error: 'Salaire non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: salaire,
    });
  } catch (error) {
    console.error('Error fetching salaire:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du salaire' },
      { status: 500 }
    );
  }
}

// PUT /api/chauffeurs/[id]/salaires/[salaireId] - Update salaire
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; salaireId: string }> }
): Promise<NextResponse<ApiResponse<Salaire>>> {
  try {
    const { id: chauffeurId, salaireId } = await params;
    const body: SalaireUpdateData = await request.json();

    // Check if salaire exists and belongs to this chauffeur
    const existingSalaire = await db.salaire.findFirst({
      where: {
        id: salaireId,
        chauffeurId,
      },
    });

    if (!existingSalaire) {
      return NextResponse.json(
        { success: false, error: 'Salaire non trouvé' },
        { status: 404 }
      );
    }

    // Check if salary is already paid
    if (existingSalaire.paye) {
      return NextResponse.json(
        { success: false, error: 'Impossible de modifier un salaire déjà payé' },
        { status: 400 }
      );
    }

    // Get chauffeur info for recalculation
    const chauffeur = await db.chauffeur.findUnique({
      where: { id: chauffeurId },
      include: {
        primes: {
          where: {
            date: {
              gte: new Date(existingSalaire.annee, existingSalaire.mois - 1, 1),
              lt: new Date(existingSalaire.annee, existingSalaire.mois, 1),
            },
          },
        },
        avances: {
          where: {
            rembourse: false,
            date: {
              gte: new Date(existingSalaire.annee, existingSalaire.mois - 1, 1),
              lt: new Date(existingSalaire.annee, existingSalaire.mois, 1),
            },
          },
        },
      },
    });

    if (!chauffeur) {
      return NextResponse.json(
        { success: false, error: 'Chauffeur non trouvé' },
        { status: 404 }
      );
    }

    // Calculate base salary
    let montantBase = existingSalaire.montantBase;
    
    if (body.montantBase !== undefined) {
      montantBase = body.montantBase;
    } else if (body.heuresTravaillees !== undefined || body.joursTravailles !== undefined) {
      const heures = body.heuresTravaillees ?? existingSalaire.heuresTravaillees ?? 0;
      const jours = body.joursTravailles ?? existingSalaire.joursTravailles ?? 0;
      
      switch (chauffeur.typeSalaire) {
        case 'FIXE':
          montantBase = chauffeur.montantSalaire;
          break;
        case 'HORAIRE':
          montantBase = chauffeur.montantSalaire * heures;
          break;
        case 'PAR_TOURNEE':
          montantBase = chauffeur.montantSalaire * jours;
          break;
        default:
          montantBase = chauffeur.montantSalaire;
      }
    }

    // Calculate primes and avances
    const montantPrimes = body.montantPrimes !== undefined 
      ? body.montantPrimes 
      : chauffeur.primes.reduce((sum, prime) => sum + prime.montant, 0);
    
    const montantAvances = body.montantAvances !== undefined
      ? body.montantAvances
      : chauffeur.avances.reduce((sum, avance) => sum + avance.montant, 0);

    // Calculate net salary: Base + Primes - Avances
    const montantNet = montantBase + montantPrimes - montantAvances;

    // Update salaire
    const salaire = await db.salaire.update({
      where: { id: salaireId },
      data: {
        heuresTravaillees: body.heuresTravaillees ?? existingSalaire.heuresTravaillees,
        joursTravailles: body.joursTravailles ?? existingSalaire.joursTravailles,
        montantBase,
        montantPrimes,
        montantAvances,
        montantNet,
      },
    });

    return NextResponse.json({
      success: true,
      data: salaire,
      message: 'Salaire modifié avec succès',
    });
  } catch (error) {
    console.error('Error updating salaire:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification du salaire' },
      { status: 500 }
    );
  }
}

// DELETE /api/chauffeurs/[id]/salaires/[salaireId] - Delete salaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; salaireId: string }> }
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const { id: chauffeurId, salaireId } = await params;

    // Check if salaire exists and belongs to this chauffeur
    const existingSalaire = await db.salaire.findFirst({
      where: {
        id: salaireId,
        chauffeurId,
      },
    });

    if (!existingSalaire) {
      return NextResponse.json(
        { success: false, error: 'Salaire non trouvé' },
        { status: 404 }
      );
    }

    // Check if salary is already paid
    if (existingSalaire.paye) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer un salaire déjà payé' },
        { status: 400 }
      );
    }

    // Delete salaire
    await db.salaire.delete({
      where: { id: salaireId },
    });

    return NextResponse.json({
      success: true,
      message: 'Salaire supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting salaire:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du salaire' },
      { status: 500 }
    );
  }
}

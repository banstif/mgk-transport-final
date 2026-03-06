import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiResponse, Salaire } from '@/types';

// PUT /api/chauffeurs/[id]/salaires/[salaireId]/payer - Mark salary as paid
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; salaireId: string }> }
): Promise<NextResponse<ApiResponse<Salaire>>> {
  try {
    const { id: chauffeurId, salaireId } = await params;

    // Check if chauffeur exists
    const chauffeur = await db.chauffeur.findUnique({
      where: { id: chauffeurId },
      select: { id: true },
    });

    if (!chauffeur) {
      return NextResponse.json(
        { success: false, error: 'Chauffeur non trouvé' },
        { status: 404 }
      );
    }

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

    // Check if already paid
    if (existingSalaire.paye) {
      return NextResponse.json(
        { success: false, error: 'Ce salaire est déjà payé' },
        { status: 400 }
      );
    }

    const { mois, annee } = existingSalaire;

    // Use transaction to update salary and mark primes/avances
    const [salaire] = await db.$transaction([
      // Update salaire to mark as paid
      db.salaire.update({
        where: { id: salaireId },
        data: {
          paye: true,
          datePaiement: new Date(),
        },
      }),
      // Mark all primes of this month as comptabilized
      db.prime.updateMany({
        where: {
          chauffeurId,
          comptabilise: false,
          date: {
            gte: new Date(annee, mois - 1, 1),
            lt: new Date(annee, mois, 1),
          },
        },
        data: {
          comptabilise: true,
        },
      }),
      // Mark all avances of this month as reimbursed
      db.avance.updateMany({
        where: {
          chauffeurId,
          rembourse: false,
          date: {
            gte: new Date(annee, mois - 1, 1),
            lt: new Date(annee, mois, 1),
          },
        },
        data: {
          rembourse: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: salaire,
      message: 'Salaire marqué comme payé, primes comptabilisées et avances remboursées',
    });
  } catch (error) {
    console.error('Error marking salaire as paid:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du marquage du salaire' },
      { status: 500 }
    );
  }
}

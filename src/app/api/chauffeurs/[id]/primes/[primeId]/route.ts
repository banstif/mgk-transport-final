import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiResponse, Prime } from '@/types';

// GET /api/chauffeurs/[id]/primes/[primeId] - Get single prime
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; primeId: string }> }
): Promise<NextResponse<ApiResponse<Prime>>> {
  try {
    const { id, primeId } = await params;

    const prime = await db.prime.findFirst({
      where: {
        id: primeId,
        chauffeurId: id,
      },
    });

    if (!prime) {
      return NextResponse.json(
        { success: false, error: 'Prime non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prime,
    });
  } catch (error) {
    console.error('Error fetching prime:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la prime' },
      { status: 500 }
    );
  }
}

// PUT /api/chauffeurs/[id]/primes/[primeId] - Update prime
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; primeId: string }> }
): Promise<NextResponse<ApiResponse<Prime>>> {
  try {
    const { id, primeId } = await params;
    const body = await request.json();

    const { motif, montant, date } = body;

    // Check if prime exists and belongs to this chauffeur
    const existingPrime = await db.prime.findFirst({
      where: {
        id: primeId,
        chauffeurId: id,
      },
    });

    if (!existingPrime) {
      return NextResponse.json(
        { success: false, error: 'Prime non trouvée' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (motif !== undefined) {
      if (!motif || motif.length < 3) {
        return NextResponse.json(
          { success: false, error: 'Le motif doit contenir au moins 3 caractères' },
          { status: 400 }
        );
      }
      updateData.motif = motif;
    }

    if (montant !== undefined) {
      if (!montant || montant <= 0) {
        return NextResponse.json(
          { success: false, error: 'Le montant doit être supérieur à 0' },
          { status: 400 }
        );
      }
      updateData.montant = montant;
    }

    if (date !== undefined) {
      // Parse date and ensure it's stored as UTC midnight
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number);
        updateData.date = new Date(Date.UTC(year, month - 1, day));
      } else {
        updateData.date = new Date(date);
      }
    }

    // Update prime
    const prime = await db.prime.update({
      where: { id: primeId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: prime,
      message: 'Prime modifiée avec succès',
    });
  } catch (error) {
    console.error('Error updating prime:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification de la prime' },
      { status: 500 }
    );
  }
}

// DELETE /api/chauffeurs/[id]/primes/[primeId] - Delete prime
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; primeId: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id, primeId } = await params;

    // Check if prime exists and belongs to this chauffeur
    const prime = await db.prime.findFirst({
      where: {
        id: primeId,
        chauffeurId: id,
      },
    });

    if (!prime) {
      return NextResponse.json(
        { success: false, error: 'Prime non trouvée' },
        { status: 404 }
      );
    }

    // Delete prime
    await db.prime.delete({
      where: { id: primeId },
    });

    return NextResponse.json({
      success: true,
      message: 'Prime supprimée avec succès',
    });
  } catch (error) {
    console.error('Error deleting prime:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la prime' },
      { status: 500 }
    );
  }
}

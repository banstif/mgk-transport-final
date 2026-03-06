import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiResponse, Avance } from '@/types';

// GET /api/chauffeurs/[id]/avances/[avanceId] - Get single avance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; avanceId: string }> }
): Promise<NextResponse<ApiResponse<Avance>>> {
  try {
    const { id, avanceId } = await params;

    const avance = await db.avance.findFirst({
      where: {
        id: avanceId,
        chauffeurId: id,
      },
    });

    if (!avance) {
      return NextResponse.json(
        { success: false, error: 'Avance non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: avance,
    });
  } catch (error) {
    console.error('Error fetching avance:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de l\'avance' },
      { status: 500 }
    );
  }
}

// PUT /api/chauffeurs/[id]/avances/[avanceId] - Update avance
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; avanceId: string }> }
): Promise<NextResponse<ApiResponse<Avance>>> {
  try {
    const { id, avanceId } = await params;
    const body = await request.json();

    const { montant, date, rembourse } = body;

    // Check if avance exists and belongs to this chauffeur
    const existingAvance = await db.avance.findFirst({
      where: {
        id: avanceId,
        chauffeurId: id,
      },
    });

    if (!existingAvance) {
      return NextResponse.json(
        { success: false, error: 'Avance non trouvée' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

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
      updateData.date = new Date(date);
    }

    if (rembourse !== undefined) {
      updateData.rembourse = rembourse;
    }

    // Update avance
    const avance = await db.avance.update({
      where: { id: avanceId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: avance,
      message: 'Avance modifiée avec succès',
    });
  } catch (error) {
    console.error('Error updating avance:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification de l\'avance' },
      { status: 500 }
    );
  }
}

// DELETE /api/chauffeurs/[id]/avances/[avanceId] - Delete avance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; avanceId: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id, avanceId } = await params;

    // Check if avance exists and belongs to this chauffeur
    const avance = await db.avance.findFirst({
      where: {
        id: avanceId,
        chauffeurId: id,
      },
    });

    if (!avance) {
      return NextResponse.json(
        { success: false, error: 'Avance non trouvée' },
        { status: 404 }
      );
    }

    // Delete avance
    await db.avance.delete({
      where: { id: avanceId },
    });

    return NextResponse.json({
      success: true,
      message: 'Avance supprimée avec succès',
    });
  } catch (error) {
    console.error('Error deleting avance:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de l\'avance' },
      { status: 500 }
    );
  }
}

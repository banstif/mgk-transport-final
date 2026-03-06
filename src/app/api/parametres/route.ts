// Parametres API Routes
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiResponse, Parametre } from '@/types';

// GET /api/parametres - Get all parametres
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Parametre[]>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cle = searchParams.get('cle');

    const where: Record<string, unknown> = {};
    
    if (cle) {
      where.cle = { contains: cle, mode: 'insensitive' };
    }

    const parametres = await db.parametre.findMany({
      where,
      orderBy: { cle: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: parametres,
    });
  } catch (error) {
    console.error('Error fetching parametres:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

// POST /api/parametres - Create new parametre
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Parametre>>> {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.cle || body.valeur === undefined) {
      return NextResponse.json(
        { success: false, error: 'Clé et valeur sont requises' },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existingParam = await db.parametre.findUnique({
      where: { cle: body.cle },
    });

    if (existingParam) {
      return NextResponse.json(
        { success: false, error: 'Un paramètre avec cette clé existe déjà' },
        { status: 400 }
      );
    }

    const parametre = await db.parametre.create({
      data: {
        cle: body.cle,
        valeur: String(body.valeur),
      },
    });

    return NextResponse.json({
      success: true,
      data: parametre,
      message: 'Paramètre créé avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating parametre:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du paramètre' },
      { status: 500 }
    );
  }
}

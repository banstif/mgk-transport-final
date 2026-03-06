import { NextRequest, NextResponse } from 'next/server';
import { checkAllAlerts } from '@/lib/alerts';
import type { ApiResponse } from '@/types';

// POST /api/alertes/check-documents - Check all alerts (documents, factures, entretiens)
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ documents: number; factures: number; entretiens: number; total: number }>>> {
  try {
    const results = await checkAllAlerts();

    return NextResponse.json({
      success: true,
      data: results,
      message: results.total > 0 
        ? `${results.total} alerte(s) mise(s) à jour (${results.documents} documents, ${results.factures} factures, ${results.entretiens} entretiens)`
        : 'Aucune nouvelle alerte',
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification des alertes' },
      { status: 500 }
    );
  }
}

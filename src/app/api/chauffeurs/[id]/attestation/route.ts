import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Mapping des clés de la base de données vers les clés du PDF
const dbKeyToPdfKey: Record<string, string> = {
  'ENTREPRISE_NOM': 'nomEntreprise',
  'ENTREPRISE_ADRESSE': 'adresse',
  'ENTREPRISE_TELEPHONE': 'telephone',
  'ENTREPRISE_EMAIL': 'email',
  'ENTREPRISE_ICE': 'ice',
  'ENTREPRISE_RC': 'rc',
  'ENTREPRISE_CNSS': 'cnss',
  'ENTREPRISE_VILLE': 'ville',
  'ENTREPRISE_LOGO': 'logo',
};

// GET /api/chauffeurs/[id]/attestation - Générer une attestation de travail PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[Attestation] Generating attestation for chauffeur:', id);

    // Récupérer les données du chauffeur
    const chauffeur = await db.chauffeur.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        cin: true,
        numeroCNSS: true,
        dateEmbauche: true,
        dateFinContrat: true,
        typeContrat: true,
        actif: true,
      },
    });

    if (!chauffeur) {
      return NextResponse.json(
        { success: false, error: 'Chauffeur non trouvé' },
        { status: 404 }
      );
    }

    console.log('[Attestation] Chauffeur found:', chauffeur.nom, chauffeur.prenom);

    // Récupérer les paramètres de l'entreprise
    const parametres = await db.parametre.findMany();
    console.log('[Attestation] Found', parametres.length, 'parameters');
    
    // Construire l'objet company à partir des paramètres
    const company: Record<string, string> = {};
    for (const param of parametres) {
      const pdfKey = dbKeyToPdfKey[param.cle];
      if (pdfKey) {
        company[pdfKey] = param.valeur;
      }
    }

    // Appeler le service PDF externe
    const response = await fetch('http://localhost:3005/attestation?XTransformPort=3005', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chauffeur, company }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Attestation] PDF service error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur du service PDF: ' + error },
        { status: 500 }
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log('[Attestation] PDF generated, size:', pdfBuffer.byteLength);

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Attestation_Travail_${chauffeur.nom}_${chauffeur.prenom}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[Attestation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération de l\'attestation de travail: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    );
  }
}

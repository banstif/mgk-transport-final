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

// GET /api/chauffeurs/[id]/salaires/[salaireId]/fiche - Generate salary slip PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; salaireId: string }> }
) {
  try {
    const { id: chauffeurId, salaireId } = await params;

    // Get salary with chauffeur info
    const salaire = await db.salaire.findFirst({
      where: {
        id: salaireId,
        chauffeurId,
      },
      include: {
        chauffeur: {
          select: {
            nom: true,
            prenom: true,
            cin: true,
            telephone: true,
            typeContrat: true,
            typeSalaire: true,
            montantSalaire: true,
            montantCNSS: true,
            montantAssurance: true,
            ribCompte: true,
          },
        },
      },
    });

    if (!salaire) {
      return NextResponse.json(
        { success: false, error: 'Salaire non trouvé' },
        { status: 404 }
      );
    }

    if (!salaire.paye) {
      return NextResponse.json(
        { success: false, error: 'Ce salaire n\'est pas encore payé' },
        { status: 400 }
      );
    }

    // Get company parameters
    const parametres = await db.parametre.findMany();

    // Build company object
    const company: Record<string, string> = {};
    for (const param of parametres) {
      const pdfKey = dbKeyToPdfKey[param.cle];
      if (pdfKey) {
        company[pdfKey] = param.valeur;
      }
    }

    // Call PDF service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Prepare data for PDF service
    const pdfData = {
      chauffeur: {
        nom: salaire.chauffeur.nom,
        prenom: salaire.chauffeur.prenom,
        cin: salaire.chauffeur.cin,
        telephone: salaire.chauffeur.telephone,
        typeContrat: salaire.chauffeur.typeContrat,
        typeSalaire: salaire.chauffeur.typeSalaire,
        montantSalaire: salaire.chauffeur.montantSalaire,
        ribCompte: salaire.chauffeur.ribCompte,
      },
      salaire: {
        id: salaire.id,
        mois: salaire.mois,
        annee: salaire.annee,
        montantBase: salaire.montantBase,
        montantPrimes: salaire.montantPrimes,
        montantAvances: salaire.montantAvances,
        montantNet: salaire.montantNet,
        datePaiement: salaire.datePaiement,
        heuresTravaillees: salaire.heuresTravaillees,
        joursTravailles: salaire.joursTravailles,
      },
      company,
    };

    let response: Response;
    try {
      response = await fetch('http://localhost:3005/bulletin-paie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[Fiche Salaire] Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Service PDF non disponible. Vérifiez que le service est démarré.' },
        { status: 503 }
      );
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Fiche Salaire] PDF service error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur du service PDF: ' + error },
        { status: 500 }
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log('[Fiche Salaire] PDF generated, size:', pdfBuffer.byteLength);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Bulletin_Paie_${salaire.chauffeur.nom}_${salaire.chauffeur.prenom}_${salaire.mois}_${salaire.annee}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[Fiche Salaire] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération de la fiche de salaire: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    );
  }
}

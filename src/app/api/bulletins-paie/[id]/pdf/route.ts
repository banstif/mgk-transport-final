import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Mapping from database keys to PDF params
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

// GET /api/bulletins-paie/[id]/pdf - Generate PDF for bulletin using JavaScript service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get bulletin with chauffeur data
    const bulletin = await db.bulletinPaie.findUnique({
      where: { id },
      include: {
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            cin: true,
            numeroCNSS: true,
            telephone: true,
            dateEmbauche: true,
            typeContrat: true,
            typeSalaire: true,
            montantSalaire: true,
            ribCompte: true,
          },
        },
      },
    });

    if (!bulletin) {
      return NextResponse.json(
        { success: false, error: 'Bulletin non trouvé' },
        { status: 404 }
      );
    }

    // Get company parameters from database
    const paramsFromDb = await db.parametre.findMany();
    const company: Record<string, string> = {};
    
    for (const param of paramsFromDb) {
      const pdfKey = dbKeyToPdfKey[param.cle];
      if (pdfKey) {
        company[pdfKey] = param.valeur;
      }
    }

    // Prepare data for PDF service
    const pdfData = {
      bulletin: {
        id: bulletin.id,
        mois: bulletin.mois,
        annee: bulletin.annee,
        salaireBase: bulletin.salaireBase,
        heuresSupplementaires: bulletin.heuresSupplementaires,
        primeTrajet: bulletin.primeTrajet,
        primeRendement: bulletin.primeRendement,
        indemniteDeplacement: bulletin.indemniteDeplacement,
        indemnitePanier: bulletin.indemnitePanier,
        autresPrimes: bulletin.autresPrimes,
        salaireBrut: bulletin.salaireBrut,
        cnss: bulletin.cnss,
        amo: bulletin.amo,
        ir: bulletin.ir,
        avanceSalaire: bulletin.avanceSalaire,
        autresRetenues: bulletin.autresRetenues,
        totalRetenues: bulletin.totalRetenues,
        salaireNet: bulletin.salaireNet,
        dateGeneration: bulletin.dateGeneration.toISOString(),
      },
      chauffeur: {
        nom: bulletin.chauffeur.nom,
        prenom: bulletin.chauffeur.prenom,
        cin: bulletin.chauffeur.cin,
        numeroCNSS: bulletin.chauffeur.numeroCNSS,
        telephone: bulletin.chauffeur.telephone,
        typeContrat: bulletin.chauffeur.typeContrat,
        typeSalaire: bulletin.chauffeur.typeSalaire,
        ribCompte: bulletin.chauffeur.ribCompte,
      },
      company,
    };

    // Call JavaScript PDF service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch('http://localhost:3005/bulletin-paie-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[Bulletin PDF] Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Service PDF non disponible. Vérifiez que le service est démarré.' },
        { status: 503 }
      );
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Bulletin PDF] PDF service error:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur du service PDF: ' + error },
        { status: 500 }
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log('[Bulletin PDF] PDF generated, size:', pdfBuffer.byteLength);

    // Month names
    const moisFr = [
      '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Bulletin_${moisFr[bulletin.mois]}_${bulletin.annee}_${bulletin.chauffeur.nom}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('[Bulletin PDF] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du PDF: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    );
  }
}

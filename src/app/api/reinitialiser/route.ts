import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';

interface ResetResult {
  table: string;
  deleted: number;
}

// POST /api/reinitialiser - Reset all application data
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ results: ResetResult[] }>>> {
  try {
    // Get confirmation from request body
    const body = await request.json();
    const { confirmation } = body;

    // Require specific confirmation string
    if (confirmation !== 'REINITIALISER_TOUTES_DONNEES') {
      return NextResponse.json(
        { success: false, error: 'Confirmation invalide' },
        { status: 400 }
      );
    }

    console.log('[REINITIALISER] Starting full data reset...');

    const results: ResetResult[] = [];

    // Delete in order of dependencies (children first, then parents)

    // 1. Delete alertes
    const alertes = await db.alerte.deleteMany({});
    results.push({ table: 'Alertes', deleted: alertes.count });
    console.log(`[REINITIALISER] Deleted ${alertes.count} alertes`);

    // 2. Delete paiements
    const paiements = await db.paiement.deleteMany({});
    results.push({ table: 'Paiements', deleted: paiements.count });
    console.log(`[REINITIALISER] Deleted ${paiements.count} paiements`);

    // 3. Delete factures
    const factures = await db.facture.deleteMany({});
    results.push({ table: 'Factures', deleted: factures.count });
    console.log(`[REINITIALISER] Deleted ${factures.count} factures`);

    // 4. Delete tournées
    const tournees = await db.tournee.deleteMany({});
    results.push({ table: 'Tournées', deleted: tournees.count });
    console.log(`[REINITIALISER] Deleted ${tournees.count} tournées`);

    // 5. Delete service-vehicule relations
    const serviceVehicules = await db.serviceVehicule.deleteMany({});
    results.push({ table: 'ServiceVehicules', deleted: serviceVehicules.count });
    console.log(`[REINITIALISER] Deleted ${serviceVehicules.count} serviceVehicules`);

    // 6. Delete services
    const services = await db.service.deleteMany({});
    results.push({ table: 'Services', deleted: services.count });
    console.log(`[REINITIALISER] Deleted ${services.count} services`);

    // 7. Delete clients
    const clients = await db.client.deleteMany({});
    results.push({ table: 'Clients', deleted: clients.count });
    console.log(`[REINITIALISER] Deleted ${clients.count} clients`);

    // 8. Delete pleins de carburant
    const pleinsCarburant = await db.pleinCarburant.deleteMany({});
    results.push({ table: 'PleinsCarburant', deleted: pleinsCarburant.count });
    console.log(`[REINITIALISER] Deleted ${pleinsCarburant.count} pleinsCarburant`);

    // 9. Delete entretiens
    const entretiens = await db.entretien.deleteMany({});
    results.push({ table: 'Entretiens', deleted: entretiens.count });
    console.log(`[REINITIALISER] Deleted ${entretiens.count} entretiens`);

    // 10. Delete vehicule documents
    const documentsVehicule = await db.documentVehicule.deleteMany({});
    results.push({ table: 'DocumentsVehicule', deleted: documentsVehicule.count });
    console.log(`[REINITIALISER] Deleted ${documentsVehicule.count} documentsVehicule`);

    // 11. Delete vehicules
    const vehicules = await db.vehicule.deleteMany({});
    results.push({ table: 'Véhicules', deleted: vehicules.count });
    console.log(`[REINITIALISER] Deleted ${vehicules.count} vehicules`);

    // 12. Delete salaires
    const salaires = await db.salaire.deleteMany({});
    results.push({ table: 'Salaires', deleted: salaires.count });
    console.log(`[REINITIALISER] Deleted ${salaires.count} salaires`);

    // 12b. Delete bulletins de paie
    const bulletinsPaie = await db.bulletinPaie.deleteMany({});
    results.push({ table: 'BulletinsPaie', deleted: bulletinsPaie.count });
    console.log(`[REINITIALISER] Deleted ${bulletinsPaie.count} bulletinsPaie`);

    // 13. Delete primes
    const primes = await db.prime.deleteMany({});
    results.push({ table: 'Primes', deleted: primes.count });
    console.log(`[REINITIALISER] Deleted ${primes.count} primes`);

    // 14. Delete avances
    const avances = await db.avance.deleteMany({});
    results.push({ table: 'Avances', deleted: avances.count });
    console.log(`[REINITIALISER] Deleted ${avances.count} avances`);

    // 15. Delete chauffeur documents
    const documentsChauffeur = await db.documentChauffeur.deleteMany({});
    results.push({ table: 'DocumentsChauffeur', deleted: documentsChauffeur.count });
    console.log(`[REINITIALISER] Deleted ${documentsChauffeur.count} documentsChauffeur`);

    // 16. Delete chauffeurs
    const chauffeurs = await db.chauffeur.deleteMany({});
    results.push({ table: 'Chauffeurs', deleted: chauffeurs.count });
    console.log(`[REINITIALISER] Deleted ${chauffeurs.count} chauffeurs`);

    // 17. Delete logs
    const logs = await db.log.deleteMany({});
    results.push({ table: 'Logs', deleted: logs.count });
    console.log(`[REINITIALISER] Deleted ${logs.count} logs`);

    // 18. Delete utilisateurs
    const utilisateurs = await db.utilisateur.deleteMany({});
    results.push({ table: 'Utilisateurs', deleted: utilisateurs.count });
    console.log(`[REINITIALISER] Deleted ${utilisateurs.count} utilisateurs`);

    // 19. Delete types documents personnalisés
    const typesDocuments = await db.typeDocumentPersonnalise.deleteMany({});
    results.push({ table: 'TypesDocuments', deleted: typesDocuments.count });
    console.log(`[REINITIALISER] Deleted ${typesDocuments.count} typesDocuments`);

    // 20. Delete types entretien personnalisés
    const typesEntretien = await db.typeEntretienPersonnalise.deleteMany({});
    results.push({ table: 'TypesEntretien', deleted: typesEntretien.count });
    console.log(`[REINITIALISER] Deleted ${typesEntretien.count} typesEntretien`);

    // 21. Keep parametres (company info, notification settings)
    // Don't delete parametres - user might want to keep company info

    console.log('[REINITIALISER] Reset complete!');

    return NextResponse.json({
      success: true,
      data: { results },
      message: 'Application réinitialisée avec succès',
    });
  } catch (error) {
    console.error('[REINITIALISER] Error during reset:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la réinitialisation' },
      { status: 500 }
    );
  }
}

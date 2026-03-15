import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Generate a CUID-like ID
function generateId(): string {
  return nanoid(25)
}

// POST /api/achats-vehicules/[id]/paiements - Ajouter un paiement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Get achat info
    const achats = await db.$queryRaw<Array<{
      id: string
      vehiculeId: string
      fournisseur: string | null
      montantTotal: number
      montantPaye: number
      nombreEcheances: number | null
    }>>`
      SELECT id, vehiculeId, fournisseur, montantTotal, montantPaye, nombreEcheances FROM AchatVehicule WHERE id = ${id}
    `

    if (!achats || achats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Achat non trouvé' },
        { status: 404 }
      )
    }

    const achat = achats[0]

    const {
      datePaiement,
      montant,
      modePaiement,
      reference,
      observations,
      echeanceId // Optionnel: ID de l'échéance payée
    } = body

    const montantValue = parseFloat(montant)
    const datePaiementObj = new Date(datePaiement)
    const now = new Date()
    const paiementId = generateId()

    // Créer le paiement
    await db.$executeRaw`
      INSERT INTO PaiementAchat (id, achatVehiculeId, datePaiement, montant, modePaiement, reference, observations, createdAt)
      VALUES (${paiementId}, ${id}, ${datePaiementObj}, ${montantValue}, ${modePaiement}, ${reference || null}, ${observations || null}, ${now})
    `

    // Mettre à jour les montants de l'achat
    const nouveauMontantPaye = achat.montantPaye + montantValue
    const nouveauMontantRestant = Math.max(0, achat.montantTotal - nouveauMontantPaye)

    // Déterminer le nouveau statut
    let nouveauStatut = 'EN_COURS'
    if (nouveauMontantRestant <= 0) {
      nouveauStatut = 'SOLDE'
    }

    await db.$executeRaw`
      UPDATE AchatVehicule 
      SET 
        montantPaye = ${nouveauMontantPaye},
        montantRestant = ${nouveauMontantRestant},
        dateDernierPaiement = ${datePaiementObj},
        statut = ${nouveauStatut},
        updatedAt = ${now}
      WHERE id = ${id}
    `

    // Si une échéance est spécifiée, la marquer comme payée
    if (echeanceId) {
      await db.$executeRaw`
        UPDATE EcheanceCredit 
        SET 
          montantPaye = ${montantValue},
          datePaiement = ${datePaiementObj},
          statut = 'PAYEE',
          updatedAt = ${now}
        WHERE id = ${echeanceId}
      `
    } else {
      // Sinon, marquer automatiquement les échéances comme payées
      const echeances = await db.$queryRaw<Array<{
        id: string
        numeroEcheance: number
        montantEcheance: number
        montantPaye: number
        statut: string
      }>>`
        SELECT id, numeroEcheance, montantEcheance, montantPaye, statut 
        FROM EcheanceCredit 
        WHERE achatVehiculeId = ${id}
        ORDER BY numeroEcheance ASC
      `

      let montantRestantPaiement = montantValue
      for (const echeance of echeances) {
        if (montantRestantPaiement <= 0) break
        if (echeance.statut === 'PAYEE') continue

        const montantAPayer = Math.min(echeance.montantEcheance - echeance.montantPaye, montantRestantPaiement)
        
        const nouveauMontantPayeEcheance = echeance.montantPaye + montantAPayer
        const nouveauStatutEcheance = nouveauMontantPayeEcheance >= echeance.montantEcheance ? 'PAYEE' : 'PARTIELLEMENT'

        await db.$executeRaw`
          UPDATE EcheanceCredit 
          SET 
            montantPaye = ${nouveauMontantPayeEcheance},
            datePaiement = ${datePaiementObj},
            statut = ${nouveauStatutEcheance},
            updatedAt = ${now}
          WHERE id = ${echeance.id}
        `

        montantRestantPaiement -= montantAPayer
      }
    }

    // Vérifier et mettre à jour les échéances en retard
    const today = new Date()
    await db.$executeRaw`
      UPDATE EcheanceCredit 
      SET statut = 'EN_RETARD', updatedAt = ${now}
      WHERE achatVehiculeId = ${id}
        AND dateEcheance < ${today}
        AND statut IN ('EN_ATTENTE', 'PARTIELLEMENT')
    `

    // Récupérer le numéro de l'échéance pour la description
    let numeroEcheance = null
    if (echeanceId) {
      const echeanceData = await db.$queryRaw<Array<{ numeroEcheance: number }>>`
        SELECT numeroEcheance FROM EcheanceCredit WHERE id = ${echeanceId}
      `
      if (echeanceData && echeanceData.length > 0) {
        numeroEcheance = echeanceData[0].numeroEcheance
      }
    }

    // Créer une charge automatique pour le paiement d'échéance
    const chargeId = generateId()
    const description = numeroEcheance 
      ? `Achat véhicule (Échéance ${numeroEcheance}) - ${achat.fournisseur || 'Crédit'}`
      : `Achat véhicule (Paiement) - ${achat.fournisseur || 'Crédit'}`
    await db.$executeRaw`
      INSERT INTO Charge (id, type, categorie, description, montant, dateCharge, vehiculeId, automatique, sourceType, sourceId, createdAt, updatedAt)
      VALUES (${chargeId}, 'VEHICULE', 'ACHAT_VEHICULE', ${description}, ${montantValue}, ${datePaiementObj}, ${achat.vehiculeId}, 1, 'ECHEANCE_CREDIT', ${paiementId}, ${now}, ${now})
    `

    return NextResponse.json({
      success: true,
      data: { id: paiementId, datePaiement: datePaiementObj, montant: montantValue, modePaiement },
      message: 'Paiement enregistré avec succès'
    })
  } catch (error) {
    console.error('Erreur enregistrement paiement:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'enregistrement du paiement: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

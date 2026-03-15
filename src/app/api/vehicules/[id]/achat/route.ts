import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Achat Vehicule API - Using raw queries to avoid client cache issues

// Generate a CUID-like ID
function generateId(): string {
  return nanoid(25)
}

// GET /api/vehicules/[id]/achat - Récupérer les informations d'achat d'un véhicule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Use raw query to avoid client cache issues
    const achat = await db.$queryRaw<Array<any>>`
      SELECT * FROM AchatVehicule WHERE vehiculeId = ${id}
    `

    if (!achat || achat.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Aucun achat enregistré pour ce véhicule'
      })
    }

    const achatData = achat[0]

    // Get echeances
    const echeances = await db.$queryRaw<Array<any>>`
      SELECT id, numeroEcheance, dateEcheance, montantEcheance, montantPaye, datePaiement, statut, observations
      FROM EcheanceCredit 
      WHERE achatVehiculeId = ${achatData.id}
      ORDER BY numeroEcheance ASC
    `

    // Get paiements
    const paiements = await db.$queryRaw<Array<any>>`
      SELECT id, datePaiement, montant, modePaiement, reference, observations
      FROM PaiementAchat 
      WHERE achatVehiculeId = ${achatData.id}
      ORDER BY datePaiement DESC
    `

    // Calculate stats
    const echeancesPayees = echeances.filter((e: any) => e.statut === 'PAYEE').length
    const echeancesEnRetard = echeances.filter((e: any) => e.statut === 'EN_RETARD').length
    const prochaineEcheance = echeances.find((e: any) => e.statut === 'EN_ATTENTE' || e.statut === 'EN_RETARD')

    const achatWithStats = {
      ...achatData,
      echeances,
      paiementsAchat: paiements,
      stats: {
        echeancesPayees,
        echeancesEnRetard,
        totalEcheances: achatData.nombreEcheances || 0,
        prochaineEcheance,
        pourcentagePaye: achatData.montantTotal > 0 ? (achatData.montantPaye / achatData.montantTotal) * 100 : 0
      }
    }

    return NextResponse.json({ success: true, data: achatWithStats })
  } catch (error) {
    console.error('Erreur récupération achat:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des informations d\'achat' },
      { status: 500 }
    )
  }
}

// POST /api/vehicules/[id]/achat - Créer un nouvel achat pour un véhicule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Vérifier que le véhicule existe
    const vehicules = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Vehicule WHERE id = ${id}
    `

    if (!vehicules || vehicules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier qu'il n'y a pas déjà un achat pour ce véhicule
    const existingAchat = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM AchatVehicule WHERE vehiculeId = ${id}
    `

    if (existingAchat && existingAchat.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Un achat existe déjà pour ce véhicule' },
        { status: 400 }
      )
    }

    const {
      typeAchat,
      dateAchat,
      montantTotal,
      acompte,
      fournisseur,
      adresseFournisseur,
      telephoneFournisseur,
      numeroFacture,
      observations,
      nombreEcheances,
      montantEcheance,
      datePremiereEcheance,
      frequencePaiement
    } = body

    // Calculer les montants
    const acompteValue = parseFloat(acompte) || 0
    const montantTotalValue = parseFloat(montantTotal)
    const montantRestant = typeAchat === 'CREDIT' 
      ? montantTotalValue - acompteValue 
      : 0

    const achatId = generateId()
    const now = new Date()
    const dateAchatObj = new Date(dateAchat)

    // Créer l'achat avec une requête brute
    await db.$executeRaw`
      INSERT INTO AchatVehicule (
        id, vehiculeId, typeAchat, dateAchat, montantTotal, acompte,
        fournisseur, adresseFournisseur, telephoneFournisseur, numeroFacture,
        observations, nombreEcheances, montantEcheance, datePremiereEcheance,
        frequencePaiement, statut, montantPaye, montantRestant, dateDernierPaiement,
        createdAt, updatedAt
      ) VALUES (
        ${achatId}, ${id}, ${typeAchat}, ${dateAchatObj}, ${montantTotalValue}, ${acompteValue},
        ${fournisseur || null}, ${adresseFournisseur || null}, ${telephoneFournisseur || null}, ${numeroFacture || null},
        ${observations || null}, ${typeAchat === 'CREDIT' ? parseInt(nombreEcheances) : null}, 
        ${typeAchat === 'CREDIT' ? parseFloat(montantEcheance) : null},
        ${typeAchat === 'CREDIT' && datePremiereEcheance ? new Date(datePremiereEcheance) : null},
        ${typeAchat === 'CREDIT' ? frequencePaiement : null},
        ${typeAchat === 'COMPTANT' ? 'SOLDE' : 'EN_COURS'},
        ${typeAchat === 'COMPTANT' ? montantTotalValue : acompteValue},
        ${montantRestant},
        ${typeAchat === 'COMPTANT' ? dateAchatObj : (acompteValue > 0 ? dateAchatObj : null)},
        ${now}, ${now}
      )
    `

    // Si c'est un achat comptant, créer un paiement et une charge automatique
    if (typeAchat === 'COMPTANT') {
      const paiementId = generateId()
      await db.$executeRaw`
        INSERT INTO PaiementAchat (id, achatVehiculeId, datePaiement, montant, modePaiement, reference, observations, createdAt)
        VALUES (${paiementId}, ${achatId}, ${dateAchatObj}, ${montantTotalValue}, 'ESPECES', null, 'Paiement comptant intégral', ${now})
      `

      // Créer une charge automatique pour l'achat comptant
      const chargeId = generateId()
      const descriptionAchat = `Achat véhicule - ${fournisseur || 'Comptant'}`
      await db.$executeRaw`
        INSERT INTO Charge (id, type, categorie, description, montant, dateCharge, vehiculeId, automatique, sourceType, sourceId, createdAt, updatedAt)
        VALUES (${chargeId}, 'VEHICULE', 'ACHAT_VEHICULE', ${descriptionAchat}, ${montantTotalValue}, ${dateAchatObj}, ${id}, 1, 'ACHAT_VEHICULE', ${paiementId}, ${now}, ${now})
      `
    } else if (typeAchat === 'CREDIT') {
      // Créer les échéances automatiquement
      const nbEcheances = parseInt(nombreEcheances)
      const montantParEcheance = parseFloat(montantEcheance)
      const premiereDate = new Date(datePremiereEcheance)

      for (let i = 0; i < nbEcheances; i++) {
        const dateEcheance = new Date(premiereDate)
        
        // Ajouter les mois selon la fréquence
        switch (frequencePaiement) {
          case 'MENSUEL':
            dateEcheance.setMonth(dateEcheance.getMonth() + i)
            break
          case 'TRIMESTRIEL':
            dateEcheance.setMonth(dateEcheance.getMonth() + (i * 3))
            break
          case 'SEMESTRIEL':
            dateEcheance.setMonth(dateEcheance.getMonth() + (i * 6))
            break
          case 'ANNUEL':
            dateEcheance.setFullYear(dateEcheance.getFullYear() + i)
            break
        }

        const echeanceId = generateId()
        await db.$executeRaw`
          INSERT INTO EcheanceCredit (id, achatVehiculeId, numeroEcheance, dateEcheance, montantEcheance, montantPaye, datePaiement, statut, observations, createdAt, updatedAt)
          VALUES (${echeanceId}, ${achatId}, ${i + 1}, ${dateEcheance}, ${montantParEcheance}, 0, null, 'EN_ATTENTE', null, ${now}, ${now})
        `
      }

      // Si acompte > 0, créer un paiement pour l'acompte et une charge automatique
      if (acompteValue > 0) {
        const paiementId = generateId()
        await db.$executeRaw`
          INSERT INTO PaiementAchat (id, achatVehiculeId, datePaiement, montant, modePaiement, reference, observations, createdAt)
          VALUES (${paiementId}, ${achatId}, ${dateAchatObj}, ${acompteValue}, 'ESPECES', null, 'Acompte initial', ${now})
        `

        // Créer une charge automatique pour l'acompte
        const chargeId = generateId()
        const descriptionAcompte = `Achat véhicule (Acompte) - ${fournisseur || 'Crédit'}`
        await db.$executeRaw`
          INSERT INTO Charge (id, type, categorie, description, montant, dateCharge, vehiculeId, automatique, sourceType, sourceId, createdAt, updatedAt)
          VALUES (${chargeId}, 'VEHICULE', 'ACHAT_VEHICULE', ${descriptionAcompte}, ${acompteValue}, ${dateAchatObj}, ${id}, 1, 'ACHAT_VEHICULE', ${paiementId}, ${now}, ${now})
        `
      }
    }

    // Récupérer l'achat créé
    const newAchat = await db.$queryRaw<Array<any>>`
      SELECT * FROM AchatVehicule WHERE id = ${achatId}
    `

    const echeances = await db.$queryRaw<Array<any>>`
      SELECT * FROM EcheanceCredit WHERE achatVehiculeId = ${achatId} ORDER BY numeroEcheance ASC
    `

    const paiements = await db.$queryRaw<Array<any>>`
      SELECT * FROM PaiementAchat WHERE achatVehiculeId = ${achatId} ORDER BY datePaiement DESC
    `

    return NextResponse.json({
      success: true,
      data: {
        ...newAchat[0],
        echeances,
        paiementsAchat: paiements
      },
      message: 'Achat enregistré avec succès'
    })
  } catch (error) {
    console.error('Erreur création achat:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'enregistrement de l\'achat: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// PUT /api/vehicules/[id]/achat - Mettre à jour un achat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const achats = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM AchatVehicule WHERE vehiculeId = ${id}
    `

    if (!achats || achats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Achat non trouvé' },
        { status: 404 }
      )
    }

    const achatId = achats[0].id
    const {
      fournisseur,
      adresseFournisseur,
      telephoneFournisseur,
      numeroFacture,
      observations,
      statut
    } = body

    const now = new Date()
    await db.$executeRaw`
      UPDATE AchatVehicule 
      SET 
        fournisseur = ${fournisseur || null},
        adresseFournisseur = ${adresseFournisseur || null},
        telephoneFournisseur = ${telephoneFournisseur || null},
        numeroFacture = ${numeroFacture || null},
        observations = ${observations || null},
        statut = ${statut},
        updatedAt = ${now}
      WHERE id = ${achatId}
    `

    const updatedAchat = await db.$queryRaw<Array<any>>`
      SELECT * FROM AchatVehicule WHERE id = ${achatId}
    `

    return NextResponse.json({
      success: true,
      data: updatedAchat[0],
      message: 'Achat mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur mise à jour achat:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de l\'achat' },
      { status: 500 }
    )
  }
}

// DELETE /api/vehicules/[id]/achat - Supprimer un achat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const achats = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM AchatVehicule WHERE vehiculeId = ${id}
    `

    if (!achats || achats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Achat non trouvé' },
        { status: 404 }
      )
    }

    const achatId = achats[0].id

    // Supprimer d'abord les échéances et paiements
    await db.$executeRaw`DELETE FROM EcheanceCredit WHERE achatVehiculeId = ${achatId}`
    await db.$executeRaw`DELETE FROM PaiementAchat WHERE achatVehiculeId = ${achatId}`

    // Supprimer l'achat
    await db.$executeRaw`DELETE FROM AchatVehicule WHERE id = ${achatId}`

    return NextResponse.json({
      success: true,
      message: 'Achat supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur suppression achat:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de l\'achat' },
      { status: 500 }
    )
  }
}

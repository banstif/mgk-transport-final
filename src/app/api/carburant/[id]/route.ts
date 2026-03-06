import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/carburant/[id] - Récupérer un plein par son ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const plein = await db.pleinCarburant.findUnique({
      where: { id },
      include: {
        vehicule: {
          select: {
            id: true,
            immatriculation: true,
            kilometrage: true,
          },
        },
      },
    })

    if (!plein) {
      return NextResponse.json(
        { success: false, error: 'Plein non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: plein })
  } catch (error) {
    console.error('Erreur récupération plein:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du plein' },
      { status: 500 }
    )
  }
}

// PUT /api/carburant/[id] - Modifier un plein
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      quantite,
      prixTotal,
      station,
      kilometrage,
      date,
    } = body

    // Vérifier que le plein existe
    const existingPlein = await db.pleinCarburant.findUnique({
      where: { id },
      include: { vehicule: true },
    })

    if (!existingPlein) {
      return NextResponse.json(
        { success: false, error: 'Plein non trouvé' },
        { status: 404 }
      )
    }

    // Validation
    if (!quantite || !prixTotal || !date) {
      return NextResponse.json(
        { success: false, error: 'Quantité, prix total et date sont obligatoires' },
        { status: 400 }
      )
    }

    // Calculer le prix unitaire
    const prixUnitaire = parseFloat(prixTotal) / parseFloat(quantite)
    const km = kilometrage ? parseInt(kilometrage) : 0

    // Mettre à jour le plein
    const plein = await db.pleinCarburant.update({
      where: { id },
      data: {
        quantite: parseFloat(quantite),
        prixUnitaire,
        prixTotal: parseFloat(prixTotal),
        station: station || null,
        kilometrage: km,
        date: new Date(date),
      },
    })

    // Mettre à jour le kilométrage du véhicule si le nouveau km est supérieur
    if (km > 0 && km > existingPlein.vehicule.kilometrage) {
      await db.vehicule.update({
        where: { id: existingPlein.vehiculeId },
        data: { kilometrage: km },
      })
    }

    return NextResponse.json({ success: true, data: plein })
  } catch (error) {
    console.error('Erreur modification plein:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification du plein' },
      { status: 500 }
    )
  }
}

// DELETE /api/carburant/[id] - Supprimer un plein
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que le plein existe
    const plein = await db.pleinCarburant.findUnique({
      where: { id },
    })

    if (!plein) {
      return NextResponse.json(
        { success: false, error: 'Plein non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le plein
    await db.pleinCarburant.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Plein supprimé avec succès',
    })
  } catch (error) {
    console.error('Erreur suppression plein:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du plein' },
      { status: 500 }
    )
  }
}

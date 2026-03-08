import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/charges/[id] - Récupérer une charge par son ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const charge = await db.charge.findUnique({
      where: { id },
      include: {
        vehicule: {
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
          }
        }
      }
    })

    if (!charge) {
      return NextResponse.json(
        { success: false, error: 'Charge non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: charge })
  } catch (error) {
    console.error('Erreur récupération charge:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la charge' },
      { status: 500 }
    )
  }
}

// PUT /api/charges/[id] - Modifier une charge
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    
    const type = formData.get('type') as string
    const categorie = formData.get('categorie') as string
    const description = formData.get('description') as string
    const montant = parseFloat(formData.get('montant') as string)
    const dateCharge = formData.get('dateCharge') as string
    const dateEcheance = formData.get('dateEcheance') as string | null
    const vehiculeId = formData.get('vehiculeId') as string | null
    const fournisseur = formData.get('fournisseur') as string | null
    const numeroFacture = formData.get('numeroFacture') as string | null
    const notes = formData.get('notes') as string | null
    const recurrente = formData.get('recurrente') === 'true'
    const frequenceRecurrence = formData.get('frequenceRecurrence') as string | null
    const statut = formData.get('statut') as string
    const modePaiement = formData.get('modePaiement') as string | null
    const referencePaiement = formData.get('referencePaiement') as string | null
    const datePaiement = formData.get('datePaiement') as string | null
    const fichierName = formData.get('fichierName') as string | null

    // Validation
    if (!type || !categorie || !description || !montant || !dateCharge) {
      return NextResponse.json(
        { success: false, error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Calculate next due date for recurring charges
    let prochaineEcheance: Date | null = null
    if (recurrente && frequenceRecurrence && dateCharge) {
      const baseDate = new Date(dateCharge)
      switch (frequenceRecurrence) {
        case 'MENSUEL':
          prochaineEcheance = new Date(baseDate.setMonth(baseDate.getMonth() + 1))
          break
        case 'TRIMESTRIEL':
          prochaineEcheance = new Date(baseDate.setMonth(baseDate.getMonth() + 3))
          break
        case 'SEMESTRIEL':
          prochaineEcheance = new Date(baseDate.setMonth(baseDate.getMonth() + 6))
          break
        case 'ANNUEL':
          prochaineEcheance = new Date(baseDate.setFullYear(baseDate.getFullYear() + 1))
          break
      }
    }

    const charge = await db.charge.update({
      where: { id },
      data: {
        type: type as any,
        categorie: categorie as any,
        description,
        montant,
        dateCharge: new Date(dateCharge),
        dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
        vehiculeId: vehiculeId || null,
        fournisseur,
        numeroFacture,
        notes,
        recurrente,
        frequenceRecurrence: recurrente ? frequenceRecurrence as any : null,
        prochaineEcheance,
        statut: statut as any,
        modePaiement: modePaiement as any,
        referencePaiement,
        datePaiement: datePaiement ? new Date(datePaiement) : null,
        fichier: fichierName ? `/uploads/charges/${fichierName}` : undefined,
      }
    })

    return NextResponse.json({
      success: true,
      data: charge,
      message: 'Charge modifiée avec succès'
    })
  } catch (error) {
    console.error('Erreur modification charge:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification de la charge' },
      { status: 500 }
    )
  }
}

// DELETE /api/charges/[id] - Supprimer une charge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const charge = await db.charge.findUnique({
      where: { id }
    })

    if (!charge) {
      return NextResponse.json(
        { success: false, error: 'Charge non trouvée' },
        { status: 404 }
      )
    }

    await db.charge.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Charge supprimée avec succès'
    })
  } catch (error) {
    console.error('Erreur suppression charge:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la charge' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/charges - Récupérer les charges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const type = searchParams.get('type')
    const statut = searchParams.get('statut')
    const categorie = searchParams.get('categorie')
    const vehiculeId = searchParams.get('vehiculeId')
    const search = searchParams.get('search')

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}
    
    if (type) where.type = type
    if (statut) where.statut = statut
    if (categorie) where.categorie = categorie
    if (vehiculeId) where.vehiculeId = vehiculeId

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { fournisseur: { contains: search, mode: 'insensitive' } },
        { numeroFacture: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await db.charge.count({ where })
    
    // Get charges with pagination
    const charges = await db.charge.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { dateCharge: 'desc' },
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

    return NextResponse.json({
      success: true,
      data: charges,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Erreur récupération charges:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des charges' },
      { status: 500 }
    )
  }
}

// POST /api/charges - Créer une nouvelle charge
export async function POST(request: NextRequest) {
  try {
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
    const statut = formData.get('statut') as string || 'EN_ATTENTE'
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

    // Create charge
    const charge = await db.charge.create({
      data: {
        type,
        categorie,
        description,
        montant,
        dateCharge: new Date(dateCharge),
        dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
        vehiculeId: vehiculeId || null,
        fournisseur,
        numeroFacture,
        notes,
        recurrente,
        frequenceRecurrence: recurrente ? frequenceRecurrence : null,
        prochaineEcheance,
        statut: statut as any,
        modePaiement: modePaiement as any,
        referencePaiement,
        datePaiement: datePaiement ? new Date(datePaiement) : null,
        fichier: fichierName ? `/uploads/charges/${fichierName}` : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: charge,
      message: 'Charge créée avec succès'
    })
  } catch (error) {
    console.error('Erreur création charge:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la charge' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/vehicules - Liste tous les véhicules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const actif = searchParams.get('actif')

    const where: any = {}

    if (search) {
      where.OR = [
        { immatriculation: { contains: search } },
        { marque: { contains: search } },
        { modele: { contains: search } },
      ]
    }

    if (actif !== null && actif !== undefined) {
      where.actif = actif === 'true'
    }

    const [vehicules, total] = await Promise.all([
      db.vehicule.findMany({
        where,
        include: {
          chauffeur: {
            select: { id: true, nom: true, prenom: true, telephone: true, actif: true }
          },
          _count: {
            select: { entretiens: true, pleinsCarburant: true, documents: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.vehicule.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: vehicules,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Erreur récupération véhicules:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des véhicules' },
      { status: 500 }
    )
  }
}

// POST /api/vehicules - Créer un nouveau véhicule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      immatriculation,
      marque,
      modele,
      annee,
      capacite,
      kilometrage,
      chauffeurId,
    } = body

    // Validation
    if (!immatriculation || !marque || !modele || !annee || !capacite) {
      return NextResponse.json(
        { success: false, error: 'Immatriculation, marque, modèle, année et capacité sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier si l'immatriculation existe déjà
    const existing = await db.vehicule.findUnique({
      where: { immatriculation: immatriculation.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Un véhicule avec cette immatriculation existe déjà' },
        { status: 400 }
      )
    }

    // Créer le véhicule
    const vehicule = await db.vehicule.create({
      data: {
        immatriculation: immatriculation.toUpperCase(),
        marque,
        modele,
        annee: parseInt(annee),
        capacite: parseInt(capacite),
        kilometrage: kilometrage ? parseInt(kilometrage) : 0,
        chauffeurId: chauffeurId || null,
      },
      include: {
        chauffeur: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: vehicule }, { status: 201 })
  } catch (error) {
    console.error('Erreur création véhicule:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du véhicule' },
      { status: 500 }
    )
  }
}

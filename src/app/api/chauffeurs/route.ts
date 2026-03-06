// Chauffeurs API Routes - Updated with CNSS, Assurance, RIB fields
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TypeContrat, TypeSalaire } from '@prisma/client';
import type { ApiResponse, PaginatedResponse, Chauffeur, ChauffeurFormData } from '@/types';

// GET /api/chauffeurs - List all chauffeurs with pagination and filtering
export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<Chauffeur> | ApiResponse<never>>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const skip = (page - 1) * pageSize;
    
    // Filter params
    const search = searchParams.get('search') || '';
    const actifParam = searchParams.get('actif');
    const typeContrat = searchParams.get('typeContrat') as TypeContrat | null;
    const typeSalaire = searchParams.get('typeSalaire') as TypeSalaire | null;
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { nom: { contains: search } },
        { prenom: { contains: search } },
        { cin: { contains: search } },
        { telephone: { contains: search } },
      ];
    }
    
    if (actifParam !== null) {
      where.actif = actifParam === 'true';
    }
    
    if (typeContrat && Object.values(TypeContrat).includes(typeContrat)) {
      where.typeContrat = typeContrat;
    }
    
    if (typeSalaire && Object.values(TypeSalaire).includes(typeSalaire)) {
      where.typeSalaire = typeSalaire;
    }
    
    // Get total count
    const total = await db.chauffeur.count({ where });
    
    // Get chauffeurs with pagination
    const chauffeurs = await db.chauffeur.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { actif: 'desc' },
        { nom: 'asc' },
        { prenom: 'asc' },
      ],
      include: {
        vehicules: {
          where: { actif: true },
          select: {
            id: true,
            immatriculation: true,
            marque: true,
            modele: true,
          },
        },
        _count: {
          select: {
            salaires: true,
            primes: true,
            avances: { where: { rembourse: false } },
            documents: true,
          },
        },
      },
    });
    
    const totalPages = Math.ceil(total / pageSize);
    
    return NextResponse.json({
      data: chauffeurs,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching chauffeurs:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des chauffeurs' },
      { status: 500 }
    );
  }
}

// POST /api/chauffeurs - Create new chauffeur
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Chauffeur>>> {
  try {
    const body: ChauffeurFormData & { 
      permisNumero?: string; 
      permisDateExpiration?: string;
    } = await request.json();
    
    // Validate required fields
    const { nom, prenom, cin, telephone, dateEmbauche, typeContrat, typeSalaire, montantSalaire } = body;
    
    if (!nom || !prenom || !cin || !telephone || !dateEmbauche || !typeContrat || !typeSalaire || montantSalaire === undefined) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }
    
    // Validate permis de conduire (obligatoire)
    if (!body.permisNumero || !body.permisDateExpiration) {
      return NextResponse.json(
        { success: false, error: 'Le permis de conduire est obligatoire (numéro et date d\'expiration)' },
        { status: 400 }
      );
    }
    
    // Check if CIN already exists
    const existingChauffeur = await db.chauffeur.findUnique({
      where: { cin },
    });
    
    if (existingChauffeur) {
      return NextResponse.json(
        { success: false, error: 'Un chauffeur avec ce CIN existe déjà' },
        { status: 400 }
      );
    }
    
    // Validate enum values
    if (!Object.values(TypeContrat).includes(typeContrat)) {
      return NextResponse.json(
        { success: false, error: 'Type de contrat invalide' },
        { status: 400 }
      );
    }
    
    if (!Object.values(TypeSalaire).includes(typeSalaire)) {
      return NextResponse.json(
        { success: false, error: 'Type de salaire invalide' },
        { status: 400 }
      );
    }
    
    // Create chauffeur with permis de conduire in a transaction
    const chauffeur = await db.chauffeur.create({
      data: {
        nom,
        prenom,
        cin,
        telephone,
        adresse: body.adresse || null,
        dateEmbauche: new Date(dateEmbauche),
        typeContrat,
        typeSalaire,
        montantSalaire,
        montantCNSS: body.montantCNSS || 0,
        montantAssurance: body.montantAssurance || 0,
        ribCompte: body.ribCompte || null,
        actif: body.actif ?? true,
        // Create permis de conduire document automatically
        documents: {
          create: {
            type: 'PERMIS_CONDUIRE',
            numero: body.permisNumero,
            dateExpiration: new Date(body.permisDateExpiration),
          },
        },
      },
      include: {
        vehicules: true,
        documents: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: chauffeur,
      message: 'Chauffeur créé avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chauffeur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du chauffeur' },
      { status: 500 }
    );
  }
}

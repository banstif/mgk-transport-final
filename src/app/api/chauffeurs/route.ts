// Chauffeurs API Routes - Updated with CNSS, Assurance, RIB fields
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TypeContrat, TypeSalaire } from '@prisma/client';
import type { ApiResponse, PaginatedResponse, Chauffeur, ChauffeurFormData } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createDocumentAlert } from '@/lib/alerts';

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
    
    // Get current month and year
    const now = new Date();
    const currentMois = now.getMonth() + 1;
    const currentAnnee = now.getFullYear();

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
        // Include salary for current month
        salaires: {
          where: {
            mois: currentMois,
            annee: currentAnnee,
          },
          select: {
            id: true,
            mois: true,
            annee: true,
            montantBase: true,
            montantPrimes: true,
            montantAvances: true,
            montantNet: true,
            paye: true,
            datePaiement: true,
          },
        },
      },
    });

    // Transform data to include current month salary info
    const chauffeursWithSalaire = chauffeurs.map((chauffeur) => {
      const salaireActuel = chauffeur.salaires?.[0] || null;
      // Remove the salaires array from the response to keep it clean
      const { salaires: _, ...chauffeurData } = chauffeur;
      return {
        ...chauffeurData,
        salaireActuel,
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: chauffeursWithSalaire,
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
    // Check if request is FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');
    
    let body: ChauffeurFormData & { 
      permisNumero?: string; 
      permisDateExpiration?: string;
    };
    let permisFile: File | null = null;
    
    if (isFormData) {
      // Handle FormData
      const formData = await request.formData();
      
      body = {
        nom: formData.get('nom') as string,
        prenom: formData.get('prenom') as string,
        cin: formData.get('cin') as string,
        telephone: formData.get('telephone') as string,
        adresse: formData.get('adresse') as string || undefined,
        dateEmbauche: formData.get('dateEmbauche') as string,
        typeContrat: formData.get('typeContrat') as TypeContrat,
        typeSalaire: formData.get('typeSalaire') as TypeSalaire,
        montantSalaire: parseFloat(formData.get('montantSalaire') as string),
        montantCNSS: parseFloat(formData.get('montantCNSS') as string) || 0,
        montantAssurance: parseFloat(formData.get('montantAssurance') as string) || 0,
        ribCompte: formData.get('ribCompte') as string || undefined,
        actif: formData.get('actif') === 'true',
        permisNumero: formData.get('permisNumero') as string || undefined,
        permisDateExpiration: formData.get('permisDateExpiration') as string || undefined,
      };
      
      const file = formData.get('permisFile');
      if (file && file instanceof File && file.size > 0) {
        permisFile = file;
      }
    } else {
      // Handle JSON
      body = await request.json();
    }
    
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
    
    // Handle file upload for permis de conduire
    if (permisFile) {
      // Validate file size (5MB max)
      if (permisFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Le fichier ne doit pas dépasser 5MB' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(permisFile.type)) {
        return NextResponse.json(
          { success: false, error: 'Type de fichier non autorisé (PDF, JPG, PNG uniquement)' },
          { status: 400 }
        );
      }

      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents', chauffeur.id);
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const fileExtension = permisFile.name.split('.').pop() || 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const fullPath = path.join(uploadDir, fileName);

      // Write file
      const bytes = await permisFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(fullPath, buffer);

      // Store public path in the document
      const filePath = `/uploads/documents/${chauffeur.id}/${fileName}`;
      
      // Update the permis document with the file path
      const permisDoc = chauffeur.documents.find(d => d.type === 'PERMIS_CONDUIRE');
      if (permisDoc) {
        await db.documentChauffeur.update({
          where: { id: permisDoc.id },
          data: { fichier: filePath },
        });
      }
    }
    
    // Create alert for permis document
    try {
      const permisDoc = chauffeur.documents.find(d => d.type === 'PERMIS_CONDUIRE');
      if (permisDoc) {
        await createDocumentAlert(
          permisDoc.id,
          chauffeur.id,
          'PERMIS_CONDUIRE',
          new Date(body.permisDateExpiration!),
          chauffeur.nom,
          chauffeur.prenom
        );
      }
    } catch (alertError) {
      console.error('Error creating document alert:', alertError);
      // Don't fail the chauffeur creation if alert creation fails
    }
    
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

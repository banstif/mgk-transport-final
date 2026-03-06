// Services API Routes
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiResponse, PaginatedResponse, Service } from '@/types';

// GET /api/services - List all services with pagination and filtering
export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<Service> | ApiResponse<never>>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const skip = (page - 1) * pageSize;
    
    // Filter params
    const search = searchParams.get('search') || '';
    const actifParam = searchParams.get('actif');
    const clientId = searchParams.get('clientId');
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { ligne: { contains: search } },
        { trajet: { contains: search } },
        { client: { nomEntreprise: { contains: search } } },
      ];
    }
    
    if (actifParam !== null) {
      where.actif = actifParam === 'true';
    }
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    // Get total count
    const total = await db.service.count({ where });
    
    // Get services with pagination
    const services = await db.service.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { actif: 'desc' },
        { ligne: 'asc' },
      ],
      include: {
        client: {
          select: {
            id: true,
            nomEntreprise: true,
            telephone: true,
          },
        },
        vehicules: {
          include: {
            vehicule: {
              select: {
                id: true,
                immatriculation: true,
                marque: true,
                modele: true,
              },
            },
          },
        },
        _count: {
          select: {
            tournées: true,
          },
        },
      },
    });
    
    const totalPages = Math.ceil(total / pageSize);
    
    return NextResponse.json({
      data: services,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    );
  }
}

// POST /api/services - Create new service
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Service>>> {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { clientId, ligne, trajet, nombreSalaries, tarif } = body;
    
    if (!clientId || !ligne || !trajet || !nombreSalaries || !tarif) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }
    
    // Check if client exists
    const client = await db.client.findUnique({
      where: { id: clientId },
    });
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client non trouvé' },
        { status: 404 }
      );
    }
    
    // Create service
    const service = await db.service.create({
      data: {
        clientId,
        ligne,
        trajet,
        nombreSalaries,
        tarif,
        actif: body.actif ?? true,
        // Assign vehicles if provided
        vehicules: body.vehiculeIds ? {
          create: body.vehiculeIds.map((vid: string) => ({
            vehiculeId: vid,
          })),
        } : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            nomEntreprise: true,
            telephone: true,
          },
        },
        vehicules: {
          include: {
            vehicule: {
              select: {
                id: true,
                immatriculation: true,
                marque: true,
                modele: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: service,
      message: 'Service créé avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du service' },
      { status: 500 }
    );
  }
}

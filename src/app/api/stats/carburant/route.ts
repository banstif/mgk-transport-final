import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats/carburant - Statistiques carburant par véhicule
export async function GET(request: NextRequest) {
  try {
    // Récupérer tous les véhicules avec leurs pleins
    const vehicules = await db.vehicule.findMany({
      where: { actif: true },
      include: {
        pleinsCarburant: {
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { immatriculation: 'asc' },
    })

    // Calculer les stats par véhicule
    const statsParVehicule = vehicules.map(vehicule => {
      const pleins = vehicule.pleinsCarburant
      
      // Total litres et coût
      const totalLitres = pleins.reduce((sum, p) => sum + p.quantite, 0)
      const totalCout = pleins.reduce((sum, p) => sum + p.prixTotal, 0)
      
      // Calcul consommation moyenne (L/100km)
      let consommationMoyenne = 0
      let kmParcourus = 0
      let coutParKm = 0
      
      if (pleins.length >= 2) {
        // Prendre le premier et dernier km
        const sortedPleins = [...pleins].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        
        const premierPlein = sortedPleins[0]
        const dernierPlein = sortedPleins[sortedPleins.length - 1]
        
        kmParcourus = dernierPlein.kilometrage - premierPlein.kilometrage
        
        if (kmParcourus > 0) {
          // Litres consommés = tous les pleins sauf le premier
          const litresConsommes = sortedPleins.slice(1).reduce((sum, p) => sum + p.quantite, 0)
          consommationMoyenne = (litresConsommes / kmParcourus) * 100
          coutParKm = totalCout / kmParcourus
        }
      }
      
      return {
        id: vehicule.id,
        immatriculation: vehicule.immatriculation,
        marque: vehicule.marque,
        modele: vehicule.modele,
        kilometrage: vehicule.kilometrage,
        nbPleins: pleins.length,
        totalLitres: Math.round(totalLitres * 100) / 100,
        totalCout: Math.round(totalCout * 100) / 100,
        consommationMoyenne: consommationMoyenne > 0 ? Math.round(consommationMoyenne * 10) / 10 : null,
        coutParKm: coutParKm > 0 ? Math.round(coutParKm * 100) / 100 : null,
        kmParcourus,
      }
    })

    // Calculer les totaux globaux
    const statsGlobales = {
      nbVehicules: vehicules.length,
      totalLitres: statsParVehicule.reduce((sum, v) => sum + v.totalLitres, 0),
      totalCout: statsParVehicule.reduce((sum, v) => sum + v.totalCout, 0),
      moyennePrixL: 0,
    }
    
    // Prix moyen au litre
    const tousPleins = vehicules.flatMap(v => v.pleinsCarburant)
    if (tousPleins.length > 0) {
      const totalPrix = tousPleins.reduce((sum, p) => sum + p.prixTotal, 0)
      const totalLitres = tousPleins.reduce((sum, p) => sum + p.quantite, 0)
      statsGlobales.moyennePrixL = Math.round((totalPrix / totalLitres) * 100) / 100
    }

    return NextResponse.json({
      success: true,
      data: {
        globales: statsGlobales,
        vehicules: statsParVehicule,
      },
    })
  } catch (error) {
    console.error('Erreur stats carburant:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du calcul des statistiques' },
      { status: 500 }
    )
  }
}

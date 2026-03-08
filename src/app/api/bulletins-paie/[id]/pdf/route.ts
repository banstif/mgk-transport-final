import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { spawn } from 'child_process';
import { readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Month names in French
const moisFr = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Default company parameters
const defaultCompanyParams = {
  nomEntreprise: 'MGK TRANSPORT',
  adresse: '',
  ville: '',
  telephone: '',
  email: '',
  ice: '',
  rc: '',
  cnss: '',
  logo: '',
};

// Mapping from database keys to PDF params
const dbKeyToPdfKey: Record<string, string> = {
  'ENTREPRISE_NOM': 'nomEntreprise',
  'ENTREPRISE_ADRESSE': 'adresse',
  'ENTREPRISE_TELEPHONE': 'telephone',
  'ENTREPRISE_EMAIL': 'email',
  'ENTREPRISE_ICE': 'ice',
  'ENTREPRISE_RC': 'rc',
  'ENTREPRISE_CNSS': 'cnss',
  'ENTREPRISE_VILLE': 'ville',
  'ENTREPRISE_LOGO': 'logo',
};

// Helper to run Python script with spawn
function runPythonScript(scriptPath: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });
    
    python.on('error', (err) => {
      reject(err);
    });
    
    // Set timeout
    setTimeout(() => {
      python.kill();
      reject(new Error('Python script timeout'));
    }, 30000);
  });
}

// GET /api/bulletins-paie/[id]/pdf - Generate PDF for bulletin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tempFiles: string[] = [];
  
  try {
    const { id } = await params;

    // Get bulletin with chauffeur data
    const bulletin = await db.bulletinPaie.findUnique({
      where: { id },
      include: {
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            cin: true,
            numeroCNSS: true,
            telephone: true,
            dateEmbauche: true,
            typeContrat: true,
            montantSalaire: true,
          },
        },
      },
    });

    if (!bulletin) {
      return NextResponse.json(
        { success: false, error: 'Bulletin non trouvé' },
        { status: 404 }
      );
    }

    // Get company parameters from database
    const paramsFromDb = await db.parametre.findMany();
    const companyParams: Record<string, string> = { ...defaultCompanyParams };
    
    for (const param of paramsFromDb) {
      const pdfKey = dbKeyToPdfKey[param.cle];
      if (pdfKey) {
        companyParams[pdfKey] = param.valeur;
      }
    }

    if (!companyParams.nomEntreprise) {
      companyParams.nomEntreprise = 'MGK TRANSPORT';
    }

    // Prepare data for Python script
    const bulletinData = {
      id: bulletin.id,
      mois: bulletin.mois,
      annee: bulletin.annee,
      salaireBase: bulletin.salaireBase,
      heuresSupplementaires: bulletin.heuresSupplementaires,
      primeTrajet: bulletin.primeTrajet,
      primeRendement: bulletin.primeRendement,
      indemniteDeplacement: bulletin.indemniteDeplacement,
      indemnitePanier: bulletin.indemnitePanier,
      autresPrimes: bulletin.autresPrimes,
      salaireBrut: bulletin.salaireBrut,
      cnss: bulletin.cnss,
      amo: bulletin.amo,
      ir: bulletin.ir,
      avanceSalaire: bulletin.avanceSalaire,
      autresRetenues: bulletin.autresRetenues,
      totalRetenues: bulletin.totalRetenues,
      salaireNet: bulletin.salaireNet,
      dateGeneration: bulletin.dateGeneration.toISOString(),
    };

    const chauffeurData = {
      id: bulletin.chauffeur.id,
      nom: bulletin.chauffeur.nom,
      prenom: bulletin.chauffeur.prenom,
      cin: bulletin.chauffeur.cin,
      numeroCNSS: bulletin.chauffeur.numeroCNSS,
      telephone: bulletin.chauffeur.telephone,
      dateEmbauche: bulletin.chauffeur.dateEmbauche?.toISOString().split('T')[0] || null,
      typeContrat: bulletin.chauffeur.typeContrat,
    };

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `bulletin_${bulletin.id}_${timestamp}.pdf`;
    const outputPath = path.join('/tmp', filename);
    
    // Write data to temp files
    const bulletinJsonPath = path.join('/tmp', `bulletin_${timestamp}.json`);
    const chauffeurJsonPath = path.join('/tmp', `chauffeur_${timestamp}.json`);
    const companyJsonPath = path.join('/tmp', `company_${timestamp}.json`);
    
    tempFiles.push(bulletinJsonPath, chauffeurJsonPath, companyJsonPath, outputPath);
    
    await writeFile(bulletinJsonPath, JSON.stringify(bulletinData));
    await writeFile(chauffeurJsonPath, JSON.stringify(chauffeurData));
    await writeFile(companyJsonPath, JSON.stringify(companyParams));

    // Logo path
    let logoPath = companyParams.logo || '';
    if (logoPath && logoPath.startsWith('data:')) {
      const logoTempPath = path.join('/tmp', `logo_${timestamp}.png`);
      const base64Data = logoPath.split(',')[1];
      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        await writeFile(logoTempPath, buffer);
        logoPath = logoTempPath;
        tempFiles.push(logoPath);
      }
    } else if (!logoPath || !logoPath.startsWith('/')) {
      logoPath = path.join(process.cwd(), 'upload', 'logo MGK.png');
    }

    // Execute Python script with spawn
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_bulletin_paie.py');
    const args = [bulletinJsonPath, chauffeurJsonPath, companyJsonPath, outputPath, logoPath];
    
    await runPythonScript(scriptPath, args);

    // Read the generated PDF
    const pdfBuffer = await readFile(outputPath);

    // Clean up temp files
    await Promise.all(tempFiles.map(f => unlink(f).catch(() => {})));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Bulletin_${moisFr[bulletin.mois]}_${bulletin.annee}_${bulletin.chauffeur.nom}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Clean up temp files
    await Promise.all(tempFiles.map(f => unlink(f).catch(() => {})));
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du PDF: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    );
  }
}

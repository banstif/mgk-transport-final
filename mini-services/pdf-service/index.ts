import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const execFileAsync = promisify(execFile);

const PORT = 3005;

// Mapping des clés de la base de données vers les clés du PDF
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

async function generateAttestation(chauffeur: any, company: any): Promise<Buffer> {
  const timestamp = Date.now();
  const tempDir = tmpdir();
  
  const chauffeurFile = join(tempDir, `chauffeur_${timestamp}.json`);
  const companyFile = join(tempDir, `company_${timestamp}.json`);
  const outputFile = join(tempDir, `attestation_${timestamp}.pdf`);

  try {
    // Write temp files
    await writeFile(chauffeurFile, JSON.stringify(chauffeur), 'utf-8');
    await writeFile(companyFile, JSON.stringify(company), 'utf-8');

    // Logo path
    let logoPath = '';
    if (company.logo) {
      if (company.logo.startsWith('/')) {
        logoPath = join(process.cwd(), '..', '..', 'public', company.logo);
      } else if (!company.logo.startsWith('http')) {
        logoPath = join(process.cwd(), '..', '..', 'public', 'uploads', company.logo);
      }
    }

    // Python script path
    const scriptPath = join(process.cwd(), '..', '..', 'scripts', 'generate_attestation_travail.py');

    // Arguments - script path first, then data files
    const args = [scriptPath, chauffeurFile, companyFile, outputFile];
    if (logoPath && existsSync(logoPath)) {
      args.push(logoPath);
    }

    // Execute Python
    const { stdout, stderr } = await execFileAsync('python3', args, {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    if (stdout) console.log('[PDF Service] Python stdout:', stdout);
    if (stderr) console.log('[PDF Service] Python stderr:', stderr);

    // Read PDF
    const pdfBuffer = await readFile(outputFile);

    // Cleanup
    await Promise.all([
      unlink(chauffeurFile).catch(() => {}),
      unlink(companyFile).catch(() => {}),
      unlink(outputFile).catch(() => {}),
    ]);

    return pdfBuffer;
  } catch (error) {
    // Cleanup on error
    await Promise.all([
      unlink(chauffeurFile).catch(() => {}),
      unlink(companyFile).catch(() => {}),
    ]);
    throw error;
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' }, { headers: corsHeaders });
    }

    // Attestation endpoint
    if (url.pathname === '/attestation' && req.method === 'POST') {
      try {
        const { chauffeur, company } = await req.json();
        
        console.log('[PDF Service] Generating attestation for:', chauffeur?.nom, chauffeur?.prenom);
        
        const pdfBuffer = await generateAttestation(chauffeur, company);
        
        console.log('[PDF Service] PDF generated, size:', pdfBuffer.length);
        
        return new Response(pdfBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Attestation_Travail_${chauffeur.nom}_${chauffeur.prenom}.pdf"`,
          },
        });
      } catch (error) {
        console.error('[PDF Service] Error:', error);
        return Response.json(
          { success: false, error: String(error) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return Response.json(
      { error: 'Not found' },
      { status: 404, headers: corsHeaders }
    );
  },
});

console.log(`[PDF Service] Running on port ${PORT}`);

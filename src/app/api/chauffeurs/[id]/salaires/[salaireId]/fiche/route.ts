import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/chauffeurs/[id]/salaires/[salaireId]/fiche - Generate salary slip PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; salaireId: string }> }
) {
  try {
    const { id: chauffeurId, salaireId } = await params;

    // Get salary with chauffeur info
    const salaire = await db.salaire.findFirst({
      where: {
        id: salaireId,
        chauffeurId,
      },
      include: {
        chauffeur: {
          select: {
            nom: true,
            prenom: true,
            cin: true,
            telephone: true,
            typeContrat: true,
            typeSalaire: true,
            montantSalaire: true,
            montantCNSS: true,
            montantAssurance: true,
            ribCompte: true,
          },
        },
      },
    });

    if (!salaire) {
      return NextResponse.json(
        { success: false, error: 'Salaire non trouvé' },
        { status: 404 }
      );
    }

    if (!salaire.paye) {
      return NextResponse.json(
        { success: false, error: 'Ce salaire n\'est pas encore payé' },
        { status: 400 }
      );
    }

    // Get company parameters
    const parametres = await db.parametre.findMany({
      where: {
        cle: {
          startsWith: 'ENTREPRISE_',
        },
      },
    });

    // Convert to object
    const entreprise: Record<string, string> = {};
    for (const param of parametres) {
      entreprise[param.cle] = param.valeur;
    }

    // Month names
    const MONTHS = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 2,
      }).format(amount);
    };

    // Format date
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    };

    // Number to words (simplified for French)
    const numberToWords = (num: number): string => {
      const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
      const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
      
      if (num === 0) return 'zéro';
      if (num < 20) return units[num];
      if (num < 100) {
        const t = Math.floor(num / 10);
        const u = num % 10;
        if (t === 7 || t === 9) {
          return tens[t] + (u === 1 ? '-et-' : '-') + units[10 + u];
        }
        return tens[t] + (u === 1 && t !== 8 ? '-et-' : (u ? '-' : '')) + units[u];
      }
      if (num < 1000) {
        const h = Math.floor(num / 100);
        const r = num % 100;
        return (h === 1 ? 'cent' : units[h] + ' cent') + (r ? ' ' + numberToWords(r) : '');
      }
      if (num < 1000000) {
        const th = Math.floor(num / 1000);
        const r = num % 1000;
        return (th === 1 ? 'mille' : numberToWords(th) + ' mille') + (r ? ' ' + numberToWords(r) : '');
      }
      return num.toString();
    };

    let montantEnLettres = numberToWords(Math.floor(salaire.montantNet)) + ' dirhams';
    const centimes = Math.round((salaire.montantNet % 1) * 100);
    if (centimes > 0) {
      const centimesEnLettres = numberToWords(centimes) + ' centimes';
      montantEnLettres = montantEnLettres + ' et ' + centimesEnLettres;
    }

    // Format RIB with spaces for readability
    const ribFormate = salaire.chauffeur.ribCompte 
      ? salaire.chauffeur.ribCompte.replace(/(.{4})/g, '$1 ').trim()
      : 'Non renseigné';

    // Generate HTML content for PDF
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de salaire - ${salaire.chauffeur.nom} ${salaire.chauffeur.prenom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      font-size: 12px; 
      line-height: 1.4;
      color: #1a1a1a;
      padding: 20mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 15px;
    }
    .company-info h1 {
      color: #0066cc;
      font-size: 22px;
      margin-bottom: 5px;
    }
    .company-info p {
      color: #666;
      font-size: 11px;
      margin: 2px 0;
    }
    .doc-title {
      text-align: right;
    }
    .doc-title h2 {
      color: #1a1a1a;
      font-size: 18px;
      font-weight: 600;
    }
    .doc-title .reference {
      color: #666;
      font-size: 11px;
      margin-top: 5px;
    }
    .period-badge {
      background: #0066cc;
      color: white;
      padding: 8px 15px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 10px;
      font-weight: 500;
    }
    .content {
      display: flex;
      gap: 30px;
      margin: 25px 0;
    }
    .section {
      flex: 1;
    }
    .section-title {
      background: #f5f5f5;
      padding: 8px 12px;
      font-weight: 600;
      color: #333;
      border-left: 3px solid #0066cc;
      margin-bottom: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dotted #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #666;
    }
    .info-value {
      font-weight: 500;
    }
    .table-container {
      margin: 25px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f8f9fa;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #0066cc;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .total-row {
      background: #f0f7ff;
      font-weight: 600;
    }
    .total-row td {
      border-bottom: none;
      padding: 12px 10px;
    }
    .amount-words {
      margin: 20px 0;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 4px;
      border-left: 3px solid #0066cc;
    }
    .amount-words span {
      color: #666;
    }
    .amount-words strong {
      color: #1a1a1a;
      text-transform: capitalize;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
    }
    .signature {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
      font-size: 10px;
      color: #666;
    }
    .status-badge {
      display: inline-block;
      background: #22c55e;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${entreprise['ENTREPRISE_NOM'] || 'MGK Transport'}</h1>
      <p>${entreprise['ENTREPRISE_ADRESSE'] || ''}</p>
      <p>Tél: ${entreprise['ENTREPRISE_TEL'] || ''} | Email: ${entreprise['ENTREPRISE_EMAIL'] || ''}</p>
      <p>ICE: ${entreprise['ENTREPRISE_ICE'] || ''} | RC: ${entreprise['ENTREPRISE_RC'] || ''}</p>
    </div>
    <div class="doc-title">
      <h2>FICHE DE SALAIRE</h2>
      <div class="reference">Réf: ${salaireId.slice(-8).toUpperCase()}</div>
      <div class="period-badge">${MONTHS[salaire.mois - 1]} ${salaire.annee}</div>
    </div>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-title">Informations du salarié</div>
      <div class="info-row">
        <span class="info-label">Nom complet</span>
        <span class="info-value">${salaire.chauffeur.nom} ${salaire.chauffeur.prenom}</span>
      </div>
      <div class="info-row">
        <span class="info-label">CIN</span>
        <span class="info-value">${salaire.chauffeur.cin}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Téléphone</span>
        <span class="info-value">${salaire.chauffeur.telephone}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type de contrat</span>
        <span class="info-value">${salaire.chauffeur.typeContrat}</span>
      </div>
      <div class="info-row">
        <span class="info-label">RIB bancaire</span>
        <span class="info-value" style="font-family: monospace; font-size: 11px;">${ribFormate}</span>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Détails du paiement</div>
      <div class="info-row">
        <span class="info-label">Date de paiement</span>
        <span class="info-value">${salaire.datePaiement ? formatDate(salaire.datePaiement) : '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type de salaire</span>
        <span class="info-value">${salaire.chauffeur.typeSalaire === 'FIXE' ? 'Fixe' : salaire.chauffeur.typeSalaire === 'HORAIRE' ? 'Horaire' : 'Par tournée'}</span>
      </div>
      ${salaire.heuresTravaillees ? `
      <div class="info-row">
        <span class="info-label">Heures travaillées</span>
        <span class="info-value">${salaire.heuresTravaillees} h</span>
      </div>
      ` : ''}
      ${salaire.joursTravailles ? `
      <div class="info-row">
        <span class="info-label">Jours travaillés</span>
        <span class="info-value">${salaire.joursTravailles} jours</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Statut</span>
        <span class="status-badge">PAYÉ</span>
      </div>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Salaire de base</td>
          <td>${formatCurrency(salaire.montantBase)}</td>
        </tr>
        <tr style="color: #16a34a;">
          <td>+ Primes</td>
          <td>${formatCurrency(salaire.montantPrimes)}</td>
        </tr>
        <tr style="color: #dc2626;">
          <td>- Avances sur salaire</td>
          <td>${formatCurrency(salaire.montantAvances)}</td>
        </tr>
        <tr class="total-row">
          <td><strong>NET À PAYER</strong></td>
          <td><strong style="color: #0066cc; font-size: 14px;">${formatCurrency(salaire.montantNet)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="amount-words">
    <span>Montant net en lettres:</span>
    <strong>${montantEnLettres}</strong>
  </div>

  <div class="footer">
    <div class="signature">
      <div class="signature-line">Signature de l'employeur</div>
    </div>
    <div class="signature">
      <div class="signature-line">Signature du salarié</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `;

    // Return HTML for printing
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating salary slip:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération de la fiche de salaire' },
      { status: 500 }
    );
  }
}

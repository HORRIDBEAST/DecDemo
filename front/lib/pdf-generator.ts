import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Claim } from './types';

export const generateClaimReport = (claim: Claim) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('DecentralizedClaim - Claim Report', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Claim ID: ${claim.id}`, 14, 35);
  doc.text(`Status: ${claim.status.toUpperCase()}`, 14, 40);

  // Claim Details Table
  autoTable(doc, {
    startY: 50,
    head: [['Field', 'Value']],
    body: [
      ['Claimant ID', claim.user_id],
      ['Type', claim.type],
      ['Incident Date', new Date(claim.incident_date).toLocaleDateString()],
      ['Requested Amount', `$${claim.requested_amount.toLocaleString()}`],
      ['Approved Amount', claim.approved_amount ? `$${claim.approved_amount.toLocaleString()}` : 'N/A'],
      ['Location', claim.location],
      ['Description', claim.description],
    ],
  });

  // AI Assessment Section (if exists)
  if (claim.ai_assessment) {
    doc.text('AI Assessment', 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Metric', 'Result']],
      body: [
        ['Confidence Score', `${claim.ai_assessment.confidenceScore}%`],
        ['Risk Score', `${claim.ai_assessment.riskScore}/100`],
        ['Fraud Detected', claim.ai_assessment.fraudDetected ? 'YES' : 'NO'],
        ['Recommended Payout', `$${claim.ai_assessment.recommendedAmount.toLocaleString()}`],
      ],
    });
  }

  // Blockchain Proof
  if (claim.approval_tx_hash) {
    doc.text('Blockchain Verification', 14, (doc as any).lastAutoTable.finalY + 10);
    doc.setFontSize(8);
    doc.text(`Approval Transaction Hash: ${claim.approval_tx_hash}`, 14, (doc as any).lastAutoTable.finalY + 15);
  }

  // Save
  doc.save(`Claim_Report_${claim.id.substring(0, 8)}.pdf`);
};
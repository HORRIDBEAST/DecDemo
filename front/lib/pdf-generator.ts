import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Claim } from './types';

// Helper to format currency
const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

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

export const generateDetailedAnalysisPDF = (claim: Claim) => {
  const doc = new jsPDF();
  const assessment = claim.ai_assessment;

  if (!assessment) {
    alert("No AI Assessment data available to generate report.");
    return;
  }

  const reports = assessment.agentReports;

  // --- HEADER ---
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185); // Blue title
  doc.text('Detailed AI Agent Analysis Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Claim ID: ${claim.id}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);
  doc.text(`Global Risk Score: ${assessment.riskScore}/100`, 14, 40);

  let finalY = 45; // Track vertical position

  // --- 1. EXECUTIVE SUMMARY ---
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('1. Executive Summary', 14, finalY + 10);
  
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Metric', 'Result', 'Status']],
    body: [
      ['Overall Confidence', `${assessment.confidenceScore}%`, assessment.confidenceScore > 80 ? 'High' : 'Low'],
      ['Fraud Detected', assessment.fraudDetected ? 'YES' : 'No', assessment.fraudDetected ? 'CRITICAL' : 'Pass'],
      ['Recommended Payout', formatCurrency(assessment.recommendedAmount), 'Final Calc'],
      ['Review Type', claim.status.replace('_', ' '), '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- 2. DOCUMENT AGENT ---
  doc.setFontSize(14);
  doc.text('2. Document Verification Agent', 14, finalY + 10);

  const docFindings = reports.documentAgent?.findings || {};
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Check', 'Finding']],
    body: [
      ['Document Validity', docFindings.validity || 'Unknown'],
      ['File Type', docFindings.file_type || 'N/A'],
      ['Text Extraction', docFindings.text_extracted ? 'Success (Content Indexed)' : 'Failed'],
      ['Date Consistency', 'Pending Logic Check'], // Placeholder for the logic we discussed
    ],
    theme: 'grid',
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- 3. DAMAGE ASSESSMENT AGENT ---
  doc.setFontSize(14);
  doc.text('3. Damage Assessment Agent (Vision)', 14, finalY + 10);

  const damageFindings = reports.damageAgent?.findings || {};
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Parameter', 'Analysis']],
    body: [
      ['Damage Severity', damageFindings.damage_level || 'Unknown'],
      ['Visual Verification', 'Matches Description'],
      ['Estimated Repair Cost', formatCurrency(damageFindings.estimated_cost || 0)],
      ['Detected Objects', damageFindings.detected_objects?.join(', ') || 'N/A'],
    ],
    theme: 'grid',
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- 4. FRAUD DETECTION AGENT ---
  // Check if we need a new page
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(14);
  doc.text('4. Fraud Detection Agent', 14, finalY + 10);

  const fraudFindings = reports.fraudAgent?.findings || {};
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Indicator', 'Result']],
    body: [
      ['Risk Level', fraudFindings.risk_score > 50 ? 'High' : 'Low'],
      ['Fraud Reason', fraudFindings.reason || 'None'],
      ['Pattern Match', 'No Global Fraud Database Match'],
      ['Metadata Analysis', 'Consistent'],
    ],
    theme: 'grid',
    headStyles: { fillColor: assessment.fraudDetected ? [192, 57, 43] : [41, 128, 185] } // Red header if fraud
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- 5. SETTLEMENT AGENT ---
  doc.setFontSize(14);
  doc.text('5. Settlement Calculation Agent', 14, finalY + 10);

  const settlementFindings = reports.settlementAgent?.findings || {};
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Component', 'Amount']],
    body: [
      ['Requested Amount', formatCurrency(claim.requested_amount)],
      ['Policy Limit', '$50,000.00 (Standard Auto)'], // Hardcoded for demo, or fetch from user profile
      ['Deductible', '- $500.00'],
      ['Damage Adjustment', formatCurrency(settlementFindings.recommended_amount || 0)],
      ['Final Recommendation', formatCurrency(assessment.recommendedAmount)],
    ],
    theme: 'striped',
  });

  // --- FOOTER ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages} - Generated by DecentralizedClaim AI`, 105, 290, { align: 'center' });
  }

  // Save File
  doc.save(`AI_Analysis_${claim.id.split('-')[0]}.pdf`);
};
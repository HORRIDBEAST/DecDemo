'use client';

import { Claim, AIAssessment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Search, DollarSign, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function AgentFindingsReport({ assessment }: { assessment: AIAssessment }) {
  if (!assessment) return null;

  const { agentReports } = assessment;

  // Helpers to interpret findings
  const docValid = agentReports.documentAgent?.findings?.validity === 'valid';
  const fraudRisk = assessment.riskScore > 50;
  const fraudDetected = assessment.fraudDetected;
  const redFlags = agentReports?.fraudAgent?.findings?.red_flags || [];
  
  return (
    <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
                <Search className="mr-2 h-5 w-5" /> Detailed Agent Analysis
            </h2>
            <Badge variant={fraudRisk ? "destructive" : "secondary"}>
                Global Risk Score: {assessment.riskScore}/100
            </Badge>
        </div>
        
        {/* ✅ FRAUD REASON DISPLAY FOR ADMIN */}
        {fraudDetected && (
          <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center text-red-800 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 mr-2" /> Fraud Detection Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>Reason:</strong> {assessment.fraudReason || "AI detected inconsistencies in claim details"}
              </p>
              
              {redFlags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-2">Red Flags ({redFlags.length}):</p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 list-disc pl-4">
                    {redFlags.map((flag: string, i: number) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {agentReports?.fraudAgent?.findings?.tool_findings && (
                <div className="pt-2 border-t border-red-200 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">Tool Verification Results:</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{agentReports.fraudAgent.findings.tool_findings}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

    </div>
  );
}

// --- Sub-components for cleaner code ---

function ReportCard({ title, icon: Icon, children, status, confidence }: any) {
    const borderColor = status === 'pass' ? 'border-l-green-500' : 'border-l-red-500';
    
    return (
        <Card className={`border-l-4 ${borderColor}`}>
            <CardHeader className="py-3 pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium flex items-center">
                        <Icon className="h-4 w-4 mr-2 text-slate-500" /> {title}
                    </CardTitle>
                    <span className="text-xs text-slate-400">{confidence * 100}% Conf.</span>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {children}
            </CardContent>
        </Card>
    );
}

function FindingRow({ label, value, highlight }: any) {
    return (
        <div className="flex justify-between">
            <span className="text-slate-500">{label}:</span>
            <span className={`font-medium ${highlight ? 'text-red-600' : 'text-slate-900'}`}>{value}</span>
        </div>
    );
}
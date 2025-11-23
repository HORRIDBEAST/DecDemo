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
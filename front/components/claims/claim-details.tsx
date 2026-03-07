'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation'; // ✅ Add useRouter
import { Claim, ClaimStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimStatusBadge } from './claim-status-badge';
import { FileUpload } from './file-upload';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle, ExternalLink, FileText, ImageIcon, Download, FileBarChart } from 'lucide-react';
import { AIProcessingIndicator } from './ai-processing-indicator';
import { useAuth } from '@/context/auth-context';
import { ActionButtons } from '@/components/admin/action-buttons';
import { generateClaimReport, generateDetailedAnalysisPDF } from '@/lib/pdf-generator';
import { AiThinkingLogs } from './ai-thinking-logs';
import { AgentFindingsReport } from '@/components/admin/ai-findings-report';

interface ClaimDetailsProps {
  claim: Claim;
  onClaimUpdate: () => void; 
}

export function ClaimDetails({ claim, onClaimUpdate }: ClaimDetailsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const hasSubmittedRef = useRef(false);
  
  const { user } = useAuth();
  const router = useRouter(); // ✅ Initialize router
  
  const isAdmin = user?.role === 'admin';
  const isDraft = claim.status === ClaimStatus.DRAFT;
  const isProcessing = claim.status === ClaimStatus.PROCESSING;
  const isApproved = claim.status === ClaimStatus.APPROVED || claim.status === ClaimStatus.SETTLED;

  const handleSubmitForReview = async () => {
    if (hasSubmittedRef.current || isSubmitting) {
      console.log('⚠️ Submit already in progress, ignoring duplicate call');
      return;
    }
    
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setShowLogs(true);
    
    toast.loading('Submitting claim for AI review...');
    try {
      await api.submitClaimForProcessing(claim.id);
      toast.dismiss();
      toast.success('Claim submitted! The AI agents are now processing it.');
      onClaimUpdate(); 
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Submission failed: ${error.message}`);
      setShowLogs(false);
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiComplete = () => {
    setShowLogs(false);
    onClaimUpdate();
  };

  const hasDocuments = claim.document_urls && claim.document_urls.length > 0;
  const hasPhotos = claim.damage_photo_urls && claim.damage_photo_urls.length > 0;
  const isReadyToSubmit = hasDocuments && hasPhotos;
  const POLYGONSCAN_URL = `https://amoy.polygonscan.com/tx/`;
  const formatTxHash = (hash: string) => hash.startsWith('0x') ? hash : `0x${hash}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Main Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                  <CardTitle>Claim {claim.id.split('-')[0]}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Filed by: {(claim as any).users?.display_name || (claim as any).users?.email || 'Unknown'}
                  </p>
              </div>
              <ClaimStatusBadge status={claim.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Type" value={claim.type} />
                <InfoItem label="Incident Date" value={new Date(claim.incident_date).toLocaleDateString()} />
                <InfoItem label="Requested Amount" value={`$${claim.requested_amount.toLocaleString()}`} />
                {claim.approved_amount && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                        <InfoItem label="Approved Amount" value={`$${claim.approved_amount.toLocaleString()}`} />
                    </div>
                )}
            </div>
            <InfoItem label="Location" value={claim.location} />
            <InfoItem label="Description" value={claim.description} />
            
            {isApproved && (
                <Button variant="outline" className="w-full mt-4" onClick={() => generateClaimReport(claim)}>
                    <Download className="mr-2 h-4 w-4" /> Download Official Claim Report (PDF)
                </Button>
            )}
          </CardContent>
        </Card>

        {isAdmin && claim.ai_assessment && (
          <AgentFindingsReport assessment={claim.ai_assessment} />
        )}

        {isAdmin && claim.ai_assessment && (
            <div className="flex justify-start">
                <Button 
                    onClick={() => generateDetailedAnalysisPDF(claim)} 
                    variant="outline" 
                    className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                    <FileBarChart className="mr-2 h-4 w-4" /> 
                    Download Detailed Agent Analysis (PDF)
                </Button>
            </div>
        )}

        <Card>
          <CardHeader><CardTitle>Evidence & Documents</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2"/> Documents
              </h3>
              {hasDocuments ? (
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <ul className="list-disc list-inside space-y-1">
                      {claim.document_urls.map((url, i) => (
                        <li key={i} className="text-sm">
                          <a href={url} target="_blank" className="text-blue-600 hover:underline break-all">
                            {url.split('/').pop()?.substring(14) || 'View Document'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
              ) : <p className="text-sm text-slate-400 italic">No documents uploaded.</p>}
              
              {isDraft && (
                <div className="mt-4">
                    <FileUpload 
                      claimId={claim.id} 
                      type="documents" 
                      onUploadSuccess={onClaimUpdate} 
                      existingFiles={[]} 
                    />
                </div>
              )}
            </div>

            <hr />

            <div>
              <h3 className="font-medium mb-2 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2"/> Damage Photos
              </h3>
              {hasPhotos ? (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {claim.damage_photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" className="block">
                         <img src={url} alt="Damage" className="w-full h-20 object-cover rounded-md border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
              ) : <p className="text-sm text-slate-400 italic">No photos uploaded.</p>}

              {isDraft && (
                <div className="mt-4">
                    <FileUpload 
                      claimId={claim.id} 
                      type="photos" 
                      onUploadSuccess={onClaimUpdate} 
                      existingFiles={[]} 
                    />
                </div>
              )}
            </div>

          </CardContent>
        </Card>
        
        {(isProcessing || showLogs) && (
          <AIProcessingIndicator claimId={claim.id} />
        )}

        {(isProcessing || showLogs) && (
          <AiThinkingLogs claimId={claim.id} onComplete={handleAiComplete} />
        )}

        {claim.ai_assessment && (
          <Card>
            <CardHeader><CardTitle>AI Assessment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {claim.ai_assessment.fraudDetected && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Flagged for Review</h4>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {claim.ai_assessment.fraudReason || "AI detected inconsistencies in the claim details."}
                      </p>
                      
                      {/* Show detailed red flags if available */}
                      {claim.ai_assessment.agentReports?.fraudAgent?.findings?.red_flags && 
                       claim.ai_assessment.agentReports.fraudAgent.findings.red_flags.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                          <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-2">Specific Issues Detected:</p>
                          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 list-disc pl-4">
                            {claim.ai_assessment.agentReports.fraudAgent.findings.red_flags.slice(0, 3).map((flag: string, i: number) => (
                              <li key={i}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="AI Status" value={claim.status === ClaimStatus.AI_REVIEW ? "Pre-Approved" : "Review Needed"} />
                  <InfoItem label="Recommended" value={`$${claim.ai_assessment.recommendedAmount.toLocaleString()}`} />
                  <InfoItem label="Confidence" value={`${claim.ai_assessment.confidenceScore.toFixed(2)}%`} />
                  <InfoItem label="Fraud Score" value={`${claim.ai_assessment.riskScore.toFixed(0)}/100`} />
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Right Column - Actions */}
      <div className="space-y-6">
        
        {/* Admin Actions */}
        {isAdmin && (claim.status === ClaimStatus.AI_REVIEW || claim.status === ClaimStatus.HUMAN_REVIEW) && (
            <ActionButtons claim={claim} onUpdate={onClaimUpdate} />
        )}
        
        {/* ✅ NEW: Retry Logic for Rejected/Draft Claims */}
        {!isAdmin && (claim.status === ClaimStatus.REJECTED || claim.status === ClaimStatus.DRAFT) && (
            <Card>
                <CardHeader><CardTitle>Edit Claim</CardTitle></CardHeader>
                <CardContent>
                    <Button 
                        variant="outline" 
                        className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                        onClick={() => router.push(`/claims/${claim.id}/edit`)}
                    >
                        ✏️ Edit Claim Details
                    </Button>
                    {claim.status === ClaimStatus.REJECTED && (
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Editing will reset status to Draft so you can re-submit.
                        </p>
                    )}
                </CardContent>
            </Card>
        )}
        
        {/* Status Card for User */}
        {!isAdmin && (
             <Card>
             <CardHeader><CardTitle>Status</CardTitle></CardHeader>
             <CardContent>
                 {isDraft ? (
                 <>
                     {isReadyToSubmit ? (
                         <Button 
                             onClick={handleSubmitForReview} 
                             disabled={isSubmitting}
                             className="w-full"
                         >
                             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                             Submit for AI Review
                         </Button>
                     ) : (
                         <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-yellow-700">
                             Please upload both documents and photos to submit.
                         </div>
                     )}
                 </>
                 ) : (
                 <div className="text-center space-y-2">
                     <p className="text-sm text-slate-600">Current Status:</p>
                     <ClaimStatusBadge status={claim.status} />
                     {isApproved && <p className="text-xs text-green-600 font-medium mt-2">Action Completed</p>}
                 </div>
                 )}
             </CardContent>
             </Card>
        )}

        {/* Blockchain Card */}
        {claim.blockchain_tx_hash && (
          <Card>
            <CardHeader><CardTitle>Blockchain Record</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <a 
                href={`${POLYGONSCAN_URL}${formatTxHash(claim.blockchain_tx_hash)}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full text-xs">
                  AI Assessment <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </a>
              
              {claim.approval_tx_hash && (
                <a 
                    href={`${POLYGONSCAN_URL}${formatTxHash(claim.approval_tx_hash)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    <Button variant="outline" className="w-full text-xs text-green-600 border-green-200 bg-green-50">
                    Final Approval <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                </a>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
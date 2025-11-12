// components/claims/claim-details.tsx
'use client';

import { useState } from 'react';
import { Claim, ClaimStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimStatusBadge } from './claim-status-badge';
import { FileUpload } from './file-upload';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { AIProcessingIndicator } from './ai-processing-indicator';

interface ClaimDetailsProps {
  claim: Claim;
  onClaimUpdate: () => void; // This is the 'mutate' function from SWR
}

export function ClaimDetails({ claim, onClaimUpdate }: ClaimDetailsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    toast.loading('Submitting claim for AI review...');

    try {
      await api.submitClaimForProcessing(claim.id);
      toast.dismiss();
      toast.success('Claim submitted! The AI agents are now processing it.');
      onClaimUpdate(); // Re-fetch the claim
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDraft = claim.status === ClaimStatus.DRAFT;
  const isProcessing = claim.status === ClaimStatus.PROCESSING;
  const hasAiAssessment = claim.ai_assessment;
  
  const POLYGONSCAN_URL = `https://amoy.polygonscan.com/tx/`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Main Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Claim {claim.id.split('-')[0]}</CardTitle>
              <ClaimStatusBadge status={claim.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem label="Type" value={claim.type} />
            <InfoItem label="Requested Amount" value={`$${claim.requested_amount.toLocaleString()}`} />
            <InfoItem label="Incident Date" value={new Date(claim.incident_date).toLocaleDateString()} />
            <InfoItem label="Location" value={claim.location} />
            <InfoItem label="Description" value={claim.description} />
          </CardContent>
        </Card>

        {/* --- Conditional Components --- */}

        {isDraft && (
          <Card>
            <CardHeader><CardTitle>Step 2: Upload Files</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FileUpload
                claimId={claim.id}
                type="documents"
                onUploadSuccess={onClaimUpdate}
                existingFiles={claim.document_urls}
              />
              <FileUpload
                claimId={claim.id}
                type="photos"
                onUploadSuccess={onClaimUpdate}
                existingFiles={claim.damage_photo_urls}
              />
            </CardContent>
          </Card>
        )}
        
        {isProcessing && (
          <AIProcessingIndicator claimId={claim.id} />
        )}

        {hasAiAssessment && (
          <Card>
            <CardHeader><CardTitle>AI Assessment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {claim.ai_assessment?.fraudDetected && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium text-red-700">Flagged for Fraud: {claim.ai_assessment.fraudReason}</span>
                </div>
              )}
              <InfoItem label="Status" value={claim.status === ClaimStatus.AI_REVIEW ? "Pre-Approved by AI" : "Needs Human Review"} />
              <InfoItem label="Recommended Amount" value={`$${claim.ai_assessment?.recommendedAmount.toLocaleString()}`} />
              <InfoItem label="Confidence Score" value={`${claim.ai_assessment?.confidenceScore.toFixed(2)}%`} />
              <InfoItem label="Fraud Risk Score" value={`${claim.ai_assessment?.riskScore.toFixed(0)}/100`} />
            </CardContent>
          </Card>
        )}

      </div>

      {/* Right Column - Actions & Status */}
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent>
            {isDraft && (
              <Button 
                onClick={handleSubmitForReview} 
                disabled={isSubmitting || claim.document_urls.length === 0 || claim.damage_photo_urls.length === 0}
                className="w-full"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Submit for AI Review
              </Button>
            )}
            {!isDraft && (
              <p className="text-sm text-slate-600">Claim is in progress. No actions available.</p>
            )}
          </CardContent>
        </Card>

        {claim.blockchain_tx_hash && (
          <Card>
            <CardHeader><CardTitle>Blockchain Record</CardTitle></CardHeader>
            <CardContent>
              <a 
                href={`${POLYGONSCAN_URL}${claim.blockchain_tx_hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  View on PolygonScan <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              {claim.approval_tx_hash && (
                 <a 
                  href={`${POLYGONSCAN_URL}${claim.approval_tx_hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2"
                >
                  <Button variant="outline" className="w-full">
                    View Approval TX <ExternalLink className="ml-2 h-4 w-4" />
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
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
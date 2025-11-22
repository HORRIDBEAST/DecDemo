'use client';

import { useState } from 'react';
import { Claim, ClaimStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimStatusBadge } from './claim-status-badge';
import { FileUpload } from './file-upload';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle, ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { AIProcessingIndicator } from './ai-processing-indicator';
import { useAuth } from '@/context/auth-context';

// ✅ IMPORT THE ADMIN COMPONENT
import { ActionButtons } from '@/components/admin/action-buttons';

interface ClaimDetailsProps {
  claim: Claim;
  onClaimUpdate: () => void; 
}

export function ClaimDetails({ claim, onClaimUpdate }: ClaimDetailsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  // ✅ Check if user is admin
  const isAdmin = user?.role === 'admin';

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    toast.loading('Submitting claim for AI review...');

    try {
      await api.submitClaimForProcessing(claim.id);
      toast.dismiss();
      toast.success('Claim submitted! The AI agents are now processing it.');
      onClaimUpdate(); 
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

        {/* --- Upload Section (Only show for non-admins if draft, or if admin wants to see it) --- */}
        {/* Usually admins just want to see the links, not the uploaders. 
            For now, keeping logic simple: If Draft, show uploader. */}
        {isDraft && (
          <Card>
            <CardHeader><CardTitle>Step 2: Documents & Photos</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              
              {/* 1. DOCUMENTS SECTION */}
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2"/> Documents
                </h3>
                {hasDocuments ? (
                   <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                     <p className="text-sm text-green-600 flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 mr-1"/> Documents Uploaded
                     </p>
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
                ) : (
                  <FileUpload 
                    claimId={claim.id} 
                    type="documents" 
                    onUploadSuccess={onClaimUpdate} 
                    existingFiles={[]} 
                  />
                )}
              </div>

              <hr />

              {/* 2. PHOTOS SECTION */}
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2"/> Damage Photos
                </h3>
                {hasPhotos ? (
                   <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                     <p className="text-sm text-green-600 flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 mr-1"/> Photos Uploaded
                     </p>
                     <div className="grid grid-cols-3 gap-2 mt-2">
                       {claim.damage_photo_urls.map((url, i) => (
                         <a key={i} href={url} target="_blank" className="block">
                            <img src={url} alt="Damage" className="w-full h-20 object-cover rounded-md border" />
                         </a>
                       ))}
                     </div>
                   </div>
                ) : (
                  <FileUpload 
                    claimId={claim.id} 
                    type="photos" 
                    onUploadSuccess={onClaimUpdate} 
                    existingFiles={[]} 
                  />
                )}
              </div>

            </CardContent>
          </Card>
        )}
        
        {/* --- AI Progress --- */}
        {isProcessing && (
          <AIProcessingIndicator claimId={claim.id} />
        )}

        {/* --- AI Result --- */}
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

      {/* Right Column - Actions */}
      <div className="space-y-6">
        
        {/* ✅ LOGIC SWITCH: If Admin, show Admin Actions. If User, show Submit Actions. */}
        {isAdmin ? (
            <ActionButtons claim={claim} onUpdate={onClaimUpdate} />
        ) : (
            <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
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
                <p className="text-sm text-slate-600">Claim submitted. Status: {claim.status.replace('_', ' ')}</p>
                )}
            </CardContent>
            </Card>
        )}

        {claim.blockchain_tx_hash && (
          <Card>
            <CardHeader><CardTitle>Blockchain Record</CardTitle></CardHeader>
            <CardContent>
              <a 
                href={`${POLYGONSCAN_URL}${formatTxHash(claim.blockchain_tx_hash)}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  View on PolygonScan <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
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
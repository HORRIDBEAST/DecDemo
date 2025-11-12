// app/(dashboard)/admin/page.tsx
'use client';

// This is a placeholder. You would build this out with
// calls to admin-specific API endpoints.
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <Card>
        <CardHeader>
          <CardTitle>Claims for Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin dashboard content goes here.</p>
          <p>You would fetch all claims with status 'human_review' or 'ai_review'.</p>
        </CardContent>
      </Card>
    </div>
  );
}
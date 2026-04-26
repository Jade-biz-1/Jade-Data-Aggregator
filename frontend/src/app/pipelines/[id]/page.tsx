'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * /pipelines/[id] — redirect to the pipeline builder with the pipeline loaded.
 * This handles bookmarked links and search result navigation.
 */
export default function PipelineDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/pipeline-builder?id=${id}`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Opening pipeline…</p>
      </div>
    </div>
  );
}

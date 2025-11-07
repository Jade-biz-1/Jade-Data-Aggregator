'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Play, BookOpen, Rocket, CheckCircle2 } from 'lucide-react';

export default function ExampleDataPage() {
  const isProduction = process.env.NODE_ENV === 'production';
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
  const [creating, setCreating] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getAuthHeader = () => {
    if (typeof document === 'undefined') return {} as Record<string, string>;
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('access_token='))
      ?.split('=')[1];
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const createExample = async () => {
    setCreating(true);
    setResultMsg(null);
    setErrorMsg(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      } as Record<string, string>;

      // Create Shopify connector
      const shopifyRes = await fetch(`${API_BASE}/connectors`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Shopify Orders (Example)',
          connector_type: 'file',
          config: {
            path: '/app/uploads/examples/ecommerce/shopify_orders.json',
            format: 'json',
          },
          is_active: true,
        }),
      });
      if (!shopifyRes.ok) throw new Error('Failed to create Shopify connector');
      const shopify = await shopifyRes.json();

      // Create WooCommerce connector
      const wooRes = await fetch(`${API_BASE}/connectors`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'WooCommerce Orders (Example)',
          connector_type: 'file',
          config: {
            path: '/app/uploads/examples/ecommerce/woocommerce_orders.json',
            format: 'json',
          },
          is_active: true,
        }),
      });
      if (!wooRes.ok) throw new Error('Failed to create WooCommerce connector');
      const woo = await wooRes.json();

      // Create pipeline
      const pipeRes = await fetch(`${API_BASE}/pipelines`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'E-commerce Orders Unification (Example)',
          description: 'Unify Shopify and WooCommerce orders into a common format.',
          source_config: {
            type: 'multi-file',
            sources: [
              { connector_id: shopify.id, platform: 'shopify' },
              { connector_id: woo.id, platform: 'woocommerce' },
            ],
          },
          destination_config: {
            type: 'file',
            path: '/app/uploads/examples/ecommerce/unified_orders.json',
            format: 'jsonl',
          },
          transformation_config: {
            type: 'mapping',
            rules: [
              {
                platform: 'shopify',
                mappings: [
                  { source: 'email', destination: 'customer_email' },
                  { source: 'created_at', destination: 'order_date' },
                  { source: 'total_price', destination: 'order_value' },
                ],
              },
              {
                platform: 'woocommerce',
                mappings: [
                  { source: 'billing.email', destination: 'customer_email' },
                  { source: 'date_created', destination: 'order_date' },
                  { source: 'total', destination: 'order_value' },
                ],
              },
            ],
            post: [{ op: 'lowercase', field: 'customer_email' }],
          },
          schedule: null,
          is_active: true,
        }),
      });
      if (!pipeRes.ok) throw new Error('Failed to create example pipeline');
      const pipeline = await pipeRes.json();

      // Execute pipeline (best-effort)
      await fetch(`${API_BASE}/pipelines/${pipeline.id}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ triggered_by: 'example-ui' }),
      }).catch(() => undefined);

      setResultMsg('Example created successfully. Check Connectors and Pipelines pages.');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to create example.');
    } finally {
      setCreating(false);
    }
  };

  if (isProduction) {
    // In production builds, don’t render this page
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Example Data (Dev)</h1>
          <p className="mt-2 text-gray-600">
            Use this page locally to try the built-in example connectors and pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary-600" /> Quick start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                Bring up the stack and wait for the API to be healthy:
              </p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-sm"><code>bash scripts/dev-up.sh</code></pre>
              <p className="text-sm text-gray-700">Then create connectors + pipeline and trigger a run:</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-sm"><code>bash scripts/load-example.sh</code></pre>
              <p className="text-sm text-gray-700">
                Output file: <code>uploads/examples/ecommerce/unified_orders.json</code>
              </p>
              <div className="pt-2">
                <Button onClick={createExample} disabled={creating} className="inline-flex items-center gap-2">
                  <Rocket className="h-4 w-4" /> {creating ? 'Creating…' : 'Create example now (dev)'}
                </Button>
                {resultMsg && (
                  <p className="mt-2 text-green-700 flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> {resultMsg}</p>
                )}
                {errorMsg && (
                  <p className="mt-2 text-red-700">{errorMsg}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-600" /> Learn more
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                <li>
                  <Link href="/docs" className="text-primary-700 hover:underline flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Documentation
                  </Link>
                </li>
                <li className="text-sm text-gray-700">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary-700" />
                    <span>
                      Example walkthrough is in the repo at
                      <code className="ml-1">docs/tutorial/example-ecommerce.md</code>
                      and accessible via
                      <Link href="/docs" className="ml-1 text-primary-700 hover:underline">Docs</Link> page.
                    </span>
                  </span>
                </li>
                <li>
                  <a href="http://localhost:8001/docs" className="text-primary-700 hover:underline" target="_blank" rel="noreferrer">API docs (Swagger)</a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What gets created</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
              <li>Two file connectors for Shopify and WooCommerce (visible under Connectors)</li>
              <li>Pipeline: <strong>E-commerce Orders Unification (Example)</strong> (visible under Pipelines)</li>
              <li>Unified output written to <code>uploads/examples/ecommerce/unified_orders.json</code></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

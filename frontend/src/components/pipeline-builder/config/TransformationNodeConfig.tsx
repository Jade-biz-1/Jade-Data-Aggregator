'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, Textarea } from '../../ui';

interface TransformationNodeConfigProps {
  config: any;
  onChange: (config: any) => void;
  subtype: string;
  availableColumns?: string[];
  sampleValues?: Record<string, string[]>;
}

export function TransformationNodeConfig({
  config,
  onChange,
  subtype,
  availableColumns = [],
  sampleValues = {},
}: TransformationNodeConfigProps) {
  // ── All hooks unconditionally at the top ───────────────────────────────
  const conditionRef = useRef<HTMLTextAreaElement>(null);
  const sourceRefs   = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [fnTab, setFnTab] = useState<'String' | 'Math' | 'Null'>('String');

  const updateConfig = (key: string, value: any) => onChange({ ...config, [key]: value });

  // ── Filter helpers ─────────────────────────────────────────────────────
  const insertColumn = (col: string) => {
    const el = conditionRef.current;
    if (!el) { updateConfig('condition', (config.condition || '') + col); return; }
    const s = el.selectionStart ?? (config.condition || '').length;
    const e = el.selectionEnd ?? s;
    const next = (config.condition || '').slice(0, s) + col + (config.condition || '').slice(e);
    updateConfig('condition', next);
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + col.length; el.focus(); });
  };

  // ── Map helpers ────────────────────────────────────────────────────────
  const mappings: { source: string; target: string }[] = Array.isArray(config.mappings)
    ? config.mappings : [];
  const setMappings = (next: { source: string; target: string }[]) => updateConfig('mappings', next);
  const addRow    = () => setMappings([...mappings, { source: '', target: '' }]);
  const removeRow = (i: number) => setMappings(mappings.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: 'source' | 'target', value: string) =>
    setMappings(mappings.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  const insertIntoSource = (rowIdx: number, text: string) => {
    const el = sourceRefs.current[rowIdx];
    const cur = mappings[rowIdx]?.source || '';
    const s = el?.selectionStart ?? cur.length;
    const e = el?.selectionEnd ?? s;
    const next = cur.slice(0, s) + text + cur.slice(e);
    updateRow(rowIdx, 'source', next);
    requestAnimationFrame(() => {
      if (el) { el.selectionStart = el.selectionEnd = s + text.length; el.focus(); }
    });
  };

  // ── Map: function catalogue ────────────────────────────────────────────
  type FnDef = { label: string; snippet: string; desc: string };
  const FN_GROUPS: Record<string, FnDef[]> = {
    String: [
      { label: 'upper()',     snippet: 'upper(col)',                desc: 'upper(name)  →  JOHN' },
      { label: 'lower()',     snippet: 'lower(col)',                desc: 'lower(email)  →  alice@example.com' },
      { label: 'trim()',      snippet: 'trim(col)',                 desc: 'trim(name)  →  strips spaces' },
      { label: 'title()',     snippet: 'title(col)',                desc: 'title(name)  →  John Smith' },
      { label: 'substr()',    snippet: 'substr(col, 0, 5)',         desc: 'substr(code, 0, 3)  →  first 3 chars' },
      { label: 'replace()',   snippet: "replace(col, 'old', 'new')", desc: "replace(phone, '-', '')  →  removes dashes" },
      { label: 'concat()',    snippet: "concat(a, ' ', b)",         desc: "concat(first, ' ', last)  →  John Smith" },
      { label: '+ join',      snippet: "col + ' ' + col2",          desc: "first_name + ' ' + last_name  →  John Smith" },
      { label: 'split()',     snippet: "split(col, ' ', 0)",        desc: "split(full_name, ' ', 0)  →  first word" },
      { label: 'length()',    snippet: 'length(col)',               desc: 'length(description)  →  character count' },
      { label: 'pad_left()',  snippet: "pad_left(col, 6, '0')",     desc: "pad_left(id, 6, '0')  →  000042" },
    ],
    Math: [
      { label: '+ add',       snippet: 'col + col2',    desc: 'price + tax' },
      { label: '- subtract',  snippet: 'col - col2',    desc: 'total - discount' },
      { label: '* multiply',  snippet: 'col * 1.0',     desc: 'price * 1.1  →  add 10%' },
      { label: '/ divide',    snippet: 'col / col2',    desc: 'total / count' },
      { label: 'round()',     snippet: 'round(col, 2)', desc: 'round(amount, 2)  →  2 decimal places' },
      { label: 'abs()',       snippet: 'abs(col)',       desc: 'abs(balance)  →  always positive' },
      { label: 'floor()',     snippet: 'floor(col)',     desc: 'floor(score)  →  round down' },
      { label: 'ceil()',      snippet: 'ceil(col)',      desc: 'ceil(score)  →  round up' },
      { label: 'int()',       snippet: 'int(col)',       desc: 'int(qty_str)  →  cast to integer' },
      { label: 'float()',     snippet: 'float(col)',     desc: 'float(price_str)  →  cast to decimal' },
    ],
    Null: [
      { label: 'coalesce()',  snippet: 'coalesce(col, col2)',       desc: 'coalesce(nickname, first_name)  →  first non-empty' },
      { label: 'if_null()',   snippet: "if_null(col, 'default')",   desc: "if_null(discount, 0)  →  fallback value" },
      { label: 'str()',       snippet: 'str(col)',                  desc: 'str(user_id)  →  convert to string' },
    ],
  };

  // ── Map: client-side preview evaluator ────────────────────────────────
  const sampleRow: Record<string, string> = {};
  for (const col of availableColumns) sampleRow[col] = sampleValues[col]?.[0] ?? '';
  const hasSample = availableColumns.length > 0;

  const evalPreview = (expr: string): string => {
    if (!expr.trim()) return '';
    try {
      const upper   = (s: any) => String(s ?? '').toUpperCase();
      const lower   = (s: any) => String(s ?? '').toLowerCase();
      const trim    = (s: any) => String(s ?? '').trim();
      const title   = (s: any) => String(s ?? '').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const length  = (s: any) => String(s ?? '').length;
      const concat  = (...a: any[]) => a.map(x => x ?? '').join('');
      const substr  = (s: any, st: number, ln?: number) => String(s ?? '').slice(st, ln !== undefined ? st + ln : undefined);
      const replace = (s: any, o: string, n: string) => String(s ?? '').split(o).join(n);
      const split   = (s: any, sep: string, idx?: number) => { const p = String(s ?? '').split(sep); return idx !== undefined ? p[idx] ?? '' : p.join(sep); };
      const pad_left  = (s: any, n: number, c = ' ') => String(s ?? '').padStart(n, c);
      const pad_right = (s: any, n: number, c = ' ') => String(s ?? '').padEnd(n, c);
      const abs     = Math.abs;
      const round   = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;
      const floor   = Math.floor;
      const ceil    = Math.ceil;
      const int     = (x: any) => parseInt(String(x), 10);
      const float   = (x: any) => parseFloat(String(x));
      const str     = (x: any) => String(x ?? '');
      const coalesce = (...a: any[]) => a.find(x => x !== null && x !== undefined && x !== '') ?? '';
      const if_null  = (v: any, d: any) => (v === null || v === undefined || v === '') ? d : v;
      const ctx = {
        upper, lower, trim, title, length, len: length, concat, substr, substring: substr,
        replace, split, pad_left, pad_right, abs, round, floor, ceil, int, float, str,
        coalesce, if_null, ...sampleRow,
      };
      // eslint-disable-next-line no-new-func
      const result = new Function(...Object.keys(ctx), `"use strict"; return (${expr})`)(...Object.values(ctx));
      return result === null || result === undefined ? 'null' : String(result);
    } catch {
      return '—';
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // FILTER
  // ══════════════════════════════════════════════════════════════════════
  if (subtype === 'filter') {
    return (
      <div className="space-y-4">
        {availableColumns.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">Available columns — click to insert:</p>
            <div className="flex flex-wrap gap-1.5">
              {availableColumns.map(col => (
                <button key={col} type="button" onClick={() => insertColumn(col)}
                  title={sampleValues[col]?.length ? `Sample: ${sampleValues[col].slice(0, 3).join(', ')}` : col}
                  className="px-2 py-0.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 font-mono">
                  {col}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Filter Condition</label>
          <Textarea
            id="condition"
            ref={conditionRef}
            value={config.condition || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig('condition', e.target.value)}
            placeholder={availableColumns.length ? `${availableColumns[0]} == 'value'` : "make == 'BMW'"}
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Python expression — use <code className="bg-gray-100 px-1 rounded">==</code>, <code className="bg-gray-100 px-1 rounded">!=</code>, <code className="bg-gray-100 px-1 rounded">&gt;</code>, <code className="bg-gray-100 px-1 rounded">&lt;</code>, <code className="bg-gray-100 px-1 rounded">and</code>, <code className="bg-gray-100 px-1 rounded">or</code>.
            Strings need quotes: <code className="bg-gray-100 px-1 rounded">make == &apos;BMW&apos;</code>
          </p>
        </div>
        <div>
          <label htmlFor="filter_type" className="block text-sm font-medium text-gray-700 mb-1">Filter Type</label>
          <Select id="filter_type" value={config.filter_type || 'include'}
            onChange={(e) => updateConfig('filter_type', e.target.value)}>
            <option value="include">Include matching records</option>
            <option value="exclude">Exclude matching records</option>
          </Select>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // MAP
  // ══════════════════════════════════════════════════════════════════════
  if (subtype === 'map') {
    const previewRows = mappings.filter(m => m.source.trim() && m.target.trim());

    return (
      <div className="space-y-4">

        {/* ── Column chips ─────────────────────────────────────────────── */}
        {availableColumns.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">
              {focusedRow !== null
                ? 'Click a column to insert at cursor:'
                : 'Source columns — focus an expression field then click to insert:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableColumns.map(col => (
                <button key={col} type="button"
                  onClick={() => { if (focusedRow !== null) insertIntoSource(focusedRow, col); }}
                  title={sampleValues[col]?.length ? `Sample: ${sampleValues[col].slice(0,3).join(', ')}` : col}
                  className={`px-2 py-0.5 text-xs border rounded font-mono transition-colors ${
                    focusedRow !== null
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-default'
                  }`}>
                  {col}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Mapping rows ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Field Mappings</label>
            <button type="button" onClick={addRow}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Add mapping
            </button>
          </div>

          {mappings.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No mappings yet — click "+ Add mapping".</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="flex-1 text-xs text-gray-500 font-medium">Source column or expression</span>
                <span className="w-5 flex-shrink-0" />
                <span className="flex-1 text-xs text-gray-500 font-medium">Output column name</span>
                <span className="w-6 flex-shrink-0" />
              </div>
              <div className="space-y-2">
                {mappings.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      ref={el => { sourceRefs.current[i] = el; }}
                      type="text"
                      value={row.source}
                      onChange={e => updateRow(i, 'source', e.target.value)}
                      onFocus={() => setFocusedRow(i)}
                      onBlur={() => setFocusedRow(null)}
                      placeholder={availableColumns[0] || 'column or expression'}
                      className="flex-1 border rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-sm flex-shrink-0">→</span>
                    <input
                      type="text"
                      value={row.target}
                      onChange={e => updateRow(i, 'target', e.target.value)}
                      placeholder="output name"
                      className="flex-1 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 border border-transparent hover:border-red-200 transition-colors"
                      title="Remove this mapping">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Live preview ──────────────────────────────────────────────── */}
        {hasSample && previewRows.length > 0 && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 border-b border-gray-200">
              Preview — first sample row
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Output column</th>
                  <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Expression</th>
                  <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => {
                  const val = evalPreview(row.source);
                  const isErr = val === '—';
                  return (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-1.5 font-mono text-gray-700">{row.target}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-500 max-w-[120px] truncate">{row.source}</td>
                      <td className={`px-3 py-1.5 font-mono font-medium ${isErr ? 'text-red-400 italic' : 'text-gray-900'}`}>
                        {isErr ? 'invalid expression' : val}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Function reference ────────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 pt-2 pb-1 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Functions
              {focusedRow !== null
                ? ' — click to insert at cursor'
                : ' — focus an expression field to enable insertion'}
            </p>
            <div className="flex gap-1">
              {(['String', 'Math', 'Null'] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setFnTab(tab)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    fnTab === tab
                      ? 'bg-white border border-gray-300 text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab === 'Null' ? 'Null / coerce' : tab}
                </button>
              ))}
            </div>
          </div>
          <div className="px-3 py-2.5 bg-white">
            <div className="flex flex-wrap gap-1.5">
              {FN_GROUPS[fnTab].map(fn => (
                <button key={fn.label} type="button"
                  title={fn.desc}
                  onClick={() => { if (focusedRow !== null) insertIntoSource(focusedRow, fn.snippet); }}
                  className={`px-2 py-1 text-xs border rounded font-mono transition-colors ${
                    focusedRow !== null
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer'
                      : 'bg-gray-50 border-gray-200 text-gray-400 cursor-default'
                  }`}>
                  {fn.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Hover a function button for an example.{' '}
              Use <code className="bg-gray-100 px-1 rounded">+</code> to join strings or add numbers.{' '}
              String literals need quotes: <code className="bg-gray-100 px-1 rounded">&apos;text&apos;</code>
            </p>
          </div>
        </div>

        {/* ── Drop unmapped ─────────────────────────────────────────────── */}
        <div className="flex items-center">
          <input id="drop_unmapped" type="checkbox"
            checked={config.drop_unmapped || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('drop_unmapped', e.target.checked)}
            className="mr-2" />
          <label htmlFor="drop_unmapped" className="text-sm font-medium text-gray-700">
            Drop unmapped fields
          </label>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // AGGREGATE
  // ══════════════════════════════════════════════════════════════════════
  if (subtype === 'aggregate') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="group_by" className="block text-sm font-medium text-gray-700 mb-1">Group By Fields</label>
          <Input id="group_by" type="text" value={config.group_by || ''}
            onChange={(e) => updateConfig('group_by', e.target.value)} placeholder="customer_id, region" />
          <p className="text-xs text-gray-500 mt-1">Comma-separated field names</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aggregations</label>
          <Textarea value={config.aggregations || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig('aggregations', e.target.value)}
            placeholder={'{\n  "total_sales": "SUM(amount)",\n  "avg_price": "AVG(price)",\n  "count": "COUNT(*)"\n}'}
            rows={6} />
          <p className="text-xs text-gray-500 mt-1">JSON object of aggregation functions</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // SORT
  // ══════════════════════════════════════════════════════════════════════
  if (subtype === 'sort') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="sort_by" className="block text-sm font-medium text-gray-700 mb-1">Sort By Field</label>
          <Input id="sort_by" type="text" value={config.sort_by || ''}
            onChange={(e) => updateConfig('sort_by', e.target.value)} placeholder="created_at" />
        </div>
        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <Select id="order" value={config.order || 'asc'} onChange={(e) => updateConfig('order', e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // JOIN
  // ══════════════════════════════════════════════════════════════════════
  if (subtype === 'join') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="join_key" className="block text-sm font-medium text-gray-700 mb-1">Join Key</label>
          <Input id="join_key" type="text" value={config.join_key || ''}
            onChange={(e) => updateConfig('join_key', e.target.value)} placeholder="id" />
        </div>
        <div>
          <label htmlFor="join_type" className="block text-sm font-medium text-gray-700 mb-1">Join Type</label>
          <Select id="join_type" value={config.join_type || 'inner'} onChange={(e) => updateConfig('join_type', e.target.value)}>
            <option value="inner">Inner Join</option>
            <option value="left">Left Join</option>
            <option value="right">Right Join</option>
            <option value="outer">Outer Join</option>
          </Select>
        </div>
      </div>
    );
  }

  return <div className="text-gray-500">Unknown transformation type: {subtype}</div>;
}

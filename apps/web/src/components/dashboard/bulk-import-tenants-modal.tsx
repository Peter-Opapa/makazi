"use client";

import * as React from "react";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { bulkRegisterTenants, type BulkImportResult, type RegisterTenantInput } from "@/lib/tenants";
import { ApiError } from "@/lib/api";

const TEMPLATE_CSV = "First Name,Last Name,Phone,Email\nJane,Doe,0712345678,jane@example.com\n";

/** Minimal RFC4180-ish CSV parser — handles quoted fields with embedded commas/newlines, enough for a controlled internal import tool. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

function rowsFromCsv(text: string): { rows: RegisterTenantInput[]; error: string | null } {
  const table = parseCsv(text.trim());
  if (table.length < 2) {
    return { rows: [], error: "The file needs a header row plus at least one tenant row." };
  }

  const header = table[0].map((h) => h.trim().toLowerCase());
  const idx = {
    firstName: header.findIndex((h) => h === "first name" || h === "firstname"),
    lastName: header.findIndex((h) => h === "last name" || h === "lastname"),
    phone: header.findIndex((h) => h === "phone"),
    email: header.findIndex((h) => h === "email"),
  };
  if (idx.firstName === -1 || idx.lastName === -1 || idx.phone === -1) {
    return { rows: [], error: 'The file must have "First Name", "Last Name" and "Phone" columns.' };
  }

  const rows: RegisterTenantInput[] = [];
  for (const cols of table.slice(1)) {
    const firstName = cols[idx.firstName]?.trim();
    const lastName = cols[idx.lastName]?.trim();
    const phone = cols[idx.phone]?.trim();
    if (!firstName && !lastName && !phone) continue; // fully blank row
    if (!firstName || !lastName || !phone) continue; // incomplete row — silently skipped, the backend never sees it
    const email = idx.email !== -1 ? cols[idx.email]?.trim() : undefined;
    rows.push({ firstName, lastName, phone, email: email || undefined });
  }

  return {
    rows,
    error: rows.length === 0 ? "No complete tenant rows found — each row needs a first name, last name and phone." : null,
  };
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "makazi-tenant-import-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BulkImportTenantsModal({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [rows, setRows] = React.useState<RegisterTenantInput[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<BulkImportResult | null>(null);

  React.useEffect(() => {
    if (open) {
      setRows([]);
      setFileName(null);
      setParseError(null);
      setSubmitError(null);
      setResult(null);
    }
  }, [open]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    file.text().then((text) => {
      const parsed = rowsFromCsv(text);
      setRows(parsed.rows);
      setParseError(parsed.error);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await bulkRegisterTenants(rows);
      setResult(res);
      onImported();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Import failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={560}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Bulk import tenants</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">
        Register many tenants at once from a CSV file. You&apos;ll still assign each one to a unit afterward, from that
        unit&apos;s page.
      </p>

      {!result && (
        <>
          <button type="button" onClick={downloadTemplate} className="text-[13px] font-semibold text-[var(--green)] mb-4">
            Download CSV template
          </button>

          <label className="block border-[1.5px] border-dashed border-[var(--line-2)] rounded-[12px] px-4 py-6 text-center cursor-pointer mb-4">
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            <div className="text-[13px] font-semibold">{fileName ?? "Choose a CSV file"}</div>
            <div className="text-xs text-[var(--stone)] mt-1">
              {rows.length > 0
                ? `${rows.length} tenant${rows.length === 1 ? "" : "s"} ready to import`
                : "First Name, Last Name, Phone, Email (optional)"}
            </div>
          </label>

          {parseError && <InlineError>{parseError}</InlineError>}
          {submitError && <InlineError>{submitError}</InlineError>}

          <div className="flex gap-[10px] mt-2">
            <FormButton variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </FormButton>
            <FormButton onClick={handleSubmit} disabled={submitting || rows.length === 0 || Boolean(parseError)}>
              {submitting
                ? "Importing…"
                : rows.length > 0
                  ? `Import ${rows.length} tenant${rows.length === 1 ? "" : "s"}`
                  : "Import"}
            </FormButton>
          </div>
        </>
      )}

      {result && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            <StatusBadge tone="success">{result.created} created</StatusBadge>
            {result.reused > 0 && <StatusBadge tone="neutral">{result.reused} already existed</StatusBadge>}
            {result.failed > 0 && <StatusBadge tone="error">{result.failed} failed</StatusBadge>}
          </div>
          <div className="max-h-[280px] overflow-y-auto border border-[var(--line)] rounded-[12px]">
            {result.results.map((r) => (
              <div
                key={r.row}
                className="flex items-start justify-between gap-3 px-3 py-[10px] border-b border-[var(--line)] last:border-b-0 text-[13px]"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">{r.name}</div>
                  <div className="text-xs text-[var(--stone)]">{r.message}</div>
                </div>
                <StatusBadge tone={r.status === "created" ? "success" : r.status === "reused" ? "neutral" : "error"}>
                  {r.status}
                </StatusBadge>
              </div>
            ))}
          </div>
          <FormButton onClick={() => onOpenChange(false)} className="mt-4">
            Done
          </FormButton>
        </>
      )}
    </Modal>
  );
}

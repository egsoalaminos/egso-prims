import * as React from "react";
import { format } from "date-fns";
import {
  Bell,
  Building2,
  DatabaseBackup,
  FileText,
  Hash,
  Info,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  Button,
  Caption,
  ContainerCard,
  Field,
  Input,
  OverlineLabel,
  PageHeader,
  PageTransition,
  SectionTitle,
  SelectField,
  Skeleton,
  StatusBadge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
} from "@/components";
import { getSystemStatus, setConfigValues, type SystemStatus } from "@/features/config/api";
import { useConfiguration } from "@/features/config/hooks";
import {
  CONFIG_DEFINITIONS,
  type ConfigDefinition,
  type ConfigValue,
} from "@/features/config/types";
import { DOCUMENT_TYPES } from "@/features/shared/doc-numbers";

/** Tabs shown in the Settings module, in order. */
const SECTIONS = [
  { id: "General", label: "General", icon: Building2 },
  { id: "Document Numbering", label: "Numbering", icon: Hash },
  { id: "Reports", label: "Reports", icon: FileText },
  { id: "Notifications", label: "Notifications", icon: Bell },
  { id: "Appearance", label: "Appearance", icon: Palette },
  { id: "Security", label: "Security", icon: ShieldCheck },
  { id: "System", label: "System", icon: Info },
  { id: "Backup", label: "Backup", icon: DatabaseBackup },
] as const;

const asText = (v: ConfigValue): string =>
  v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v, null, 2) : String(v);

/**
 * Settings — the management interface for the centralized configuration
 * system built in Phase 20. It owns no configuration logic of its own: every
 * field is rendered from CONFIG_DEFINITIONS and written through the existing
 * config service, so adding a setting needs no change here.
 */
export function SettingsPage() {
  const { loading, refresh, get } = useConfiguration(React.useMemo(() => ({}), []));
  const [draft, setDraft] = React.useState<Record<string, ConfigValue>>({});
  const [saving, setSaving] = React.useState<string | null>(null);

  const fieldId = (d: ConfigDefinition) => `${d.category}::${d.key}`;

  /** Current value: the unsaved edit when present, otherwise the stored one. */
  const valueOf = React.useCallback(
    (d: ConfigDefinition): ConfigValue => {
      const id = fieldId(d);
      return id in draft ? draft[id] : get(d.category, d.key);
    },
    [draft, get],
  );

  const setDraftValue = (d: ConfigDefinition, value: ConfigValue) =>
    setDraft((prev) => ({ ...prev, [fieldId(d)]: value }));

  const sectionDefs = (category: string) =>
    CONFIG_DEFINITIONS.filter((d) => d.category === category);

  /** Unsaved edits within one section. */
  const dirtyIn = (category: string) =>
    sectionDefs(category).filter((d) => fieldId(d) in draft);

  const saveSection = async (category: string) => {
    const changed = dirtyIn(category);
    if (changed.length === 0) return;
    setSaving(category);
    try {
      await setConfigValues(
        changed.map((d) => ({ category: d.category, key: d.key, value: valueOf(d) })),
      );
      setDraft((prev) => {
        const next = { ...prev };
        for (const d of changed) delete next[fieldId(d)];
        return next;
      });
      toast.success(`${category} settings saved`);
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save settings");
    }
    setSaving(null);
  };

  const resetSection = (category: string) => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const d of sectionDefs(category)) delete next[fieldId(d)];
      return next;
    });
  };

  /* ---------------- field renderer ---------------- */

  const renderField = (d: ConfigDefinition) => {
    const value = valueOf(d);

    if (d.kind === "boolean") {
      return (
        <div
          key={d.key}
          className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-3.5"
        >
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-neutral-800">{d.label}</div>
            {d.note && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{d.note}</p>
            )}
          </div>
          <Switch
            checked={value === true}
            onCheckedChange={(checked) => setDraftValue(d, checked)}
          />
        </div>
      );
    }

    if (d.kind === "select") {
      return (
        <Field key={d.key} label={d.label} helper={d.note}>
          <SelectField
            options={(d.options ?? []).map((o) => ({ value: o, label: o }))}
            value={typeof value === "string" && value ? value : undefined}
            onChange={(v) => setDraftValue(d, v)}
          />
        </Field>
      );
    }

    if (d.kind === "json") {
      return (
        <Field key={d.key} label={d.label} helper={d.note}>
          <Textarea
            rows={5}
            className="font-mono text-[11.5px]"
            value={asText(value)}
            onChange={(e) => {
              const raw = e.target.value;
              try {
                setDraftValue(d, JSON.parse(raw) as ConfigValue);
              } catch {
                // Keep the raw text while it is mid-edit and not yet valid
                // JSON; saving is blocked below until it parses.
                setDraftValue(d, raw);
              }
            }}
          />
          {typeof valueOf(d) === "string" && (
            <Caption as="p" className="mt-1 text-red-600">
              Not valid JSON yet — fix before saving.
            </Caption>
          )}
        </Field>
      );
    }

    if (d.kind === "number") {
      return (
        <Field key={d.key} label={d.label} helper={d.note}>
          <Input
            type="number"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) =>
              setDraftValue(d, e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </Field>
      );
    }

    return (
      <Field key={d.key} label={d.label} helper={d.note}>
        <Input
          value={asText(value)}
          // A cleared text field stores an empty string rather than null: it
          // reads back identically and avoids relying on a nullable column.
          onChange={(e) => setDraftValue(d, e.target.value)}
        />
      </Field>
    );
  };

  /** A category's fields plus its save / reset bar. */
  const renderSection = (category: string, description: string, extra?: React.ReactNode) => {
    const dirty = dirtyIn(category);
    const invalidJson = dirty.some(
      (d) => d.kind === "json" && typeof valueOf(d) === "string",
    );
    return (
      <div className="space-y-4">
        <ContainerCard className="p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <SectionTitle as="h3">{category}</SectionTitle>
              <p className="mt-0.5 text-[11.5px] text-neutral-500">{description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {dirty.length > 0 && (
                <Caption as="span">
                  {dirty.length} unsaved change{dirty.length === 1 ? "" : "s"}
                </Caption>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => resetSection(category)}
                disabled={dirty.length === 0}
              >
                <RotateCcw />
                Reset
              </Button>
              <Button
                size="xs"
                onClick={() => void saveSection(category)}
                loading={saving === category}
                disabled={dirty.length === 0 || invalidJson}
              >
                <Save />
                Save Changes
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {sectionDefs(category).map(renderField)}
            </div>
          )}
        </ContainerCard>
        {extra}
      </div>
    );
  };

  return (
    <PageTransition className="space-y-4">
      <PageHeader
        title="Settings"
        description="Manage system-wide configuration. Values are shared by every General Services Office module."
      />

      <Tabs defaultValue="General">
        <TabsList className="bg-neutral-100">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="text-[12.5px]">
              <s.icon className="mr-1.5 h-3.5 w-3.5" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="General" className="pt-3">
          {renderSection(
            "General",
            "Identity and contact details printed on official documents and reports.",
          )}
        </TabsContent>

        <TabsContent value="Document Numbering" className="pt-3">
          {renderSection(
            "Document Numbering",
            "Padding, yearly reset and separator are read by the numbering service when a document number is issued.",
            <RegisteredPrefixes />,
          )}
        </TabsContent>

        <TabsContent value="Reports" className="pt-3">
          {renderSection(
            "Reports",
            "Defaults applied by the shared report, print and export engines.",
          )}
        </TabsContent>

        <TabsContent value="Notifications" className="pt-3">
          {renderSection(
            "Notifications",
            "Applies to the Notification Center; events themselves are raised by database triggers.",
          )}
        </TabsContent>

        <TabsContent value="Appearance" className="pt-3">
          {renderSection(
            "Appearance",
            "Visual preferences for the application shell.",
            <ContainerCard className="p-4">
              <div className="flex items-start gap-2.5">
                <Palette className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                <div>
                  <div className="text-[12.5px] font-medium text-neutral-800">
                    Dark Mode will be implemented in the next phase.
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">
                    The theme selector stores your preference now; the application still renders
                    in light mode until dark mode ships.
                  </p>
                </div>
              </div>
            </ContainerCard>,
          )}
        </TabsContent>

        <TabsContent value="Security" className="pt-3">
          {renderSection(
            "Security",
            "Session and password policy. Authentication behaviour itself is unchanged by this phase.",
          )}
        </TabsContent>

        <TabsContent value="System" className="pt-3">
          <SystemInformation version={asText(get("System", "app_version"))} />
        </TabsContent>

        <TabsContent value="Backup" className="pt-3">
          <BackupRestore />
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

/* ---------------- document numbering: registered prefixes ---------------- */

/** Read-only view of the prefixes the numbering service currently issues. */
function RegisteredPrefixes() {
  return (
    <ContainerCard className="p-5">
      <SectionTitle as="h3">Registered Prefixes</SectionTitle>
      <p className="mt-0.5 text-[11.5px] text-neutral-500">
        Issued by the centralized numbering service. An unlisted prefix registers itself the first
        time a module requests one, so future modules need no change here.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(DOCUMENT_TYPES).map(([prefix, label]) => (
          <div
            key={prefix}
            className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
          >
            <span className="text-[12px] text-neutral-600">{label}</span>
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-neutral-700">
              {prefix}
            </span>
          </div>
        ))}
      </div>
    </ContainerCard>
  );
}

/* ---------------- system information ---------------- */

/** Read-only environment and connection facts. */
function SystemInformation({ version }: { version: string }) {
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [checking, setChecking] = React.useState(true);

  const probe = React.useCallback(async () => {
    setChecking(true);
    setStatus(await getSystemStatus());
    setChecking(false);
  }, []);

  React.useEffect(() => {
    void probe();
  }, [probe]);

  const buildDate = (() => {
    try {
      return format(new Date(__BUILD_DATE__), "d MMMM yyyy · h:mm a");
    } catch {
      return "—";
    }
  })();

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "System Version", value: version || "—" },
    { label: "Environment", value: import.meta.env.DEV ? "Development" : "Production" },
    { label: "Build Date", value: buildDate },
    { label: "Supabase Host", value: status?.host ?? "—" },
    {
      label: "Database Status",
      value: checking ? (
        <Skeleton className="h-4 w-20" />
      ) : status?.connected ? (
        <StatusBadge status="Success" />
      ) : (
        <StatusBadge status="Failed" />
      ),
    },
    {
      label: "Connection Latency",
      value: checking ? (
        <Skeleton className="h-4 w-16" />
      ) : status?.latencyMs !== null && status?.latencyMs !== undefined ? (
        `${status.latencyMs} ms`
      ) : (
        "—"
      ),
    },
  ];

  return (
    <ContainerCard className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle as="h3">System Information</SectionTitle>
          <p className="mt-0.5 text-[11.5px] text-neutral-500">
            Read-only. Reported live from the running application and database.
          </p>
        </div>
        <Button variant="secondary" size="xs" onClick={() => void probe()} loading={checking}>
          {status?.connected ? <Wifi /> : <WifiOff />}
          Re-check Connection
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <OverlineLabel>{r.label}</OverlineLabel>
            <span className="text-[12.5px] font-medium text-neutral-800">{r.value}</span>
          </div>
        ))}
      </div>

      {status && !status.connected && status.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[11.5px] text-red-700">
          {status.error}
        </p>
      )}
    </ContainerCard>
  );
}

/* ---------------- backup & restore (interface only) ---------------- */

function BackupRestore() {
  return (
    <ContainerCard className="p-5">
      <SectionTitle as="h3">Backup &amp; Restore</SectionTitle>
      <p className="mt-0.5 text-[11.5px] text-neutral-500">
        Database backup and restore will be handled here once the backend support is built.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            title: "Backup Database",
            body: "Create a downloadable snapshot of every module's records.",
          },
          {
            title: "Restore Database",
            body: "Restore all records from a previously created snapshot.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-lg border border-dashed border-neutral-300 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-neutral-800">{c.title}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-neutral-500">
                Coming Soon
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">{c.body}</p>
            <Button variant="secondary" size="xs" className="mt-3" disabled>
              <DatabaseBackup />
              {c.title}
            </Button>
          </div>
        ))}
      </div>
    </ContainerCard>
  );
}

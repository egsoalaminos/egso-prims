/**
 * System configuration domain types.
 *
 * This is the foundation the future Settings module will consume — there is
 * deliberately no UI in this phase. Every setting lives in one table; nothing
 * is hardcoded in a module that belongs here.
 */

export const CONFIG_CATEGORIES = [
  "General",
  "Document Numbering",
  "Reports",
  "Notifications",
  "Appearance",
  "Security",
  "Utilities",
  "System",
] as const;

export type ConfigCategory = (typeof CONFIG_CATEGORIES)[number];

/** A value may be a string, number, boolean, object or null. */
export type ConfigValue = string | number | boolean | null | Record<string, unknown>;

export interface ConfigEntry {
  id: string;
  category: ConfigCategory | string;
  key: string;
  value: ConfigValue;
  description?: string;
  updatedAt: string;
}

/** How a setting should be rendered once a Settings page exists. */
export type ConfigKind = "text" | "number" | "boolean" | "select" | "json";

export interface ConfigDefinition {
  category: ConfigCategory;
  key: string;
  label: string;
  kind: ConfigKind;
  /** Used when the row is missing, so callers always get a usable value. */
  fallback: ConfigValue;
  /** Allowed values for `select` settings. */
  options?: readonly string[];
  /** Set when changing the value has effects beyond cosmetics. */
  note?: string;
}

/**
 * The known settings, their shapes and their fallbacks. A future Settings
 * page renders from this registry; adding a setting means adding an entry
 * here and a seed row in the migration — no new service code.
 */
export const CONFIG_DEFINITIONS: ConfigDefinition[] = [
  /* General */
  { category: "General", key: "organization_name", label: "Organization Name", kind: "text", fallback: "Municipality of Alaminos, Laguna" },
  { category: "General", key: "office_name", label: "Office Name", kind: "text", fallback: "General Services Office" },
  { category: "General", key: "province", label: "Province", kind: "text", fallback: "Laguna" },
  { category: "General", key: "municipality_address", label: "Municipality Address", kind: "text", fallback: "Poblacion, Alaminos, Laguna 4001" },
  { category: "General", key: "contact_number", label: "Contact Number", kind: "text", fallback: "(049) 543-1234" },
  { category: "General", key: "official_email", label: "Official Email", kind: "text", fallback: "gso@alaminos.gov.ph" },
  { category: "General", key: "municipality_logo", label: "Municipality Logo", kind: "text", fallback: null, note: "Storage path; leave blank to use the built-in mark." },
  { category: "General", key: "fiscal_year", label: "Fiscal Year", kind: "number", fallback: 2026 },
  { category: "General", key: "currency", label: "Currency", kind: "text", fallback: "PHP" },
  { category: "General", key: "timezone", label: "Timezone", kind: "text", fallback: "Asia/Manila" },

  /* Document Numbering — read by the next_document_number RPC */
  {
    category: "Document Numbering",
    key: "padding_length",
    label: "Padding Length",
    kind: "number",
    fallback: 6,
    note: "Changes the width of newly issued numbers only; existing numbers keep their width.",
  },
  {
    category: "Document Numbering",
    key: "year_reset",
    label: "Reset Sequence Yearly",
    kind: "boolean",
    fallback: true,
    note: "Turning this off moves every type onto one continuous counter.",
  },
  { category: "Document Numbering", key: "separator", label: "Separator", kind: "text", fallback: "-" },
  {
    category: "Document Numbering",
    key: "document_types",
    label: "Registered Prefixes",
    kind: "json",
    fallback: {},
    note: "Unlisted prefixes still self-register on first use.",
  },

  /* Reports */
  { category: "Reports", key: "default_report_year", label: "Default Report Year", kind: "number", fallback: null },
  { category: "Reports", key: "print_layout", label: "Print Layout", kind: "select", fallback: "A4 Landscape", options: ["A4 Landscape", "A4 Portrait", "Letter Landscape", "Letter Portrait"] },
  { category: "Reports", key: "default_export_format", label: "Default Export Format", kind: "select", fallback: "PDF", options: ["PDF", "Excel", "CSV"] },
  { category: "Reports", key: "prepared_by", label: "Prepared By", kind: "text", fallback: "Administrator" },
  { category: "Reports", key: "approved_by", label: "Approved By", kind: "text", fallback: "Engr. Paolo Madrigal" },

  /* Notifications */
  { category: "Notifications", key: "realtime_enabled", label: "Realtime Enabled", kind: "boolean", fallback: true },
  { category: "Notifications", key: "retention_days", label: "Retention (days)", kind: "number", fallback: 90 },
  { category: "Notifications", key: "default_read_status", label: "Default Read Status", kind: "boolean", fallback: false },
  { category: "Notifications", key: "page_size", label: "Drawer Page Size", kind: "number", fallback: 200 },

  /* Appearance */
  {
    category: "Appearance",
    key: "theme",
    label: "Theme",
    kind: "select",
    fallback: "light",
    options: ["light", "dark", "system"],
    note: "Applies immediately across every page. Printed reports always use the light design.",
  },
  {
    category: "Appearance",
    key: "accent_color",
    label: "Accent Color",
    kind: "select",
    fallback: "neutral",
    options: ["neutral", "blue", "green", "red", "purple"],
    note: "Tints primary buttons, the active sidebar item, links and focus rings.",
  },
  { category: "Appearance", key: "table_density", label: "Table Density", kind: "select", fallback: "comfortable", options: ["comfortable", "compact"] },

  /* Security */
  { category: "Security", key: "session_timeout_minutes", label: "Session Timeout (minutes)", kind: "number", fallback: 480 },
  { category: "Security", key: "password_min_length", label: "Minimum Password Length", kind: "number", fallback: 10 },
  { category: "Security", key: "password_requires_mixed_case", label: "Require Mixed Case", kind: "boolean", fallback: true },
  { category: "Security", key: "role_permissions", label: "Role Permissions", kind: "json", fallback: {}, note: "Reserved for the future permission matrix." },

  /* Utilities */
  { category: "Utilities", key: "energy_rate_per_kwh", label: "Energy Rate per kWh", kind: "number", fallback: 11.6 },
  { category: "Utilities", key: "water_rate_per_cubic_meter", label: "Water Rate per m³", kind: "number", fallback: 38 },
  { category: "Utilities", key: "fuel_volume_unit", label: "Fuel Volume Unit", kind: "text", fallback: "L" },
  { category: "Utilities", key: "comparison_basis", label: "Comparison Basis", kind: "select", fallback: "previous_month", options: ["previous_month", "same_month_last_year"] },

  /* System */
  { category: "System", key: "app_version", label: "Application Version", kind: "text", fallback: "1.0.0" },
  { category: "System", key: "maintenance_mode", label: "Maintenance Mode", kind: "boolean", fallback: false },
  { category: "System", key: "audit_retention_days", label: "Audit Retention (days)", kind: "number", fallback: 3650 },
  { category: "System", key: "default_page_size", label: "Default Page Size", kind: "number", fallback: 12 },
];

/** Definition lookup, e.g. for a Settings form or a typed getter's fallback. */
export function configDefinition(
  category: string,
  key: string,
): ConfigDefinition | undefined {
  return CONFIG_DEFINITIONS.find((d) => d.category === category && d.key === key);
}

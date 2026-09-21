/**
 * The municipal officials who sign what this system prints.
 *
 * One list, so a document cannot name a different General Services Officer
 * than the one on the sheet beside it in the same folder. Procurement forms,
 * the report print window and the report sign-off block all read from here.
 */

export interface Official {
  name: string;
  title: string;
}

export const GENERAL_SERVICES_OFFICER: Official = {
  name: "FLORENTINO J. DESTACAMENTO",
  title: "General Services Officer",
};

export const MUNICIPAL_TREASURER: Official = {
  name: "ROWENA C. LANDICHO",
  title: "Municipal Treasurer",
};

export const MUNICIPAL_MAYOR: Official = {
  name: "Hon. ERICSON R. LOPEZ",
  title: "Municipal Mayor",
};

/** The officials who sign every procurement document, in the order they sign. */
export const PROCUREMENT_SIGNATORIES: Official[] = [
  GENERAL_SERVICES_OFFICER,
  MUNICIPAL_TREASURER,
  MUNICIPAL_MAYOR,
];

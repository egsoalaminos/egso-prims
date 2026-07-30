import { ITEM_CATEGORIES } from "@/features/inventory/types";

/**
 * Category auto-classification for Smart Import.
 *
 * Runs entirely in the browser — no external AI. Each real inventory category
 * has a lexicon of the terms that characterise it (item names and synonyms).
 * An extracted item is scored against every lexicon; the winning category is
 * assigned only when it is clearly ahead, otherwise the field is left blank so
 * nothing is guessed. Corrections the administrator makes are remembered
 * locally, so the same or similar item classifies itself next time.
 *
 * Only the categories with a lexicon can be auto-assigned; the rest are left
 * for the administrator to choose, which is safer than guessing.
 */

type Category = (typeof ITEM_CATEGORIES)[number];

/** Characteristic terms per category. Multi-word phrases score higher. */
const LEXICON: Partial<Record<Category, string[]>> = {
  "Office Supplies": [
    "paper", "bond paper", "short bond", "long bond", "a4 paper", "folder", "envelope",
    "notebook", "note book", "ballpen", "ball pen", "pen", "pencil", "marker", "sign pen",
    "highlighter", "stapler", "staple wire", "staple", "paper clip", "clip", "glue", "paste",
    "tape", "correction tape", "correction fluid", "ink", "toner", "cartridge", "ruler",
    "scissor", "fastener", "binder", "record book", "logbook", "columnar", "index card",
    "rubber band", "puncher", "sharpener", "eraser", "carbon paper", "manila", "expanded folder",
    "mailing envelope", "brown envelope", "clearbook", "sticky note", "post it", "calculator",
    "certificate holder", "data folder",
  ],
  "ICT Supplies & Equipment": [
    "mouse", "keyboard", "monitor", "printer", "laptop", "computer", "desktop", "cpu", "ups",
    "router", "network switch", "ethernet", "utp cable", "lan cable", "hdmi", "usb", "flash drive",
    "flashdrive", "external drive", "hard drive", "ssd", "ram", "memory", "projector", "webcam",
    "web camera", "headset", "speaker", "microphone", "scanner", "adapter", "charger", "power bank",
    "tablet", "cctv", "ip camera", "network hub", "modem", "access point", "power supply",
    "motherboard", "processor", "printer ink", "printer toner", "ink cartridge", "toner cartridge",
    "extension cord", "avr", "hdd", "wifi",
  ],
  "Janitorial & Sanitation Supplies": [
    "broom", "walis", "mop", "detergent", "bleach", "soap", "disinfectant", "cleaner", "cleaning",
    "trash bag", "garbage bag", "dustpan", "rag", "sponge", "tissue", "toilet paper", "air freshener",
    "insecticide", "floor wax", "scrub", "pail", "bucket", "brush", "hand soap", "dishwashing",
    "muriatic", "toilet bowl cleaner", "glass cleaner", "fabric conditioner", "doormat", "feather duster",
    "trash can", "waste basket", "zonrox", "downy", "joy", "surf",
  ],
  "Construction Materials": [
    "paint", "latex paint", "enamel", "hammer", "plywood", "cement", "nail", "screw", "wood",
    "lumber", "gravel", "sand", "steel", "rebar", "reinforcing bar", "pipe", "pvc", "electrical wire",
    "tile", "gi sheet", "roofing", "concrete", "hollow block", "paint brush", "sandpaper", "putty",
    "sealant", "hinge", "bolt", "drill", "hand saw", "trowel", "shovel", "wheelbarrow", "gi pipe",
    "angle bar", "welding rod", "tie wire", "hacksaw", "wrench", "pliers", "screwdriver", "steel bar",
    "aggregates", "marine plywood",
  ],
  "Medical & First Aid Supplies": [
    "alcohol", "isopropyl", "ethyl alcohol", "face mask", "surgical mask", "mask", "medicine",
    "gauze", "bandage", "syringe", "betadine", "cotton", "thermometer", "first aid", "antiseptic",
    "paracetamol", "vitamin", "ppe", "surgical", "hand sanitizer", "sanitizer", "povidone",
    "ointment", "test kit", "antigen", "bp apparatus", "blood pressure", "stethoscope", "oxygen",
    "dextrose", "iv fluid", "medical", "biohazard", "examination glove", "surgical glove",
    "face shield", "hand gloves", "band aid", "hydrogen peroxide",
  ],
  "Garden & Landscaping Supplies": [
    "seed", "seedling", "fertilizer", "pesticide", "herbicide", "fungicide", "compost", "urea",
    "ammonium", "organic fertilizer", "rice seed", "corn seed", "vegetable seed", "garden tool",
    "sprayer", "knapsack sprayer", "farm", "sacks of seeds", "ammonium sulfate", "complete fertilizer",
    "hybrid seed", "planting material", "grafting", "manure",
  ],
};

/** Only the categories that carry a lexicon take part in scoring. */
const CATEGORIES = Object.entries(LEXICON) as [Category, string[]][];

/** Lowercase, drop numbers/punctuation, collapse whitespace, de-pluralise. */
function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

const significantTokens = (text: string): string[] =>
  normalize(text)
    .trim()
    .split(" ")
    .filter((t) => t.length >= 3);

/** Scores one normalized string against a category's lexicon. */
function scoreCategory(normalized: string, terms: string[]): number {
  let score = 0;
  for (const term of terms) {
    const words = term.split(" ").length;
    if (words > 1) {
      // Phrase match anywhere in the string.
      if (normalized.includes(` ${term} `) || normalized.includes(term)) score += words * 1.5;
    } else if (normalized.includes(` ${term} `)) {
      // Whole-word match for single tokens.
      score += 1;
    } else if (term.length >= 5 && normalized.includes(term)) {
      // Substring match for longer stems (e.g. "detergent" in "detergents").
      score += 0.6;
    }
  }
  return score;
}

export interface Classification {
  category: string; // "" when undetermined
  confidence: number;
  /** True when a learned correction produced this result. */
  learned: boolean;
}

/* ---------------- learning store ---------------- */

const STORE_KEY = "gso-prims.smart-import.category-map";

function readStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeStore(map: Record<string, string>): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable (private mode): learning simply won't persist.
  }
}

/** Remembers that `itemName` was classified as `category`. */
export function learnCategory(itemName: string, category: string): void {
  const key = normalize(itemName).trim();
  if (!key || !(ITEM_CATEGORIES as readonly string[]).includes(category)) return;
  const map = readStore();
  map[key] = category;
  writeStore(map);
}

/** Finds a learned category for an exact or sufficiently similar item name. */
function learnedMatch(itemName: string): string | null {
  const map = readStore();
  const key = normalize(itemName).trim();
  if (map[key]) return map[key];

  // Similar item: significant-token overlap with a remembered name.
  const qTokens = new Set(significantTokens(itemName));
  if (qTokens.size === 0) return null;
  for (const [learnedKey, category] of Object.entries(map)) {
    const lTokens = new Set(learnedKey.split(" ").filter((t) => t.length >= 3));
    if (lTokens.size === 0) continue;
    const shared = [...qTokens].filter((t) => lTokens.has(t)).length;
    const union = new Set([...qTokens, ...lTokens]).size;
    // Jaccard ≥ 0.5, or one name's tokens fully contain the other's.
    if (
      shared / union >= 0.5 ||
      [...lTokens].every((t) => qTokens.has(t)) ||
      [...qTokens].every((t) => lTokens.has(t))
    ) {
      return category;
    }
  }
  return null;
}

/**
 * Classifies an item into an inventory category, or "" when unsure.
 * `description` (when available) adds signal but the name dominates.
 */
export function classifyCategory(itemName: string, description = ""): Classification {
  if (!itemName.trim()) return { category: "", confidence: 0, learned: false };

  const learned = learnedMatch(itemName);
  if (learned) return { category: learned, confidence: 5, learned: true };

  const text = normalize(`${itemName} ${description}`);
  const scored = CATEGORIES.map(([category, terms]) => ({
    category,
    score: scoreCategory(text, terms),
  })).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];
  // Assign only with a clear winner: a real match and a margin over the runner-up.
  const confident = top.score >= 1 && (second.score === 0 || top.score - second.score >= 1);
  return confident
    ? { category: top.category, confidence: top.score, learned: false }
    : { category: "", confidence: top.score, learned: false };
}

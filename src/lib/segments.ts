import { Product } from "./types";

/** Therapeutic segments used by the business planner (mix sliders + charts). */
export interface Segment {
  id: string;
  label: string;
  color: string;
}

export const SEGMENTS: Segment[] = [
  { id: "pain", label: "Pain Relief", color: "#b99657" },
  { id: "antibiotic", label: "Antibiotics", color: "#16694e" },
  { id: "cough", label: "Cough & Cold", color: "#4a90a4" },
  { id: "gastro", label: "Gastro & Digestive", color: "#a3813f" },
  { id: "vitamins", label: "Vitamins & Nutrition", color: "#7a8450" },
  { id: "personal", label: "Personal Care", color: "#9c6b4f" },
  { id: "derma", label: "Skin & Derma", color: "#2e465c" },
  { id: "ayurvedic", label: "Ayurvedic & Wellness", color: "#6b8f71" },
  { id: "other", label: "Other", color: "#8a9098" },
];

export const SEGMENT_BY_ID: Record<string, Segment> = Object.fromEntries(
  SEGMENTS.map((s) => [s.id, s])
);

const RULES: [string, string[]][] = [
  ["pain", ["diclofenac", "aceclofenac", "paracetamol", "ibuprofen", "nimesulide", "mefenamic", "aspirin", "etoricoxib", "tramadol", "serratiopeptidase", "pain relief", "5d gel"]],
  ["antibiotic", ["floxacin", "azithromycin", "amoxy", "amoxicillin", "cefixime", "cephalexin", "cefpodoxime", "metronidazole", "ornidazole", "doxycycline", "clindamic", "gentamycin", "neomycin", "framycetin", "fusidic", "mupirocin", "azithro"]],
  ["cough", ["cough", "cold", "chlorpheniramine", "phenylephrine", "ambroxol", "bromhexine", "dextromethorphan", "cloperastine", "guaiphenesin", "terbutaline", "salbutamol", "montelukast", "levocetirizine", "cetirizine", "expectorant", "linctus"]],
  ["gastro", ["pantoprazole", "omeprazole", "rabeprazole", "esomeprazole", "domperidone", "ondansetron", "ranitidine", "famotidine", "sucralfate", "antacid", "digest", "liver", "livo", "acidity", "dicyclomine", "drotaverine", "gripe"]],
  ["vitamins", ["vitamin", "calcium", "ferrous", "b-complex", "b complex", "multivitamin", "folic", "protein", "malt", "supplement", "methylcobalamin", "amino", "zinc sulphate"]],
  ["personal", ["soap", "shampoo", "toothpaste", "dant", "handwash", "sanitizer", "hygiene", "sensodine", "mouth wash", "mouthwash", "face wash"]],
  ["derma", ["clotrimazole", "clotrimozole", "ketoconazole", "miconazole", "terbinafine", "luliconazole", "itraconazole", "fluconazole", "clobetasol", "betamethasone", "mometasone", "beclomethasone", "hydroquinone", "tretinoin", "adapalene", "salicylic", "calamine", "povidone", "cream", "ointment", "gel", "lotion", "scrub"]],
  ["ayurvedic", ["ayurvedic", "herbal", "juice", "tonic", "tulsi", "giloy", "ashwagandha", "amla", "aloe", "musli", "shankh", "neem", "churna", "bhasma"]],
];

export function segmentOf(p: Product): string {
  const hay = `${p.name} ${p.composition} ${p.category}`.toLowerCase();
  for (const [id, keys] of RULES) {
    if (keys.some((k) => hay.includes(k))) return id;
  }
  return "other";
}

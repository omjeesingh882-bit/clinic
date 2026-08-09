export interface ParsedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  uncertain?: boolean;
}

export interface ParsedPrescription {
  correctedText: string;
  summary: string;
  medicines: ParsedMedicine[];
  importantFindings: string[];
  tags: string[];
}

// Common medicine forms / prefixes
const FORM_PREFIXES = [
  'tab\\.?', 'tablet', 'tablets',
  'cap\\.?', 'capsule', 'capsules',
  'syp\\.?', 'syrup', 'susp\\.?', 'suspension',
  'inj\\.?', 'injection',
  'oint\\.?', 'ointment', 'cream', 'gel',
  'drop', 'drops', 'eye drop', 'eye drops', 'ear drop', 'ear drops',
  'inhaler', 'rotacap', 'respule', 'respules', 'spray', 'lotion',
  'powder', 'sachet', 'suppository', 'patch', 'sol\\.?', 'solution'
];

// Common medical drug entities
const KNOWN_DRUGS = [
  'amoxicillin', 'augmentin', 'clavam', 'moxikind', 'ampicillin', 'azithromycin', 'azee', 'zithromax',
  'cefixime', 'taxim', 'cefpodoxime', 'ceftriaxone', 'ciprofloxacin', 'cipro', 'levofloxacin', 'levomac',
  'ofloxacin', 'oflox', 'metronidazole', 'flagyl', 'doxycycline', 'dox', 'clindamycin', 'erythromycin',
  'paracetamol', 'dolo', 'calpol', 'crocin', 'pacimol', 'combiflam', 'ibuprofen', 'brufen', 'diclofenac',
  'voveran', 'aceclofenac', 'zerodol', 'tramadol', 'ultram', 'naproxen', 'mefenamic', 'meftal',
  'pantoprazole', 'pan', 'pan-d', 'pantocid', 'pantosec', 'omeprazole', 'omez', 'rabeprazole', 'rabekind',
  'esomeprazole', 'nexpro', 'ranitidine', 'aciloc', 'famotidine', 'digene', 'gelusil', 'sucralfate',
  'ondansetron', 'emeset', 'domperidone', 'vomistop', 'metoclopramide', 'perinorm',
  'cetirizine', 'cetzine', 'okacet', 'levocetirizine', 'levocet', 'montelukast', 'montek', 'montek-lc', 'montair-lc',
  'fexofenadine', 'allegra', 'bilastine', 'hydroxyzine', 'atarax',
  'ascoril', 'ascoril-ls', 'benadryl', 'alex', 'grilinctus', 'ambroxol', 'bromhexine', 'guaifenesin',
  'salbutamol', 'asthalin', 'budesonide', 'budecort', 'formoterol', 'foracort', 'seretide', 'duolin',
  'metformin', 'glycomet', 'glimepiride', 'amaryl', 'teneligliptin', 'vildagliptin', 'galvus', 'dapagliflozin', 'forxiga', 'empagliflozin', 'jardiance', 'insulin',
  'telmisartan', 'telma', 'amlodipine', 'amlong', 'losartan', 'losar', 'enalapril', 'ramipril', 'cardace',
  'atenolol', 'metoprolol', 'betaloc', 'nebivolol', 'propranolol', 'inderal',
  'atorvastatin', 'atorva', 'lipitor', 'rosuvastatin', 'rosuvas', 'fenofibrate',
  'multivitamin', 'becosules', 'neurobion', 'neurobion forte', 'vitamin c', 'limcee', 'celin', 'vitamin d3', 'calcirol', '60k',
  'shelcal', 'cipcal', 'zinc', 'zincovit', 'folic acid', 'autrin', 'orofer', 'supradyn'
];

const NON_MEDICINE_PATTERNS = [
  /\b(?:hospital|clinic|healthcare|dispensary|center|centre|institute|nursing home)\b/i,
  /\b(?:dr\.|doctor|mbbs|md|ms|dnb|bams|bhms|frcs|physician|surgeon|reg(?:istration)?\s*(?:no|\.?))\b/i,
  /\b(?:patient|name|age|gender|sex|male|female|dob|phone|mobile|address|weight|height|bp|pulse|spo2)\b/i,
  /\b(?:diagnosis|impression|symptoms|chief complaint|history|c\/o|k\/c\/o|investigation|rx:?$)\b/i,
  /\b(?:advice|instructions?|notes?|follow[ -]?up|review|sign(?:ature)?)\b/i
];

export function parseMedicalPrescription(rawText: string): ParsedPrescription {
  if (!rawText || !rawText.trim()) {
    return {
      correctedText: '',
      summary: 'No prescription text detected.',
      medicines: [],
      importantFindings: ['No clear text detected in the document.'],
      tags: ['General Care']
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const medicines: ParsedMedicine[] = [];
  const findings: string[] = [];
  const tagsSet = new Set<string>();

  let doctorNotes = '';
  let diagnosisText = '';
  let inRxSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check diagnosis
    if (/\b(?:Diagnosis|Impression|Symptoms?|Complaints?)\b/i.test(line)) {
      diagnosisText = line.replace(/^(?:Diagnosis|Impression|Symptoms?|Complaints?):?\s*/i, '').trim();
    }

    // Check Rx section start
    if (/\b(?:Rx:?|Prescription|Medications?|Treatment|Medicines?)\b/i.test(line)) {
      inRxSection = true;
    }

    // Check advice / follow up
    if (/\b(?:Advice|Notes?|Follow[ -]?up|Instructions?|Review)\b/i.test(line)) {
      inRxSection = false;
      const advicePart = line.replace(/^(?:Advice|Notes?|Follow[ -]?up|Instructions?|Review):?\s*/i, '').trim();
      if (advicePart) {
        doctorNotes += (doctorNotes ? ' ' : '') + advicePart;
      }
      continue;
    }

    // Try parsing medicine from line
    const parsedMed = extractMedicineFromLine(line, inRxSection);
    if (parsedMed) {
      // Avoid duplicate medicine names
      const existing = medicines.find(m => m.name.toLowerCase() === parsedMed.name.toLowerCase());
      if (!existing) {
        medicines.push(parsedMed);
      }
    }
  }

  // If no medicines found with structured line parse, try multi-token search
  if (medicines.length === 0) {
    const fallbackMeds = extractMedicinesFromUnstructuredText(rawText);
    medicines.push(...fallbackMeds);
  }

  // Generate automated clinical tags based on medications and keywords
  detectTags(rawText, medicines, tagsSet);

  // Generate important clinical findings & warnings
  generateFindings(rawText, medicines, findings);

  // Generate summary
  const summary = generateSummary(medicines, doctorNotes, diagnosisText);

  // Clean and format text
  const correctedText = cleanAndFormatText(rawText);

  return {
    correctedText,
    summary,
    medicines,
    importantFindings: findings.length > 0 ? findings : ['Review prescription dosage with patient.'],
    tags: tagsSet.size > 0 ? Array.from(tagsSet) : ['General Care']
  };
}

function extractMedicineFromLine(line: string, inRxSection: boolean): ParsedMedicine | null {
  // Check non-medicine lines
  const isNonMedicine = NON_MEDICINE_PATTERNS.some(pat => pat.test(line));
  
  const formMatch = line.match(new RegExp(`\\b(${FORM_PREFIXES.join('|')})\\b`, 'i'));
  const containsKnownDrug = KNOWN_DRUGS.some(drug => new RegExp(`\\b${drug}\\b`, 'i').test(line));
  const strengthMatch = line.match(/\b(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|iu|%|gm|units))\b/i);

  // If line matches non-medicine headers and doesn't explicitly start with a drug/form, skip it
  if (isNonMedicine && !formMatch && !containsKnownDrug) {
    return null;
  }

  // If we have neither a form prefix, known drug, nor dosage strength, it's not a medicine
  if (!formMatch && !containsKnownDrug && !strengthMatch) {
    return null;
  }

  // Check frequency pattern: 1-0-1, 1-1-1, OD, BD, TDS, SOS, etc.
  const frequencyMatch = line.match(/\b(1-0-1|1-1-1|0-0-1|1-0-0|0-1-0|1-0-1-0|1\/2-0-1\/2|OD|BD|BID|TDS|TID|QID|SOS|PRN|HS|QHS|STAT|once daily|twice daily|thrice daily|three times daily|before food|after food|before breakfast|empty stomach|at bedtime)\b/i);

  // Check duration: for 5 days, 5 days, 1 week, etc.
  const durationMatch = line.match(/\b(?:for\s+)?(\d+\s*(?:days?|weeks?|months?))\b/i);

  // Clean initial numbers / bullet points: "1.", "1)", "-", "•", "Rx:"
  let cleanLine = line.replace(/^(?:[0-9]+[.)]\s*|[-*•]\s*|Rx:?\s*)/i, '').trim();

  // Extract dosage
  let dosage = '';
  if (strengthMatch) {
    dosage = strengthMatch[1].trim();
  } else {
    const qtyMatch = cleanLine.match(/\b(\d+\s*(?:tab|tablet|cap|capsule|puff|drop|spoon|tsp|tbsp)s?)\b/i);
    if (qtyMatch) dosage = qtyMatch[1].trim();
    else dosage = '1 Unit';
  }

  // Extract frequency
  let frequency = '';
  if (frequencyMatch) {
    frequency = frequencyMatch[1].trim();
    if (durationMatch) {
      frequency += ` (${durationMatch[0].trim()})`;
    }
  } else if (durationMatch) {
    frequency = durationMatch[0].trim();
  } else if (/\b(?:morning|night|evening|afternoon)\b/i.test(cleanLine)) {
    const timeMatch = cleanLine.match(/\b(?:morning|night|evening|afternoon|daily)\b/gi);
    frequency = timeMatch ? timeMatch.join(', ') : 'Daily';
  } else {
    frequency = 'As prescribed';
  }

  // Determine medicine name by isolating text before hyphen or dosage frequency
  let nameCandidate = cleanLine;

  if (nameCandidate.includes(' - ')) {
    nameCandidate = nameCandidate.split(' - ')[0];
  } else if (nameCandidate.includes(' – ')) {
    nameCandidate = nameCandidate.split(' – ')[0];
  }

  // Remove trailing details
  nameCandidate = nameCandidate.replace(/[:,-]+$/, '').trim();

  // If candidate is too long, extract primary drug name
  if (nameCandidate.split(/\s+/).length > 5) {
    nameCandidate = nameCandidate.split(/\s+/).slice(0, 4).join(' ');
  }

  const medName = capitalizeTitle(nameCandidate);
  if (!medName || medName.length < 2) return null;

  return {
    name: medName,
    dosage: dosage || '1 Unit',
    frequency: frequency || 'OD (Once daily)',
    uncertain: !containsKnownDrug && !strengthMatch
  };
}

function extractMedicinesFromUnstructuredText(text: string): ParsedMedicine[] {
  const list: ParsedMedicine[] = [];

  for (const drug of KNOWN_DRUGS) {
    const regex = new RegExp(`\\b(${drug})\\b(?:\\s+([0-9]+\\s*(?:mg|g|mcg|ml)))?`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const drugName = capitalizeTitle(match[1]);
      const strength = match[2] ? match[2].trim() : 'As directed';

      if (!list.some(m => m.name.toLowerCase() === drugName.toLowerCase())) {
        list.push({
          name: drugName,
          dosage: strength,
          frequency: 'As directed',
          uncertain: false
        });
      }
    }
  }

  return list;
}

function detectTags(text: string, medicines: ParsedMedicine[], tags: Set<string>) {
  const lowerText = text.toLowerCase();
  const medNames = medicines.map(m => m.name.toLowerCase()).join(' ');

  if (/amoxicillin|augmentin|azithromycin|cefixime|cefpodoxime|ciprofloxacin|levofloxacin|ofloxacin|doxycycline|antibiotic/i.test(medNames + ' ' + lowerText)) {
    tags.add('Antibiotic');
  }

  if (/paracetamol|dolo|calpol|crocin|fever|antipyretic/i.test(medNames + ' ' + lowerText)) {
    tags.add('Antipyretic');
    tags.add('Fever');
  }

  if (/combiflam|ibuprofen|diclofenac|aceclofenac|tramadol|naproxen|meftal|pain|analgesic/i.test(medNames + ' ' + lowerText)) {
    tags.add('Pain Management');
  }

  if (/pantoprazole|pan|pan-d|omeprazole|rabeprazole|esomeprazole|ranitidine|antacid|acidity|gastric|gerd/i.test(medNames + ' ' + lowerText)) {
    tags.add('Gastrointestinal');
  }

  if (/cetirizine|cetzine|levocetirizine|montelukast|allegra|fexofenadine|allergy|allergic/i.test(medNames + ' ' + lowerText)) {
    tags.add('Allergy');
  }

  if (/ascoril|cough|cold|benadryl|alex|grilinctus|inhaler|salbutamol|asthalin|budesonide|respiratory|bronchitis|asthma/i.test(medNames + ' ' + lowerText)) {
    tags.add('Respiratory');
  }

  if (/metformin|glycomet|glimepiride|diabetes|diabetic|sugar|insulin/i.test(medNames + ' ' + lowerText)) {
    tags.add('Diabetic Care');
  }

  if (/telmisartan|amlodipine|losartan|atenolol|hypertension|bp|blood pressure|cardiac/i.test(medNames + ' ' + lowerText)) {
    tags.add('Cardiovascular');
  }

  if (/multivitamin|becosules|neurobion|vitamin|calcium|shelcal|zinc|zincovit|supplement/i.test(medNames + ' ' + lowerText)) {
    tags.add('Supplements');
  }

  if (/pediatric|child|infant|syrup|drop/i.test(lowerText) && /syp|syrup|drops/i.test(medNames)) {
    tags.add('Pediatric');
  }

  if (tags.size === 0) {
    tags.add('General Care');
  }
}

function generateFindings(text: string, medicines: ParsedMedicine[], findings: string[]) {
  const lowerText = text.toLowerCase();
  const medNames = medicines.map(m => m.name.toLowerCase()).join(' ');

  // Antibiotic warnings
  if (/amoxicillin|augmentin|azithromycin|cefixime|ciprofloxacin|levofloxacin|doxycycline/i.test(medNames)) {
    findings.push('Complete the full course of antibiotics as prescribed to prevent drug resistance.');
  }

  // Antacid timing
  if (/pantoprazole|pan|pan-d|omeprazole|rabeprazole|esomeprazole/i.test(medNames)) {
    findings.push('Take gastroprotective medication 30 minutes before breakfast / food.');
  }

  // Painkiller / Antipyretic advice
  if (/paracetamol|dolo|combiflam|ibuprofen|diclofenac/i.test(medNames)) {
    findings.push('Take antipyretic/analgesic after meals; use SOS (when required) if fever or pain subsides.');
  }

  // Allergy / Drowsiness warnings
  if (/cetirizine|cetzine|levocetirizine|hydroxyzine|atarax/i.test(medNames)) {
    findings.push('Antihistamines may cause slight sedation; avoid operating heavy machinery if drowsy.');
  }

  // General advice detected
  if (lowerText.includes('warm water') || lowerText.includes('drink water') || lowerText.includes('hydration')) {
    findings.push('Maintain adequate hydration and drink plenty of fluids.');
  }
  if (lowerText.includes('steam') || lowerText.includes('inhalation')) {
    findings.push('Steam inhalation recommended for airway relief.');
  }
  if (lowerText.includes('rest') || lowerText.includes('bed rest')) {
    findings.push('Adequate physical rest recommended.');
  }
  if (lowerText.includes('review') || lowerText.includes('follow up') || lowerText.includes('follow-up')) {
    const reviewMatch = text.match(/(?:review|follow[ -]?up|consult)\s+(?:after|in)?\s*([0-9]+\s*(?:days?|weeks?))/i);
    if (reviewMatch) {
      findings.push(`Clinical follow-up scheduled after ${reviewMatch[1]}.`);
    } else {
      findings.push('Follow up with the doctor if symptoms persist or worsen.');
    }
  }
}

function generateSummary(medicines: ParsedMedicine[], doctorNotes: string, diagnosisText: string): string {
  if (medicines.length === 0) {
    return 'Prescription digitized. No standard medications identified; please review raw OCR text.';
  }

  const medListStr = medicines.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join(', ');
  let summary = '';

  if (diagnosisText) {
    summary += `Diagnosis: ${diagnosisText}. `;
  }

  summary += `Prescribed ${medicines.length} medication${medicines.length > 1 ? 's' : ''}: ${medListStr}.`;

  if (doctorNotes) {
    summary += ` Doctor's advice: ${doctorNotes}.`;
  }

  return summary;
}

function cleanAndFormatText(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function capitalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Discrepancy Detector
 * Compares company details from the database against data extracted from the website Impressum.
 * Flags mismatches and auto-learns missing fields.
 */

function detectDiscrepancies(dbDetails, impressumData) {
  if (!impressumData || Object.keys(impressumData).length === 0) {
    return { discrepancies: [], extracted: {} };
  }

  const fieldMap = [
    { db: 'registered_address', web: 'address', label: 'Registered Address' },
    { db: 'lead_director', web: 'director', label: 'Lead Director' },
    { db: 'company_number', web: 'registration', label: 'Company Number' },
    { db: 'vat_number', web: 'vat', label: 'VAT Number' },
    { db: 'registered_email', web: 'email', label: 'Email' },
    { db: 'registered_phone', web: 'phone', label: 'Phone' },
  ];

  const discrepancies = [];

  if (!dbDetails) {
    return { discrepancies: [], extracted: impressumData, autoLearn: impressumData };
  }

  const autoLearn = {};

  for (const { db, web, label } of fieldMap) {
    const dbValue = (dbDetails[db] || '').trim();
    const webValue = (impressumData[web] || '').trim();

    if (!webValue) continue;

    if (!dbValue) {
      // Auto-learn: DB is empty, website has data
      autoLearn[db] = webValue;
    } else {
      // Compare: both have values
      const dbNorm = normalize(dbValue);
      const webNorm = normalize(webValue);
      if (dbNorm !== webNorm && !dbNorm.includes(webNorm) && !webNorm.includes(dbNorm)) {
        discrepancies.push({
          field: label,
          dbField: db,
          dbValue,
          websiteValue: webValue,
          severity: ['registered_address', 'lead_director', 'company_number'].includes(db) ? 'critical' : 'warning'
        });
      }
    }
  }

  return { discrepancies, extracted: impressumData, autoLearn };
}

function normalize(str) {
  return str.toLowerCase()
    .replace(/[,.\-\/\\()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { detectDiscrepancies };

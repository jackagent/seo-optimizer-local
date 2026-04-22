/**
 * Sentinel — Internationalization (i18n)
 * German (default) and English language support.
 */

const TRANSLATIONS = {
  de: {
    // Sidebar
    'nav.commandCenter': 'Übersicht',
    'nav.portfolioGrid': 'Portfolio-Raster',
    'nav.companies': 'Unternehmen',
    'nav.scanAll': 'Alle scannen',
    'nav.discrepancies': 'Abweichungen',
    'nav.reports': 'Berichte',
    'nav.export': 'Export',
    'nav.overview': 'Übersicht',
    'nav.management': 'Verwaltung',
    'nav.intelligence': 'Analyse',

    // Sidebar footer
    'sidebar.administrator': 'Administrator',
    'sidebar.portfolioManager': 'Portfolio Manager',
    'sidebar.subtitle': 'Compliance Intelligence',

    // Header
    'header.scanAll': 'Alle scannen',
    'header.addCompany': 'Unternehmen hinzufügen',

    // Page titles
    'page.commandCenter': 'Übersicht',
    'page.commandCenter.sub': 'Portfolio-Übersicht',
    'page.portfolioGrid': 'Portfolio-Raster',
    'page.portfolioGrid.sub': 'Alle Unternehmen im Überblick',
    'page.companies': 'Unternehmen',
    'page.companies.sub': 'Portfolio-Verwaltung',
    'page.discrepancies': 'Abweichungen',
    'page.discrepancies.sub': 'Datenintegritäts-Warnungen',
    'page.companyDetail': 'Unternehmensdetail',

    // Stats
    'stats.portfolioCompanies': 'Portfolio-Unternehmen',
    'stats.avgScore': 'Durchschnittliche Bewertung',
    'stats.criticalIssues': 'Kritische Probleme',
    'stats.scansToday': 'Scans heute',

    // Discrepancy banner
    'disc.detected': 'DATENABWEICHUNGEN ERKANNT',
    'disc.mismatch': 'Abweichung',
    'disc.mismatches': 'Abweichungen',
    'disc.across': 'bei',
    'disc.company': 'Unternehmen',
    'disc.companies': 'Unternehmen',
    'disc.field': 'Feld',
    'disc.dbRecord': 'Datenbank',
    'disc.liveWebsite': 'Live-Website',
    'disc.severity': 'Schweregrad',
    'disc.noDiscrepancies': 'Keine Abweichungen',
    'disc.allMatch': 'Alle Unternehmensdaten stimmen mit den Live-Websites überein. Führe regelmäßig Scans durch, um die Überwachung fortzusetzen.',

    // Tutorial
    'tutorial.title': 'Tutorial: Meridian Ventures ist ein Demo-Unternehmen',
    'tutorial.desc': 'Klicke auf Meridian Ventures, um Scan-Ergebnisse, rechtliche Compliance, Dokumente und den Fix-Prompt-Generator zu erkunden. Wenn Du bereit bist, füge Deine eigenen Unternehmen hinzu und lösche die Demo.',

    // Company card
    'card.noScan': 'Noch nicht gescannt',
    'card.noScanClick': 'Noch nicht gescannt — klicken zum Scannen',
    'card.scanned': 'Gescannt',
    'card.pagesCrawled': 'Seiten gecrawlt',

    // Onboarding
    'onboard.welcome': 'Willkommen bei Sentinel',
    'onboard.subtitle': 'Deine Enterprise-Compliance-Intelligence-Plattform. Überwache SEO-Performance, rechtliche Compliance und Datenintegrität Deines gesamten Portfolios von einer zentralen Übersicht aus.',
    'onboard.feature1.title': 'Tiefgehende Website-Analyse',
    'onboard.feature1.desc': 'Automatisches Crawling mit SEO-Bewertung, Meta-Analyse, technischen Audits und seitenweisen Erkenntnissen.',
    'onboard.feature2.title': 'Rechtliche Compliance',
    'onboard.feature2.desc': 'Impressum, Datenschutzerklärung, AGB und DSGVO-Cookie-Consent-Prüfung.',
    'onboard.feature3.title': 'Abweichungserkennung',
    'onboard.feature3.desc': 'Automatischer Abgleich Deiner Daten mit den Live-Website-Daten. Auto-Learn aus Impressum-Seiten.',
    'onboard.addFirst': 'Erstes Unternehmen hinzufügen',
    'onboard.tryDemo': 'Mit Demo starten',

    // Company detail
    'detail.back': 'Zurück zum Portfolio',
    'detail.rescan': 'Erneut scannen',
    'detail.fixPrompt': 'Fix-Prompt',
    'detail.edit': 'Bearbeiten',
    'detail.discrepancy': 'DATENABWEICHUNG',
    'detail.between': 'zwischen Datenbank und Live-Website',

    // Tabs
    'tab.issues': 'Probleme',
    'tab.legal': 'Rechtliche Compliance',
    'tab.info': 'Unternehmensdaten',
    'tab.docs': 'Dokumente',
    'tab.history': 'Scan-Verlauf',

    // Issues
    'issues.noIssues': 'Keine Probleme erkannt',
    'issues.runScan': 'Führe einen Scan durch, um Probleme zu erkennen',

    // Legal
    'legal.impressum': 'Impressum',
    'legal.privacy': 'Datenschutzerklärung',
    'legal.terms': 'AGB',
    'legal.cookieBanner': 'Cookie-Banner',
    'legal.found': 'Vorhanden',
    'legal.missing': 'Fehlt',
    'legal.viewPage': 'Seite ansehen',
    'legal.cookieScore': 'Cookie-Compliance-Bewertung',
    'legal.rejectAll': 'Alle ablehnen',
    'legal.granular': 'Detailauswahl',
    'legal.necessary': 'Nur notwendige',
    'legal.cookiePolicy': 'Cookie-Richtlinie',
    'legal.runScan': 'Führe einen Scan durch, um die rechtliche Compliance zu prüfen',

    // Company info
    'info.companyNumber': 'Handelsregisternummer',
    'info.companyType': 'Rechtsform',
    'info.jurisdiction': 'Registergericht',
    'info.address': 'Registrierte Adresse',
    'info.incDate': 'Gründungsdatum',
    'info.vat': 'USt-IdNr.',
    'info.email': 'E-Mail',
    'info.phone': 'Telefon',
    'info.director': 'Geschäftsführer',
    'info.directorTitle': 'Titel des Geschäftsführers',
    'info.localDirector': 'Prokurist/in',
    'info.shareCapital': 'Stammkapital',
    'info.shareType': 'Einlageart',
    'info.shareCount': 'Anzahl Anteile',
    'info.notSpecified': 'Nicht angegeben',
    'info.editDetails': 'Details bearbeiten',
    'info.noDetails': 'Keine Unternehmensdaten gespeichert',
    'info.noDetailsDesc': 'Führe einen Scan durch, um Details automatisch aus dem Impressum zu extrahieren, oder füge sie manuell hinzu.',
    'info.addDetails': 'Unternehmensdaten hinzufügen',

    // Documents
    'docs.upload': 'Dokument hochladen',
    'docs.view': 'Ansehen',
    'docs.delete': 'Löschen',
    'docs.noDocs': 'Noch keine Dokumente hochgeladen',

    // Scan history
    'history.score': 'Bewertung',
    'history.noHistory': 'Kein Scan-Verlauf',

    // Modals
    'modal.addCompany': 'Unternehmen hinzufügen',
    'modal.addCompany.desc': 'Füge ein Unternehmen zu Deinem Portfolio hinzu. Ein Scan wird nach der Erstellung automatisch gestartet.',
    'modal.companyName': 'Unternehmensname',
    'modal.websiteUrl': 'Website-URL',
    'modal.sector': 'Branche',
    'modal.platform': 'Hosting-Plattform',
    'modal.description': 'Beschreibung',
    'modal.cancel': 'Abbrechen',
    'modal.addAndScan': 'Hinzufügen & Scannen',
    'modal.editCompany': 'Unternehmen bearbeiten',
    'modal.save': 'Speichern',
    'modal.uploadDoc': 'Dokument hochladen',
    'modal.uploadDoc.desc': 'Lade Unternehmensdokumente wie Zertifikate, Registrierungen oder rechtliche Unterlagen hoch.',
    'modal.file': 'Datei',
    'modal.category': 'Kategorie',
    'modal.docDesc': 'Beschreibung',
    'modal.uploadBtn': 'Hochladen',
    'modal.companyDetails': 'Unternehmensdaten',
    'modal.companyDetails.desc': 'Gib die offiziellen Registrierungsdaten ein. Diese werden bei Scans mit dem Live-Website-Impressum verglichen.',

    // Fix prompt
    'fix.title': 'Alle Probleme beheben — KI-Prompt',
    'fix.desc': 'Kopiere diesen Prompt und füge ihn in einen KI-Agenten ein, um alle erkannten Probleme auf einmal zu beheben.',
    'fix.critical': 'Kritisch',
    'fix.warnings': 'Warnungen',
    'fix.totalIssues': 'Probleme gesamt',
    'fix.characters': 'Zeichen',
    'fix.noPrompt': 'Kein Prompt generiert',
    'fix.close': 'Schließen',
    'fix.copy': 'Prompt kopieren',
    'fix.copied': 'Prompt in die Zwischenablage kopiert!',

    // Actions / Toasts
    'toast.scanStarted': 'Scan gestartet — dies kann 1–2 Minuten dauern...',
    'toast.scanComplete': 'Scan abgeschlossen! Bewertung:',
    'toast.scanFailed': 'Scan fehlgeschlagen — prüfe die Server-Logs',
    'toast.scanAllStarted': 'Alle Unternehmen werden gescannt — dies dauert einige Minuten...',
    'toast.scansQueued': 'Scans in Warteschlange',
    'toast.companyAdded': 'hinzugefügt! Scan wird gestartet...',
    'toast.companyUpdated': 'Unternehmen aktualisiert',
    'toast.companyDeleted': 'gelöscht',
    'toast.docUploaded': 'Dokument hochgeladen',
    'toast.docDeleted': 'Dokument gelöscht',
    'toast.detailsSaved': 'Unternehmensdaten gespeichert',
    'toast.demoCreated': 'Demo-Unternehmen erstellt! Scan wird gestartet...',
    'toast.connectionError': 'Verbindungsfehler. Bitte prüfe den Server.',
    'toast.comingSoon': 'Modul kommt in v2.1',

    // Delete confirm
    'confirm.delete': 'löschen?\n\nAlle Scans, Dokumente und Unternehmensdaten werden dauerhaft entfernt.',
    'confirm.deleteDoc': 'Dieses Dokument löschen?',

    // Document categories
    'cat.incorporation': 'Gründung',
    'cat.governance': 'Governance',
    'cat.tax': 'Steuern',
    'cat.legal': 'Recht',
    'cat.financial': 'Finanzen',
    'cat.compliance': 'Compliance',
    'cat.other': 'Sonstiges',

    // Scores
    'score.overall': 'Gesamt',
    'score.meta': 'Meta',
    'score.content': 'Inhalt',
    'score.technical': 'Technik',
    'score.legal': 'Recht',

    // Language
    'lang.switch': 'English',
    'lang.current': 'DE',

    // Placeholders
    'ph.companyName': 'z.B. Acme Corp GmbH',
    'ph.url': 'z.B. acme-corp.de',
    'ph.sector': 'z.B. FinTech, Health, KI',
    'ph.platform': 'z.B. WordPress, Shopify, Eigenbau',
    'ph.description': 'Kurze Beschreibung des Unternehmens...',
    'ph.docDesc': 'Optionale Beschreibung',
    'ph.companyNumber': '',
    'ph.companyType': 'z.B. GmbH, UG, AG',
    'ph.jurisdiction': '',
    'ph.incDate': 'TT.MM.JJJJ',
    'ph.directorTitle': 'z.B. Geschäftsführer, CEO',

    // Empty states
    'empty.noCompanies': 'Keine Unternehmen vorhanden',
    'empty.noCompaniesDesc': 'Füge Dein erstes Unternehmen hinzu, um loszulegen.',
    'empty.noData': 'Daten konnten nicht geladen werden',
    'empty.noDataDesc': 'Prüfe, ob der Server auf dem richtigen Port läuft.',
    'empty.noDashboard': 'Keine Unternehmen vorhanden',
    'empty.noDashboardDesc': 'Füge Unternehmen hinzu, um das Portfolio-Raster zu sehen.',
  },

  en: {
    'nav.commandCenter': 'Command Center',
    'nav.portfolioGrid': 'Portfolio Grid',
    'nav.companies': 'Companies',
    'nav.scanAll': 'Scan All',
    'nav.discrepancies': 'Discrepancies',
    'nav.reports': 'Reports',
    'nav.export': 'Export',
    'nav.overview': 'Overview',
    'nav.management': 'Management',
    'nav.intelligence': 'Intelligence',

    'sidebar.administrator': 'Administrator',
    'sidebar.portfolioManager': 'Portfolio Manager',
    'sidebar.subtitle': 'Compliance Intelligence',

    'header.scanAll': 'Scan All',
    'header.addCompany': 'Add Company',

    'page.commandCenter': 'Command Center',
    'page.commandCenter.sub': 'Portfolio Overview',
    'page.portfolioGrid': 'Portfolio Grid',
    'page.portfolioGrid.sub': 'All Companies at a Glance',
    'page.companies': 'Companies',
    'page.companies.sub': 'Manage Portfolio Entities',
    'page.discrepancies': 'Discrepancies',
    'page.discrepancies.sub': 'Data Integrity Alerts',
    'page.companyDetail': 'Company Detail',

    'stats.portfolioCompanies': 'Portfolio Companies',
    'stats.avgScore': 'Average Score',
    'stats.criticalIssues': 'Critical Issues',
    'stats.scansToday': 'Scans Today',

    'disc.detected': 'DATA DISCREPANCIES DETECTED',
    'disc.mismatch': 'mismatch',
    'disc.mismatches': 'mismatches',
    'disc.across': 'across',
    'disc.company': 'company',
    'disc.companies': 'companies',
    'disc.field': 'Field',
    'disc.dbRecord': 'Database Record',
    'disc.liveWebsite': 'Live Website',
    'disc.severity': 'Severity',
    'disc.noDiscrepancies': 'No Discrepancies',
    'disc.allMatch': 'All company records match their live website data. Run scans regularly to keep monitoring.',

    'tutorial.title': 'Tutorial: Meridian Ventures is a demo company',
    'tutorial.desc': 'Click on Meridian Ventures to explore scan results, legal compliance, documents, and the fix prompt generator. When ready, add your own companies and delete the demo.',

    'card.noScan': 'No scan yet',
    'card.noScanClick': 'Not yet scanned — click to scan',
    'card.scanned': 'Scanned',
    'card.pagesCrawled': 'pages crawled',

    'onboard.welcome': 'Welcome to Sentinel',
    'onboard.subtitle': 'Your enterprise compliance intelligence platform. Monitor SEO performance, legal compliance, and data integrity across your entire portfolio from a single command center.',
    'onboard.feature1.title': 'Deep Website Scanning',
    'onboard.feature1.desc': 'Automated crawling with SEO scoring, meta analysis, technical audits, and page-level insights.',
    'onboard.feature2.title': 'Legal Compliance',
    'onboard.feature2.desc': 'Impressum, Privacy Policy, Terms of Service, and GDPR cookie consent verification.',
    'onboard.feature3.title': 'Discrepancy Detection',
    'onboard.feature3.desc': 'Cross-reference your records against live website data. Auto-learn from Impressum pages.',
    'onboard.addFirst': 'Add Your First Company',
    'onboard.tryDemo': 'Try with Demo',

    'detail.back': 'Back to Portfolio',
    'detail.rescan': 'Re-scan',
    'detail.fixPrompt': 'Fix Prompt',
    'detail.edit': 'Edit',
    'detail.discrepancy': 'DATA DISCREPANCY',
    'detail.between': 'between database and live website',

    'tab.issues': 'Issues',
    'tab.legal': 'Legal Compliance',
    'tab.info': 'Company Info',
    'tab.docs': 'Documents',
    'tab.history': 'Scan History',

    'issues.noIssues': 'No issues detected',
    'issues.runScan': 'Run a scan to detect issues',

    'legal.impressum': 'Impressum',
    'legal.privacy': 'Privacy Policy',
    'legal.terms': 'Terms of Service',
    'legal.cookieBanner': 'Cookie Banner',
    'legal.found': 'Found',
    'legal.missing': 'Missing',
    'legal.viewPage': 'View Page',
    'legal.cookieScore': 'Cookie Compliance Score',
    'legal.rejectAll': 'Reject All',
    'legal.granular': 'Granular Choices',
    'legal.necessary': 'Necessary Only',
    'legal.cookiePolicy': 'Cookie Policy',
    'legal.runScan': 'Run a scan to check legal compliance',

    'info.companyNumber': 'Company Number',
    'info.companyType': 'Company Type',
    'info.jurisdiction': 'Jurisdiction',
    'info.address': 'Registered Address',
    'info.incDate': 'Incorporation Date',
    'info.vat': 'VAT Number',
    'info.email': 'Email',
    'info.phone': 'Phone',
    'info.director': 'Lead Director',
    'info.directorTitle': 'Director Title',
    'info.localDirector': 'Local Director',
    'info.shareCapital': 'Share Capital',
    'info.shareType': 'Share Type',
    'info.shareCount': 'Share Count',
    'info.notSpecified': 'Not specified',
    'info.editDetails': 'Edit Details',
    'info.noDetails': 'No company details stored',
    'info.noDetailsDesc': 'Run a scan to auto-extract details from the Impressum, or add them manually.',
    'info.addDetails': 'Add Company Details',

    'docs.upload': 'Upload Document',
    'docs.view': 'View',
    'docs.delete': 'Delete',
    'docs.noDocs': 'No documents uploaded yet',

    'history.score': 'Score',
    'history.noHistory': 'No scan history',

    'modal.addCompany': 'Add Company',
    'modal.addCompany.desc': 'Add a company to your portfolio. A scan will start automatically after creation.',
    'modal.companyName': 'Company Name',
    'modal.websiteUrl': 'Website URL',
    'modal.sector': 'Sector',
    'modal.platform': 'Hosting Platform',
    'modal.description': 'Description',
    'modal.cancel': 'Cancel',
    'modal.addAndScan': 'Add & Start Scan',
    'modal.editCompany': 'Edit Company',
    'modal.save': 'Save Changes',
    'modal.uploadDoc': 'Upload Document',
    'modal.uploadDoc.desc': 'Upload company documents such as certificates, registrations, or legal files.',
    'modal.file': 'File',
    'modal.category': 'Category',
    'modal.docDesc': 'Description',
    'modal.uploadBtn': 'Upload',
    'modal.companyDetails': 'Company Details',
    'modal.companyDetails.desc': 'Enter official registration details. These are compared against the live website Impressum during scans.',

    'fix.title': 'Fix All Issues — AI Prompt',
    'fix.desc': 'Copy this prompt and paste it into any AI agent to fix all detected issues at once.',
    'fix.critical': 'Critical',
    'fix.warnings': 'Warnings',
    'fix.totalIssues': 'total issues',
    'fix.characters': 'characters',
    'fix.noPrompt': 'No prompt generated',
    'fix.close': 'Close',
    'fix.copy': 'Copy Prompt',
    'fix.copied': 'Prompt copied to clipboard!',

    'toast.scanStarted': 'Scan initiated — this may take 1–2 minutes...',
    'toast.scanComplete': 'Scan complete! Score:',
    'toast.scanFailed': 'Scan failed — check server logs',
    'toast.scanAllStarted': 'Scanning all companies — this will take several minutes...',
    'toast.scansQueued': 'scans queued',
    'toast.companyAdded': 'added! Starting scan...',
    'toast.companyUpdated': 'Company updated',
    'toast.companyDeleted': 'deleted',
    'toast.docUploaded': 'Document uploaded',
    'toast.docDeleted': 'Document deleted',
    'toast.detailsSaved': 'Company details saved',
    'toast.demoCreated': 'Demo company created! Starting scan...',
    'toast.connectionError': 'Connection error. Please check the server.',
    'toast.comingSoon': 'Module coming in v2.1',

    'confirm.delete': 'delete?\n\nThis will permanently remove all scans, documents, and company details.',
    'confirm.deleteDoc': 'Delete this document?',

    'cat.incorporation': 'Incorporation',
    'cat.governance': 'Governance',
    'cat.tax': 'Tax',
    'cat.legal': 'Legal',
    'cat.financial': 'Financial',
    'cat.compliance': 'Compliance',
    'cat.other': 'Other',

    'score.overall': 'Overall',
    'score.meta': 'Meta',
    'score.content': 'Content',
    'score.technical': 'Technical',
    'score.legal': 'Legal',

    'lang.switch': 'Deutsch',
    'lang.current': 'EN',

    'ph.companyName': 'e.g. Acme Corp GmbH',
    'ph.url': 'e.g. acme-corp.com',
    'ph.sector': 'e.g. FinTech, Health, AI',
    'ph.platform': 'e.g. WordPress, Shopify, Custom',
    'ph.description': 'Brief description of the company...',
    'ph.docDesc': 'Optional description',
    'ph.companyNumber': '',
    'ph.companyType': 'e.g. GmbH, Ltd, UG',
    'ph.jurisdiction': '',
    'ph.incDate': 'DD.MM.YYYY',
    'ph.directorTitle': 'e.g. Geschäftsführer, CEO',

    'empty.noCompanies': 'No companies yet',
    'empty.noCompaniesDesc': 'Add your first company to get started.',
    'empty.noData': 'Unable to load data',
    'empty.noDataDesc': 'Check that the server is running on the correct port.',
    'empty.noDashboard': 'No companies to display',
    'empty.noDashboardDesc': 'Add companies to see the portfolio grid.',
  }
};

// Current language — default German
let currentLang = localStorage.getItem('sentinel-lang') || 'de';

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('sentinel-lang', lang);
}

function getLang() {
  return currentLang;
}

function toggleLang() {
  const newLang = currentLang === 'de' ? 'en' : 'de';
  setLang(newLang);
  return newLang;
}

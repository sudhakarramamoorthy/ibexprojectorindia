import { LanguageCode } from '../types/projector';

export const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export interface TranslationStrings {
  brandTitle: string;
  navHome: string;
  navCalculator: string;
  navCatalog: string;
  navCompare: string;
  navTracker: string;
  navReport: string;
  signInGoogle: string;
  signOut: string;
  cloudSynced: string;
  localOfflineMode: string;
  quoteBag: string;
  calcHeadline: string;
  calcSubhead: string;
  dragHint: string;
  throwDistance: string;
  screenWidth: string;
  screenDiagonal: string;
  throwRatio: string;
  lensModelPreset: string;
  aspectRatio: string;
  roomLightingSection: string;
  lightIntensityLabel: string;
  lightDark: string;
  lightSemiLit: string;
  lightBright: string;
  ambientSourceLabel: string;
  surfaceFinishLabel: string;
  primaryPurposeLabel: string;
  purposeCinema: string;
  purposeGaming: string;
  purposeCasual: string;
  purposeAll: string;
  indiaConditionsSection: string;
  heatLabel: string;
  humidityLabel: string;
  powerLabel: string;
  recommendedModelsTitle: string;
  requiredBrightness: string;
  seatingRange: string;
  recommendedUps: string;
  saveConfiguration: string;
  generatePdfReport: string;
  compareSpec: string;
  trackPrice: string;
  viewDetails: string;
  addToQuoteBag: string;
  masterCatalogTitle: string;
  masterCatalogSub: string;
  searchPlaceholder: string;
  allBrands: string;
  allCategories: string;
  compareTitle: string;
  compareSub: string;
  trackerTitle: string;
  trackerSub: string;
  newsletterTitle: string;
  newsletterDesc: string;
  subscribeSubstack: string;
  installerReportTitle: string;
  printPdfAction: string;
}

const EN: TranslationStrings = {
  brandTitle: 'IbexProjectorsIndia',
  navHome: 'Home',
  navCalculator: 'Room Planner',
  navCatalog: 'Projector Catalog',
  navCompare: 'Compare Specs',
  navTracker: 'Price Tracker',
  navReport: 'Installer PDF',
  signInGoogle: 'Sign in with Google',
  signOut: 'Sign Out',
  cloudSynced: 'Cloud Synced',
  localOfflineMode: 'Offline Ready',
  quoteBag: 'Quote Bag',
  calcHeadline: 'Projector Throw Distance & Room Calibration',
  calcSubhead:
    'Drag the projector or screen edges directly on the optical canvas to calibrate throw distance, brightness, and India climate suitability.',
  dragHint: 'Drag projector or screen handle horizontally to calibrate in real time',
  throwDistance: 'Throw Distance',
  screenWidth: 'Screen Width',
  screenDiagonal: 'Screen Diagonal',
  throwRatio: 'Throw Ratio',
  lensModelPreset: 'Lens Model Preset',
  aspectRatio: 'Aspect Ratio',
  roomLightingSection: 'Room Lighting, Surface & Primary Purpose',
  lightIntensityLabel: 'Room Light Intensity',
  lightDark: 'Fully Dark Room',
  lightSemiLit: 'Semi-Lit Room',
  lightBright: 'Brightly Lit Room',
  ambientSourceLabel: 'Ambient Light Source',
  surfaceFinishLabel: 'Projection Surface Finish',
  primaryPurposeLabel: 'Primary Viewing Purpose',
  purposeCinema: 'Home Cinema',
  purposeGaming: 'Low-Lag Gaming',
  purposeCasual: 'Casual TV & OTT',
  purposeAll: 'All-Rounder Mix',
  indiaConditionsSection: 'India Environment & Power Conditions',
  heatLabel: 'Room Thermal / AC Profile',
  humidityLabel: 'Humidity & Urban Dust',
  powerLabel: 'Power Voltage Stability',
  recommendedModelsTitle: 'Recommended Projectors in India',
  requiredBrightness: 'Target Brightness',
  seatingRange: 'Ideal Seating',
  recommendedUps: 'Suggested UPS',
  saveConfiguration: 'Save Setup',
  generatePdfReport: 'Installer PDF',
  compareSpec: 'Compare',
  trackPrice: 'Track Price',
  viewDetails: 'Product Page',
  addToQuoteBag: 'Add to Bag',
  masterCatalogTitle: 'India Projector Brands & Models Directory',
  masterCatalogSub:
    'Browse verified projectors sold in India with ISO lumens, lens throw ratios, official India warranty, and live marketplace comparisons.',
  searchPlaceholder: 'Search brand, model, 4K, UST, laser...',
  allBrands: 'All Brands',
  allCategories: 'All Lens Types',
  compareTitle: 'Side-by-Side Specification Comparison',
  compareSub:
    'Compare up to 4 models across throw geometry for your room, ISO lumens, lens shift, India warranty, and Indian marketplace pricing.',
  trackerTitle: 'India Marketplace Price-Drop Tracker',
  trackerSub:
    'Track saved projectors across Amazon.in, Flipkart, Croma, Reliance Digital, and authorized Indian AV dealers with target price alerts.',
  newsletterTitle: 'India Projector Releases & Price-Drop Alerts',
  newsletterDesc:
    'Get verified launch alerts, festival sale price drops (Great Indian Festival / Big Billion Days), and technical lens guides.',
  subscribeSubstack: 'Subscribe on Substack',
  installerReportTitle: 'Professional Installer Optical & Site Report',
  printPdfAction: 'Print / Save as PDF',
};

const HI: TranslationStrings = {
  ...EN,
  navHome: 'होम',
  navCalculator: 'रूम प्लानर',
  navCatalog: 'प्रोजेक्टर कैटलॉग',
  navCompare: 'तुलना करें',
  navTracker: 'प्राइस ट्रैकर',
  navReport: 'इंस्टॉलर PDF',
  signInGoogle: 'Google से साइन इन करें',
  signOut: 'साइन आउट',
  cloudSynced: 'क्लाउड सिंक सक्रिय',
  localOfflineMode: 'ऑफ़लाइन तैयार',
  quoteBag: 'कोट बैग',
  calcHeadline: 'प्रोजेक्टर थ्रो दूरी और रूम कैलिब्रेशन',
  calcSubhead:
    'थ्रो दूरी, ब्राइटनेस और भारतीय मौसम के अनुसार सटीक प्रोजेक्टर चुनने के लिए प्रोजेक्टर या स्क्रीन को ड्रैग करें।',
  dragHint: 'रियल-टाइम कैलिब्रेशन के लिए प्रोजेक्टर या स्क्रीन हैंडल को ड्रैग करें',
  throwDistance: 'थ्रो दूरी (Throw Distance)',
  screenWidth: 'स्क्रीन चौड़ाई',
  screenDiagonal: 'स्क्रीन आकार (डायगोनल)',
  throwRatio: 'थ्रो रेशियो',
  lensModelPreset: 'लेंस मॉडल प्रीसेट',
  aspectRatio: 'आस्पेक्ट रेशियो',
  roomLightingSection: 'कमरे की रोशनी, सतह और मुख्य उपयोग',
  lightIntensityLabel: 'कमरे में प्रकाश स्तर',
  lightDark: 'पूरी तरह अंधेरा कमरा',
  lightSemiLit: 'हल्की रोशनी वाला कमरा',
  lightBright: 'तेज़ रोशनी वाला कमरा',
  ambientSourceLabel: 'आसपास की रोशनी का स्रोत',
  surfaceFinishLabel: 'प्रोजेक्शन सतह (स्क्रीन/दीवार)',
  primaryPurposeLabel: 'प्रोजेक्टर का मुख्य उद्देश्य',
  purposeCinema: 'होम सिनेमा',
  purposeGaming: 'गेमिंग (कम लैग)',
  purposeCasual: 'कैज़ुअल टीवी और OTT',
  purposeAll: 'सभी का मिश्रण',
  indiaConditionsSection: 'भारतीय तापमान, नमी और वोल्टेज स्थितियाँ',
  heatLabel: 'कमरे की गर्मी / AC स्थिति',
  humidityLabel: 'नमी और धूल (मानसून/तटीय)',
  powerLabel: 'बिजली और वोल्टेज स्थिरता',
  recommendedModelsTitle: 'भारत में अनुशंसित प्रोजेक्टर मॉडल',
  requiredBrightness: 'आवश्यक ब्राइटनेस',
  seatingRange: 'आदर्श बैठने की दूरी',
  recommendedUps: 'सुझाया गया UPS',
  saveConfiguration: 'सेटअप सेव करें',
  generatePdfReport: 'इंस्टॉलर PDF रिपोर्ट',
  compareSpec: 'तुलना में जोड़ें',
  trackPrice: 'प्राइस ट्रैक करें',
  viewDetails: 'प्रोडक्ट पेज',
  addToQuoteBag: 'बैग में जोड़ें',
  masterCatalogTitle: 'भारत में उपलब्ध प्रोजेक्टर ब्रांड्स और मॉडल',
  masterCatalogSub:
    'ISO ल्यूमेन, लेंस थ्रो रेशियो, आधिकारिक इंडिया वारंटी और भारतीय मार्केटप्लेस कीमतों के साथ सभी मॉडल देखें।',
  searchPlaceholder: 'ब्रांड, मॉडल, 4K, लेज़र खोजें...',
  allBrands: 'सभी ब्रांड',
  allCategories: 'सभी लेंस प्रकार',
  compareTitle: 'स्पेसिफिकेशन की सीधी तुलना',
  trackerTitle: 'प्राइस-ड्रॉप ट्रैकिंग डैशबोर्ड',
  newsletterTitle: 'नए प्रोजेक्टर लॉन्च और डिस्काउंट अलर्ट',
  subscribeSubstack: 'Substack पर सब्सक्राइब करें',
  installerReportTitle: 'प्रोफेशनल इंस्टॉलर ऑप्टिकल रिपोर्ट',
  printPdfAction: 'PDF प्रिंट / सेव करें',
};

const TA: TranslationStrings = {
  ...EN,
  navHome: 'முகப்பு',
  navCalculator: 'அறை திட்டமிடல்',
  navCatalog: 'புரொஜெக்டர் பட்டியல்',
  navCompare: 'ஒப்பிடு',
  navTracker: 'விலை கண்காணிப்பு',
  navReport: 'நிறுவனர் PDF',
  signInGoogle: 'Google உள்நுழைவு',
  signOut: 'வெளியேறு',
  calcHeadline: 'புரொஜெக்டர் த்ரோ தூரம் & அறை அளவீடு',
  calcSubhead:
    'த்ரோ தூரம், பிரகாசம் மற்றும் இந்திய காலநிலைக்கு ஏற்ற புரொஜெக்டரை கணக்கிட புரொஜெக்டர் அல்லது திரையை இழுக்கவும்.',
  dragHint: 'நேரடி அளவீட்டிற்கு புரொஜெக்டர் அல்லது திரை முனையை இழுக்கவும்',
  throwDistance: 'த்ரோ தூரம்',
  screenWidth: 'திரை அகலம்',
  screenDiagonal: 'திரை அளவு',
  throwRatio: 'த்ரோ விகிதம்',
  roomLightingSection: 'அறை வெளிச்சம், திரை வகை & பயன்பாடு',
  lightIntensityLabel: 'அறை வெளிச்ச நிலை',
  lightDark: 'முழு இருட்டு அறை',
  lightSemiLit: 'மிதமான வெளிச்சம்',
  lightBright: 'அதிக வெளிச்சம்',
  primaryPurposeLabel: 'முதன்மை பயன்பாடு',
  purposeCinema: 'ஹோம் சினிமா',
  purposeGaming: 'கேமிங்',
  purposeCasual: 'தினசரி பார்வை',
  purposeAll: 'அனைத்தும்',
  indiaConditionsSection: 'இந்திய வெப்பம், ஈரப்பதம் & மின்சார நிலை',
  recommendedModelsTitle: 'இந்தியாவில் பரிந்துரைக்கப்படும் மாடல்கள்',
  saveConfiguration: 'அமைப்பை சேமி',
  generatePdfReport: 'PDF அறிக்கை',
  masterCatalogTitle: 'இந்தியா புரொஜெக்டர் பிராண்டுகள் & மாடல்கள்',
  compareTitle: 'மாடல் விவரக்குறிப்பு ஒப்பீடு',
  trackerTitle: 'விலை குறைப்பு கண்காணிப்பு',
  subscribeSubstack: 'Substack-இல் இணையுங்கள்',
  printPdfAction: 'PDF அச்சிடு / சேமி',
};

const TE: TranslationStrings = {
  ...EN,
  navHome: 'హోమ్',
  navCalculator: 'రూమ్ ప్లానర్',
  navCatalog: 'ప్రొజెక్టర్ కేటలాగ్',
  navCompare: 'పోలిక',
  navTracker: 'ధర ట్రాకర్',
  navReport: 'ఇన్‌స్టాలర్ PDF',
  signInGoogle: 'Google తో సైన్ ఇన్',
  signOut: 'సైన్ అవుట్',
  calcHeadline: 'ప్రొజెక్టర్ త్రో దూరం & గది కాలిబ్రేషన్',
  calcSubhead:
    'త్రో దూరం, బ్రైట్‌నెస్ మరియు భారతీయ వాతావరణానికి అనుగుణంగా ప్రొజెక్టర్ లేదా స్క్రీన్‌ను డ్రాగ్ చేసి కొలవండి.',
  throwDistance: 'త్రో దూరం',
  screenWidth: 'స్క్రీన్ వెడల్పు',
  screenDiagonal: 'స్క్రీన్ పరిమాణం',
  throwRatio: 'త్రో రేషియో',
  roomLightingSection: 'గది లైటింగ్, స్క్రీన్ & ప్రాథమిక అవసరం',
  lightIntensityLabel: 'గది వెలుతురు స్థాయి',
  lightDark: 'పూర్తి చీకటి గది',
  lightSemiLit: 'తక్కువ వెలుతురు గది',
  lightBright: 'ఎక్కువ వెలుతురు గది',
  indiaConditionsSection: 'భారతీయ వేడి, తేమ & వోల్టేజ్ పరిస్థితులు',
  recommendedModelsTitle: 'భారతదేశంలో సిఫార్సు చేసిన ప్రొజెక్టర్లు',
  saveConfiguration: 'సెటప్ సేవ్ చేయండి',
  generatePdfReport: 'ఇన్‌స్టాలర్ PDF',
  masterCatalogTitle: 'భారతదేశ ప్రొజెక్టర్ బ్రాండ్లు & మోడల్స్',
  compareTitle: 'స్పెసిఫికేషన్ పోలిక',
  trackerTitle: 'ధర తగ్గింపు ట్రాకర్',
  subscribeSubstack: 'Substack లో సబ్‌స్క్రైబ్ చేయండి',
  printPdfAction: 'PDF ప్రింట్ / సేవ్',
};

const KN: TranslationStrings = {
  ...EN,
  navHome: 'ಮುಖಪುಟ',
  navCalculator: 'ರೂಮ್ ಪ್ಲಾನರ್',
  navCatalog: 'ಪ್ರೊಜೆಕ್ಟರ್ ಕ್ಯಾಟಲಾಗ್',
  navCompare: 'ಹೋಲಿಕೆ',
  navTracker: 'ಬೆಲೆ ಟ್ರ್ಯಾಕರ್',
  navReport: 'ಇನ್‌ಸ್ಟಾಲರ್ PDF',
  signInGoogle: 'Google ಸೈನ್ ಇನ್',
  signOut: 'ಸೈನ್ ಔಟ್',
  calcHeadline: 'ಪ್ರೊಜೆಕ್ಟರ್ ಥ್ರೋ ದೂರ ಮತ್ತು ಕೋಣೆ ಮಾಪನಾಂಕ',
  calcSubhead:
    'ಥ್ರೋ ದೂರ, ಪ್ರಕಾಶಮಾನತೆ ಮತ್ತು ಭಾರತೀಯ ಹವಾಮಾನಕ್ಕೆ ಸೂಕ್ತ ಪ್ರೊಜೆಕ್ಟರ್ ಲೆಕ್ಕಹಾಕಲು ಪ್ರೊಜೆಕ್ಟರ್ ಅಥವಾ ಪರದೆಯನ್ನು ಎಳೆಯಿರಿ.',
  throwDistance: 'ಥ್ರೋ ದೂರ',
  screenWidth: 'ಪರದೆಯ ಅಗಲ',
  screenDiagonal: 'ಪರದೆಯ ಗಾತ್ರ',
  throwRatio: 'ಥ್ರೋ ಅನುಪಾತ',
  roomLightingSection: 'ಕೋಣೆಯ ಬೆಳಕು, ಮೇಲ್ಮೈ ಮತ್ತು ಬಳಕೆ',
  lightIntensityLabel: 'ಕೋಣೆಯ ಬೆಳಕಿನ ತೀವ್ರತೆ',
  lightDark: 'ಸಂಪೂರ್ಣ ಕತ್ತಲೆ ಕೋಣೆ',
  lightSemiLit: 'ಮಧ್ಯಮ ಬೆಳಕಿನ ಕೋಣೆ',
  lightBright: 'ಪ್ರಕಾಶಮಾನ ಕೋಣೆ',
  indiaConditionsSection: 'ಭಾರತೀಯ ಶಾಖ, ತೇವಾಂಶ ಮತ್ತು ವೋಲ್ಟೇಜ್ ಪರಿಸ್ಥಿತಿ',
  recommendedModelsTitle: 'ಭಾರತದಲ್ಲಿ ಶಿಫಾರಸು ಮಾಡಲಾದ ಪ್ರೊಜೆಕ್ಟರ್‌ಗಳು',
  saveConfiguration: 'ಸೆಟಪ್ ಉಳಿಸಿ',
  generatePdfReport: 'ಇನ್‌ಸ್ಟಾಲರ್ PDF',
  masterCatalogTitle: 'ಭಾರತದ ಪ್ರೊಜೆಕ್ಟರ್ ಬ್ರಾಂಡ್‌ಗಳು ಮತ್ತು ಮಾದರಿಗಳು',
  compareTitle: 'ವಿಶೇಷಣಗಳ ಹೋಲಿಕೆ',
  trackerTitle: 'ಬೆಲೆ ಇಳಿಕೆ ಟ್ರ್ಯಾಕರ್',
  subscribeSubstack: 'Substack ನಲ್ಲಿ ಚಂದಾದಾರರಾಗಿ',
  printPdfAction: 'PDF ಮುದ್ರಿಸಿ / ಉಳಿಸಿ',
};

const DICTIONARY: Record<LanguageCode, TranslationStrings> = {
  en: EN,
  hi: HI,
  ta: TA,
  te: TE,
  kn: KN,
};

export function getTranslations(lang: LanguageCode): TranslationStrings {
  return DICTIONARY[lang] || EN;
}

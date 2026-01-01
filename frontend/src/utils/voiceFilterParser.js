/**
 * Utilitaire pour parser le texte de reconnaissance vocale
 * et extraire les critères de filtrage
 * Support multilingue: français, anglais, arabe
 */

// Mots-clés pour les types de propriétés par langue
const propertyTypeKeywords = {
  'fr': {
    'APARTMENT': ['appartement', 'appart', 'appartements'],
    'HOUSE': ['maison', 'maisons'],
    'STUDIO': ['studio', 'studios'],
    'CONDO': ['condo', 'condominium', 'condominiums'],
    'TOWNHOUSE': ['maison de ville', 'maisons de ville'],
    'VILLA': ['villa', 'villas']
  },
  'en': {
    'APARTMENT': ['apartment', 'apartments', 'flat', 'flats'],
    'HOUSE': ['house', 'houses', 'home', 'homes'],
    'STUDIO': ['studio', 'studios'],
    'CONDO': ['condo', 'condos', 'condominium', 'condominiums'],
    'TOWNHOUSE': ['townhouse', 'townhouses'],
    'VILLA': ['villa', 'villas']
  },
  'ar': {
    'APARTMENT': ['شقة', 'شقق', 'أبارتمنت'],
    'HOUSE': ['منزل', 'منازل', 'بيت', 'بيوت'],
    'STUDIO': ['استوديو', 'استوديوهات'],
    'CONDO': ['كوندو', 'كوندومينيوم'],
    'TOWNHOUSE': ['منزل صف', 'منازل صف'],
    'VILLA': ['فيلا', 'فيلات']
  }
};

// Mots-clés pour les prépositions et contextes par langue
const languagePatterns = {
  'fr': {
    prepositions: ['à', 'dans', 'de', 'pour', 'avec'],
    cityContext: ['ville', 'région', 'city', 'region'],
    priceMax: ['moins de', 'maximum', 'max', 'jusqu\'à', 'inférieur à', 'sous'],
    priceMin: ['au moins', 'minimum', 'min', 'à partir de', 'supérieur à'],
    bedrooms: ['chambre', 'chambres', 'bedroom', 'bedrooms'],
    want: ['je veux', 'je cherche', 'je recherche', 'des', 'les', 'toutes', 'tous', 'montre', 'affiche', 'voir'],
    locationVerbs: ['existent', 'sont', 'se trouvent', 'se situent', 'disponibles', 'présentes', 'localisées'],
    allKeywords: ['toutes', 'tous', 'toute', 'tout', 'chaque', 'tous les', 'toutes les']
  },
  'en': {
    prepositions: ['in', 'at', 'for', 'with', 'to'],
    cityContext: ['city', 'region', 'town', 'area'],
    priceMax: ['less than', 'maximum', 'max', 'up to', 'under', 'below'],
    priceMin: ['at least', 'minimum', 'min', 'from', 'above', 'over'],
    bedrooms: ['bedroom', 'bedrooms', 'room', 'rooms'],
    want: ['i want', 'i need', 'i\'m looking for', 'looking for', 'find', 'show', 'display', 'see'],
    locationVerbs: ['exist', 'are', 'located', 'situated', 'available', 'found'],
    allKeywords: ['all', 'every', 'each', 'any', 'all the', 'every']
  },
  'ar': {
    prepositions: ['في', 'ب', 'من', 'إلى', 'مع'],
    cityContext: ['مدينة', 'منطقة', 'في مدينة', 'في منطقة'],
    priceMax: ['أقل من', 'حد أقصى', 'بحد أقصى', 'حتى', 'تحت'],
    priceMin: ['على الأقل', 'حد أدنى', 'بحد أدنى', 'من', 'أكثر من'],
    bedrooms: ['غرفة', 'غرف', 'غرف نوم'],
    want: ['أريد', 'أبحث عن', 'أحتاج', 'ابحث عن', 'أرغب في']
  }
};

// Noms de villes en arabe
const arabicCityNames = {
  'الدار البيضاء': 'Casablanca',
  'الرباط': 'Rabat',
  'مراكش': 'Marrakech',
  'طنجة': 'Tanger',
  'فاس': 'Fès',
  'أغادير': 'Agadir',
  'مكناس': 'Meknès',
  'وجدة': 'Oujda',
  'تطوان': 'Tétouan',
  'تارودانت': 'Taroudant',
  'سلا': 'Salé',
  'القنيطرة': 'Kenitra',
  'آسفي': 'Safi',
  'الجديدة': 'El Jadida',
  'الناظور': 'Nador',
  'تازة': 'Taza',
  'سطات': 'Settat',
  'العرائش': 'Larache',
  'خريبكة': 'Khouribga',
  'بني ملال': 'Béni Mellal',
  'الرشيدية': 'Errachidia'
};

// Villes marocaines communes
const moroccanCities = [
  'casablanca', 'rabat', 'marrakech', 'tanger', 'fès', 'fes', 'agadir',
  'meknès', 'meknes', 'oujda', 'tétouan', 'tetouan', 'taroudant',
  'salé', 'sale', 'kenitra', 'safi', 'el jadida', 'nador', 'taza',
  'settat', 'larache', 'khouribga', 'béni mellal', 'beni mellal', 'errachidia'
];

/**
 * Normalise le nom d'une ville (Rabat, rabat, RABAT -> Rabat)
 */
const normalizeCityName = (cityName) => {
  if (!cityName) return null;
  
  const lowerCity = cityName.toLowerCase().trim();
  
  // Mapping des variantes vers les noms normalisés
  const cityMapping = {
    'rabat': 'Rabat',
    'casablanca': 'Casablanca',
    'marrakech': 'Marrakech',
    'tanger': 'Tanger',
    'fès': 'Fès',
    'fes': 'Fès',
    'agadir': 'Agadir',
    'meknès': 'Meknès',
    'meknes': 'Meknès',
    'oujda': 'Oujda',
    'tétouan': 'Tétouan',
    'tetouan': 'Tétouan',
    'taroudant': 'Taroudant',
    'salé': 'Salé',
    'sale': 'Salé',
    'kenitra': 'Kenitra',
    'safi': 'Safi',
    'el jadida': 'El Jadida',
    'nador': 'Nador',
    'taza': 'Taza',
    'settat': 'Settat',
    'larache': 'Larache',
    'khouribga': 'Khouribga',
    'béni mellal': 'Béni Mellal',
    'beni mellal': 'Béni Mellal',
    'errachidia': 'Errachidia'
  };
  
  return cityMapping[lowerCity] || cityName.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

/**
 * Extrait le nom de la région/ville du texte
 * Priorise les mentions explicites comme "à la ville de X", "dans X"
 * Retourne UNIQUEMENT la première ville trouvée dans un contexte prioritaire
 * Support multilingue
 */
export const extractRegion = (text, language = 'fr') => {
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  const lang = language.split('-')[0] || 'fr';
  const patterns = languagePatterns[lang] || languagePatterns['fr'];
  const lowerText = text.toLowerCase();
  
  // Vérifier d'abord les noms de villes en arabe
  if (lang === 'ar') {
    for (const [arabicName, englishName] of Object.entries(arabicCityNames)) {
      if (text.includes(arabicName)) {
        return normalizeCityName(englishName);
      }
    }
  }
  
  // Patterns TRÈS prioritaires pour les mentions explicites de ville
  // Français: "à la ville de Rabat", "dans la ville de Rabat", "ville de Rabat"
  // Anglais: "in the city of Rabat", "in Rabat", "city of Rabat"
  // Arabe: "في مدينة الرباط", "في الرباط", "مدينة الرباط"
  let veryPriorityPatterns = [];
  
  if (lang === 'fr') {
    const patterns = languagePatterns[lang] || languagePatterns['fr'];
    const locationVerbs = patterns.locationVerbs || ['existent', 'sont', 'se trouvent', 'se situent'];
    const locationVerbsPattern = locationVerbs.join('|');
    
    veryPriorityPatterns = [
      // PRIORITÉ 1: "Toutes les maisons existent à la ville d'Agadir"
      /(?:toutes?\s+les?\s+)?(?:maison|maisons|appartement|appartements|studio|studios|villa|villas|propriété|propriétés)\s+(?:existent|sont|se trouvent|se situent|disponibles|présentes)\s+(?:à|dans)\s+la\s+ville\s+d'([a-zàâäéèêëïîôùûüÿç]+)/i,
      // PRIORITÉ 2: "existent à la ville d'Agadir", "sont à la ville d'Agadir"
      new RegExp(`(?:${locationVerbsPattern})\\s+(?:à|dans)\\s+la\\s+ville\\s+d'([a-zàâäéèêëïîôùûüÿç]+)`, 'i'),
      // PRIORITÉ 3: "existent à la ville de Rabat"
      new RegExp(`(?:${locationVerbsPattern})\\s+(?:à|dans)\\s+la\\s+ville\\s+de\\s+([a-zàâäéèêëïîôùûüÿç]+)`, 'i'),
      // PRIORITÉ 4: "à la ville d'Agadir" (avec apostrophe)
      /(?:à|dans)\s+la\s+ville\s+d'([a-zàâäéèêëïîôùûüÿç]+)/i,
      // PRIORITÉ 5: "à la ville de Rabat" (sans apostrophe)
      /(?:à|dans)\s+la\s+ville\s+de\s+([a-zàâäéèêëïîôùûüÿç]+)/i,
      // PRIORITÉ 6: "ville d'Agadir"
      /ville\s+d'([a-zàâäéèêëïîôùûüÿç]+)/i,
      // PRIORITÉ 7: "ville de Rabat"
      /ville\s+de\s+([a-zàâäéèêëïîôùûüÿç]+)/i
    ];
  } else if (lang === 'en') {
    veryPriorityPatterns = [
      /(?:in|at)\s+(?:the\s+)?city\s+of\s+([a-z]+)/i,
      /city\s+of\s+([a-z]+)/i,
      /(?:in|at)\s+([a-z]+)\s+(?:city|area|region)/i
    ];
  } else if (lang === 'ar') {
    veryPriorityPatterns = [
      /في\s+مدينة\s+([\u0600-\u06FF\s]+)/i,
      /مدينة\s+([\u0600-\u06FF\s]+)/i,
      /في\s+([\u0600-\u06FF\s]+)\s+مدينة/i
    ];
  }
  
  // Chercher d'abord dans les patterns très prioritaires
  for (const pattern of veryPriorityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let potentialCity = match[1].trim().toLowerCase();
      // Nettoyer les apostrophes, espaces, et ponctuation finale
      potentialCity = potentialCity.replace(/^d'|^de\s+/i, '').trim();
      potentialCity = potentialCity.replace(/[.,;!?]+$/, '').trim(); // Enlever la ponctuation finale
      
      console.log('[extractRegion] Ville potentielle extraite:', potentialCity, 'du pattern:', pattern);
      
      // Vérifier si c'est une ville connue (correspondance exacte ou partielle)
      for (const city of moroccanCities) {
        // Correspondance exacte
        if (potentialCity === city) {
          console.log('[extractRegion] Correspondance exacte trouvée:', city);
          return normalizeCityName(city);
        }
        // Correspondance partielle (pour gérer les variations)
        if (potentialCity.includes(city) || city.includes(potentialCity)) {
          // Vérifier que c'est bien la ville complète, pas juste une partie
          const cityWords = city.split(' ');
          const potentialWords = potentialCity.split(' ');
          if (cityWords.some(word => potentialWords.includes(word)) || 
              potentialWords.some(word => cityWords.includes(word))) {
            console.log('[extractRegion] Correspondance partielle trouvée:', city);
            return normalizeCityName(city);
          }
        }
      }
    }
  }
  
  // Patterns prioritaires pour "à X", "dans X", "région X"
  // Mais seulement si X est directement suivi d'un mot-clé de propriété ou d'une ponctuation
  let priorityPatterns = [];
  const propertyKeywords = [
    ...(propertyTypeKeywords[lang]?.HOUSE || []),
    ...(propertyTypeKeywords[lang]?.APARTMENT || []),
    ...(propertyTypeKeywords[lang]?.VILLA || []),
    ...(propertyTypeKeywords[lang]?.STUDIO || []),
    ...(propertyTypeKeywords[lang]?.CONDO || []),
    ...(propertyTypeKeywords[lang]?.TOWNHOUSE || [])
  ].join('|');
  
  if (lang === 'fr') {
    priorityPatterns = [
      new RegExp(`(?:à|dans|région|region)\\s+([a-zàâäéèêëïîôùûüÿç]+)(?:\\s+(?:${propertyKeywords}|avec|pour|moins|maximum|prix|chambre|bedroom)|\\s|$|,|\\.)`, 'i')
    ];
  } else if (lang === 'en') {
    priorityPatterns = [
      new RegExp(`(?:in|at|region|area)\\s+([a-z]+)(?:\\s+(?:${propertyKeywords}|with|for|less|maximum|price|bedroom)|\\s|$|,|\\.)`, 'i')
    ];
  } else if (lang === 'ar') {
    priorityPatterns = [
      /في\s+([\u0600-\u06FF]+)(?:\s+(?:شقة|منزل|فيلا|استوديو|مع|لأقل|حد|سعر|غرفة)|\s|$|،|\.)/i
    ];
  }
  
  for (const pattern of priorityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let potentialCity = match[1].trim().toLowerCase();
      // Nettoyer les apostrophes et espaces pour le français
      if (lang === 'fr') {
        potentialCity = potentialCity.replace(/^d'|^de\s+/i, '').trim();
      }
      // Vérifier si c'est une ville connue
      for (const city of moroccanCities) {
        // Correspondance exacte
        if (potentialCity === city) {
          return normalizeCityName(city);
        }
        // Correspondance partielle
        if (potentialCity.includes(city) || city.includes(potentialCity)) {
          return normalizeCityName(city);
        }
      }
    }
  }
  
  // Pattern pour "je veux des maisons à X" ou "Toutes les maisons existent à X" ou similaire
  let contextPattern = null;
  if (lang === 'fr') {
    const patterns = languagePatterns[lang] || languagePatterns['fr'];
    const locationVerbs = patterns.locationVerbs || ['existent', 'sont', 'se trouvent'];
    const locationVerbsPattern = locationVerbs.join('|');
    const allKeywords = patterns.allKeywords || ['toutes', 'tous'];
    const allKeywordsPattern = allKeywords.join('|');
    
    // Pattern pour "Toutes les maisons existent à la ville d'Agadir"
    const allPattern = new RegExp(`(?:${allKeywordsPattern})\\s+les?\\s+(?:${propertyKeywords})\\s+(?:${locationVerbsPattern})\\s+(?:à|dans)\\s+(?:la\\s+)?ville\\s+(?:d'|de\\s+)?([a-zàâäéèêëïîôùûüÿç]+)`, 'i');
    const allMatch = text.match(allPattern);
    if (allMatch && allMatch[1]) {
      const potentialCity = allMatch[1].trim().toLowerCase().replace(/[.,;!?]+$/, '');
      for (const city of moroccanCities) {
        if (potentialCity === city || potentialCity.includes(city) || city.includes(potentialCity)) {
          console.log('[extractRegion] ✓ Ville trouvée avec pattern "Toutes les ... existent":', city);
          return normalizeCityName(city);
        }
      }
    }
    
    // Gérer "à la ville d'Agadir" et "à la ville de Rabat"
    contextPattern = new RegExp(`(?:${patterns.want.join('|')})\\s+(?:${propertyKeywords})[\\s\\w]*?\\s+(?:à|dans)\\s+(?:la\\s+)?ville\\s+(?:d'|de\\s+)?([a-zàâäéèêëïîôùûüÿç]+)`, 'i');
    // Pattern alternatif pour "à X" sans "ville"
    const altPattern = new RegExp(`(?:${patterns.want.join('|')})\\s+(?:${propertyKeywords})[\\s\\w]*?\\s+(?:${patterns.prepositions.join('|')})\\s+(?:d'|de\\s+)?([a-zàâäéèêëïîôùûüÿç]+)`, 'i');
    const altMatch = text.match(altPattern);
    if (altMatch && altMatch[1]) {
      const potentialCity = altMatch[1].trim().toLowerCase();
      for (const city of moroccanCities) {
        if (potentialCity === city || potentialCity.includes(city) || city.includes(potentialCity)) {
          return normalizeCityName(city);
        }
      }
    }
  } else if (lang === 'en') {
    contextPattern = new RegExp(`(?:${patterns.want.join('|')})\\s+(?:${propertyKeywords})[\\s\\w]*?\\s+(?:${patterns.prepositions.join('|')})\\s+([a-z]+)`, 'i');
  } else if (lang === 'ar') {
    contextPattern = /(?:أريد|أبحث|أحتاج|ابحث)\s+(?:شقة|منزل|فيلا|استوديو)[\s\w\u0600-\u06FF]*?\s+(?:في|ب|من)\s+([\u0600-\u06FF]+)/i;
  }
  
  const contextMatch = contextPattern ? text.match(contextPattern) : null;
  
  if (contextMatch && contextMatch[1]) {
    const potentialCity = contextMatch[1].trim().toLowerCase();
    for (const city of moroccanCities) {
      if (potentialCity === city || potentialCity.includes(city) || city.includes(potentialCity)) {
        return normalizeCityName(city);
      }
    }
  }
  
  // Dernière tentative : chercher la première ville mentionnée dans le texte
  // Mais seulement si elle apparaît dans un contexte clair (avec délimiteurs)
  let firstCityFound = null;
  let firstCityPosition = Infinity;
  
  // Construire les délimiteurs selon la langue
  let delimiters = '';
  if (lang === 'fr') {
    delimiters = '(?:^|\\s|,|à|dans|ville\\s+de|région|region)';
  } else if (lang === 'en') {
    delimiters = '(?:^|\\s|,|in|at|city\\s+of|region|area)';
  } else if (lang === 'ar') {
    delimiters = '(?:^|\\s|،|في|ب|مدينة|منطقة)';
  }
  
  for (const city of moroccanCities) {
    // Chercher la ville avec des délimiteurs pour éviter les faux positifs
    const cityPattern = new RegExp(`${delimiters}\\s*${city}\\s*(?:$|,|\\.|،|avec|pour|مع|with|for|moins|maximum|prix|chambre|bedroom|appartement|maison|villa|studio|شقة|منزل|فيلا|استوديو)`, 'i');
    const match = text.match(cityPattern);
    if (match) {
      const position = match.index;
      if (position < firstCityPosition) {
        firstCityPosition = position;
        firstCityFound = city;
      }
    }
  }
  
  // Pour l'arabe, vérifier aussi les noms arabes des villes
  if (lang === 'ar') {
    for (const [arabicName, englishName] of Object.entries(arabicCityNames)) {
      const arabicPattern = new RegExp(`${delimiters}\\s*${arabicName}\\s*(?:$|،|\\.|مع|لأقل|حد|سعر|غرفة|شقة|منزل|فيلا|استوديو)`, 'i');
      const match = text.match(arabicPattern);
      if (match) {
        const position = match.index;
        if (position < firstCityPosition) {
          firstCityPosition = position;
          firstCityFound = englishName.toLowerCase();
        }
      }
    }
  }
  
  if (firstCityFound) {
    return normalizeCityName(firstCityFound);
  }
  
  return null;
};

/**
 * Extrait le prix exact du texte (sans contexte de maximum/minimum)
 * Support multilingue
 */
export const extractExactPrice = (text, language = 'fr') => {
  if (!text || typeof text !== 'string') {
    console.log('[extractExactPrice] ✗ Texte invalide');
    return null;
  }
  
  const lang = language.split('-')[0] || 'fr';
  const lowerText = text.toLowerCase();
  
  // Patterns pour détecter un prix exact (sans mots de maximum/minimum)
  // Ex: "maison de 5000 dhs", "appartement à 5000 dirhams"
  let exactPricePatterns = [];
  
  if (lang === 'fr') {
    exactPricePatterns = [
      // PRIORITÉ 1: "maison de 5000 dhs", "je veux maison de 5000 dhs"
      // Pattern très spécifique pour capturer "de X dhs" après un type de propriété
      /(?:je\s+veux\s+)?(?:une|des)?\s*(?:maison|maisons|appartement|appartements|studio|studios|villa|villas|propriété|propriétés)\s+de\s+(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)\s*(?:par\s+mois|par\s+jour)?\.?/i,
      // PRIORITÉ 2: "de 5000 dhs", "à 5000 dirhams" (général)
      /(?:de|à|pour)\s+(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)\s*(?:par\s+mois|par\s+jour)?\.?/i,
      // PRIORITÉ 3: "5000 dhs" (simple, sans contexte de maximum/minimum avant)
      /(?:^|\s)(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)\s*(?:par\s+mois|par\s+jour)?(?:\.|$|\s)/i
    ];
  } else if (lang === 'en') {
    exactPricePatterns = [
      /(?:of|at|for)\s+(\d+(?:,\d{3})*)\s*(?:dh|dirhams?|dhs?|dollars?|\$)\s*(?:per\s+month|per\s+day)?\.?/i,
      /(?:^|\s)(\d+(?:,\d{3})*)\s*(?:dh|dirhams?|dhs?|dollars?)\s*(?:per\s+month|per\s+day)?(?:\.|$|\s)/i
    ];
  } else if (lang === 'ar') {
    exactPricePatterns = [
      /(?:ب|من|ل)\s+(\d+(?:\s*\d{3})*)\s*(?:درهم|د\.م\.)\s*(?:شهريا|يوميا)?\.?/i,
      /(?:^|\s)(\d+(?:\s*\d{3})*)\s*(?:درهم|د\.م\.)\s*(?:شهريا|يوميا)?(?:\.|$|\s)/i
    ];
  }
  
  // Vérifier qu'il n'y a pas de mots indiquant un maximum ou minimum AVANT le prix
  // Mais permettre "maison de 5000 dhs" même si "je veux" est présent
  const maxMinKeywords = {
    'fr': ['moins de', 'maximum', 'max', 'jusqu\'à', 'sous', 'inférieur', 'au moins', 'minimum', 'min', 'à partir', 'supérieur', 'plus de'],
    'en': ['less than', 'maximum', 'max', 'up to', 'under', 'below', 'at least', 'minimum', 'min', 'from', 'above', 'over', 'more than'],
    'ar': ['أقل من', 'حد أقصى', 'أقصى', 'حد أدنى', 'أدنى', 'أكثر من']
  };
  
  const keywords = maxMinKeywords[lang] || maxMinKeywords['fr'];
  // Chercher si un mot de max/min apparaît juste avant un nombre suivi de "dhs"
  const hasMaxMinBeforePrice = keywords.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    const keywordIndex = lowerText.indexOf(keywordLower);
    if (keywordIndex === -1) return false;
    // Vérifier si après le mot, il y a un nombre suivi de "dhs" dans les 50 caractères suivants
    const afterKeyword = lowerText.substring(keywordIndex + keywordLower.length, keywordIndex + keywordLower.length + 50);
    return /\d+\s*(?:dh|dirhams?|dhs?)/.test(afterKeyword);
  });
  
  if (hasMaxMinBeforePrice) {
    console.log('[extractExactPrice] ✗ Mots de maximum/minimum détectés avant le prix, ce n\'est pas un prix exact');
    return null;
  }
  
  console.log('[extractExactPrice] ===== DÉBUT EXTRACTION PRIX EXACT =====');
  console.log('[extractExactPrice] Texte:', text);
  console.log('[extractExactPrice] Langue:', lang);
  
  for (let i = 0; i < exactPricePatterns.length; i++) {
    const pattern = exactPricePatterns[i];
    const match = text.match(pattern);
    console.log(`[extractExactPrice] Pattern ${i + 1}:`, pattern, 'match:', match);
    
    if (match && match[1]) {
      // Nettoyer les espaces dans les nombres (ex: "5 000" -> "5000")
      const priceStr = match[1].replace(/\s+/g, '').replace(/,/g, '');
      const price = parseInt(priceStr);
      console.log('[extractExactPrice] Prix extrait (brut):', priceStr, 'parsed:', price);
      
      if (price > 0 && price < 10000000) {
        console.log('[extractExactPrice] ✓ Prix exact extrait:', price, 'du texte:', text);
        return price.toString();
      } else {
        console.log('[extractExactPrice] ✗ Prix invalide (hors limites):', price);
      }
    }
  }
  
  console.log('[extractExactPrice] ✗ Aucun prix exact trouvé');
  return null;
};

/**
 * Extrait le prix maximum du texte
 * Support multilingue
 */
export const extractMaxPrice = (text, language = 'fr') => {
  if (!text || typeof text !== 'string') {
    console.log('[extractMaxPrice] ✗ Texte invalide');
    return null;
  }
  
  const lang = language.split('-')[0] || 'fr';
  const patterns = languagePatterns[lang] || languagePatterns['fr'];
  
  console.log('[extractMaxPrice] ===== DÉBUT EXTRACTION PRIX MAX =====');
  console.log('[extractMaxPrice] Texte:', text);
  console.log('[extractMaxPrice] Langue:', lang);
  
  let pricePatterns = [];
  if (lang === 'fr') {
    pricePatterns = [
      // PRIORITÉ 1: "avec le prix de 500 dirhams par mois" - Pattern très spécifique
      // Gérer aussi le point final et "Dirhams" avec D majuscule
      // Pattern plus flexible pour capturer le prix même avec variations
      /(?:avec\s+)?(?:le\s+)?prix\s+de\s+(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)?\s*(?:par\s+mois|par\s+jour)?\.?/i,
      // Pattern alternatif pour "avec le prix de 5000 Dirhams."
      /(?:avec\s+)?(?:le\s+)?prix\s+de\s+(\d+(?:\s*\d{3})*)\s*(?:Dirhams?|dirhams?|dh|dhs?)\s*\.?/i,
      // PRIORITÉ 2: "moins de 5000 dirhams", "moins de 5000 dh", "moins de 5000"
      new RegExp(`(?:${patterns.priceMax.join('|')})\\s*(\\d+(?:\\s*\\d{3})*)\\s*(?:dh|dirhams?|dhs?|euros?|€)?`, 'i'),
      // PRIORITÉ 3: "5000 dirhams maximum", "5000 dh max", "5000 ou moins"
      /(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)\s*(?:maximum|max|ou moins|au maximum)/i,
      // PRIORITÉ 4: "prix maximum 5000", "prix max 5000"
      /prix\s*(?:maximum|max|maximal)\s*(\d+(?:\s*\d{3})*)/i,
      // PRIORITÉ 5: "jusqu'à 5000", "sous 5000"
      /(?:jusqu'?à|sous|en dessous de|inférieur à)\s*(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)?/i,
      // PRIORITÉ 6: "avec un prix de 500", "avec prix 500"
      /(?:avec\s+)?(?:un\s+)?prix\s+(?:de\s+)?(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)?\s*(?:par\s+mois|par\s+jour)?/i,
      // PRIORITÉ 7: "à 500 dirhams", "pour 500 dirhams" (sans contexte de minimum)
      /(?:à|pour)\s+(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)\s*(?:par\s+mois|par\s+jour|maximum|max)?/i
    ];
  } else if (lang === 'en') {
    pricePatterns = [
      new RegExp(`(?:${patterns.priceMax.join('|')})\\s*(\\d+(?:,\\d{3})*)\\s*(?:dh|dirhams?|dhs?|dollars?|\\$)?`, 'i'),
      /(\d+(?:,\\d{3})*)\s*(?:dh|dirhams?|dhs?|dollars?)\s*(?:maximum|max|or less)/i,
      /price\s*(?:maximum|max)\s*(\d+(?:,\\d{3})*)/i,
      /(?:up to|under|below|less than)\s*(\d+(?:,\\d{3})*)\s*(?:dh|dirhams?|dhs?)?/i
    ];
  } else if (lang === 'ar') {
    pricePatterns = [
      new RegExp(`(?:${patterns.priceMax.join('|')})\\s*(\\d+(?:\\s*\\d{3})*)\\s*(?:درهم|د\\.م\\.|دولار)?`, 'i'),
      /(\d+(?:\s*\d{3})*)\s*(?:درهم|د\.م\.)\s*(?:حد أقصى|أو أقل)/i,
      /سعر\s*(?:حد أقصى|أقصى)\s*(\d+(?:\s*\d{3})*)/i
    ];
  }
  
  console.log('[extractMaxPrice] Recherche du prix maximum dans:', text);
  
  for (let i = 0; i < pricePatterns.length; i++) {
    const pattern = pricePatterns[i];
    const match = text.match(pattern);
    console.log(`[extractMaxPrice] Pattern ${i + 1}:`, pattern, 'match:', match);
    
    if (match && match[1]) {
      // Nettoyer les espaces dans les nombres (ex: "5 000" -> "5000")
      const priceStr = match[1].replace(/\s+/g, '');
      const price = parseInt(priceStr);
      console.log('[extractMaxPrice] Prix extrait (brut):', priceStr, 'parsed:', price);
      
      if (price > 0 && price < 10000000) { // Prix raisonnable (jusqu'à 10 millions)
        console.log('[extractMaxPrice] ✓ Prix maximum extrait:', price, 'du texte:', text);
        return price.toString();
      } else {
        console.log('[extractMaxPrice] ✗ Prix invalide (hors limites):', price);
      }
    } else if (match) {
      console.log('[extractMaxPrice] ⚠ Pattern matché mais pas de groupe capturé:', pattern, 'match:', match);
    }
  }
  
  console.log('[extractMaxPrice] ✗ Aucun pattern prioritaire n\'a matché pour le texte:', text);
  
  // PATTERN DE SECOURS TRÈS SIMPLE : chercher n'importe quel nombre suivi de "dirhams" dans le texte
  // Ce pattern devrait capturer "5000 Dirhams" même si les autres patterns échouent
  console.log('[extractMaxPrice] Test du pattern de secours universel...');
  const universalFallbackPattern = /(\d+(?:\s*\d{3})*)\s*(?:Dirhams?|dirhams?|dh|dhs?)/i;
  const universalMatch = text.match(universalFallbackPattern);
  console.log('[extractMaxPrice] Pattern de secours universel match:', universalMatch);
  
  if (universalMatch && universalMatch[1]) {
    const priceStr = universalMatch[1].replace(/\s+/g, '');
    const price = parseInt(priceStr);
    console.log('[extractMaxPrice] Prix extrait (secours universel, brut):', priceStr, 'parsed:', price);
    
    if (price > 0 && price < 10000000) {
      console.log('[extractMaxPrice] ✓✓✓ Prix maximum extrait (pattern de secours universel):', price);
      return price.toString();
    }
  }
  
  // Chercher simplement un nombre suivi de "dh" ou "dirhams" ou équivalents
  // Mais seulement si c'est dans un contexte de prix maximum ou si c'est un prix simple
  let simplePattern = null;
  if (lang === 'ar') {
    simplePattern = /(\d+(?:\s*\d{3})*)\s*(?:درهم|د\.م\.)/i;
  } else {
    // Chercher "X dirhams" dans un contexte de prix (avec, prix, à, pour)
    // Mais éviter si c'est clairement un prix minimum
    const minPriceContext = /(?:au moins|minimum|min|à partir|supérieur|plus de)/i;
    if (!minPriceContext.test(text)) {
      // Chercher "X dirhams" si précédé de "avec", "prix", "à", "pour" ou mots de prix max
      // Gérer aussi "par mois" ou "par jour" après, et le point final
      // Pattern très flexible pour capturer le prix même avec des variations
      simplePattern = /(?:avec|prix|à|pour|moins|maximum|max|jusqu'|sous|inférieur)\s+(?:le\s+)?(?:prix\s+de\s+)?(\d+(?:\s*\d{3})*)\s*(?:Dirhams?|dirhams?|dh|dhs?)\s*(?:par\s+mois|par\s+jour)?\.?/i;
      
      // Pattern encore plus simple : chercher n'importe quel nombre suivi de "dirhams" dans un contexte de prix
      const verySimplePattern = /(?:avec|prix)\s+.*?(\d+(?:\s*\d{3})*)\s*(?:Dirhams?|dirhams?|dh|dhs?)/i;
      const verySimpleMatch = text.match(verySimplePattern);
      if (verySimpleMatch && verySimpleMatch[1]) {
        const priceStr = verySimpleMatch[1].replace(/\s+/g, '');
        const price = parseInt(priceStr);
        if (price > 0 && price < 10000000) {
          console.log('[extractMaxPrice] ✓ Prix maximum extrait (pattern très simple):', price);
          return price.toString();
        }
      }
    }
  }
  
  if (simplePattern) {
    console.log('[extractMaxPrice] Test du pattern simple:', simplePattern);
    const simpleMatch = text.match(simplePattern);
    console.log('[extractMaxPrice] Résultat du pattern simple:', simpleMatch);
    
    if (simpleMatch && simpleMatch[1]) {
      const priceStr = simpleMatch[1].replace(/\s+/g, '');
      const price = parseInt(priceStr);
      console.log('[extractMaxPrice] Prix extrait (simple, brut):', priceStr, 'parsed:', price);
      
      if (price > 0 && price < 10000000) {
        console.log('[extractMaxPrice] ✓ Prix maximum extrait (pattern simple):', price);
        return price.toString();
      } else {
        console.log('[extractMaxPrice] ✗ Prix invalide (simple pattern, hors limites):', price);
      }
    }
  } else {
    console.log('[extractMaxPrice] Pas de pattern simple défini pour la langue:', lang);
  }
  
  return null;
};

/**
 * Extrait le prix minimum du texte
 * Support multilingue
 */
export const extractMinPrice = (text, language = 'fr') => {
  const lang = language.split('-')[0] || 'fr';
  const patterns = languagePatterns[lang] || languagePatterns['fr'];
  
  let pricePatterns = [];
  if (lang === 'fr') {
    pricePatterns = [
      // "au moins 2000 dirhams", "au moins 2000 dh", "au moins 2000"
      new RegExp(`(?:${patterns.priceMin.join('|')})\\s*(\\d+(?:\\s*\\d{3})*)\\s*(?:dh|dirhams?|dhs?|euros?|€)?`, 'i'),
      // "2000 dirhams minimum", "2000 dh min", "2000 ou plus"
      /(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)\s*(?:minimum|min|ou plus|au minimum)/i,
      // "prix minimum 2000", "prix min 2000"
      /prix\s*(?:minimum|min|minimal)\s*(\d+(?:\s*\d{3})*)/i,
      // "à partir de 2000", "supérieur à 2000"
      /(?:à partir de|supérieur à|plus de|au-dessus de)\s*(\d+(?:\s*\d{3})*)\s*(?:dh|dirhams?|dhs?)?/i
    ];
  } else if (lang === 'en') {
    pricePatterns = [
      new RegExp(`(?:${patterns.priceMin.join('|')})\\s*(\\d+(?:,\\d{3})*)\\s*(?:dh|dirhams?|dhs?|dollars?|\\$)?`, 'i'),
      /(\d+(?:,\\d{3})*)\s*(?:dh|dirhams?|dhs?|dollars?)\s*(?:minimum|min|or more)/i,
      /price\s*(?:minimum|min)\s*(\d+(?:,\\d{3})*)/i,
      /(?:from|above|over|more than)\s*(\d+(?:,\\d{3})*)\s*(?:dh|dirhams?|dhs?)?/i
    ];
  } else if (lang === 'ar') {
    pricePatterns = [
      new RegExp(`(?:${patterns.priceMin.join('|')})\\s*(\\d+(?:\s*\\d{3})*)\\s*(?:درهم|د\\.م\\.|دولار)?`, 'i'),
      /(\d+(?:\s*\d{3})*)\s*(?:درهم|د\.م\.)\s*(?:حد أدنى|أو أكثر)/i,
      /سعر\s*(?:حد أدنى|أدنى)\s*(\d+(?:\s*\d{3})*)/i
    ];
  }
  
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Nettoyer les espaces dans les nombres (ex: "2 000" -> "2000")
      const priceStr = match[1].replace(/\s+/g, '');
      const price = parseInt(priceStr);
      if (price > 0 && price < 10000000) { // Prix raisonnable
        console.log('[extractMinPrice] Prix minimum extrait:', price, 'du texte:', text);
        return price.toString();
      }
    }
  }
  
  return null;
};

/**
 * Extrait le type de propriété du texte
 * Priorise les types plus spécifiques (VILLA avant HOUSE)
 * Support multilingue
 */
export const extractPropertyType = (text, language = 'fr') => {
  const lang = language.split('-')[0] || 'fr';
  const keywords = propertyTypeKeywords[lang] || propertyTypeKeywords['fr'];
  const lowerText = text.toLowerCase();
  
  // Patterns pour détecter si le type de propriété est mentionné dans un contexte générique
  // (ex: "Je veux une maison" sans autre critère = pas un filtre)
  // vs un contexte de filtrage explicite (ex: "Toutes les maisons", "des maisons à Rabat")
  const genericPatterns = {
    'fr': [
      /^je\s+veux\s+(?:une|des)\s+(maison|maisons|appartement|appartements|studio|studios|villa|villas)\s*$/i,
      /^je\s+veux\s+(?:une|des)\s+(maison|maisons|appartement|appartements|studio|studios|villa|villas)\s+(?:avec|à|pour)\s+(?:le\s+)?prix/i,
      /^je\s+cherche\s+(?:une|des)\s+(maison|maisons|appartement|appartements|studio|studios|villa|villas)\s*$/i
    ],
    'en': [
      /^i\s+want\s+(?:a|an|some)\s+(house|houses|apartment|apartments|studio|studios|villa|villas)\s*$/i,
      /^i\s+want\s+(?:a|an|some)\s+(house|houses|apartment|apartments|studio|studios|villa|villas)\s+(?:with|at|for)\s+(?:the\s+)?price/i,
      /^i\s+(?:am\s+)?looking\s+for\s+(?:a|an|some)\s+(house|houses|apartment|apartments|studio|studios|villa|villas)\s*$/i
    ],
    'ar': []
  };
  
  // Vérifier si c'est une phrase générique (ne pas extraire le type dans ce cas)
  // MAIS permettre "Toutes les maisons" qui est un filtre explicite
  const genericPatternsForLang = genericPatterns[lang] || [];
  const isGeneric = genericPatternsForLang.some(pattern => pattern.test(text.trim()));
  
  // Si c'est "Toutes les maisons" ou similaire, c'est un filtre explicite
  const patterns = languagePatterns[lang] || languagePatterns['fr'];
  const allKeywords = patterns.allKeywords || ['toutes', 'tous'];
  const allKeywordsPattern = allKeywords.join('|');
  
  const explicitFilterPatterns = {
    'fr': [
      new RegExp(`(?:${allKeywordsPattern})\\s+les?\\s+(maison|maisons|appartement|appartements|studio|studios|villa|villas|propriété|propriétés)`, 'i'),
      /(?:maison|maisons|appartement|appartements|studio|studios|villa|villas|propriété|propriétés)\s+(?:existent|sont|se trouvent|se situent|disponibles|présentes)/i
    ],
    'en': [
      /all\s+(?:the\s+)?(house|houses|apartment|apartments|studio|studios|villa|villas|property|properties)/i,
      /(?:house|houses|apartment|apartments|studio|studios|villa|villas|property|properties)\s+(?:exist|are|located|situated|available|found)/i
    ],
    'ar': []
  };
  
  const explicitPatterns = explicitFilterPatterns[lang] || [];
  let isExplicitFilter = false;
  let extractedTypeFromExplicit = null;
  
  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      isExplicitFilter = true;
      // Extraire le type depuis le match
      const matchedType = match[1].toLowerCase();
      // Chercher le type correspondant dans les keywords
      for (const [type, typeKeywords] of Object.entries(keywords)) {
        if (typeKeywords.some(kw => kw === matchedType || matchedType.includes(kw) || kw.includes(matchedType))) {
          extractedTypeFromExplicit = type;
          console.log('[extractPropertyType] ✓ Type extrait depuis filtre explicite:', type, 'du texte:', text);
          break;
        }
      }
      if (extractedTypeFromExplicit) break;
    }
  }
  
  if (isGeneric && !isExplicitFilter) {
    console.log('[extractPropertyType] Phrase générique détectée, type de propriété ignoré:', text);
    return null;
  }
  
  if (isExplicitFilter && extractedTypeFromExplicit) {
    console.log('[extractPropertyType] ✓✓✓ Filtre explicite détecté, type retourné:', extractedTypeFromExplicit);
    return extractedTypeFromExplicit;
  }
  
  if (isExplicitFilter) {
    console.log('[extractPropertyType] Filtre explicite détecté (ex: "Toutes les maisons"), extraction du type');
  }
  
  // Chercher d'abord les types plus spécifiques (VILLA, STUDIO, etc.)
  // puis les types génériques (HOUSE, APARTMENT)
  const typeOrder = ['VILLA', 'STUDIO', 'CONDO', 'TOWNHOUSE', 'APARTMENT', 'HOUSE'];
  
  for (const type of typeOrder) {
    const typeKeywords = keywords[type] || [];
    for (const keyword of typeKeywords) {
      // Pour l'arabe, chercher directement dans le texte
      if (lang === 'ar') {
        if (text.includes(keyword)) {
          // Vérifier que ce n'est pas dans un contexte générique
          const isGeneric = /^(?:أريد|أبحث عن)\s+(?:منزل|شقة|استوديو|فيلا)/i.test(text.trim());
          if (!isGeneric) {
            return type;
          }
        }
      } else {
        // Utiliser des limites de mots pour éviter les faux positifs
        const keywordPattern = new RegExp(`\\b${keyword}s?\\b`, 'i');
        if (keywordPattern.test(lowerText)) {
          // Vérifier que ce n'est pas juste "Je veux une/des [type]" sans autre critère
          // Si le texte contient d'autres critères (région, prix, chambres), alors c'est un filtre valide
          const hasOtherCriteria = 
            /(?:à|dans|de|pour|avec|ville|région|city|region)/i.test(text) ||
            /(?:prix|price|chambre|bedroom|room)/i.test(text) ||
            /(?:seulement|only|uniquement|just)/i.test(text);
          
          if (hasOtherCriteria) {
            console.log('[extractPropertyType] Type de propriété extrait avec autres critères:', type);
            return type;
          } else {
            // Si c'est juste "Je veux une/des [type]" sans autre critère, ne pas l'extraire
            console.log('[extractPropertyType] Type de propriété ignoré (phrase générique):', text);
            return null;
          }
        }
      }
    }
  }
  
  return null;
};

/**
 * Extrait le nombre de chambres du texte
 * Support multilingue
 */
export const extractBedrooms = (text, language = 'fr') => {
  const lang = language.split('-')[0] || 'fr';
  const patterns = languagePatterns[lang] || languagePatterns['fr'];
  
  let bedroomPatterns = [];
  if (lang === 'fr') {
    bedroomPatterns = [
      new RegExp(`(?:au moins|minimum|min|au minimum)\\s*(\\d+)\\s*(?:${patterns.bedrooms.join('|')})`, 'i'),
      new RegExp(`(\\d+)\\s*(?:${patterns.bedrooms.join('|')})\\s*(?:ou plus|minimum|min)?`, 'i'),
      new RegExp(`(?:${patterns.bedrooms.join('|')})\\s*(\\d+)`, 'i')
    ];
  } else if (lang === 'en') {
    bedroomPatterns = [
      new RegExp(`(?:at least|minimum|min)\\s*(\\d+)\\s*(?:${patterns.bedrooms.join('|')})`, 'i'),
      new RegExp(`(\\d+)\\s*(?:${patterns.bedrooms.join('|')})\\s*(?:or more|minimum|min)?`, 'i'),
      new RegExp(`(?:${patterns.bedrooms.join('|')})\\s*(\\d+)`, 'i')
    ];
  } else if (lang === 'ar') {
    bedroomPatterns = [
      new RegExp(`(?:${patterns.priceMin[0]}|حد أدنى)\\s*(\\d+)\\s*(?:${patterns.bedrooms.join('|')})`, 'i'),
      new RegExp(`(\\d+)\\s*(?:${patterns.bedrooms.join('|')})`, 'i'),
      new RegExp(`(?:${patterns.bedrooms.join('|')})\\s*(\\d+)`, 'i')
    ];
  }
  
  for (const pattern of bedroomPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const bedrooms = parseInt(match[1]);
      if (bedrooms > 0 && bedrooms <= 10) {
        return bedrooms.toString();
      }
    }
  }
  
  return null;
};

/**
 * Parse le texte vocal et retourne un objet avec les critères de filtrage
 * Support multilingue: français, anglais, arabe
 */
export const parseVoiceText = (text, language = 'fr') => {
  if (!text || typeof text !== 'string') {
    return {};
  }
  
  const lang = language.split('-')[0] || 'fr';
  const filters = {};
  
  console.log('[parseVoiceText] ===== DÉBUT DU PARSING =====');
  console.log('[parseVoiceText] Texte reçu:', text);
  console.log('[parseVoiceText] Langue:', language);
  
  const region = extractRegion(text, lang);
  if (region) {
    filters.region = region;
    console.log('[parseVoiceText] ✓ Région extraite:', region);
  } else {
    console.log('[parseVoiceText] ✗ Aucune région extraite');
  }
  
  // D'abord vérifier si c'est un prix exact (sans contexte de maximum/minimum)
  const exactPrice = extractExactPrice(text, lang);
  if (exactPrice) {
    filters.exactPrice = exactPrice;
    console.log('[parseVoiceText] ✓ Prix exact extrait:', exactPrice);
  } else {
    // Si ce n'est pas un prix exact, chercher un prix maximum ou minimum
    const maxPrice = extractMaxPrice(text, lang);
    if (maxPrice) {
      filters.maxPrice = maxPrice;
      console.log('[parseVoiceText] ✓ Prix maximum extrait:', maxPrice);
    } else {
      console.log('[parseVoiceText] ✗ Aucun prix maximum extrait');
    }
    
    const minPrice = extractMinPrice(text, lang);
    if (minPrice) {
      filters.minPrice = minPrice;
      console.log('[parseVoiceText] ✓ Prix minimum extrait:', minPrice);
    } else {
      console.log('[parseVoiceText] ✗ Aucun prix minimum extrait');
    }
  }
  
  const propertyType = extractPropertyType(text, lang);
  if (propertyType) {
    filters.propertyType = propertyType;
    console.log('[parseVoiceText] ✓ Type de propriété extrait:', propertyType);
  } else {
    console.log('[parseVoiceText] ✗ Aucun type de propriété extrait');
  }
  
  const bedrooms = extractBedrooms(text, lang);
  if (bedrooms) {
    filters.numBedrooms = bedrooms;
    console.log('[parseVoiceText] ✓ Nombre de chambres extrait:', bedrooms);
  } else {
    console.log('[parseVoiceText] ✗ Aucun nombre de chambres extrait');
  }
  
  console.log('[parseVoiceText] ===== FIN DU PARSING =====');
  console.log('[parseVoiceText] Filtres finaux:', filters);
  return filters;
};


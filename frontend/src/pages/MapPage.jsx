import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PropertyMap } from '../components/PropertyMap';
import { PropertyCard } from '../components/PropertyCard';
import { LocationButton } from '../components/LocationButton';
import { VoiceFilter } from '../components/VoiceFilter';
import { POIControls } from '../components/POIControls';
import { propertiesApi } from '../api/properties';
import { useLanguage } from '../context/LanguageContext';
import { fetchAllPOI } from '../utils/poiService';
import html2canvas from 'html2canvas';

export const MapPage = () => {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [region, setRegion] = useState(searchParams.get('region') || '');
  const [maxPrice, setMaxPrice] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [exactPrice, setExactPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [numBedrooms, setNumBedrooms] = useState('');
  // Si un paramètre region est présent dans l'URL, utiliser la vue grid par défaut
  const [viewMode, setViewMode] = useState(searchParams.get('region') ? 'grid' : 'map');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const mapContainerRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [translatedTitles, setTranslatedTitles] = useState({});
  const [enabledPOITypes, setEnabledPOITypes] = useState({
    hospital: false,
    restaurant: false,
    mosque: false,
    school: false,
    supermarket: false,
  });
  const [poiData, setPoiData] = useState({});
  const [loadingPOI, setLoadingPOI] = useState(false);

  // Mettre à jour la région quand l'URL change
  useEffect(() => {
    const regionParam = searchParams.get('region');
    if (regionParam) {
      setRegion(regionParam);
      setShowFilters(true);
      setViewMode('grid'); // Afficher la liste des annonces
    }
  }, [searchParams]);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, region, maxPrice, minPrice, exactPrice, propertyType, numBedrooms]);

  // Load POI when enabled types change or map center changes
  useEffect(() => {
    const loadPOI = async () => {
      const hasEnabledTypes = Object.values(enabledPOITypes).some(enabled => enabled);
      if (!hasEnabledTypes) {
        setPoiData({});
        return;
      }

      // Calculate center coordinates
      let centerCoords;
      if (userLocation) {
        centerCoords = userLocation;
      } else if (filteredProperties.length > 0 && filteredProperties[0].latitude && filteredProperties[0].longitude) {
        let lat = Number(filteredProperties[0].latitude);
        let lng = Number(filteredProperties[0].longitude);
        if ((lat < -90 || lat > 90) && (lng >= -90 && lng <= 90)) {
          [lat, lng] = [lng, lat];
        }
        centerCoords = [lat, lng];
      } else {
        centerCoords = [33.5731, -7.5898]; // Default to Casablanca
      }

      if (!centerCoords || centerCoords.length !== 2) return;

      setLoadingPOI(true);
      try {
        const radius = 10; // 10km radius (augmenté pour capturer plus de POIs)
        const poi = await fetchAllPOI(centerCoords[0], centerCoords[1], radius, enabledPOITypes);
        setPoiData(poi);
        console.log('POI loaded:', poi);
      } catch (error) {
        console.error('Error loading POI:', error);
      } finally {
        setLoadingPOI(false);
      }
    };

    // Debounce POI loading
    const timeoutId = setTimeout(loadPOI, 500);
    return () => clearTimeout(timeoutId);
  }, [enabledPOITypes, userLocation, filteredProperties]);

  const handleTogglePOI = (poiType) => {
    setEnabledPOITypes(prev => ({
      ...prev,
      [poiType]: !prev[poiType]
    }));
  };

  // Fonction pour traduire un texte
  const translateText = async (text, targetLang) => {
    if (!text) return text;
    
    const langCode = targetLang.split('-')[0];
    if (langCode === 'fr') {
      return text; // On suppose que les textes sont en français par défaut
    }

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0].map((item) => item[0]).join('');
      }
      return text;
    } catch (error) {
      return text;
    }
  };

  // Traduire les titres des propriétés quand la langue change
  useEffect(() => {
    const translateAllTitles = async () => {
      const translations = {};
      for (const property of filteredProperties) {
        if (property.title) {
          const translated = await translateText(property.title, i18n.language);
          translations[property.id] = translated;
        }
      }
      setTranslatedTitles(translations);
    };

    if (filteredProperties.length > 0) {
      translateAllTitles();
    } else {
      setTranslatedTitles({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, filteredProperties.map(p => p.id).join(',')]); // Quand la langue ou les propriétés changent

  // Log pour vérifier que tous les résultats sont bien stockés
  useEffect(() => {
    console.log('[MapPage] ===== VÉRIFICATION DES RÉSULTATS FILTRÉS =====');
    console.log('[MapPage] Nombre de propriétés filtrées dans l\'état:', filteredProperties.length);
    if (filteredProperties.length > 0) {
      console.log('[MapPage] ✓✓✓ TOUTES LES PROPRIÉTÉS FILTRÉES:');
      filteredProperties.forEach((p, idx) => {
        console.log(`[MapPage]   [${idx + 1}/${filteredProperties.length}] "${p.title}" - Prix: ${p.price}`);
      });
    } else {
      console.log('[MapPage] ⚠ Aucune propriété filtrée dans l\'état');
    }
  }, [filteredProperties]);

  const loadProperties = async () => {
    try {
      setError(null);
      const data = await propertiesApi.getAllForMap();
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setError(error.message || 'Erreur lors du chargement des propriétés');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    console.log('[filterProperties] ===== DÉBUT DU FILTRAGE =====');
    console.log('[filterProperties] Filtres actifs:', { region, minPrice, maxPrice, exactPrice, propertyType, numBedrooms });
    console.log('[filterProperties] Nombre de propriétés avant filtrage:', properties.length);
    
    let filtered = [...properties];

    if (region) {
      // Correspondance exacte de la région (case-insensitive et sans espaces superflus)
      const normalizedRegion = region.trim().toLowerCase();
      const beforeCount = filtered.length;
      console.log(`[Filter] Filtrage par région: "${region}" (normalisé: "${normalizedRegion}")`);
      filtered = filtered.filter(p => {
        if (!p.region) {
          console.log(`[Filter] Propriété "${p.title}" exclue: pas de région définie`);
          return false;
        }
        const normalizedPropertyRegion = p.region.trim().toLowerCase();
        const isMatch = normalizedPropertyRegion === normalizedRegion;
        if (!isMatch) {
          console.log(`[Filter] Propriété "${p.title}" exclue: région "${p.region}" (normalisé: "${normalizedPropertyRegion}") !== "${region}" (normalisé: "${normalizedRegion}")`);
        } else {
          console.log(`[Filter] ✓✓✓ Propriété "${p.title}" INCLUSE: région "${p.region}" (normalisé: "${normalizedPropertyRegion}") === "${region}" (normalisé: "${normalizedRegion}")`);
        }
        return isMatch;
      });
      console.log(`[Filter] ${filtered.length} propriétés trouvées pour la région "${region}" (${beforeCount} avant)`);
      if (filtered.length > 0) {
        console.log(`[Filter] ✓✓✓ PROPRIÉTÉS TROUVÉES POUR "${region}":`);
        filtered.forEach((p, idx) => {
          console.log(`[Filter]   [${idx + 1}/${filtered.length}] "${p.title}" - Type: ${p.propertyType} - Prix: ${p.price}`);
        });
      }
    }

    if (minPrice) {
      const price = parseFloat(minPrice);
      console.log(`[Filter] Filtrage par prix minimum: ${price}`);
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        const propertyPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price);
        const matches = propertyPrice >= price;
        if (!matches) {
          console.log(`[Filter] Propriété "${p.title}" exclue: prix ${propertyPrice} < minimum ${price}`);
        }
        return matches;
      });
      console.log(`[Filter] ${filtered.length} propriétés après filtre prix minimum (${beforeCount} avant)`);
    }

    // PRIORITÉ: Si un prix exact est spécifié, utiliser uniquement celui-ci
    if (exactPrice) {
      const price = parseFloat(exactPrice);
      console.log(`[Filter] Filtrage par prix EXACT: ${price} (type: ${typeof price})`);
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        // Gérer BigDecimal ou Number
        let propertyPrice;
        if (typeof p.price === 'number') {
          propertyPrice = p.price;
        } else if (typeof p.price === 'string') {
          propertyPrice = parseFloat(p.price);
        } else if (p.price && typeof p.price === 'object' && p.price.value !== undefined) {
          // Gérer BigDecimal si c'est un objet avec une propriété value
          propertyPrice = parseFloat(p.price.value || p.price);
        } else {
          propertyPrice = parseFloat(p.price);
        }
        
        if (isNaN(propertyPrice)) {
          console.log(`[Filter] ⚠ Prix invalide pour "${p.title}":`, p.price);
          return false;
        }
        
        // Correspondance exacte : arrondir les deux prix pour gérer les décimales
        // Ex: 5000.00 === 5000, 5000.50 !== 5000
        const roundedPropertyPrice = Math.round(propertyPrice);
        const roundedTargetPrice = Math.round(price);
        const matches = roundedPropertyPrice === roundedTargetPrice;
        
        if (!matches) {
          console.log(`[Filter] Propriété "${p.title}" exclue: prix arrondi ${roundedPropertyPrice} !== prix exact arrondi ${roundedTargetPrice} (prix brut: ${propertyPrice})`);
        } else {
          console.log(`[Filter] ✓✓✓ Propriété "${p.title}" INCLUSE: prix arrondi ${roundedPropertyPrice} === prix exact arrondi ${roundedTargetPrice} (prix brut: ${propertyPrice})`);
        }
        return matches;
      });
      console.log(`[Filter] ${filtered.length} propriétés après filtre prix EXACT (${beforeCount} avant)`);
      if (filtered.length > 0) {
        console.log(`[Filter] ✓✓✓ ${filtered.length} PROPRIÉTÉ(S) CORRESPONDANTE(S) AU PRIX EXACT ${price}:`);
        filtered.forEach((p, idx) => {
          console.log(`[Filter]   ${idx + 1}. "${p.title}" - Prix: ${p.price} - Type: ${p.propertyType} - Région: ${p.region}`);
        });
      } else {
        console.log(`[Filter] ⚠ Aucune propriété avec le prix exact ${price}`);
      }
    } else if (maxPrice) {
      const price = parseFloat(maxPrice);
      console.log(`[Filter] Filtrage par prix maximum: ${price} (type: ${typeof price})`);
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        // Gérer BigDecimal ou Number
        let propertyPrice;
        if (typeof p.price === 'number') {
          propertyPrice = p.price;
        } else if (typeof p.price === 'string') {
          propertyPrice = parseFloat(p.price);
        } else if (p.price && typeof p.price === 'object' && p.price.value !== undefined) {
          // Gérer BigDecimal si c'est un objet avec une propriété value
          propertyPrice = parseFloat(p.price.value || p.price);
        } else {
          propertyPrice = parseFloat(p.price);
        }
        
        if (isNaN(propertyPrice)) {
          console.log(`[Filter] ⚠ Prix invalide pour "${p.title}":`, p.price);
          return false;
        }
        
        const matches = propertyPrice <= price;
        if (!matches) {
          console.log(`[Filter] Propriété "${p.title}" exclue: prix ${propertyPrice} > maximum ${price}`);
        } else {
          console.log(`[Filter] ✓ Propriété "${p.title}" incluse: prix ${propertyPrice} <= maximum ${price}`);
        }
        return matches;
      });
      console.log(`[Filter] ${filtered.length} propriétés après filtre prix maximum (${beforeCount} avant)`);
    }

    if (propertyType) {
      console.log(`[Filter] Filtrage par type de propriété: ${propertyType}`);
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        const matches = p.propertyType === propertyType;
        if (!matches) {
          console.log(`[Filter] Propriété "${p.title}" exclue: type "${p.propertyType}" !== "${propertyType}"`);
        } else {
          console.log(`[Filter] ✓✓✓ Propriété "${p.title}" INCLUSE: type "${p.propertyType}" === "${propertyType}"`);
        }
        return matches;
      });
      console.log(`[Filter] ${filtered.length} propriétés après filtre type (${beforeCount} avant)`);
      if (filtered.length > 0) {
        console.log(`[Filter] ✓✓✓ PROPRIÉTÉS DE TYPE "${propertyType}":`);
        filtered.forEach((p, idx) => {
          console.log(`[Filter]   [${idx + 1}/${filtered.length}] "${p.title}" - Région: ${p.region} - Prix: ${p.price}`);
        });
      }
    }

    if (numBedrooms) {
      const bedrooms = parseInt(numBedrooms);
      console.log(`[Filter] Filtrage par nombre de chambres: ${bedrooms}+`);
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        const matches = p.numBedrooms >= bedrooms;
        if (!matches) {
          console.log(`[Filter] Propriété "${p.title}" exclue: ${p.numBedrooms} chambres < ${bedrooms}`);
        } else {
          console.log(`[Filter] ✓ Propriété "${p.title}" incluse: ${p.numBedrooms} chambres >= ${bedrooms}`);
        }
        return matches;
      });
      console.log(`[Filter] ${filtered.length} propriétés après filtre chambres (${beforeCount} avant)`);
    }

    console.log('[filterProperties] ===== FIN DU FILTRAGE =====');
    console.log('[filterProperties] Nombre de propriétés après filtrage:', filtered.length);
    console.log('[filterProperties] Filtres actifs finaux:', { region, minPrice, maxPrice, exactPrice, propertyType, numBedrooms });
    if (filtered.length > 0) {
      console.log('[filterProperties] ✓✓✓ PROPRIÉTÉS RESTANTES (TOUTES):', filtered.length);
      filtered.forEach((p, index) => {
        console.log(`[filterProperties]   ${index + 1}. "${p.title}" - Prix: ${p.price} - Type: ${p.propertyType} - Région: ${p.region}`);
      });
    } else {
      console.log('[filterProperties] ⚠ Aucune propriété ne correspond aux filtres !');
      console.log('[filterProperties] Vérification des filtres actifs:');
      if (region) console.log(`  - Région: "${region}"`);
      if (minPrice) console.log(`  - Prix minimum: ${minPrice}`);
      if (maxPrice) console.log(`  - Prix maximum: ${maxPrice}`);
      if (exactPrice) console.log(`  - Prix EXACT: ${exactPrice}`);
      if (propertyType) console.log(`  - Type de propriété: "${propertyType}"`);
      if (numBedrooms) console.log(`  - Nombre de chambres: ${numBedrooms}+`);
    }
    console.log('[filterProperties] ==== SETTING FILTERED PROPERTIES =====');
    console.log('[filterProperties] Nombre de propriétés à afficher:', filtered.length);
    console.log('[filterProperties] Liste complète des propriétés filtrées:');
    filtered.forEach((p, idx) => {
      console.log(`[filterProperties]   [${idx + 1}/${filtered.length}] ID: ${p.id}, Titre: "${p.title}", Prix: ${p.price}`);
    });
    
    // S'assurer qu'on définit TOUTES les propriétés filtrées, pas seulement une
    setFilteredProperties([...filtered]); // Créer une nouvelle copie pour forcer la mise à jour
    console.log('[filterProperties] ✓✓✓ État mis à jour avec', filtered.length, 'propriété(s) - TOUTES seront affichées');
  };

  const clearFilters = () => {
    setRegion('');
    setMinPrice('');
    setMaxPrice('');
    setExactPrice('');
    setPropertyType('');
    setNumBedrooms('');
    setSearchParams({}); // Nettoyer l'URL
  };

  const hasActiveFilters = region || minPrice || maxPrice || exactPrice || propertyType || numBedrooms;

  const handleMarkerClick = (property) => {
    setSelectedProperty(property);
  };

  const handleLocationFound = (location) => {
    setUserLocation(location);
  };

  const handleVoiceFiltersExtracted = (filters) => {
    setVoiceError(null);
    
    console.log('[MapPage] ===== APPLICATION DES FILTRES VOCAUX =====');
    console.log('[MapPage] Filtres reçus:', filters);
    
    let filtersApplied = false;
    
    // Appliquer les filtres extraits
    if (filters.region) {
      console.log('[MapPage] ✓ Application du filtre région:', filters.region);
      setRegion(filters.region);
      setSearchParams({ region: filters.region });
      filtersApplied = true;
    }
    if (filters.minPrice) {
      console.log('[MapPage] ✓ Application du filtre prix minimum:', filters.minPrice, '(type:', typeof filters.minPrice, ')');
      setMinPrice(filters.minPrice);
      filtersApplied = true;
    }
    if (filters.exactPrice) {
      console.log('[MapPage] ✓ Application du filtre prix EXACT:', filters.exactPrice, '(type:', typeof filters.exactPrice, ')');
      setExactPrice(filters.exactPrice);
      setMaxPrice(''); // Réinitialiser maxPrice si un prix exact est défini
      setMinPrice(''); // Réinitialiser minPrice si un prix exact est défini
      filtersApplied = true;
    } else if (filters.maxPrice) {
      console.log('[MapPage] ✓ Application du filtre prix maximum:', filters.maxPrice, '(type:', typeof filters.maxPrice, ')');
      setMaxPrice(filters.maxPrice);
      setExactPrice(''); // Réinitialiser exactPrice si un prix max est défini
      filtersApplied = true;
    }
    if (filters.propertyType) {
      console.log('[MapPage] ✓ Application du filtre type:', filters.propertyType);
      setPropertyType(filters.propertyType);
      filtersApplied = true;
    }
    if (filters.numBedrooms) {
      console.log('[MapPage] ✓ Application du filtre chambres:', filters.numBedrooms);
      setNumBedrooms(filters.numBedrooms);
      filtersApplied = true;
    }
    
    if (!filtersApplied) {
      console.log('[MapPage] ⚠ Aucun filtre n\'a été appliqué!');
    }
    
    // Afficher les filtres si nécessaire
    if (Object.keys(filters).length > 0) {
      setShowFilters(true);
    }
    
    console.log('[MapPage] ===== FIN APPLICATION DES FILTRES =====');
  };

  const handleVoiceError = (errorMessage) => {
    setVoiceError(errorMessage);
    setTimeout(() => setVoiceError(null), 5000);
  };

  const handleExportMap = async () => {
    if (!mapContainerRef.current) return;
    
    setIsExporting(true);
    try {
      // Find the map container element
      const mapElement = mapContainerRef.current.querySelector('.leaflet-container');
      if (!mapElement) {
        throw new Error('Map element not found');
      }

      // Use html2canvas to capture the map
      const canvas = await html2canvas(mapElement, {
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scale: 2, // Higher quality
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight,
      });

      // Create a download link
      const link = document.createElement('a');
      link.download = `carte-proprietes-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Show success message (you could add a toast notification here)
      setTimeout(() => setIsExporting(false), 1000);
    } catch (error) {
      console.error('Error exporting map:', error);
      setIsExporting(false);
      alert('Erreur lors de l\'export de la carte. Veuillez réessayer.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-secondary dark:text-text-secondary-dark text-lg">{t('map.loadingProperties')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-4">
            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Erreur de connexion</h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={loadProperties}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Réessayer
            </button>
          </div>
          <div className="text-sm text-text-secondary dark:text-text-secondary-dark space-y-2">
            <p className="font-semibold">Vérifications à effectuer:</p>
            <ul className="text-left space-y-1 list-disc list-inside">
              <li>Le serveur backend est-il démarré sur le port 8080?</li>
              <li>La base de données PostgreSQL est-elle accessible?</li>
              <li>Les données sont-elles présentes dans la base de données?</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Leaflet uses [latitude, longitude] format
  const getCenter = () => {
    if (userLocation) return userLocation;
    
    if (filteredProperties.length > 0 && filteredProperties[0].latitude && filteredProperties[0].longitude) {
      let lat = Number(filteredProperties[0].latitude);
      let lng = Number(filteredProperties[0].longitude);
      
      // Detect and fix swapped coordinates
      if ((lat < -90 || lat > 90) && (lng >= -90 && lng <= 90)) {
        [lat, lng] = [lng, lat];
      }
      
      return [lat, lng];
    }
    
    return [33.5731, -7.5898]; // Default to Casablanca, Morocco
  };
  
  const center = getCenter();

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark transition-colors duration-300">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary via-primary-light to-primary-dark dark:from-bg-dark dark:via-primary/20 dark:to-primary/30 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              {region ? (
                <>
                  {t('map.exploreProperties')} - {region}
                </>
              ) : (
                t('map.exploreProperties')
              )}
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              {region ? (
                <>
                  {filteredProperties.length} {filteredProperties.length === 1 ? t('home.propertyAvailableIn') : t('home.propertiesAvailableIn')} {region}
                </>
              ) : (
                t('map.discoverPerfect')
              )}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">{t('map.totalProperties')}</p>
                  <p className="text-3xl font-bold">{properties.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">{t('map.filteredResults')}</p>
                  <p className="text-3xl font-bold">{filteredProperties.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">{t('map.citiesCovered')}</p>
                  <p className="text-3xl font-bold">
                    {properties.length > 0 
                      ? new Set(properties.filter(p => p.region).map(p => p.region)).size
                      : '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('map.searchByRegion')}
                  value={region}
                  onChange={(e) => {
                    const newRegion = e.target.value;
                    setRegion(newRegion);
                    // Mettre à jour l'URL
                    if (newRegion) {
                      setSearchParams({ region: newRegion });
                    } else {
                      setSearchParams({});
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <VoiceFilter 
                  onFiltersExtracted={handleVoiceFiltersExtracted}
                  onError={handleVoiceError}
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {t('map.filters')}
                  {hasActiveFilters && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {[region, minPrice, maxPrice, propertyType, numBedrooms].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Voice Error Message */}
            {voiceError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-300/30 rounded-lg text-red-100 text-sm">
                {voiceError}
              </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">{t('map.minPrice')}</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">{t('map.maxPrice')}</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">{t('property.propertyType')}</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="">{t('map.allTypes')}</option>
                    <option value="APARTMENT">{t('property.apartment')}</option>
                    <option value="HOUSE">{t('property.house')}</option>
                    <option value="STUDIO">{t('property.studio')}</option>
                    <option value="CONDO">{t('property.condo')}</option>
                    <option value="TOWNHOUSE">{t('property.townhouse')}</option>
                    <option value="VILLA">{t('property.villa')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">{t('property.bedrooms')}</label>
                  <select
                    value={numBedrooms}
                    onChange={(e) => setNumBedrooms(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="">{t('map.any')}</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-6 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-all"
                    >
                      {t('map.clearAllFilters')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {viewMode === 'map' ? t('map.mapView') : t('map.gridView')}
            </h2>
            <div className="flex items-center gap-2 bg-surface dark:bg-surface-dark rounded-lg p-1 border border-border dark:border-border-dark">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-md transition-all ${
                  viewMode === 'map'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-secondary dark:text-text-secondary-dark hover:bg-bg dark:hover:bg-bg-dark'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
          {viewMode === 'map' && (
            <button
              onClick={handleExportMap}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('map.exporting')}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{t('map.exportMap')}</span>
                </>
              )}
            </button>
          )}
        </div>

        {viewMode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 relative">
              <div className="overflow-hidden h-[600px] rounded-xl border border-border dark:border-border-dark bg-white dark:bg-gray-800 shadow-lg" ref={mapContainerRef}>
                <PropertyMap
                  properties={filteredProperties}
                  center={center}
                  onMarkerClick={handleMarkerClick}
                  selectedPropertyId={selectedProperty?.id}
                  userLocation={userLocation}
                  poiData={poiData}
                  enabledPOITypes={enabledPOITypes}
                />
                {loadingPOI && (
                  <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs text-gray-700 dark:text-gray-300">{t('map.loadingPOI')}</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Controls */}
              <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <LocationButton onLocationFound={handleLocationFound} />
                {/* Export Map Button */}
                <button
                  onClick={handleExportMap}
                  disabled={isExporting}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  title="Exporter la carte"
                >
                  {isExporting ? (
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </button>
              </div>
              {/* POI Controls */}
              <div className="absolute bottom-4 left-4 z-[1000]">
                <POIControls 
                  enabledTypes={enabledPOITypes}
                  onToggle={handleTogglePOI}
                />
              </div>
            </div>
            <div className="space-y-4">
              {selectedProperty ? (
                <div className="card overflow-hidden">
                  <PropertyCard property={selectedProperty} />
                </div>
              ) : (
                <div className="card p-8">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                      {t('map.selectProperty')}
                    </h3>
                    <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                      {t('map.clickMarkerToView')}
                    </p>
                  </div>
                </div>
              )}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark">
                    {t('map.propertiesList')}
                  </h3>
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                    {filteredProperties.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {filteredProperties.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">{t('map.noPropertiesFound')}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('map.tryAdjustingFilters')}</p>
                    </div>
                  ) : (
                    filteredProperties.map((property) => (
                      <div
                        key={property.id}
                        onClick={() => setSelectedProperty(property)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] ${
                          selectedProperty?.id === property.id
                            ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md ring-2 ring-primary/50'
                            : 'border-border dark:border-border-dark hover:border-primary dark:hover:border-primary-light hover:bg-bg dark:hover:bg-bg-dark hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                            {property.imageUrls && property.imageUrls.length > 0 ? (() => {
                              // Helper function to detect if URL is a video
                              const isVideo = (url) => {
                                const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv', '.m4v'];
                                return videoExtensions.some(ext => url.toLowerCase().includes(ext));
                              };
                              // Try to find the first image (not video) for thumbnail
                              const imageUrl = property.imageUrls.find(url => !isVideo(url)) || property.imageUrls[0];
                              const fullUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:8080${imageUrl}`;
                              return (
                                <img
                                  src={fullUrl}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=64`;
                                  }}
                                />
                              );
                            })() : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{property.title?.[0] || 'P'}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-text-primary dark:text-text-primary-dark mb-1 truncate">
                              {translatedTitles[property.id] !== undefined ? translatedTitles[property.id] : property.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-text-secondary-dark mb-2">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {property.region}
                              </span>
                              {property.numBedrooms && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                  </svg>
                                  {property.numBedrooms} {t('map.bed')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-primary dark:text-primary-light">
                              {formatPrice(property.price)}/{property.rentalPeriod === 'DAY' ? t('property.perDay') : t('property.perMonth')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProperties.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('map.noPropertiesFound')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{t('map.tryAdjustingFilters')}</p>
                  <button
                    onClick={clearFilters}
                    className="btn-primary"
                  >
                    {t('map.clearFilters')}
                  </button>
                </div>
              ) : (
                filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


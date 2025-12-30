/**
 * Service pour récupérer les Points d'Intérêt (POI) depuis Overpass API
 */

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

/**
 * Calcule la distance entre deux points en utilisant la formule de Haversine
 * @param {number} lat1 Latitude du premier point
 * @param {number} lon1 Longitude du premier point
 * @param {number} lat2 Latitude du deuxième point
 * @param {number} lon2 Longitude du deuxième point
 * @returns {number} Distance en kilomètres
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formate la distance pour l'affichage
 * @param {number} distance Distance en kilomètres
 * @returns {string} Distance formatée
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

/**
 * Récupère les POI depuis Overpass API
 * @param {number} lat Latitude du centre
 * @param {number} lon Longitude du centre
 * @param {number} radius Rayon de recherche en kilomètres
 * @param {string} poiType Type de POI (hospital, restaurant, mosque, school, supermarket)
 * @returns {Promise<Array>} Liste des POI
 */
export const fetchPOI = async (lat, lon, radius, poiType) => {
  const radiusInMeters = radius * 1000;
  
  // Tags OSM améliorés pour chaque type de POI avec plus de variantes
  const poiQueries = {
    hospital: `
      (
        node["amenity"="hospital"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="clinic"](around:${radiusInMeters},${lat},${lon});
        node["healthcare"="hospital"](around:${radiusInMeters},${lat},${lon});
        node["healthcare"="clinic"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="hospital"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="clinic"](around:${radiusInMeters},${lat},${lon});
        way["healthcare"="hospital"](around:${radiusInMeters},${lat},${lon});
        way["healthcare"="clinic"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="hospital"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="clinic"](around:${radiusInMeters},${lat},${lon});
        relation["healthcare"="hospital"](around:${radiusInMeters},${lat},${lon});
        relation["healthcare"="clinic"](around:${radiusInMeters},${lat},${lon});
      );
    `,
    restaurant: `
      (
        node["amenity"="restaurant"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="fast_food"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="cafe"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="bar"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="food_court"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="biergarten"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="ice_cream"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="restaurant"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="fast_food"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="cafe"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="bar"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="food_court"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="biergarten"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="ice_cream"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="restaurant"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="fast_food"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="cafe"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="bar"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="food_court"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="biergarten"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="ice_cream"](around:${radiusInMeters},${lat},${lon});
      );
    `,
    mosque: `
      (
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="mosque"](around:${radiusInMeters},${lat},${lon});
        node["place_of_worship"="mosque"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="place_of_worship"]["place_of_worship"="mosque"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="mosque"](around:${radiusInMeters},${lat},${lon});
        way["place_of_worship"="mosque"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="place_of_worship"]["place_of_worship"="mosque"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="mosque"](around:${radiusInMeters},${lat},${lon});
        relation["place_of_worship"="mosque"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="place_of_worship"]["place_of_worship"="mosque"](around:${radiusInMeters},${lat},${lon});
      );
    `,
    school: `
      (
        node["amenity"="school"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="university"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="college"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="kindergarten"](around:${radiusInMeters},${lat},${lon});
        node["amenity"="library"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="school"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="university"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="college"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="kindergarten"](around:${radiusInMeters},${lat},${lon});
        way["amenity"="library"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="school"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="university"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="college"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="kindergarten"](around:${radiusInMeters},${lat},${lon});
        relation["amenity"="library"](around:${radiusInMeters},${lat},${lon});
      );
    `,
    supermarket: `
      (
        node["shop"="supermarket"](around:${radiusInMeters},${lat},${lon});
        node["shop"="convenience"](around:${radiusInMeters},${lat},${lon});
        node["shop"="market"](around:${radiusInMeters},${lat},${lon});
        node["shop"="grocery"](around:${radiusInMeters},${lat},${lon});
        node["shop"="mall"](around:${radiusInMeters},${lat},${lon});
        way["shop"="supermarket"](around:${radiusInMeters},${lat},${lon});
        way["shop"="convenience"](around:${radiusInMeters},${lat},${lon});
        way["shop"="market"](around:${radiusInMeters},${lat},${lon});
        way["shop"="grocery"](around:${radiusInMeters},${lat},${lon});
        way["shop"="mall"](around:${radiusInMeters},${lat},${lon});
        relation["shop"="supermarket"](around:${radiusInMeters},${lat},${lon});
        relation["shop"="convenience"](around:${radiusInMeters},${lat},${lon});
        relation["shop"="market"](around:${radiusInMeters},${lat},${lon});
        relation["shop"="grocery"](around:${radiusInMeters},${lat},${lon});
        relation["shop"="mall"](around:${radiusInMeters},${lat},${lon});
      );
    `
  };

  const queryBody = poiQueries[poiType];
  if (!queryBody) return [];

  const query = `
    [out:json][timeout:30];
    ${queryBody}
      out center meta;
    `;

    try {
      const response = await fetch(OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const elements = data.elements || [];
      
        // Pour les mosquées, filtrer pour s'assurer qu'on ne prend que les mosquées musulmanes
      let filteredElements = elements;
      if (poiType === 'mosque') {
        filteredElements = elements.filter(el => {
          const tags = el.tags || {};
          // Vérifier que c'est bien une mosquée musulmane (pas juste religion=muslim)
          return (
            tags.amenity === 'mosque' ||
            tags.place_of_worship === 'mosque' ||
            (tags.amenity === 'place_of_worship' && tags.religion === 'muslim') ||
            (tags.amenity === 'place_of_worship' && tags.place_of_worship === 'mosque')
          );
        });
      }

      // Pour les restaurants, filtrer pour exclure les faux positifs
      if (poiType === 'restaurant') {
        filteredElements = elements.filter(el => {
          const tags = el.tags || {};
          // Garder seulement si c'est vraiment un restaurant/café/bar
          return (
            tags.amenity === 'restaurant' ||
            tags.amenity === 'fast_food' ||
            tags.amenity === 'cafe' ||
            tags.amenity === 'bar' ||
            tags.amenity === 'food_court' ||
            tags.amenity === 'biergarten' ||
            tags.amenity === 'ice_cream'
          );
        });
      }
      
      // Dédupliquer par ID
      const uniqueElements = Array.from(
        new Map(filteredElements.map(el => [el.id, el])).values()
      );

      // Transformer les éléments en format standardisé
      return uniqueElements.map(element => {
      const elementTags = element.tags || {};
      let position;
      
      if (element.type === 'node') {
        position = [element.lat, element.lon];
      } else if (element.center) {
        position = [element.center.lat, element.center.lon];
      } else {
        return null;
      }

      // Si pas de position valide, ignorer
      if (!position || !position[0] || !position[1]) {
        return null;
      }

      return {
        id: element.id,
        type: element.type,
        name: elementTags.name || elementTags['name:fr'] || elementTags['name:ar'] || elementTags['name:en'] || `Sans nom`,
        position: position,
        lat: position[0],
        lon: position[1],
        tags: elementTags,
        poiType: poiType
      };
      }).filter(poi => poi !== null && poi.position && poi.position.length === 2);
    } catch (error) {
      console.error(`Error fetching ${poiType} POI:`, error);
      return [];
    }
};

/**
 * Récupère tous les types de POI pour une zone donnée
 * @param {number} lat Latitude du centre
 * @param {number} lon Longitude du centre
 * @param {number} radius Rayon de recherche en kilomètres
 * @param {Object} enabledTypes Types de POI activés {hospital: true, restaurant: true, ...}
 * @returns {Promise<Object>} Objet avec les POI par type
 */
export const fetchAllPOI = async (lat, lon, radius, enabledTypes) => {
  const poiTypes = ['hospital', 'restaurant', 'mosque', 'school', 'supermarket'];

  // Créer un tableau de promesses uniquement pour les types activés
  const enabledTypesArray = poiTypes.filter(type => enabledTypes[type]);
  const promises = enabledTypesArray.map(type => fetchPOI(lat, lon, radius, type));

  try {
    const results = await Promise.all(promises);
    
    // Construire l'objet résultat en associant chaque résultat à son type
    const poiByType = {};
    enabledTypesArray.forEach((type, index) => {
      poiByType[type] = results[index] || [];
      console.log(`Loaded ${results[index]?.length || 0} ${type}(s)`);
    });

    return poiByType;
  } catch (error) {
    console.error('Error fetching all POI:', error);
    return {};
  }
};

/**
 * Trouve le POI le plus proche d'un point donné
 * @param {number} lat Latitude du point de référence
 * @param {number} lon Longitude du point de référence
 * @param {Array} poiList Liste des POI
 * @returns {Object|null} POI le plus proche avec sa distance
 */
export const findNearestPOI = (lat, lon, poiList) => {
  if (!poiList || poiList.length === 0) return null;

  let nearest = null;
  let minDistance = Infinity;

  poiList.forEach(poi => {
    const distance = calculateDistance(lat, lon, poi.lat, poi.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...poi, distance };
    }
  });

  return nearest;
};


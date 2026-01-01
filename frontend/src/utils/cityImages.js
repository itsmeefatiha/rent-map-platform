// Mapping des villes marocaines vers leurs images
// Les images sont chargées depuis des sources externes (Unsplash, TripAdvisor, etc.)
// Vous pouvez remplacer ces URLs par vos propres images locales si nécessaire

export const cityImages = {
  // Grandes villes principales
  'Casablanca': 'https://premiumtravelnews.com/wp-content/uploads/2025/01/IMG_0011.jpeg',
  'Rabat': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBRVobrypdAcG9iLFcAf0ApD6kjG1dASAiIw&s',
  'Marrakech': 'https://images.contentstack.io/v3/assets/blt06f605a34f1194ff/blt1c1c620107f17f6b/687f9d512a594b6d7878bb31/iStock-475057992-2-HEADER_MOBILE.jpg?format=webp&quality=60&width=1440',
  'Tanger': 'https://img.lonelyplanet.fr/s3fs-public/styles/wysiwyg_800px_/public/2025-09/printemps_tanger.jpg.webp?itok=bC2QDQu8',
  'Fès': 'https://moroccodreamsafari.com/wp-content/uploads/2025/01/Peut-on-visiter-Fes-en-toute-securite.jpg',
  'Agadir': 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/16/aa/27/6c/agadir-ville-situee-sur.jpg?w=900&h=-1&s=1',
  
  // Autres villes importantes
  'Meknès': 'https://maroc-diplomatique.net/wp-content/uploads/2024/02/vue-mosquee-quaraouiyine-1-e1707823702408.png',
  'Oujda': 'https://experienciah.com/_next/image?url=https%3A%2F%2Fapi.experienciah.com%2Fuploads%2FTHE_CITY_9ceabe7cef.png&w=3840&q=75',
  'Tétouan': 'https://quadtetouan.com/images/2021/01/17/t%C3%A9touan-quad.jpg',
  'Taroudant': 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/83/09/5b/caption.jpg?w=500&h=400&s=1',
  
  // Villes avec image par défaut (peuvent être remplacées)
  'Salé': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Kenitra': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Safi': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'El Jadida': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Nador': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Taza': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Settat': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Larache': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Khouribga': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Béni Mellal': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
  'Errachidia': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
};

/**
 * Obtient l'image d'une ville par son nom
 * @param {string} cityName - Le nom de la ville
 * @returns {string} L'URL de l'image de la ville ou l'image par défaut
 */
export const getCityImage = (cityName) => {
  if (!cityName) {
    return defaultCityImage;
  }
  
  // Recherche insensible à la casse
  const normalizedCityName = Object.keys(cityImages).find(
    key => key.toLowerCase() === cityName.toLowerCase()
  );
  
  return normalizedCityName ? cityImages[normalizedCityName] : defaultCityImage;
};

/**
 * Image par défaut utilisée si la ville n'est pas trouvée
 */
export const defaultCityImage = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80';

/**
 * Vérifie si une ville a une image personnalisée
 * @param {string} cityName - Le nom de la ville
 * @returns {boolean} True si la ville a une image personnalisée
 */
export const hasCustomImage = (cityName) => {
  if (!cityName) return false;
  return Object.keys(cityImages).some(
    key => key.toLowerCase() === cityName.toLowerCase()
  );
};

/**
 * Liste toutes les villes avec images personnalisées
 * @returns {string[]} Liste des noms de villes
 */
export const getCitiesWithImages = () => {
  return Object.keys(cityImages);
};

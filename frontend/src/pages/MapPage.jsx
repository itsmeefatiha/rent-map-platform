import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PropertyMap } from '../components/PropertyMap';
import { PropertyCard } from '../components/PropertyCard';
import { propertiesApi } from '../api/properties';

export const MapPage = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [region, setRegion] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [numBedrooms, setNumBedrooms] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'grid'
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, region, maxPrice, minPrice, propertyType, numBedrooms]);

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAllForMap();
      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    if (region) {
      filtered = filtered.filter(p => 
        p.region.toLowerCase().includes(region.toLowerCase())
      );
    }

    if (minPrice) {
      const price = parseFloat(minPrice);
      filtered = filtered.filter(p => p.price >= price);
    }

    if (maxPrice) {
      const price = parseFloat(maxPrice);
      filtered = filtered.filter(p => p.price <= price);
    }

    if (propertyType) {
      filtered = filtered.filter(p => p.propertyType === propertyType);
    }

    if (numBedrooms) {
      const bedrooms = parseInt(numBedrooms);
      filtered = filtered.filter(p => p.numBedrooms >= bedrooms);
    }

    setFilteredProperties(filtered);
  };

  const clearFilters = () => {
    setRegion('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('');
    setNumBedrooms('');
  };

  const hasActiveFilters = region || minPrice || maxPrice || propertyType || numBedrooms;

  const handleMarkerClick = (property) => {
    setSelectedProperty(property);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-secondary dark:text-text-secondary-dark text-lg">Loading properties...</p>
        </div>
      </div>
    );
  }

  const center = filteredProperties.length > 0
    ? [filteredProperties[0].latitude, filteredProperties[0].longitude]
    : [40.7128, -74.0060];

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark transition-colors duration-300">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary via-primary-light to-primary-dark dark:from-bg-dark dark:via-primary/20 dark:to-primary/30 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Explore Properties
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Discover your perfect rental property on our interactive map
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Properties</p>
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
                  <p className="text-blue-100 text-sm font-medium mb-1">Filtered Results</p>
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
                  <p className="text-blue-100 text-sm font-medium mb-1">Avg. Price</p>
                  <p className="text-3xl font-bold">
                    ${properties.length > 0 
                      ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length).toLocaleString()
                      : '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  placeholder="Search by region or location..."
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {hasActiveFilters && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {[region, minPrice, maxPrice, propertyType, numBedrooms].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">Min Price</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">Max Price</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="">All Types</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="HOUSE">House</option>
                    <option value="STUDIO">Studio</option>
                    <option value="CONDO">Condo</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="VILLA">Villa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">Bedrooms</label>
                  <select
                    value={numBedrooms}
                    onChange={(e) => setNumBedrooms(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="">Any</option>
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
                      Clear All Filters
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
              {viewMode === 'map' ? 'Map View' : 'Grid View'}
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
        </div>

        {viewMode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card overflow-hidden h-[600px]">
                <PropertyMap
                  properties={filteredProperties}
                  center={center}
                  onMarkerClick={handleMarkerClick}
                  selectedPropertyId={selectedProperty?.id}
                />
              </div>
            </div>
            <div className="space-y-4">
              {selectedProperty ? (
                <div className="card overflow-hidden">
                  <Link to={`/properties/${selectedProperty.id}`}>
                    <PropertyCard property={selectedProperty} />
                  </Link>
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
                      Select a Property
                    </h3>
                    <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                      Click on a marker on the map to view property details
                    </p>
                  </div>
                </div>
              )}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark">
                    Properties List
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
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No properties found</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your filters</p>
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
                            {property.imageUrls && property.imageUrls.length > 0 ? (
                              <img
                                src={property.imageUrls[0].startsWith('http') ? property.imageUrls[0] : `http://localhost:8080${property.imageUrls[0]}`}
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=64`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{property.title?.[0] || 'P'}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-text-primary dark:text-text-primary-dark mb-1 truncate">
                              {property.title}
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
                                  {property.numBedrooms} bed
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-primary dark:text-primary-light">
                              ${property.price?.toLocaleString()}/mo
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
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No properties found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters</p>
                  <button
                    onClick={clearFilters}
                    className="btn-primary"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredProperties.map((property) => (
                  <Link key={property.id} to={`/properties/${property.id}`}>
                    <PropertyCard property={property} />
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


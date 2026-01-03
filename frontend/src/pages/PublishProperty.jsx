import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { propertiesApi } from '../api/properties';
import { MapClickHandler } from '../components/MapClickHandler';
import { LocationButton } from '../components/LocationButton';

export const PublishProperty = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    area: '',
    region: '',
    availability: '',
    numberOfRooms: '',
    numberOfBedrooms: '',
    numberOfBathrooms: '',
    propertyType: 'APARTMENT',
    rentalPeriod: 'MONTH', // MONTH or DAY
    hasWifi: false,
    hasParking: false,
    hasAirConditioning: false,
    hasHeating: false,
    hasFurnished: false,
    petsAllowed: false,
  });
  
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([33.5731, -7.5898]); // Casablanca, Morocco
  const [uploadedMedia, setUploadedMedia] = useState([]); // Array of {url, type: 'image' | 'video'}
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(isEditMode);

  // Charger la propriété si on est en mode édition
  useEffect(() => {
    const loadProperty = async () => {
      if (isEditMode && editId) {
        try {
          setLoadingProperty(true);
          const property = await propertiesApi.getById(editId);
          
          setFormData({
            title: property.title || '',
            description: property.description || '',
            price: property.price?.toString() || '',
            area: property.area?.toString() || '',
            region: property.region || '',
            availability: property.availability || '',
            numberOfRooms: property.numberOfRooms?.toString() || '',
            numberOfBedrooms: property.numberOfBedrooms?.toString() || '',
            numberOfBathrooms: property.numberOfBathrooms?.toString() || '',
            propertyType: property.propertyType || 'APARTMENT',
            rentalPeriod: property.rentalPeriod || 'MONTH',
            hasWifi: property.hasWifi || false,
            hasParking: property.hasParking || false,
            hasAirConditioning: property.hasAirConditioning || false,
            hasHeating: property.hasHeating || false,
            hasFurnished: property.hasFurnished || false,
            petsAllowed: property.petsAllowed || false,
          });
          
          if (property.latitude && property.longitude) {
            setLatitude(property.latitude);
            setLongitude(property.longitude);
            setMarkerPosition([property.latitude, property.longitude]);
            setMapCenter([property.latitude, property.longitude]);
          }
          
          if (property.imageUrls && property.imageUrls.length > 0) {
            const media = property.imageUrls.map(url => ({
              url,
              type: url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') ? 'video' : 'image'
            }));
            setUploadedMedia(media);
          }
        } catch (err) {
          setError(err.message || t('property.failedToLoad'));
        } finally {
          setLoadingProperty(false);
        }
      }
    };
    
    loadProperty();
  }, [isEditMode, editId, t]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleMapClick = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setMarkerPosition([lat, lng]);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const processFiles = async (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const errors = [];
    const validFiles = [];

    // Validate files (images and videos)
    fileArray.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        errors.push(`${file.name}: ${t('property.notAnImageOrVideo')}`);
        return;
      }
      
      // Images: max 5MB, Videos: max 50MB
      const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = isImage ? 5 : 50;
        errors.push(`${file.name}: ${t('property.largerThanMaxSize', { maxSize: maxSizeMB })}`);
        return;
      }
      
      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      setError(errors.join('; '));
    }

    if (validFiles.length === 0) return;

    setUploadingImages(true);
    setError('');

    try {
      const mediaUrls = await propertiesApi.uploadImages(validFiles);
      const newMedia = validFiles.map((file, index) => ({
        url: mediaUrls[index],
        type: file.type.startsWith('video/') ? 'video' : 'image'
      }));
      setUploadedMedia([...uploadedMedia, ...newMedia]);
    } catch (err) {
      setError(t('property.failedToUpload'));
      console.error(err);
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (e) => {
    await processFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    await processFiles(files);
  };

  const removeMedia = (index) => {
    setUploadedMedia(uploadedMedia.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!latitude || !longitude) {
      setError(t('property.pleaseSelectLocation'));
      return;
    }

    if (!isEditMode && uploadedMedia.length === 0) {
      setError(t('property.pleaseUploadImage'));
      return;
    }

    setLoading(true);
    try {
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        area: parseFloat(formData.area),
        latitude,
        longitude,
        availability: formData.availability,
        numberOfRooms: formData.numberOfRooms ? parseInt(formData.numberOfRooms) : null,
        numberOfBedrooms: formData.numberOfBedrooms ? parseInt(formData.numberOfBedrooms) : null,
        numberOfBathrooms: formData.numberOfBathrooms ? parseInt(formData.numberOfBathrooms) : null,
        imageUrls: uploadedMedia.map(m => m.url), // Backend still expects imageUrls
      };
      
      if (isEditMode && editId) {
        await propertiesApi.update(editId, propertyData);
      } else {
        await propertiesApi.create(propertyData);
      }
      navigate('/my-properties');
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? t('property.failedToUpdate') : t('property.failedToCreate')));
    } finally {
      setLoading(false);
    }
  };

  const defaultCenter = mapCenter;

  const MapCenterUpdater = () => {
    const map = useMap();
    React.useEffect(() => {
      if (mapCenter) {
        map.setView(mapCenter, 13);
      }
    }, [mapCenter, map]);
    return null;
  };

  const handleLocationFound = (location) => {
    setMapCenter(location);
    setLatitude(location[0]);
    setLongitude(location[1]);
    setMarkerPosition(location);
  };

  if (loadingProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {isEditMode ? t('property.editProperty') : t('property.publishYourProperty')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {isEditMode ? t('property.editDetails') : t('property.fillDetails')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Map Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('property.propertyLocation')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('property.clickMapToSelect')}</p>
              </div>
            </div>
            <div className="w-full h-96 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 mb-4 relative">
              <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterUpdater />
                <MapClickHandler onMapClick={handleMapClick} />
                {markerPosition && <Marker position={markerPosition} />}
              </MapContainer>
              <div className="absolute top-4 right-4 z-[1000]">
                <LocationButton onLocationFound={handleLocationFound} />
              </div>
            </div>
            {latitude && longitude ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{t('property.locationSelected')}: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{t('property.pleaseClickMap')}</span>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('property.basicInformation')}</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('property.propertyTitle')} *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t('property.titlePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('property.description')} *
                </label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('property.descriptionPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('property.priceDH')} *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('property.rentalPeriod')} *
                  </label>
                  <select
                    name="rentalPeriod"
                    required
                    value={formData.rentalPeriod}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="MONTH">{t('property.perMonth')}</option>
                    <option value="DAY">{t('property.perDay')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('property.areaSqft')} *
                  </label>
                  <input
                    type="number"
                    name="area"
                    required
                    min="0"
                    step="0.01"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('property.propertyType')} *
                  </label>
                  <select
                    name="propertyType"
                    required
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="APARTMENT">{t('property.apartment')}</option>
                    <option value="HOUSE">{t('property.house')}</option>
                    <option value="STUDIO">{t('property.studio')}</option>
                    <option value="CONDO">{t('property.condo')}</option>
                    <option value="TOWNHOUSE">{t('property.townhouse')}</option>
                    <option value="VILLA">{t('property.villa')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('property.region')} *
                  </label>
                  <input
                    type="text"
                    name="region"
                    required
                    value={formData.region}
                    onChange={handleChange}
                    placeholder={t('property.regionPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('property.availabilityDate')} *
                  </label>
                  <input
                    type="date"
                    name="availability"
                    required
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('property.propertyDetails')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('property.numberOfRooms')}
                </label>
                <input
                  type="number"
                  name="numberOfRooms"
                  min="0"
                  value={formData.numberOfRooms}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('property.bedrooms')}
                </label>
                <input
                  type="number"
                  name="numberOfBedrooms"
                  min="0"
                  value={formData.numberOfBedrooms}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('property.bathrooms')}
                </label>
                <input
                  type="number"
                  name="numberOfBathrooms"
                  min="0"
                  step="0.5"
                  value={formData.numberOfBathrooms}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                <input
                  type="checkbox"
                  name="hasWifi"
                  checked={formData.hasWifi}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t('property.wifi')}</span>
              </label>

              <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                <input
                  type="checkbox"
                  name="hasParking"
                  checked={formData.hasParking}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t('property.parking')}</span>
              </label>

              <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                <input
                  type="checkbox"
                  name="hasAirConditioning"
                  checked={formData.hasAirConditioning}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t('property.airConditioning')}</span>
              </label>

              <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                <input
                  type="checkbox"
                  name="hasHeating"
                  checked={formData.hasHeating}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t('property.heating')}</span>
              </label>

              <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                <input
                  type="checkbox"
                  name="hasFurnished"
                  checked={formData.hasFurnished}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t('property.furnished')}</span>
              </label>

              <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                <input
                  type="checkbox"
                  name="petsAllowed"
                  checked={formData.petsAllowed}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t('property.petsAllowed')}</span>
              </label>
            </div>
          </div>

          {/* Media Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('property.propertyMedia')}</h2>
              {uploadedMedia.length > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {uploadedMedia.length} {uploadedMedia.length === 1 ? t('property.mediaItem') : t('property.mediaItems')}
                </span>
              )}
            </div>
            
            <div
              onClick={handleFileSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              {uploadingImages ? (
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">{t('property.uploadingMedia')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('property.youCanAddMore')}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {isDragging ? t('property.dropFilesHere') : t('property.clickOrDragToUpload')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('property.mediaFormats')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t('property.selectMultipleFiles')}
                  </p>
                </div>
              )}
            </div>

            {uploadedMedia.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  {t('property.uploadedMedia')} ({uploadedMedia.length})
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedMedia.map((media, index) => (
                    <div key={index} className="relative group">
                      {media.type === 'video' ? (
                        <video
                          src={`http://localhost:8080${media.url}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          controls={false}
                          muted
                        >
                          {t('property.videoNotSupported')}
                        </video>
                      ) : (
                        <img
                          src={`http://localhost:8080${media.url}`}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      )}
                      {media.type === 'video' && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                          {t('property.video')}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !latitude || !longitude || uploadedMedia.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('property.publishing')}
              </span>
            ) : (
              t('property.publishProperty')
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';

export const Profile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profilePicture: '',
    bio: '',
    companyName: '',
    licenseNumber: '',
    preferredRegion: '',
    maxBudget: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordMessageType, setPasswordMessageType] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profilePicture || '',
        bio: user.bio || '',
        companyName: user.companyName || '',
        licenseNumber: user.licenseNumber || '',
        preferredRegion: user.preferredRegion || '',
        maxBudget: user.maxBudget || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage(t('profile.pleaseSelectImage'));
      setMessageType('error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(t('profile.fileSizeMustBeLess'));
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');
    setMessageType(null);

    try {
      const fileUrl = await usersApi.uploadProfilePicture(file);
      setFormData({ ...formData, profilePicture: fileUrl });
      const updatedUser = { ...user, profilePicture: fileUrl };
      updateUser(updatedUser);
      setMessage(t('profile.profilePictureUpdated'));
      setMessageType('success');
    } catch (error) {
      setMessage(t('profile.failedToUploadPicture'));
      setMessageType('error');
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType(null);

    try {
      const data = { ...formData };
      if (data.maxBudget) {
        data.maxBudget = parseFloat(data.maxBudget);
      }
      const updated = user.role === 'OWNER'
        ? await usersApi.updateOwner(data)
        : await usersApi.updateTenant(data);
      updateUser(updated);
      setMessage(t('profile.profileUpdated'));
      setMessageType('success');
    } catch (error) {
      setMessage(t('profile.failedToUpdate'));
      setMessageType('error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordMessageType(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage(t('profile.passwordsDoNotMatch'));
      setPasswordMessageType('error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage(t('profile.passwordTooShort'));
      setPasswordMessageType('error');
      return;
    }

    setChangingPassword(true);

    try {
      await usersApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordMessage(t('profile.passwordChangedSuccess'));
      setPasswordMessageType('success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordMessage('');
        setPasswordMessageType(null);
      }, 2000);
    } catch (error) {
      setPasswordMessage(error.response?.data?.message || t('profile.failedToChangePassword'));
      setPasswordMessageType('error');
      console.error(error);
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">{t('profile.pleaseLogIn')}</div>
      </div>
    );
  }

  const profilePictureUrl = user.profilePicture 
    ? `http://localhost:8080${user.profilePicture}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent((user.firstName || '') + ' ' + (user.lastName || ''))}&background=random&size=200`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {t('profile.myProfile')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('profile.manageAccount')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg mx-auto mb-4">
                    <img 
                      src={profilePictureUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((user.firstName || '') + ' ' + (user.lastName || ''))}&background=random&size=200`;
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold">
                  {user.role === 'OWNER' ? t('auth.owner') : t('auth.tenant')}
                </span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 space-y-6">
              {message && (
                <div className={`p-4 rounded-xl flex items-center ${
                  messageType === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    {messageType === 'success' ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    )}
                  </svg>
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('profile.firstName')}
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('profile.lastName')}
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.phoneNumber')}
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.bio')}
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder={t('profile.tellAboutYourself')}
                />
              </div>

              {user.role === 'OWNER' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.companyName')}
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.licenseNumber')}
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {user.role === 'TENANT' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.preferredRegion')}
                      </label>
                      <input
                        type="text"
                        name="preferredRegion"
                        value={formData.preferredRegion}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.maxBudget')}
                      </label>
                      <input
                        type="number"
                        name="maxBudget"
                        value={formData.maxBudget}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('profile.updating') : t('profile.updateProfile')}
              </button>
            </form>

            {/* Change Password Section */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('profile.changePassword')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('profile.changePasswordDescription')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(!showChangePassword);
                    setPasswordMessage('');
                    setPasswordMessageType(null);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {showChangePassword ? t('common.cancel') : t('profile.changePassword')}
                </button>
              </div>

              {showChangePassword && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {passwordMessage && (
                    <div className={`p-4 rounded-xl flex items-center ${
                      passwordMessageType === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        {passwordMessageType === 'success' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        )}
                      </svg>
                      {passwordMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.currentPassword')}
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.newPassword')}
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.confirmNewPassword')}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? t('profile.changingPassword') : t('profile.updatePassword')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


import { useState, useRef } from 'react';
import {
  Pencil, Loader2, Trash2, Phone, Stethoscope, BadgeCheck, Building2, CheckCircle2, User,
} from 'lucide-react';
import api from '../services/api';
import ImageCropModal from './ImageCropModal';
import ProfileImageLightbox from './ProfileImageLightbox';
import { Card, CardContent } from './ui/card';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const calculateAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const ROLE_LABELS = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
};

const ROLE_FIELDS = {
  doctor: [
    { key: 'specialization', label: 'Specialization', icon: Stethoscope, color: 'bg-blue-50 text-blue-500' },
    { key: 'department', label: 'Department', icon: Building2, color: 'bg-purple-50 text-purple-500' },
    { key: 'licenseNumber', label: 'License No.', icon: BadgeCheck, color: 'bg-green-50 text-green-500' },
    { key: 'available', label: 'Availability', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-500', format: (v) => v ? 'Available' : 'Unavailable' },
  ],
  nurse: [
    { key: 'department', label: 'Department', icon: Building2, color: 'bg-purple-50 text-purple-500' },
    { key: 'licenseNumber', label: 'License No.', icon: BadgeCheck, color: 'bg-green-50 text-green-500' },
  ],
  pharmacist: [
    { key: 'licenseNumber', label: 'License No.', icon: BadgeCheck, color: 'bg-green-50 text-green-500' },
  ],
  lab_technician: [],
};

export default function UserProfileCard({ profile, onProfileUpdate, onEdit }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image must be under 5 MB.');
      return;
    }

    setImageError('');
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedFile) => {
    setUploading(true);
    setCropSrc(null);
    try {
      const formData = new FormData();
      formData.append('profileImage', croppedFile);
      const res = await api.upload('/profile/me/image', formData);
      onProfileUpdate(res.data);
    } catch (err) {
      setImageError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    setImageError('');
    setUploading(true);
    try {
      const res = await api.delete('/profile/me/image');
      onProfileUpdate(res.data);
    } catch (err) {
      setImageError(err.message || 'Failed to remove image.');
    } finally {
      setUploading(false);
    }
  };

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const role = profile.role;
  const fields = ROLE_FIELDS[role] || [];
  const age = calculateAge(profile.dateOfBirth);

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-3">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={fullName}
                  onClick={() => setLightboxOpen(true)}
                  className="w-20 h-20 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cta flex items-center justify-center text-white text-2xl font-bold">
                  {(profile.firstName?.[0] || '')}{(profile.lastName?.[0] || '')}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors border-2 border-white"
                aria-label="Change profile photo"
              >
                <Pencil className="w-3 h-3" />
              </button>
              {profile.profileImageUrl && !uploading && (
                <button
                  type="button"
                  onClick={handleImageDelete}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 border-2 border-white"
                  aria-label="Remove profile image"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">{fullName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
            <span className="mt-1.5 inline-block px-3 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
              {ROLE_LABELS[role] || role}
            </span>
            {onEdit && (
              <button
                onClick={onEdit}
                className="mt-3 flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-x-16 gap-y-8 mt-6 pt-5 border-t border-slate-100">
            {age !== null && (
              <div className="flex flex-col items-center text-center gap-1 min-w-[5rem]">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-xs text-slate-400">Age</p>
                <p className="text-sm font-medium text-slate-700">{age} yrs</p>
              </div>
            )}
            {profile.phone && (
              <div className="flex flex-col items-center text-center gap-1 min-w-[5rem]">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm font-medium text-slate-700">{profile.phone}</p>
              </div>
            )}
            {fields.map((field) => {
              const val = profile[field.key];
              if (val === undefined || val === null) return null;
              const Icon = field.icon;
              const [bgClass, textClass] = field.color.split(' ');
              return (
                <div key={field.key} className="flex flex-col items-center text-center gap-1 min-w-[5rem]">
                  <div className={`w-9 h-9 rounded-full ${bgClass} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${textClass}`} />
                  </div>
                  <p className="text-xs text-slate-400">{field.label}</p>
                  <p className="text-sm font-medium text-slate-700">{field.format ? field.format(val) : val}</p>
                </div>
              );
            })}
          </div>

          {imageError && (
            <p className="mt-3 text-sm text-center text-red-600">{imageError}</p>
          )}
        </CardContent>
      </Card>

      {lightboxOpen && profile.profileImageUrl && (
        <ProfileImageLightbox
          src={profile.profileImageUrl}
          alt={fullName}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}

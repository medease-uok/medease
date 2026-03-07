import { useState, useRef } from 'react';
import { X, Save, Loader2, Phone, Camera, Trash2 } from 'lucide-react';
import api from '../services/api';
import ImageCropModal from './ImageCropModal';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Friend', 'Other'];
const INSURANCE_PROVIDERS = [
  'Sri Lanka Insurance Corporation',
  'Ceylinco Insurance',
  'AIA Insurance Lanka',
  'Allianz Insurance Lanka',
  'Union Assurance',
  'Softlogic Life Insurance',
  'Janashakthi Insurance',
  'Fairfirst Insurance',
  'HNB Assurance',
  'Other',
];
const INSURANCE_PLAN_TYPES = ['Inpatient', 'Outpatient', 'Comprehensive'];
const COUNTRY_CODE = '+94';
const PHONE_PATTERN = /^[7-9]\d{8}$/;
const NAME_PATTERN = /^[A-Za-z\s]+$/;
const MAX_AGE_YEARS = 120;
const ADDRESS_MAX_LENGTH = 500;

const stripCountryCode = (phone) => (phone || '').replace(/^\+94\s?/, '');
const addCountryCode = (phone) => phone ? `${COUNTRY_CODE}${phone}` : '';

const baseInputClass = (hasError) =>
  `px-4 py-3 border ${hasError ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`;

const inputClass = (hasError) => `w-full ${baseInputClass(hasError)}`;
const phoneInputClass = (hasError) => `flex-1 pl-11 pr-4 py-3 border ${hasError ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function EditProfileModal({ profile, onClose, onSaved, onImageUpdate }) {
  const fileInputRef = useRef(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');

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
      const res = await api.upload(`/patients/${profile.id}/profile-image`, formData);
      onImageUpdate(res.data);
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
      const res = await api.delete(`/patients/${profile.id}/profile-image`);
      onImageUpdate(res.data);
    } catch (err) {
      setImageError(err.message || 'Failed to remove image.');
    } finally {
      setUploading(false);
    }
  };

  const [form, setForm] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: stripCountryCode(profile.phone),
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
    gender: profile.gender || '',
    bloodType: profile.bloodType || '',
    organDonor: profile.organDonor || false,
    address: profile.address || '',
    emergencyContact: profile.emergencyContact || '',
    emergencyRelationship: profile.emergencyRelationship || '',
    emergencyPhone: stripCountryCode(profile.emergencyPhone),
    insuranceProvider: profile.insuranceProvider || '',
    insurancePolicyNumber: profile.insurancePolicyNumber || '',
    insurancePlanType: profile.insurancePlanType || '',
    insuranceExpiryDate: profile.insuranceExpiryDate ? profile.insuranceExpiryDate.split('T')[0] : '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errs = {};

    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    else if (!NAME_PATTERN.test(form.firstName)) errs.firstName = 'Only letters and spaces allowed';

    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    else if (!NAME_PATTERN.test(form.lastName)) errs.lastName = 'Only letters and spaces allowed';

    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!PHONE_PATTERN.test(form.phone)) errs.phone = '9 digits starting with 7, 8, or 9';

    if (!form.dateOfBirth) {
      errs.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(form.dateOfBirth);
      if (dob > new Date()) {
        errs.dateOfBirth = 'Date of birth cannot be in the future';
      } else {
        const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (age > MAX_AGE_YEARS) errs.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.bloodType) errs.bloodType = 'Blood type is required';
    if (!form.address.trim()) errs.address = 'Address is required';

    if (!form.emergencyContact.trim()) errs.emergencyContact = 'Emergency contact name is required';
    else if (!NAME_PATTERN.test(form.emergencyContact)) errs.emergencyContact = 'Only letters and spaces allowed';

    if (!form.emergencyRelationship) errs.emergencyRelationship = 'Relationship is required';

    if (!form.emergencyPhone.trim()) errs.emergencyPhone = 'Emergency phone is required';
    else if (!PHONE_PATTERN.test(form.emergencyPhone)) errs.emergencyPhone = '9 digits starting with 7, 8, or 9';

    const hasInsurance = form.insuranceProvider || form.insurancePolicyNumber;
    if (hasInsurance) {
      if (!form.insuranceProvider) errs.insuranceProvider = 'Provider is required when policy details are provided';
      if (!form.insurancePolicyNumber.trim()) errs.insurancePolicyNumber = 'Policy number is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError('');

    try {
      const submitted = {
        ...form,
        phone: addCountryCode(form.phone),
        emergencyPhone: addCountryCode(form.emergencyPhone),
      };

      const payload = {};
      const phoneFields = ['phone', 'emergencyPhone'];
      for (const [key, value] of Object.entries(submitted)) {
        const original = profile[key] ?? '';
        let normalised;
        if ((key === 'dateOfBirth' || key === 'insuranceExpiryDate') && original) {
          normalised = original.split('T')[0];
        } else if (phoneFields.includes(key)) {
          normalised = original.replace(/^\+94\s?/, '').replace(/^/, COUNTRY_CODE);
        } else {
          normalised = original || '';
        }
        if (value !== normalised) {
          payload[key] = value;
        }
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const res = await api.patch(`/patients/${profile.id}`, payload);
      onSaved(res.data);
    } catch (err) {
      if (err.data?.errors?.length) {
        const fieldErrs = {};
        err.data.errors.forEach((fieldError) => {
          if (fieldError.path) fieldErrs[fieldError.path] = fieldError.message;
        });
        setErrors(fieldErrs);
      } else {
        setApiError(err.message || 'Failed to save changes.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900 font-heading">Edit Profile</h2>
          <button onClick={onClose} aria-label="Close modal" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Profile Photo</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200"
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
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {profile.profileImageUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {profile.profileImageUrl && (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={handleImageDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Photo
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            {imageError && <p className="mt-2 text-sm text-red-600">{imageError}</p>}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className={inputClass(errors.firstName)} />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className={inputClass(errors.lastName)} />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <div className="flex gap-2">
                  <div className="w-20 flex items-center justify-center border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium">
                    {COUNTRY_CODE}
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="7XXXXXXXX"
                      maxLength={9}
                      className={phoneInputClass(errors.phone)}
                    />
                  </div>
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className={inputClass(errors.dateOfBirth)} />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select name="gender" value={form.gender} onChange={handleChange} className={inputClass(errors.gender)}>
                  <option value="">Select Gender</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Type *</label>
                <select name="bloodType" value={form.bloodType} onChange={handleChange} className={inputClass(errors.bloodType)}>
                  <option value="">Select Blood Type</option>
                  {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                </select>
                {errors.bloodType && <p className="mt-1 text-sm text-red-600">{errors.bloodType}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} maxLength={ADDRESS_MAX_LENGTH} className={inputClass(errors.address)} />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.organDonor}
                    onChange={(e) => setForm((prev) => ({ ...prev, organDonor: e.target.checked }))}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">Registered organ donor</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                <input type="text" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} className={inputClass(errors.emergencyContact)} />
                {errors.emergencyContact && <p className="mt-1 text-sm text-red-600">{errors.emergencyContact}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Relationship *</label>
                <select name="emergencyRelationship" value={form.emergencyRelationship} onChange={handleChange} className={inputClass(errors.emergencyRelationship)}>
                  <option value="">Select Relationship</option>
                  {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.emergencyRelationship && <p className="mt-1 text-sm text-red-600">{errors.emergencyRelationship}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone *</label>
                <div className="flex gap-2">
                  <div className="w-20 flex items-center justify-center border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium">
                    {COUNTRY_CODE}
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={form.emergencyPhone}
                      onChange={handleChange}
                      placeholder="7XXXXXXXX"
                      maxLength={9}
                      className={phoneInputClass(errors.emergencyPhone)}
                    />
                  </div>
                </div>
                {errors.emergencyPhone && <p className="mt-1 text-sm text-red-600">{errors.emergencyPhone}</p>}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Insurance Information</h3>
            <p className="text-xs text-slate-400 mb-3">Optional — fill in if you have private health insurance.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Provider</label>
                <select name="insuranceProvider" value={form.insuranceProvider} onChange={handleChange} className={inputClass(errors.insuranceProvider)}>
                  <option value="">None</option>
                  {INSURANCE_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.insuranceProvider && <p className="mt-1 text-sm text-red-600">{errors.insuranceProvider}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Policy / Member No.</label>
                <input type="text" name="insurancePolicyNumber" value={form.insurancePolicyNumber} onChange={handleChange} maxLength={50} className={inputClass(errors.insurancePolicyNumber)} />
                {errors.insurancePolicyNumber && <p className="mt-1 text-sm text-red-600">{errors.insurancePolicyNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Type</label>
                <select name="insurancePlanType" value={form.insurancePlanType} onChange={handleChange} className={inputClass(errors.insurancePlanType)}>
                  <option value="">Select Plan Type</option>
                  {INSURANCE_PLAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.insurancePlanType && <p className="mt-1 text-sm text-red-600">{errors.insurancePlanType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Policy Expiry Date</label>
                <input type="date" name="insuranceExpiryDate" value={form.insuranceExpiryDate} onChange={handleChange} className={inputClass(errors.insuranceExpiryDate)} />
                {errors.insuranceExpiryDate && <p className="mt-1 text-sm text-red-600">{errors.insuranceExpiryDate}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-cta text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>

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

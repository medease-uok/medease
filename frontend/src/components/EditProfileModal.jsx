import { useState } from 'react';
import { X, Save, Loader2, Phone } from 'lucide-react';
import api from '../services/api';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Friend', 'Other'];
const PHONE_PATTERN = /^[7-9]\d{8,9}$/;
const NAME_PATTERN = /^[A-Za-z\s]+$/;
const MAX_AGE_YEARS = 120;

const stripCountryCode = (phone) => (phone || '').replace(/^\+94\s?/, '');
const addCountryCode = (phone) => phone ? `+94${phone}` : '';

const inputClass = (hasError) =>
  `w-full px-4 py-3 border ${hasError ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`;

const phoneInputClass = (hasError) =>
  `flex-1 pl-11 pr-4 py-3 border ${hasError ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`;

export default function EditProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: stripCountryCode(profile.phone),
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
    gender: profile.gender || '',
    bloodType: profile.bloodType || '',
    address: profile.address || '',
    emergencyContact: profile.emergencyContact || '',
    emergencyRelationship: profile.emergencyRelationship || '',
    emergencyPhone: stripCountryCode(profile.emergencyPhone),
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
    else if (!PHONE_PATTERN.test(form.phone)) errs.phone = '9-10 digits starting with 7, 8, or 9';

    if (!form.dateOfBirth) {
      errs.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(form.dateOfBirth);
      if (dob > new Date()) errs.dateOfBirth = 'Date of birth cannot be in the future';
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age > MAX_AGE_YEARS) errs.dateOfBirth = 'Please enter a valid date of birth';
    }

    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.bloodType) errs.bloodType = 'Blood type is required';
    if (!form.address.trim()) errs.address = 'Address is required';

    if (!form.emergencyContact.trim()) errs.emergencyContact = 'Emergency contact name is required';
    else if (!NAME_PATTERN.test(form.emergencyContact)) errs.emergencyContact = 'Only letters and spaces allowed';

    if (!form.emergencyRelationship) errs.emergencyRelationship = 'Relationship is required';

    if (!form.emergencyPhone.trim()) errs.emergencyPhone = 'Emergency phone is required';
    else if (!PHONE_PATTERN.test(form.emergencyPhone)) errs.emergencyPhone = '9-10 digits starting with 7, 8, or 9';

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
      for (const [key, value] of Object.entries(submitted)) {
        const original = profile[key] ?? '';
        const normalised = key === 'dateOfBirth' && original ? original.split('T')[0] : (original || '');
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
        err.data.errors.forEach((e) => {
          if (e.path) fieldErrs[e.path] = e.message;
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900 font-heading">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    +94
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="7XXXXXXXX"
                      maxLength={10}
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
                <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass(errors.address)} />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    +94
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={form.emergencyPhone}
                      onChange={handleChange}
                      placeholder="7XXXXXXXX"
                      maxLength={10}
                      className={phoneInputClass(errors.emergencyPhone)}
                    />
                  </div>
                </div>
                {errors.emergencyPhone && <p className="mt-1 text-sm text-red-600">{errors.emergencyPhone}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
  );
}

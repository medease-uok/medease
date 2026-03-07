import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../data/AuthContext';
import { roles as allRoles } from '../constants';
import TermsModal from '../components/TermsModal';
import {
  Activity,
  Mail,
  Phone,
  Lock,
  User,
  Calendar,
  Heart,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  UserCheck,
  Users,
  Shield,
  CreditCard,
  FileText,
} from 'lucide-react';


const TURNSTILE_SITE_KEY = import.meta.env.VITE_CLOUDFLARE_SITE_KEY;

const roles = allRoles.filter((r) => r !== 'admin');
const genderOptions = ['Male', 'Female', 'Other'];
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const specializations = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
  'Oncology', 'Psychiatry', 'Radiology', 'Surgery', 'General Medicine',
];
const departments = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency',
  'ICU', 'Surgery', 'Radiology', 'Pathology', 'Pharmacy', 'General',
];

const stepLabels = ['Account', 'Details', 'Password'];

const PATTERNS = {
  name: /^[A-Za-z\s]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[7-9]\d{8,9}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
  license: {
    doctor: /^SLMC-[A-Za-z0-9]{4,}-[A-Za-z0-9]{4,}$/,
    nurse: /^SLNC-[A-Za-z0-9]{4,}-[A-Za-z0-9]{4,}$/,
    pharmacist: /^SLPC-[A-Za-z0-9]{4,}-[A-Za-z0-9]{4,}$/,
  },
};

const MIN_PASSWORD_LENGTH = 8;
const MAX_AGE_YEARS = 120;

const MSG = {
  required: (field) => `${field} is required`,
  nameFormat: 'Only letters and spaces allowed',
  emailFormat: 'Please enter a valid email',
  phoneFormat: 'Enter 9-10 digits starting with 7, 8, or 9',
  passwordMin: `Must be at least ${MIN_PASSWORD_LENGTH} characters`,
  passwordStrength: 'Must include uppercase, lowercase, number, and special character',
  passwordMatch: 'Passwords do not match',
  dobFuture: 'Date of birth cannot be in the future',
  dobRange: 'Please enter a valid date of birth',
  licenseFormat: (prefix) => `Format: ${prefix}-XXXX-XXXX`,
};

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  return {
    score,
    label: labels[score - 1] || 'Weak',
    color: colors[score - 1] || 'bg-red-500'
  };
}

function InputField({ label, name, type = 'text', icon: Icon, error, value, onChange, disabled, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`
            w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3
            border ${error ? 'border-red-500' : 'border-slate-300'} rounded-lg
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-all placeholder:text-slate-400
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          disabled={disabled}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function RegisterEnhanced() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: 'patient',
    password: '', confirmPassword: '', dateOfBirth: '', gender: '',
    bloodType: '', address: '', emergencyContact: '', emergencyRelationship: '',
    emergencyPhone: '', insuranceProvider: '', insurancePolicyNumber: '',
    insurancePlanType: '', insuranceExpiryDate: '',
    specialization: '', licenseNumber: '', department: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'role') {
      setFieldErrors({});
    } else {
      const cleared = { [name]: '' };
      if (name === 'password') cleared.confirmPassword = '';
      setFieldErrors((prev) => ({ ...prev, ...cleared }));
    }
    setError('');
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = MSG.required('First name');
    else if (!PATTERNS.name.test(form.firstName.trim())) errs.firstName = MSG.nameFormat;
    if (!form.lastName.trim()) errs.lastName = MSG.required('Last name');
    else if (!PATTERNS.name.test(form.lastName.trim())) errs.lastName = MSG.nameFormat;
    if (!form.email.trim()) errs.email = MSG.required('Email');
    else if (!PATTERNS.email.test(form.email.trim())) errs.email = MSG.emailFormat;
    if (form.phone && !PATTERNS.phone.test(form.phone)) errs.phone = MSG.phoneFormat;
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    switch (form.role) {
      case 'patient': {
        if (!form.dateOfBirth) {
          errs.dateOfBirth = MSG.required('Date of birth');
        } else {
          const dob = new Date(form.dateOfBirth);
          const today = new Date();
          if (dob > today) {
            errs.dateOfBirth = MSG.dobFuture;
          } else {
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
            if (age > MAX_AGE_YEARS) errs.dateOfBirth = MSG.dobRange;
          }
        }
        if (!form.gender) errs.gender = MSG.required('Gender');
        if (form.emergencyPhone && !PATTERNS.phone.test(form.emergencyPhone))
          errs.emergencyPhone = MSG.phoneFormat;
        break;
      }
      case 'doctor':
        if (!form.specialization) errs.specialization = MSG.required('Specialization');
        if (!form.licenseNumber.trim()) errs.licenseNumber = MSG.required('License number');
        else if (!PATTERNS.license.doctor.test(form.licenseNumber.trim()))
          errs.licenseNumber = MSG.licenseFormat('SLMC');
        if (!form.department) errs.department = MSG.required('Department');
        break;
      case 'nurse':
        if (!form.licenseNumber.trim()) errs.licenseNumber = MSG.required('License number');
        else if (!PATTERNS.license.nurse.test(form.licenseNumber.trim()))
          errs.licenseNumber = MSG.licenseFormat('SLNC');
        if (!form.department) errs.department = MSG.required('Department');
        break;
      case 'lab_technician':
        if (!form.department) errs.department = MSG.required('Department');
        break;
      case 'pharmacist':
        if (!form.licenseNumber.trim()) errs.licenseNumber = MSG.required('License number');
        else if (!PATTERNS.license.pharmacist.test(form.licenseNumber.trim()))
          errs.licenseNumber = MSG.licenseFormat('SLPC');
        break;
      default:
        break;
    }
    return errs;
  };

  const validateStep3 = () => {
    const errs = {};
    if (!form.password) errs.password = MSG.required('Password');
    else if (form.password.length < MIN_PASSWORD_LENGTH) errs.password = MSG.passwordMin;
    else if (!PATTERNS.password.test(form.password)) errs.password = MSG.passwordStrength;
    if (!form.confirmPassword) errs.confirmPassword = MSG.required('Password confirmation');
    else if (form.password && form.password !== form.confirmPassword)
      errs.confirmPassword = MSG.passwordMatch;
    return errs;
  };

  const handleNext = () => {
    setError('');
    const errs = step === 1 ? validateStep1() : validateStep2();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setFieldErrors({});
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validateStep3();
    if (!termsAccepted) errs.terms = 'You must accept the Terms & Conditions';
    if (!captchaToken) errs.captcha = 'Please complete the verification';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const result = await register({ ...form, captchaToken });
    setLoading(false);
    if (result.success) {
      navigate('/verify-email', { state: { email: form.email } });
    } else {
      if (result.error && result.error.toLowerCase().includes('email already exists')) {
        setFieldErrors({ email: result.error });
        setStep(1);
      } else {
        setError(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-cta/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-cta p-8 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white font-heading mb-2">MedEase</h1>
            <p className="text-white/90 text-sm">Create Your Account</p>
          </div>

          <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  {stepLabels.map((label, i) => {
                    const num = i + 1;
                    const isActive = num === step;
                    const isComplete = num < step;

                    return (
                      <div key={label} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                            ${isComplete ? 'bg-primary text-white' : isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}
                            transition-all
                          `}>
                            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : num}
                          </div>
                          <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                            {label}
                          </span>
                        </div>
                        {i < stepLabels.length - 1 && (
                          <div className={`h-1 flex-1 mx-2 rounded ${num < step ? 'bg-primary' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* STEP 1: Account Information */}
                {step === 1 && (
                  <>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="First Name *" name="firstName" icon={User} error={fieldErrors.firstName} maxLength={50} value={form.firstName} onChange={handleChange} disabled={loading} />
                      <InputField label="Last Name *" name="lastName" icon={User} error={fieldErrors.lastName} maxLength={50} value={form.lastName} onChange={handleChange} disabled={loading} />
                    </div>
                    <InputField label="Email *" name="email" type="email" icon={Mail} error={fieldErrors.email} maxLength={100} value={form.email} onChange={handleChange} disabled={loading} />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
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
                            className={`w-full pl-11 pr-4 py-3 border ${fieldErrors.phone ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                          />
                        </div>
                      </div>
                      {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-cta text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                      >
                        Next <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 2: Role-Specific Details */}
                {step === 2 && (
                  <>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      {form.role === 'patient' ? 'Patient Information' : 'Professional Information'}
                    </h3>

                    {form.role === 'patient' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField label="Date of Birth *" name="dateOfBirth" type="date" icon={Calendar} error={fieldErrors.dateOfBirth} value={form.dateOfBirth} onChange={handleChange} disabled={loading} />
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                            <select
                              name="gender"
                              value={form.gender}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 border ${fieldErrors.gender ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-primary`}
                            >
                              <option value="">Select Gender</option>
                              {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                            {fieldErrors.gender && <p className="mt-1 text-sm text-red-600">{fieldErrors.gender}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Blood Type</label>
                            <div className="relative">
                              <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <select
                                name="bloodType"
                                value={form.bloodType}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Select Blood Type</option>
                                {bloodTypes.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                              </select>
                            </div>
                          </div>
                          <InputField label="Address" name="address" icon={MapPin} value={form.address} onChange={handleChange} disabled={loading} placeholder="Your address" />
                        </div>

                        {/* Emergency Contact */}
                        <div className="border-t border-slate-200 pt-4 mt-2">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            Emergency Contact
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Contact Name" name="emergencyContact" icon={UserCheck} value={form.emergencyContact} onChange={handleChange} disabled={loading} placeholder="Full name" maxLength={100} />
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Relationship</label>
                              <select
                                name="emergencyRelationship"
                                value={form.emergencyRelationship}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                              >
                                <option value="">Select Relationship</option>
                                <option value="Parent">Parent</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Child">Child</option>
                                <option value="Friend">Friend</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Phone</label>
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
                                  className={`w-full pl-11 pr-4 py-3 border ${fieldErrors.emergencyPhone ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                                />
                              </div>
                            </div>
                            {fieldErrors.emergencyPhone && <p className="mt-1 text-sm text-red-600">{fieldErrors.emergencyPhone}</p>}
                          </div>
                        </div>

                        {/* Insurance Details */}
                        <div className="border-t border-slate-200 pt-4 mt-2">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-slate-500" />
                            Insurance Details
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Insurance Provider" name="insuranceProvider" icon={CreditCard} value={form.insuranceProvider} onChange={handleChange} disabled={loading} placeholder="Provider name" maxLength={100} />
                            <InputField label="Policy Number" name="insurancePolicyNumber" icon={FileText} value={form.insurancePolicyNumber} onChange={handleChange} disabled={loading} placeholder="Policy number" maxLength={50} />
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Plan Type</label>
                              <select
                                name="insurancePlanType"
                                value={form.insurancePlanType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Select Plan</option>
                                <option value="Inpatient">Inpatient</option>
                                <option value="Outpatient">Outpatient</option>
                                <option value="Comprehensive">Comprehensive</option>
                              </select>
                            </div>
                            <InputField label="Expiry Date" name="insuranceExpiryDate" type="date" icon={Calendar} value={form.insuranceExpiryDate} onChange={handleChange} disabled={loading} />
                          </div>
                        </div>
                      </>
                    )}

                    {form.role === 'doctor' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Specialization *</label>
                          <div className="relative">
                            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                              name="specialization"
                              value={form.specialization}
                              onChange={handleChange}
                              className={`w-full pl-11 pr-4 py-3 border ${fieldErrors.specialization ? 'border-red-500' : 'border-slate-300'} rounded-lg`}
                            >
                              <option value="">Select Specialization</option>
                              {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          {fieldErrors.specialization && <p className="mt-1 text-sm text-red-600">{fieldErrors.specialization}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField label="License Number (SLMC) *" name="licenseNumber" placeholder="SLMC-XXXX-XXXX" error={fieldErrors.licenseNumber} maxLength={30} value={form.licenseNumber} onChange={handleChange} disabled={loading} />
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                            <select
                              name="department"
                              value={form.department}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 border ${fieldErrors.department ? 'border-red-500' : 'border-slate-300'} rounded-lg`}
                            >
                              <option value="">Select Department</option>
                              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {fieldErrors.department && <p className="mt-1 text-sm text-red-600">{fieldErrors.department}</p>}
                          </div>
                        </div>
                      </>
                    )}

                    {(form.role === 'nurse' || form.role === 'pharmacist') && (
                      <>
                        <InputField
                          label={`License Number (${form.role === 'nurse' ? 'SLNC' : 'SLPC'}) *`}
                          name="licenseNumber"
                          placeholder={`${form.role === 'nurse' ? 'SLNC' : 'SLPC'}-XXXX-XXXX`}
                          error={fieldErrors.licenseNumber}
                          maxLength={30}
                          value={form.licenseNumber}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        {form.role === 'nurse' && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                            <select name="department" value={form.department} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg">
                              <option value="">Select Department</option>
                              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {form.role === 'lab_technician' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                        <select name="department" value={form.department} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg">
                          <option value="">Select Department</option>
                          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button type="button" onClick={handleBack} className="flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all">
                        <ChevronLeft className="w-5 h-5" /> Back
                      </button>
                      <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-cta text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                        Next <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 3: Password */}
                {step === 3 && (
                  <>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Set Your Password</h3>
                    <InputField label="Password *" name="password" type="password" icon={Lock} error={fieldErrors.password} maxLength={72} value={form.password} onChange={handleChange} disabled={loading} />
                    {form.password && (() => {
                      const { score, label, color } = getPasswordStrength(form.password);
                      return (
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className={`h-2 flex-1 rounded ${i <= score ? color : 'bg-slate-200'}`} />
                            ))}
                          </div>
                          <p className="text-sm text-slate-600">Strength: <span className="font-semibold">{label}</span></p>
                        </div>
                      );
                    })()}
                    <InputField label="Confirm Password *" name="confirmPassword" type="password" icon={Lock} error={fieldErrors.confirmPassword} maxLength={72} value={form.confirmPassword} onChange={handleChange} disabled={loading} />

                    <div className="space-y-4">
                      <Turnstile
                        siteKey={TURNSTILE_SITE_KEY}
                        options={{ theme: 'light' }}
                        onSuccess={setCaptchaToken}
                        onExpire={() => setCaptchaToken('')}
                        onError={() => setCaptchaToken('')}
                      />
                      {fieldErrors.captcha && <p className="text-sm text-red-600">{fieldErrors.captcha}</p>}
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          setFieldErrors((prev) => ({ ...prev, terms: '' }));
                        }}
                        className="mt-1 w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm text-slate-700">
                        I agree to the{' '}
                        <button type="button" onClick={() => setTermsOpen(true)} className="text-primary hover:underline font-semibold">
                          Terms & Conditions
                        </button>
                      </span>
                    </label>
                    {fieldErrors.terms && <p className="text-sm text-red-600">{fieldErrors.terms}</p>}

                    <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />

                    <div className="flex justify-between">
                      <button type="button" onClick={handleBack} className="flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all">
                        <ChevronLeft className="w-5 h-5" /> Back
                      </button>
                      <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-cta text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all">
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:text-primary/80 font-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

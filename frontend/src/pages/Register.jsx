import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../data/AuthContext';
import { roles as allRoles } from '../constants';
import './Login.css';
import './Register.css';

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

/* Validation patterns and messages */
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

const STRENGTH_LEVELS = ['Weak', 'Fair', 'Good', 'Strong'];

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  return { score, label: STRENGTH_LEVELS[score - 1] || 'Weak' };
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'patient',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    address: '',
    emergencyContact: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    specialization: '',
    licenseNumber: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const navigate = useNavigate();
  const { register, resendVerification } = useAuth();

  /* Helpers for per-field accessibility & error display */
  const fieldProps = (name, baseClass = 'login-input') => ({
    className: `${baseClass}${fieldErrors[name] ? ' input-error' : ''}`,
    'aria-invalid': fieldErrors[name] ? 'true' : undefined,
    'aria-describedby': fieldErrors[name] ? `err-${name}` : undefined,
  });

  const renderError = (name) =>
    fieldErrors[name] ? (
      <span id={`err-${name}`} className="field-error" role="alert">
        {fieldErrors[name]}
      </span>
    ) : null;

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
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
              age--;
            }
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
    if (!captchaToken) errs.captcha = 'Please complete the verification';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const result = await register({ ...form, captchaToken });
    setLoading(false);
    if (result.success) {
      navigate('/verify-email', { state: { email: form.email } });
    } else {
      /* If email already exists, show inline error and go back to step 1 */
      if (result.error && result.error.toLowerCase().includes('email already exists')) {
        setFieldErrors({ email: result.error });
        setStep(1);
      } else {
        setError(result.error);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <div className="login-brand">
          <span className="login-logo">+</span>
          <h1 className="login-title">MedEase</h1>
          <p className="login-subtitle">Create an Account</p>
        </div>
        
        {/* Step indicator */}
        <div className="register-steps">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            let cls = 'register-step';
            if (num < step) cls += ' register-step-done';
            else if (num === step) cls += ' register-step-active';
            return (
              <div key={label} className="register-step-wrapper">
                {i > 0 && <div className={`register-step-line${num <= step ? ' register-step-line-active' : ''}`} />}
                <div className={cls}>
                  <span className="register-step-circle">
                    {num < step ? '\u2713' : num}
                  </span>
                  <span className="register-step-label">{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Account Information */}
          {step === 1 && (
            <>
              <div className="register-section-title">Account Information</div>
              <div className="register-row">
                <div className="login-field">
                  <label className="login-label" htmlFor="reg-firstName">First Name *</label>
                  <input id="reg-firstName" type="text" name="firstName" maxLength={50} {...fieldProps('firstName')} value={form.firstName} onChange={handleChange} />
                  {renderError('firstName')}
                </div>
                <div className="login-field">
                  <label className="login-label" htmlFor="reg-lastName">Last Name *</label>
                  <input id="reg-lastName" type="text" name="lastName" maxLength={50} {...fieldProps('lastName')} value={form.lastName} onChange={handleChange} />
                  {renderError('lastName')}
                </div>
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-email">Email *</label>
                <input id="reg-email" type="email" name="email" maxLength={100} {...fieldProps('email')} value={form.email} onChange={handleChange} />
                {renderError('email')}
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-phone">Phone</label>
                <div className="register-phone-group">
                  <span className="register-phone-prefix">+94</span>
                  <input id="reg-phone" type="tel" name="phone" maxLength={10} {...fieldProps('phone', 'login-input register-phone-input')} placeholder="7XXXXXXXX" value={form.phone} onChange={handleChange} />
                </div>
                {renderError('phone')}
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-role">Role *</label>
                <select id="reg-role" name="role" className="login-select" value={form.role} onChange={handleChange}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="register-nav">
                <span />
                <button type="button" className="login-button register-btn-next" onClick={handleNext}>
                  Next
                </button>
              </div>
            </>
          )}

          {/* Step 2: Role-Specific Details */}
          {step === 2 && (
            <>
              {form.role === 'patient' && (
                <>
                  <div className="register-section-title">Patient Information</div>
                  <div className="register-row">
                    <div className="login-field">
                      <label className="login-label" htmlFor="reg-dob">Date of Birth *</label>
                      <input id="reg-dob" type="date" name="dateOfBirth" {...fieldProps('dateOfBirth')} value={form.dateOfBirth} onChange={handleChange} />
                      {renderError('dateOfBirth')}
                    </div>
                    <div className="login-field">
                      <label className="login-label" htmlFor="reg-gender">Gender *</label>
                      <select id="reg-gender" name="gender" {...fieldProps('gender', 'login-select')} value={form.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      {renderError('gender')}
                    </div>
                  </div>
                  <div className="login-field">
                    <label className="login-label" htmlFor="reg-bloodType">Blood Type</label>
                    <select id="reg-bloodType" name="bloodType" className="login-select" value={form.bloodType} onChange={handleChange}>
                      <option value="">Select Blood Type</option>
                      {bloodTypes.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </div>
                  <div className="register-row">
                    <div className="login-field">
                      <label className="login-label" htmlFor="reg-emergencyContact">Emergency Contact Name</label>
                      <input id="reg-emergencyContact" type="text" name="emergencyContact" maxLength={100} className="login-input" placeholder="e.g. John Perera" value={form.emergencyContact} onChange={handleChange} />
                    </div>
                    <div className="login-field">
                      <label className="login-label" htmlFor="reg-emergencyRelationship">Relationship</label>
                      <select id="reg-emergencyRelationship" name="emergencyRelationship" className="login-select" value={form.emergencyRelationship} onChange={handleChange}>
                        <option value="">Select Relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="login-field">
                    <label className="login-label" htmlFor="reg-emergencyPhone">Emergency Phone</label>
                    <div className="register-phone-group">
                      <span className="register-phone-prefix">+94</span>
                      <input id="reg-emergencyPhone" type="tel" name="emergencyPhone" maxLength={10} {...fieldProps('emergencyPhone', 'login-input register-phone-input')} placeholder="7XXXXXXXX" value={form.emergencyPhone} onChange={handleChange} />
                    </div>
                    {renderError('emergencyPhone')}
                  </div>
                  <div className="login-field">
                    <label className="login-label" htmlFor="reg-address">Address</label>
                    <input id="reg-address" type="text" name="address" maxLength={200} className="login-input" placeholder="Full address" value={form.address} onChange={handleChange} />
                  </div>
                </>
              )}

              {form.role === 'doctor' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="login-field">
                    <label className="login-label" htmlFor="reg-specialization">Specialization *</label>
                    <select id="reg-specialization" name="specialization" {...fieldProps('specialization', 'login-select')} value={form.specialization} onChange={handleChange}>
                      <option value="">Select Specialization</option>
                      {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {renderError('specialization')}
                  </div>
                  <div className="register-row">
                    <div className="login-field">
                      <label className="login-label" htmlFor="reg-licenseNumber">License Number (SLMC) *</label>
                      <input id="reg-licenseNumber" type="text" name="licenseNumber" maxLength={30} {...fieldProps('licenseNumber')} placeholder="SLMC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
                      {renderError('licenseNumber')}
                    </div>
                    <div className="login-field">
                      <label className="login-label" htmlFor="reg-department">Department *</label>
                      <select id="reg-department" name="department" {...fieldProps('department', 'login-select')} value={form.department} onChange={handleChange}>
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {renderError('department')}
                    </div>
                  </div>
                </>
              )}

              {form.role === 'nurse' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="register-row">
                    <div className="login-field">
                      <label className="login-label" htmlFor="reg-licenseNumber">License Number (SLNC) *</label>
                      <input id="reg-licenseNumber" type="text" name="licenseNumber" maxLength={30} {...fieldProps('licenseNumber')} placeholder="SLNC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
                      {renderError('licenseNumber')}
                    </div>
                    <div className="login-field">
                      <label className="login-label" htmlFor="reg-department">Department *</label>
                      <select id="reg-department" name="department" {...fieldProps('department', 'login-select')} value={form.department} onChange={handleChange}>
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {renderError('department')}
                    </div>
                  </div>
                </>
              )}

              {form.role === 'lab_technician' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="login-field">
                    <label className="login-label" htmlFor="reg-department">Department *</label>
                    <select id="reg-department" name="department" {...fieldProps('department', 'login-select')} value={form.department} onChange={handleChange}>
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {renderError('department')}
                  </div>
                </>
              )}

              {form.role === 'pharmacist' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="login-field">
                    <label className="login-label" htmlFor="reg-licenseNumber">License Number (SLPC) *</label>
                    <input id="reg-licenseNumber" type="text" name="licenseNumber" maxLength={30} {...fieldProps('licenseNumber')} placeholder="SLPC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
                    {renderError('licenseNumber')}
                  </div>
                </>
              )}

              <div className="register-nav">
                <button type="button" className="register-btn-back" onClick={handleBack}>
                  Back
                </button>
                <button type="button" className="login-button register-btn-next" onClick={handleNext}>
                  Next
                </button>
              </div>
            </>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <>
              <div className="register-section-title">Set Your Password</div>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-password">Password *</label>
                <input id="reg-password" type="password" name="password" maxLength={72} {...fieldProps('password')} value={form.password} onChange={handleChange} />
                {renderError('password')}
                {form.password && (() => {
                  const { score, label } = getPasswordStrength(form.password);
                  return (
                    <div className="password-strength">
                      <div className="password-strength-bar">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`password-strength-segment${i <= score ? ` strength-${score}` : ''}`} />
                        ))}
                      </div>
                      <span className={`password-strength-label strength-text-${score}`}>{label}</span>
                    </div>
                  );
                })()}
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-confirmPassword">Confirm Password *</label>
                <input id="reg-confirmPassword" type="password" name="confirmPassword" maxLength={72} {...fieldProps('confirmPassword')} value={form.confirmPassword} onChange={handleChange} />
                {renderError('confirmPassword')}
              </div>
              <div className="register-captcha">
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  options={{ theme: 'light' }}
                  onSuccess={setCaptchaToken}
                  onExpire={() => setCaptchaToken('')}
                  onError={() => setCaptchaToken('')}
                />
                {renderError('captcha')}
              </div>
              <div className="register-nav">
                <button type="button" className="register-btn-back" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="login-button register-btn-next" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>
        <div className="register-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

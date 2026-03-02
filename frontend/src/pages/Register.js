import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { roles as allRoles } from '../constants';
import './Login.css';
import './Register.css';

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
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const nameRegex = /^[A-Za-z\s]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{9,10}$/;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setError('');
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    else if (!nameRegex.test(form.firstName)) errs.firstName = 'Only letters and spaces allowed';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    else if (!nameRegex.test(form.lastName)) errs.lastName = 'Only letters and spaces allowed';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!emailRegex.test(form.email)) errs.email = 'Please enter a valid email';
    if (form.phone && !phoneRegex.test(form.phone)) errs.phone = 'Phone must be 9-10 digits';
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    switch (form.role) {
      case 'patient':
        if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
        else if (new Date(form.dateOfBirth) > new Date()) errs.dateOfBirth = 'Cannot be in the future';
        if (!form.gender) errs.gender = 'Gender is required';
        if (form.emergencyPhone && !phoneRegex.test(form.emergencyPhone)) errs.emergencyPhone = 'Must be 9-10 digits';
        break;
      case 'doctor':
        if (!form.specialization) errs.specialization = 'Specialization is required';
        if (!form.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
        else if (!/^SLMC-\w+-\w+$/.test(form.licenseNumber)) errs.licenseNumber = 'Format: SLMC-XXXX-XXXX';
        if (!form.department) errs.department = 'Department is required';
        break;
      case 'nurse':
        if (!form.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
        else if (!/^SLNC-\w+-\w+$/.test(form.licenseNumber)) errs.licenseNumber = 'Format: SLNC-XXXX-XXXX';
        if (!form.department) errs.department = 'Department is required';
        break;
      case 'lab_technician':
        if (!form.department) errs.department = 'Department is required';
        break;
      case 'pharmacist':
        if (!form.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
        else if (!/^SLPC-\w+-\w+$/.test(form.licenseNumber)) errs.licenseNumber = 'Format: SLPC-XXXX-XXXX';
        break;
      default:
        break;
    }
    return errs;
  };

  const validateStep3 = () => {
    const errs = {};
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Must be at least 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password && form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
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
        {success ? (
          <div className="register-success">
            <p>Your account has been created successfully.</p>
            <p>Please wait for admin approval before signing in.</p>
            <Link to="/login" className="login-button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '20px' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (<>
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
                  <label className="login-label">First Name *</label>
                  <input type="text" name="firstName" className={`login-input ${fieldErrors.firstName ? 'input-error' : ''}`} value={form.firstName} onChange={handleChange} />
                  {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
                </div>
                <div className="login-field">
                  <label className="login-label">Last Name *</label>
                  <input type="text" name="lastName" className={`login-input ${fieldErrors.lastName ? 'input-error' : ''}`} value={form.lastName} onChange={handleChange} />
                  {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
                </div>
              </div>
              <div className="login-field">
                <label className="login-label">Email *</label>
                <input type="email" name="email" className={`login-input ${fieldErrors.email ? 'input-error' : ''}`} value={form.email} onChange={handleChange} />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>
              <div className="login-field">
                <label className="login-label">Phone</label>
                <div className="register-phone-group">
                  <span className="register-phone-prefix">+94</span>
                  <input type="tel" name="phone" className={`login-input register-phone-input ${fieldErrors.phone ? 'input-error' : ''}`} placeholder="7XXXXXXXX" value={form.phone} onChange={handleChange} />
                </div>
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </div>
              <div className="login-field">
                <label className="login-label">Role *</label>
                <select name="role" className="login-select" value={form.role} onChange={handleChange}>
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
                      <label className="login-label">Date of Birth *</label>
                      <input type="date" name="dateOfBirth" className={`login-input ${fieldErrors.dateOfBirth ? 'input-error' : ''}`} value={form.dateOfBirth} onChange={handleChange} />
                      {fieldErrors.dateOfBirth && <span className="field-error">{fieldErrors.dateOfBirth}</span>}
                    </div>
                    <div className="login-field">
                      <label className="login-label">Gender *</label>
                      <select name="gender" className={`login-select ${fieldErrors.gender ? 'input-error' : ''}`} value={form.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      {fieldErrors.gender && <span className="field-error">{fieldErrors.gender}</span>}
                    </div>
                  </div>
                  <div className="login-field">
                    <label className="login-label">Blood Type</label>
                    <select name="bloodType" className="login-select" value={form.bloodType} onChange={handleChange}>
                      <option value="">Select Blood Type</option>
                      {bloodTypes.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </div>
                  <div className="register-row">
                    <div className="login-field">
                      <label className="login-label">Emergency Contact Name</label>
                      <input type="text" name="emergencyContact" className="login-input" placeholder="e.g. John Perera" value={form.emergencyContact} onChange={handleChange} />
                    </div>
                    <div className="login-field">
                      <label className="login-label">Relationship</label>
                      <select name="emergencyRelationship" className="login-select" value={form.emergencyRelationship} onChange={handleChange}>
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
                    <label className="login-label">Emergency Phone</label>
                    <div className="register-phone-group">
                      <span className="register-phone-prefix">+94</span>
                      <input type="tel" name="emergencyPhone" className={`login-input register-phone-input ${fieldErrors.emergencyPhone ? 'input-error' : ''}`} placeholder="7XXXXXXXX" value={form.emergencyPhone} onChange={handleChange} />
                    </div>
                    {fieldErrors.emergencyPhone && <span className="field-error">{fieldErrors.emergencyPhone}</span>}
                  </div>
                  <div className="login-field">
                    <label className="login-label">Address</label>
                    <input type="text" name="address" className="login-input" placeholder="Full address" value={form.address} onChange={handleChange} />
                  </div>
                </>
              )}

              {form.role === 'doctor' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="login-field">
                    <label className="login-label">Specialization *</label>
                    <select name="specialization" className={`login-select ${fieldErrors.specialization ? 'input-error' : ''}`} value={form.specialization} onChange={handleChange}>
                      <option value="">Select Specialization</option>
                      {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {fieldErrors.specialization && <span className="field-error">{fieldErrors.specialization}</span>}
                  </div>
                  <div className="register-row">
                    <div className="login-field">
                      <label className="login-label">License Number (SLMC) *</label>
                      <input type="text" name="licenseNumber" className={`login-input ${fieldErrors.licenseNumber ? 'input-error' : ''}`} placeholder="SLMC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
                      {fieldErrors.licenseNumber && <span className="field-error">{fieldErrors.licenseNumber}</span>}
                    </div>
                    <div className="login-field">
                      <label className="login-label">Department *</label>
                      <select name="department" className={`login-select ${fieldErrors.department ? 'input-error' : ''}`} value={form.department} onChange={handleChange}>
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {fieldErrors.department && <span className="field-error">{fieldErrors.department}</span>}
                    </div>
                  </div>
                </>
              )}

              {form.role === 'nurse' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="register-row">
                    <div className="login-field">
                      <label className="login-label">License Number (SLNC) *</label>
                      <input type="text" name="licenseNumber" className={`login-input ${fieldErrors.licenseNumber ? 'input-error' : ''}`} placeholder="SLNC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
                      {fieldErrors.licenseNumber && <span className="field-error">{fieldErrors.licenseNumber}</span>}
                    </div>
                    <div className="login-field">
                      <label className="login-label">Department *</label>
                      <select name="department" className={`login-select ${fieldErrors.department ? 'input-error' : ''}`} value={form.department} onChange={handleChange}>
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {fieldErrors.department && <span className="field-error">{fieldErrors.department}</span>}
                    </div>
                  </div>
                </>
              )}

              {form.role === 'lab_technician' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="login-field">
                    <label className="login-label">Department *</label>
                    <select name="department" className={`login-select ${fieldErrors.department ? 'input-error' : ''}`} value={form.department} onChange={handleChange}>
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {fieldErrors.department && <span className="field-error">{fieldErrors.department}</span>}
                  </div>
                </>
              )}

              {form.role === 'pharmacist' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="login-field">
                    <label className="login-label">License Number (SLPC) *</label>
                    <input type="text" name="licenseNumber" className={`login-input ${fieldErrors.licenseNumber ? 'input-error' : ''}`} placeholder="SLPC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
                    {fieldErrors.licenseNumber && <span className="field-error">{fieldErrors.licenseNumber}</span>}
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
                <label className="login-label">Password *</label>
                <input type="password" name="password" className={`login-input ${fieldErrors.password ? 'input-error' : ''}`} value={form.password} onChange={handleChange} />
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </div>
              <div className="login-field">
                <label className="login-label">Confirm Password *</label>
                <input type="password" name="confirmPassword" className={`login-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`} value={form.confirmPassword} onChange={handleChange} />
                {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
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
        </>)}
      </div>
    </div>
  );
}

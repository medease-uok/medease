import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { roles as allRoles } from '../data/users';
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
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email) {
        setError('Please fill in all required fields.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (form.role === 'patient') {
        if (!form.dateOfBirth || !form.gender) {
          setError('Please fill in date of birth and gender.');
          return;
        }
      }
      if (form.role === 'doctor') {
        if (!form.specialization || !form.licenseNumber || !form.department) {
          setError('Please fill in specialization, license number, and department.');
          return;
        }
      }
      if (form.role === 'nurse') {
        if (!form.licenseNumber || !form.department) {
          setError('Please fill in license number and department.');
          return;
        }
      }
      if (form.role === 'lab_technician') {
        if (!form.department) {
          setError('Please select a department.');
          return;
        }
      }
      if (form.role === 'pharmacist') {
        if (!form.licenseNumber) {
          setError('Please fill in your license number.');
          return;
        }
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.password) {
      setError('Please enter a password.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
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
                  <input type="text" name="firstName" className="login-input" value={form.firstName} onChange={handleChange} />
                </div>
                <div className="login-field">
                  <label className="login-label">Last Name *</label>
                  <input type="text" name="lastName" className="login-input" value={form.lastName} onChange={handleChange} />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label">Email *</label>
                <input type="email" name="email" className="login-input" value={form.email} onChange={handleChange} />
              </div>
              <div className="login-field">
                <label className="login-label">Phone</label>
                <div className="register-phone-group">
                  <span className="register-phone-prefix">+94</span>
                  <input type="tel" name="phone" className="login-input register-phone-input" placeholder="7XXXXXXXX" value={form.phone} onChange={handleChange} />
                </div>
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
                      <input type="date" name="dateOfBirth" className="login-input" value={form.dateOfBirth} onChange={handleChange} />
                    </div>
                    <div className="login-field">
                      <label className="login-label">Gender *</label>
                      <select name="gender" className="login-select" value={form.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
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
                      <input type="tel" name="emergencyPhone" className="login-input register-phone-input" placeholder="7XXXXXXXX" value={form.emergencyPhone} onChange={handleChange} />
                    </div>
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
                    <select name="specialization" className="login-select" value={form.specialization} onChange={handleChange}>
                      <option value="">Select Specialization</option>
                      {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="register-row">
                    <div className="login-field">
                      <label className="login-label">License Number (SLMC) *</label>
                      <input type="text" name="licenseNumber" className="login-input" placeholder="SLMC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
                    </div>
                    <div className="login-field">
                      <label className="login-label">Department *</label>
                      <select name="department" className="login-select" value={form.department} onChange={handleChange}>
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
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
                      <input type="text" name="licenseNumber" className="login-input" placeholder="SLNC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
                    </div>
                    <div className="login-field">
                      <label className="login-label">Department *</label>
                      <select name="department" className="login-select" value={form.department} onChange={handleChange}>
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {form.role === 'lab_technician' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="login-field">
                    <label className="login-label">Department *</label>
                    <select name="department" className="login-select" value={form.department} onChange={handleChange}>
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </>
              )}

              {form.role === 'pharmacist' && (
                <>
                  <div className="register-section-title">Professional Information</div>
                  <div className="login-field">
                    <label className="login-label">License Number (SLPC) *</label>
                    <input type="text" name="licenseNumber" className="login-input" placeholder="SLPC-XXXX-XXXX" value={form.licenseNumber} onChange={handleChange} />
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
                <input type="password" name="password" className="login-input" value={form.password} onChange={handleChange} />
              </div>
              <div className="login-field">
                <label className="login-label">Confirm Password *</label>
                <input type="password" name="confirmPassword" className="login-input" value={form.confirmPassword} onChange={handleChange} />
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

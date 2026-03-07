import { useEffect } from 'react';
import './TermsModal.css';

export default function TermsModal({ open, onClose }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="terms-overlay" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terms-header">
          <h2>Terms &amp; Conditions</h2>
          <button className="terms-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="terms-body">
          <p className="terms-updated">Last updated: March 2026</p>

          <h3>1. Acceptance of Terms</h3>
          <p>
            By creating an account on MedEase, you agree to be bound by these Terms &amp; Conditions.
            MedEase is a hospital management system operated for government hospitals in Sri Lanka.
            If you do not agree, please do not register.
          </p>

          <h3>2. Eligibility</h3>
          <p>
            You must be at least 18 years of age or have parental/guardian consent to register.
            Healthcare professionals (doctors, nurses, pharmacists, lab technicians) must hold
            valid licenses issued by the relevant Sri Lankan regulatory body — the Sri Lanka
            Medical Council (SLMC), Sri Lanka Nursing Council (SLNC), or Sri Lanka Pharmacy
            Council (SLPC) — as applicable.
          </p>

          <h3>3. User Accounts &amp; Responsibilities</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials.
            You agree to provide accurate, current, and complete information during registration.
            Accounts are subject to administrator approval before activation.
          </p>

          <h3>4. Privacy &amp; Data Protection</h3>
          <p>
            MedEase collects and processes personal data — including medical records, contact
            details, and professional credentials — in accordance with the <strong>Personal Data
            Protection Act No. 9 of 2022</strong> of Sri Lanka. Your data will be used solely
            for healthcare service delivery, appointment management, and system administration.
            We will not share your personal information with third parties except as required by
            law or with your explicit consent.
          </p>

          <h3>5. Medical Records &amp; Confidentiality</h3>
          <p>
            All electronic medical records (EMR) stored on MedEase are treated as confidential
            and are accessible only to authorised healthcare personnel involved in your care.
            Access to patient records is governed by the <strong>Code of Ethics</strong> of
            the Sri Lanka Medical Council and applicable health regulations.
          </p>

          <h3>6. Acceptable Use</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Access another user's account or medical records without authorisation</li>
            <li>Submit false or misleading information</li>
            <li>Use the system for any purpose other than legitimate healthcare operations</li>
            <li>Attempt to interfere with, compromise, or disrupt the system's security</li>
          </ul>

          <h3>7. System Availability</h3>
          <p>
            While we strive to maintain continuous availability, MedEase may be temporarily
            unavailable due to maintenance, upgrades, or circumstances beyond our control.
            We shall not be liable for any loss arising from system downtime.
          </p>

          <h3>8. Limitation of Liability</h3>
          <p>
            MedEase is a management and information tool. It does not provide medical advice,
            diagnosis, or treatment. Clinical decisions remain the sole responsibility of
            qualified healthcare professionals. MedEase and its operators shall not be held
            liable for clinical outcomes resulting from the use of this system.
          </p>

          <h3>9. Governing Law</h3>
          <p>
            These Terms &amp; Conditions shall be governed by and construed in accordance with
            the laws of the Democratic Socialist Republic of Sri Lanka. Any disputes arising
            from these terms shall be subject to the exclusive jurisdiction of the courts of
            Sri Lanka.
          </p>

          <h3>10. Changes to Terms</h3>
          <p>
            We reserve the right to update these Terms &amp; Conditions at any time. Continued
            use of MedEase after changes constitutes acceptance of the revised terms.
          </p>
        </div>
        <div className="terms-footer">
          <button className="login-button" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </div>
  );
}

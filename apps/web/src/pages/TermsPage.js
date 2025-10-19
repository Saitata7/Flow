import React from 'react';
import { motion } from 'framer-motion';

const TermsPage = () => {
  return (
    <div className="terms-page">
      <div className="container">
        <motion.div
          className="terms-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="terms-header">
            <h1>Terms & Conditions</h1>
            <p className="terms-intro">
              Welcome to Flow — by using our app or website, you agree to the following terms.
            </p>
            <p className="last-updated">Last updated: January 2025</p>
          </div>

          <div className="terms-sections">
            <section className="terms-section">
              <h2>1. Account & User Responsibilities</h2>
              <div className="terms-text">
                <p>
                  When you create an account with Flow, you must provide accurate and complete information. 
                  You are responsible for maintaining the security of your account and password.
                </p>
                <p>
                  Guest mode users have limited access to features. To sync data across devices and access 
                  full functionality, you must create an account and log in.
                </p>
                <p>
                  You agree to notify us immediately of any unauthorized use of your account or any other 
                  breach of security.
                </p>
              </div>
            </section>

            <section className="terms-section">
              <h2>2. Data & Privacy</h2>
              <div className="terms-text">
                <p>
                  Flow respects your privacy and collects minimal data necessary for app functionality. 
                  We are committed to protecting your personal information and using it responsibly.
                </p>
                <p>
                  Your data syncs between offline storage (local device) and cloud storage (Google Cloud Platform). 
                  This ensures your progress is saved and accessible across devices.
                </p>
                <p>
                  We do not sell, trade, or share your personal data with third parties for marketing purposes. 
                  Data is only used to provide and improve our services.
                </p>
                <p>
                  You can request data deletion at any time by contacting us at privacy@flowapp.ai.
                </p>
              </div>
            </section>

            <section className="terms-section">
              <h2>3. Usage Restrictions</h2>
              <div className="terms-text">
                <p>
                  You agree not to use Flow for any unlawful purpose or in any way that could damage, 
                  disable, overburden, or impair our services.
                </p>
                <p>
                  Prohibited activities include:
                </p>
                <ul>
                  <li>Reverse engineering, decompiling, or disassembling the app</li>
                  <li>Attempting to extract source code or algorithms</li>
                  <li>Data scraping or automated data collection</li>
                  <li>Distributing or redistributing the app without permission</li>
                  <li>Using the app to violate any laws or regulations</li>
                </ul>
                <p>
                  You may not redistribute our AI models, algorithms, or proprietary technology.
                </p>
              </div>
            </section>

            <section className="terms-section">
              <h2>4. Intellectual Property</h2>
              <div className="terms-text">
                <p>
                  All trademarks, service marks, trade names, logos, and other branding elements 
                  displayed in Flow are the property of Flow or their respective owners.
                </p>
                <p>
                  The app content, including but not limited to text, graphics, images, music, 
                  software, and other materials, is protected by copyright and other intellectual 
                  property laws.
                </p>
                <p>
                  You may not modify, reproduce, distribute, or create derivative works based on 
                  our content without explicit written permission.
                </p>
              </div>
            </section>

            <section className="terms-section">
              <h2>5. Limitation of Liability</h2>
              <div className="terms-text">
                <p>
                  Flow is provided "as is" without warranties of any kind. We do not guarantee 
                  that the app will be error-free or uninterrupted.
                </p>
                <p>
                  Flow is not responsible for:
                </p>
                <ul>
                  <li>Data loss due to device failure, user error, or external factors</li>
                  <li>Issues arising from third-party services (Firebase, Google Cloud Platform)</li>
                  <li>Network connectivity problems or service interruptions</li>
                  <li>Misuse of the app or failure to follow recommended practices</li>
                </ul>
                <p>
                  Our liability is limited to the maximum extent permitted by law.
                </p>
              </div>
            </section>

            <section className="terms-section">
              <h2>6. Service Availability</h2>
              <div className="terms-text">
                <p>
                  We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                  Maintenance, updates, and technical issues may temporarily affect service.
                </p>
                <p>
                  Flow may modify, suspend, or discontinue features at any time with reasonable notice 
                  to users.
                </p>
              </div>
            </section>

            <section className="terms-section">
              <h2>7. Changes to Terms</h2>
              <div className="terms-text">
                <p>
                  We reserve the right to modify these terms at any time. Changes will be posted 
                  on this page with an updated "Last updated" date.
                </p>
                <p>
                  Continued use of Flow after changes constitutes acceptance of the new terms. 
                  If you disagree with changes, you may discontinue use of the app.
                </p>
              </div>
            </section>

            <section className="terms-section">
              <h2>8. Contact Information</h2>
              <div className="terms-text">
                <p>
                  For questions about these Terms & Conditions, please contact us:
                </p>
                <div className="contact-info">
                  <p><strong>Email:</strong> legal@flowapp.ai</p>
                  <p><strong>General Support:</strong> contact@flowapp.ai</p>
                </div>
                <p>
                  We will respond to all inquiries within 48 hours during business days.
                </p>
              </div>
            </section>
          </div>

          <div className="terms-footer">
            <p>
              By using Flow, you acknowledge that you have read, understood, and agree to be bound 
              by these Terms & Conditions.
            </p>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .terms-page {
          padding-top: 120px;
          padding-bottom: 80px;
          background: white;
          min-height: 100vh;
        }

        .terms-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .terms-header {
          text-align: center;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 2px solid #F8F9FA;
        }

        .terms-header h1 {
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #3E3E3E;
        }

        .terms-intro {
          font-size: 18px;
          color: #585858;
          margin-bottom: 16px;
        }

        .last-updated {
          font-size: 14px;
          color: #F7BA53;
          font-weight: 500;
        }

        .terms-sections {
          margin-bottom: 48px;
        }

        .terms-section {
          margin-bottom: 40px;
          padding: 32px;
          background: #F8F9FA;
          border-radius: 18px;
          border-left: 4px solid #F7BA53;
        }

        .terms-section h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #3E3E3E;
        }

        .terms-text {
          line-height: 1.7;
        }

        .terms-text p {
          margin-bottom: 16px;
          color: #585858;
        }

        .terms-text ul {
          margin: 16px 0;
          padding-left: 24px;
        }

        .terms-text li {
          margin-bottom: 8px;
          color: #585858;
        }

        .contact-info {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin: 16px 0;
        }

        .contact-info p {
          margin-bottom: 8px;
        }

        .contact-info strong {
          color: #3E3E3E;
        }

        .terms-footer {
          text-align: center;
          padding: 32px;
          background: linear-gradient(135deg, #FEDFCE 0%, #FFE3C3 100%);
          border-radius: 18px;
          margin-top: 48px;
        }

        .terms-footer p {
          font-size: 16px;
          color: #3E3E3E;
          font-weight: 500;
          margin: 0;
        }

        @media (max-width: 768px) {
          .terms-page {
            padding-top: 100px;
          }

          .terms-header h1 {
            font-size: 32px;
          }

          .terms-section {
            padding: 24px;
          }

          .terms-section h2 {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .terms-header h1 {
            font-size: 28px;
          }

          .terms-section {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default TermsPage;

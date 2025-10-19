import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '#about' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Contact', path: '#contact' },
  ];

  const socialLinks = [
    { name: 'LinkedIn', url: '#', icon: '💼' },
    { name: 'Instagram', url: '#', icon: '📷' },
    { name: 'Twitter', url: '#', icon: '🐦' },
    { name: 'YouTube', url: '#', icon: '📺' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-icon">
                <div className="logo-circle"></div>
              </div>
              <span className="logo-text">Flow</span>
            </div>
            <p className="footer-description">
              Build better habits, track your progress, and achieve your goals with Flow. 
              The intuitive habit tracking app that helps you create lasting positive changes.
            </p>
            <div className="social-links">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="social-link"
                  aria-label={social.name}
                >
                  <span className="social-icon">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="footer-links">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-nav">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="footer-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="footer-contact">
            <h4 className="footer-title">Contact</h4>
            <div className="contact-info">
              <p className="contact-item">
                <span className="contact-label">Email:</span>
                <a href="mailto:contact@flowapp.ai" className="contact-link">
                  contact@flowapp.ai
                </a>
              </p>
              <p className="contact-item">
                <span className="contact-label">Legal:</span>
                <a href="mailto:legal@flowapp.ai" className="contact-link">
                  legal@flowapp.ai
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} Flow. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/terms" className="footer-bottom-link">
                Terms
              </Link>
              <Link to="/privacy" className="footer-bottom-link">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: linear-gradient(135deg, #2D1B0E 0%, #3D2412 100%);
          color: white;
          padding: 64px 0 0;
          margin-top: 80px;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 48px;
        }

        .footer-brand {
          max-width: 400px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .logo-icon {
          margin-right: 12px;
        }

        .logo-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F7BA53 0%, #F7A053 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .logo-circle::after {
          content: '';
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          position: absolute;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .footer-description {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .social-links {
          display: flex;
          gap: 16px;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .social-link:hover {
          background: rgba(247, 186, 83, 0.2);
          transform: translateY(-2px);
        }

        .social-icon {
          font-size: 18px;
        }

        .footer-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: white;
        }

        .footer-nav {
          list-style: none;
        }

        .footer-nav li {
          margin-bottom: 8px;
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-link:hover {
          color: #F7BA53;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .contact-label {
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }

        .contact-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .contact-link:hover {
          color: #F7BA53;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 24px 0;
        }

        .footer-bottom-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .copyright {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }

        .footer-bottom-link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s ease;
        }

        .footer-bottom-link:hover {
          color: #F7BA53;
        }

        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .footer-bottom-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .footer-bottom-links {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '#about' },
    { name: 'How It Works', path: '#how-it-works' },
    { name: 'Contact', path: '#contact' },
  ];

  const scrollToSection = (path) => {
    if (path.startsWith('#')) {
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header
      className={`header ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo-icon">
              <div className="logo-circle"></div>
            </div>
            <span className="logo-text">Flow</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.name}
                className="nav-link"
                onClick={() => scrollToSection(item.path)}
              >
                {item.name}
              </button>
            ))}
            <Link to="/terms" className="nav-link">
              Terms
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <motion.nav
          className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isMobileMenuOpen ? 1 : 0,
            height: isMobileMenuOpen ? 'auto' : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {navItems.map((item) => (
            <button
              key={item.name}
              className="mobile-nav-link"
              onClick={() => scrollToSection(item.path)}
            >
              {item.name}
            </button>
          ))}
          <Link to="/terms" className="mobile-nav-link">
            Terms
          </Link>
        </motion.nav>
      </div>

      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(254, 223, 206, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .header.scrolled {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
        }

        .logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #3E3E3E;
          font-weight: 700;
          font-size: 24px;
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

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-link {
          background: none;
          border: none;
          color: #3E3E3E;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.3s ease;
          padding: 8px 0;
        }

        .nav-link:hover {
          color: #F7BA53;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          width: 24px;
          height: 18px;
          justify-content: space-between;
        }

        .hamburger span {
          width: 100%;
          height: 2px;
          background: #3E3E3E;
          transition: all 0.3s ease;
          transform-origin: center;
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }

        .mobile-nav {
          display: none;
          flex-direction: column;
          padding: 20px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .mobile-nav.open {
          display: flex;
        }

        .mobile-nav-link {
          background: none;
          border: none;
          color: #3E3E3E;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          padding: 12px 0;
          text-align: left;
          transition: color 0.3s ease;
        }

        .mobile-nav-link:hover {
          color: #F7BA53;
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }

          .mobile-nav {
            display: flex;
          }
        }
      `}</style>
    </motion.header>
  );
};

export default Header;

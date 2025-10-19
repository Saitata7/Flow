import React from 'react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <motion.div
              className="hero-text"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1>Build Better Habits</h1>
              <p className="hero-subtitle">
                Track your habits, build consistency, and achieve your goals with Flow. 
                The intuitive habit tracking app that helps you create lasting positive changes.
              </p>
              <div className="hero-buttons">
                <a href="#" className="btn btn-primary btn-large">
                  Download on App Store
                </a>
                <a href="#" className="btn btn-secondary btn-large">
                  Get it on Google Play
                </a>
              </div>
            </motion.div>
            <motion.div
              className="hero-visual"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-preview">
                    <div className="app-header">
                      <div className="app-logo"></div>
                      <span>Flow</span>
                    </div>
                    <div className="habit-list">
                      <div className="habit-item completed">✓ Morning Exercise</div>
                      <div className="habit-item completed">✓ Drink Water</div>
                      <div className="habit-item pending">○ Read 30 min</div>
                      <div className="habit-item pending">○ Meditation</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <motion.div
            className="about-content"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>About Flow</h2>
            <p className="text-large">
              Flow is designed around the science of habit formation and dopamine-driven motivation. 
              We help you build sustainable routines that lead to lasting positive changes in your life.
            </p>
            <div className="about-features">
              <div className="feature-card">
                <div className="feature-icon">🧠</div>
                <h3>Dopamine-Driven</h3>
                <p>Built on neuroscience principles to maximize motivation and habit retention.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Smart Analytics</h3>
                <p>Track patterns, identify triggers, and optimize your habit-building journey.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Flow State Focus</h3>
                <p>Design habits that help you enter and maintain optimal performance states.</p>
              </div>
            </div>
            <div className="about-cta">
              <button 
                className="btn btn-primary btn-large"
                onClick={() => scrollToSection('#how-it-works')}
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <motion.div
            className="how-it-works-content"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>How It Works</h2>
            <p className="section-subtitle">
              Three simple steps to transform your habits and achieve your goals
            </p>
            <div className="steps">
              <motion.div
                className="step"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Track Your Habits</h3>
                  <p>Start by identifying and tracking the habits you want to build or break. Flow makes it easy to log your daily progress.</p>
                </div>
              </motion.div>
              <motion.div
                className="step"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Analyze Your Patterns</h3>
                  <p>Get insights into your behavior patterns, mood correlations, and progress trends to optimize your approach.</p>
                </div>
              </motion.div>
              <motion.div
                className="step"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Get Insights & Rewards</h3>
                  <p>Receive personalized recommendations, celebrate milestones, and maintain motivation through intelligent reward systems.</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases">
        <div className="container">
          <motion.div
            className="use-cases-content"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>Perfect For</h2>
            <p className="section-subtitle">
              Whether you're a student, professional, or wellness enthusiast, Flow adapts to your lifestyle
            </p>
            <div className="use-case-grid">
              <div className="use-case-card">
                <div className="use-case-icon">🎓</div>
                <h3>Students</h3>
                <p>Build study routines, track academic goals, and maintain focus throughout your educational journey.</p>
                <ul>
                  <li>Study session tracking</li>
                  <li>Assignment deadlines</li>
                  <li>Focus time management</li>
                </ul>
              </div>
              <div className="use-case-card">
                <div className="use-case-icon">💼</div>
                <h3>Professionals</h3>
                <p>Enhance productivity, manage work-life balance, and develop professional skills systematically.</p>
                <ul>
                  <li>Productivity habits</li>
                  <li>Skill development</li>
                  <li>Wellness integration</li>
                </ul>
              </div>
              <div className="use-case-card">
                <div className="use-case-icon">💪</div>
                <h3>Fitness Enthusiasts</h3>
                <p>Track workouts, monitor nutrition, and build consistent fitness routines that deliver results.</p>
                <ul>
                  <li>Workout consistency</li>
                  <li>Nutrition tracking</li>
                  <li>Recovery monitoring</li>
                </ul>
              </div>
              <div className="use-case-card">
                <div className="use-case-icon">🧘</div>
                <h3>Mental Health</h3>
                <p>Develop mindfulness practices, track mood patterns, and build emotional resilience habits.</p>
                <ul>
                  <li>Meditation practice</li>
                  <li>Mood tracking</li>
                  <li>Stress management</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="app-preview">
        <div className="container">
          <motion.div
            className="app-preview-content"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>See Your Progress Evolve</h2>
            <p className="section-subtitle">
              Watch your habits transform into powerful routines that drive real change
            </p>
            <div className="preview-grid">
              <div className="preview-card">
                <div className="preview-screen">
                  <div className="screen-header">Week 1</div>
                  <div className="progress-dots">
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot missed"></div>
                    <div className="dot completed"></div>
                    <div className="dot pending"></div>
                    <div className="dot pending"></div>
                    <div className="dot pending"></div>
                  </div>
                </div>
                <h4>Getting Started</h4>
                <p>Building awareness of your current habits</p>
              </div>
              <div className="preview-card">
                <div className="preview-screen">
                  <div className="screen-header">Week 4</div>
                  <div className="progress-dots">
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                  </div>
                </div>
                <h4>Building Momentum</h4>
                <p>Consistency is becoming natural</p>
              </div>
              <div className="preview-card">
                <div className="preview-screen">
                  <div className="screen-header">Week 12</div>
                  <div className="progress-dots">
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                    <div className="dot completed"></div>
                  </div>
                </div>
                <h4>Habit Mastery</h4>
                <p>Your new routine is now automatic</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Community Section */}
      <section className="community">
        <div className="container">
          <motion.div
            className="community-content"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>Join the Flow Community</h2>
            <p className="section-subtitle">
              Connect with like-minded individuals on their habit-building journey
            </p>
            <div className="community-stats">
              <div className="stat">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat">
                <div className="stat-number">500K+</div>
                <div className="stat-label">Habits Tracked</div>
              </div>
              <div className="stat">
                <div className="stat-number">95%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
            <div className="community-cta">
              <button className="btn btn-primary btn-large">
                Join the Flow Community
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <motion.div
            className="contact-content"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>Get in Touch</h2>
            <p className="section-subtitle">
              Have questions or feedback? We'd love to hear from you.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <h3>Email Us</h3>
                  <p>contact@flowapp.ai</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">💬</div>
                <div className="contact-details">
                  <h3>Support</h3>
                  <p>Get help with your Flow journey</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        .home-page {
          padding-top: 80px;
        }

        /* Hero Section */
        .hero {
          padding: 80px 0;
          background: linear-gradient(135deg, #FEDFCE 0%, #FFE3C3 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-text h1 {
          font-size: 56px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #3E3E3E 0%, #F7BA53 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 20px;
          line-height: 1.6;
          margin-bottom: 32px;
          color: #585858;
        }

        .hero-buttons {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .phone-mockup {
          width: 280px;
          height: 560px;
          background: #1C1C1E;
          border-radius: 40px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .phone-screen {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #FEDFCE 0%, #FFE3C3 100%);
          border-radius: 30px;
          padding: 20px;
          overflow: hidden;
        }

        .app-preview {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
        }

        .app-logo {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #F7BA53 0%, #F7A053 100%);
          border-radius: 50%;
          margin-right: 12px;
        }

        .habit-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .habit-item {
          padding: 12px 16px;
          background: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
        }

        .habit-item.completed {
          color: #4DB34D;
        }

        .habit-item.pending {
          color: #585858;
        }

        /* About Section */
        .about {
          padding: 80px 0;
          background: white;
        }

        .about-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .about-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
          margin: 48px 0;
        }

        .feature-card {
          text-align: center;
          padding: 32px 24px;
          background: #F8F9FA;
          border-radius: 18px;
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .about-cta {
          margin-top: 40px;
        }

        /* How It Works Section */
        .how-it-works {
          padding: 80px 0;
          background: #F8F9FA;
        }

        .how-it-works-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .section-subtitle {
          font-size: 18px;
          color: #585858;
          margin-bottom: 48px;
        }

        .steps {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 32px;
          text-align: left;
        }

        .step:nth-child(even) {
          flex-direction: row-reverse;
        }

        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #F7BA53 0%, #F7A053 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .step-content h3 {
          margin-bottom: 8px;
        }

        /* Use Cases Section */
        .use-cases {
          padding: 80px 0;
          background: white;
        }

        .use-cases-content {
          text-align: center;
        }

        .use-case-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          margin-top: 48px;
        }

        .use-case-card {
          background: white;
          border-radius: 18px;
          padding: 32px 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          text-align: left;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .use-case-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .use-case-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .use-case-card ul {
          list-style: none;
          margin-top: 16px;
        }

        .use-case-card li {
          padding: 4px 0;
          color: #585858;
        }

        .use-case-card li::before {
          content: '✓';
          color: #4DB34D;
          font-weight: bold;
          margin-right: 8px;
        }

        /* App Preview Section */
        .app-preview {
          padding: 80px 0;
          background: #F8F9FA;
        }

        .app-preview-content {
          text-align: center;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
          margin-top: 48px;
        }

        .preview-card {
          background: white;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }

        .preview-card:hover {
          transform: translateY(-4px);
        }

        .preview-screen {
          background: #F8F9FA;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .screen-header {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #585858;
        }

        .progress-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .dot.completed {
          background: #4DB34D;
        }

        .dot.missed {
          background: #FF6961;
        }

        .dot.pending {
          background: #E0E0E0;
        }

        /* Community Section */
        .community {
          padding: 80px 0;
          background: linear-gradient(135deg, #F7BA53 0%, #F7A053 100%);
          color: white;
          text-align: center;
        }

        .community h2,
        .community .section-subtitle {
          color: white;
        }

        .community-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 32px;
          margin: 48px 0;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 16px;
          opacity: 0.9;
        }

        .community-cta {
          margin-top: 40px;
        }

        /* Contact Section */
        .contact {
          padding: 80px 0;
          background: white;
        }

        .contact-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .contact-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
          margin-top: 48px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: #F8F9FA;
          border-radius: 18px;
          text-align: left;
        }

        .contact-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .contact-details h3 {
          margin-bottom: 4px;
        }

        .contact-details p {
          color: #585858;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 40px;
            text-align: center;
          }

          .hero-text h1 {
            font-size: 42px;
          }

          .hero-buttons {
            justify-content: center;
          }

          .phone-mockup {
            width: 240px;
            height: 480px;
          }

          .step {
            flex-direction: column;
            text-align: center;
          }

          .step:nth-child(even) {
            flex-direction: column;
          }

          .step-number {
            margin-bottom: 16px;
          }

          .community-stats {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .contact-item {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .hero-text h1 {
            font-size: 32px;
          }

          .hero-subtitle {
            font-size: 18px;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }

          .phone-mockup {
            width: 200px;
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;

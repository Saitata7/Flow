# Flow Website

Official static React website for the Flow habit tracking app.

## 🎯 Overview

This is the official landing page for Flow, built as a modern, professional static React website that matches the mobile app's UI and brand identity. The website serves as the primary destination for users to learn about Flow, explore features, and download the app.

## 🚀 Features

- **Modern Design**: Consistent with mobile app's color palette and typography
- **Responsive Layout**: Optimized for all devices (mobile, tablet, desktop)
- **Smooth Animations**: Framer Motion powered transitions and scroll effects
- **SEO Optimized**: Meta tags, Open Graph, and Twitter Card support
- **Static Site**: No backend required, deployable to Vercel/Netlify
- **Accessibility**: WCAG compliant design and navigation

## 📱 Pages

### Home Page
- Hero section with app preview
- About Flow section
- How It Works (3-step process)
- Use Cases (Students, Professionals, Fitness, Mental Health)
- App Preview with progress visualization
- Community statistics
- Contact information

### Terms & Conditions
- Comprehensive legal terms
- Privacy and data handling policies
- Usage restrictions and limitations
- Contact information for legal inquiries

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Framer Motion**: Smooth animations and transitions
- **CSS-in-JS**: Styled components with mobile app color system
- **Responsive Design**: Mobile-first approach

## 🎨 Design System

Based on the Flow mobile app's design system:

- **Colors**: Warm gradient backgrounds (#FEDFCE to #FFE3C3), accent orange (#F7BA53)
- **Typography**: Inter font family with mobile app's type scale
- **Spacing**: 4px base unit system
- **Components**: Squircle borders, elevation shadows, consistent button styles

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

```bash
# Start development server (http://localhost:3000)
npm start

# Run linting
npm run lint

# Clean build artifacts
npm run clean
```

## 📦 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Deploy automatically on push to main branch

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the project
npm run build

# Upload the 'build' folder to your hosting provider
```

## 🔧 Configuration

### Environment Variables

No environment variables required for static deployment.

### Customization

- **Colors**: Update `src/styles/colors.js` to modify the color system
- **Content**: Edit page components in `src/pages/`
- **Styling**: Modify CSS-in-JS styles in component files
- **SEO**: Update meta tags in `public/index.html`

## 📱 Mobile App Integration

The website is designed to complement the Flow mobile app:

- Consistent branding and visual identity
- App Store and Google Play download buttons
- Feature explanations that match app functionality
- Terms & Conditions that align with app policies

## 🎯 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Bundle Size**: Minimal dependencies for fast loading
- **Images**: Optimized and responsive images

## 🔒 Security

- **No Backend**: Static site reduces attack surface
- **HTTPS**: Enforced by hosting providers
- **Content Security Policy**: Configured for static assets
- **No User Data**: No personal information collection

## 📄 License

This website is part of the Flow ecosystem. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

- **Website Issues**: contact@flowapp.ai
- **Legal Inquiries**: legal@flowapp.ai
- **General Support**: Available through the mobile app

---

Built with ❤️ for the Flow community

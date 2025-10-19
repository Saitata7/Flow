import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TermsPage from './pages/TermsPage';

function App() {
  const location = useLocation();
  const isTermsPage = location.pathname === '/terms';

  return (
    <div className="App">
      <Header />
      <main>
        {isTermsPage ? <TermsPage /> : <HomePage />}
      </main>
      <Footer />
    </div>
  );
}

export default App;

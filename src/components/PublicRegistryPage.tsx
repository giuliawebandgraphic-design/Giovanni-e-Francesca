import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { GuestEmbedView } from './GuestEmbedView';
import floral from '../assets/images/wedding-floral.png';
import './public-registry.css';

const mainSite = 'https://giovanniefrancesca.com';
const links = [
  { en: 'Home', it: 'Home', href: `${mainSite}/` },
  { en: 'The Weekend', it: 'Il weekend', href: `${mainSite}/il-weekend/` },
  { en: 'Where to Stay', it: 'Dove alloggiare', href: `${mainSite}/dove-soggiornare/` },
  { en: 'How to Arrive', it: 'Come arrivare', href: `${mainSite}/come-arrivare/` },
  { en: 'RSVP', it: 'RSVP', href: 'https://francescaegiovanni-rsvp.vercel.app/rsvp', preserveLanguage: true },
  { en: 'FAQs', it: 'Domande frequenti', href: `${mainSite}/faqs/` },
  { en: 'Registry', it: 'Lista nozze', href: '/registry', current: true },
];

export const PublicRegistryPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = language === 'it' ? 'Lista nozze' : 'Registry';

  useEffect(() => {
    document.title = `${pageTitle} | Giovanni & Francesca`;
  }, [pageTitle]);

  const selectLanguage = (next: 'it' | 'en') => {
    setLanguage(next);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(window.history.state, '', url);
  };

  return (
    <div className="wedding-registry-page">
      <header className="wedding-registry-page__hero">
        <div className="wedding-registry-page__header">
          <button
            type="button"
            className="wedding-registry-page__menu-toggle"
            aria-label={menuOpen ? (language === 'it' ? 'Chiudi menu' : 'Close menu') : (language === 'it' ? 'Apri menu' : 'Open menu')}
            aria-expanded={menuOpen}
            aria-controls="wedding-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
          <nav id="wedding-navigation" aria-label={language === 'it' ? 'Menu principale' : 'Main menu'} className={`wedding-registry-page__nav${menuOpen ? ' is-open' : ''}`}>
            {links.map(link => (
              <a key={link.href} href={link.preserveLanguage ? `${link.href}?lang=${language}` : link.href} aria-current={link.current ? 'page' : undefined}>
                {link[language]}
              </a>
            ))}
          </nav>
          <div className="wedding-registry-page__languages" role="group" aria-label={language === 'it' ? 'Seleziona lingua' : 'Select language'}>
            <button type="button" aria-label="English" aria-pressed={language === 'en'} onClick={() => selectLanguage('en')}>
              EN
            </button>
            <button type="button" aria-label="Italiano" aria-pressed={language === 'it'} onClick={() => selectLanguage('it')}>
              IT
            </button>
          </div>
        </div>
        <div className="wedding-registry-page__frame">
          <img className="wedding-registry-page__floral" src={floral} alt="" />
          <h1>{pageTitle}</h1>
        </div>
      </header>

      <main className="wedding-registry-page__main">
        <section className="wedding-registry-page__intro" aria-label={language === 'it' ? 'Un pensiero per gli sposi' : 'A gift for the couple'}>
          {language === 'it' ? (
            <p>
              La vostra presenza nel nostro giorno speciale è il regalo più bello che potremmo desiderare.<br />
              Non è necessario alcun dono, ma per chi avesse piacere di farci un pensiero, abbiamo raccolto qui sotto alcuni spunti e idee.<br />
              <strong>Inoltre durante i preparativi del nostro matrimonio, abbiamo scelto di realizzare le bomboniere solidali con VIDAS, una realtà che ci sta particolarmente a cuore.<br />
              Ci farebbe davvero felici se voleste unirvi a noi nel sostenere questa importante causa. Naturalmente, il contributo è del tutto facoltativo: grazie di cuore!</strong>
            </p>
          ) : (
            <p>
              Your presence on our special day is the most beautiful gift we could ask for.<br />
              No gift is necessary, but for those who would like to give us a gift, we have gathered some ideas below.<br />
              <strong>During our wedding preparations, we also chose to support VIDAS, an organisation that is particularly close to our hearts, with our wedding favours.<br />
              We would be delighted if you joined us in supporting this important cause. Your contribution is entirely optional: thank you so much!</strong>
            </p>
          )}
          <p className="wedding-registry-page__bank">
            <strong>{language === 'it' ? 'BANCA E INTESTATARIO' : 'BANK AND ACCOUNT HOLDER'}</strong> : INTESA SAN PAOLO - VIDAS ODV<br />
            <strong>IBAN</strong> : IT24A03069 09606100000061310{' '}
            <strong>{language === 'it' ? 'CAUSALE' : 'PAYMENT REFERENCE'}</strong> : VD23820 - Gio&amp;Fra
          </p>
        </section>
        <section className="wedding-registry-page__gifts" aria-label={language === 'it' ? 'Lista nozze' : 'Wedding registry'}>
          <GuestEmbedView showLanguageSelector={false} />
        </section>
      </main>

      <footer className="wedding-registry-page__footer">
        {language === 'it' ? 'Giovanni e Francesca' : 'Giovanni and Francesca'}
      </footer>
    </div>
  );
};

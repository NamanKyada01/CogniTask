import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: 'Good morning',
      tagline: 'We remember, so you don\'t have to.',
      dashboard: 'Dashboard',
      taskManager: 'Task Manager',
      focusflow: 'Focus Flow',
      calendar: 'Calendar',
      rewards: 'Rewards',
      profile: 'Profile',
      upcoming: 'Upcoming Today',
      quickAdd: 'Quick Add',
    },
  },
  de: {
    translation: {
      welcome: 'Guten Morgen',
      tagline: 'Wir erinnern uns, damit Sie es nicht tun müssen.',
      dashboard: 'Dashboard',
      taskManager: 'Aufgaben-Manager',
      focusflow: 'Fokus-Fluss',
      calendar: 'Kalender',
      rewards: 'Belohnungen',
      profile: 'Profil',
      upcoming: 'Heute anstehend',
      quickAdd: 'Schnell hinzufügen',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

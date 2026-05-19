import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'lr.lang';

export const LANGS = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const DICT = {
  ru: {
    'nav.goals': 'Цели',
    'nav.skills': 'Навыки',
    'nav.asceses': 'Аскезы',
    'nav.moneymaxing': 'Moneymaxing',
    'nav.looksmaxing': 'Looksmaxing',
    'name.hero': 'Имя героя',
    'name.placeholder': 'Имя',
    'btn.enter': 'Войти',
    'btn.loginGoogle': 'Войти через Google',
    'goal.placeholder': 'Цель',
    'goal.add': '+ цель',
    'goal.deadline': 'Дедлайн',
    'goal.remove': 'Удалить',
    'goal.elapsed': '{n}% времени прошло',
    'skill.level': 'Ур.',
    'skill.new': 'Новый навык',
    'asceza.new': 'Новая аскеза',
    'asceza.daysShort': 'дн.',
    'asceza.daysLabel': 'Дней',
    'asceza.from': 'с',
    'asceza.done': 'завершено',
    'asceza.broken': 'сорвано',
    'asceza.complete': 'Завершить',
    'asceza.break': 'Сорвать',
    'looks.photoEmpty': '+ фото',
    'looks.yourRating': 'Твоя оценка',
    'looks.notSelected': '— не выбрано —',
    'looks.uploading': 'Загружаем…',
    'looks.replace': 'Заменить фото',
    'looks.tracker': 'Что прокачиваешь во внешности',
    'money.activity': 'Твоя деятельность',
    'money.placeholder': 'Например: фриланс, торговля, бизнес…',
    'money.tracker': 'Источник дохода / финансовая цель',
    'lang.title': 'Язык',
    'settings.title': 'Настройки',
  },
  en: {
    'nav.goals': 'Goals',
    'nav.skills': 'Skills',
    'nav.asceses': 'Ascesis',
    'nav.moneymaxing': 'Moneymaxing',
    'nav.looksmaxing': 'Looksmaxing',
    'name.hero': "Hero's name",
    'name.placeholder': 'Name',
    'btn.enter': 'Enter',
    'btn.loginGoogle': 'Sign in with Google',
    'goal.placeholder': 'Goal',
    'goal.add': '+ goal',
    'goal.deadline': 'Deadline',
    'goal.remove': 'Remove',
    'goal.elapsed': '{n}% of time elapsed',
    'skill.level': 'Lv.',
    'skill.new': 'New skill',
    'asceza.new': 'New ascesis',
    'asceza.daysShort': 'd.',
    'asceza.daysLabel': 'Days',
    'asceza.from': 'since',
    'asceza.done': 'completed',
    'asceza.broken': 'broken',
    'asceza.complete': 'Complete',
    'asceza.break': 'Break',
    'looks.photoEmpty': '+ photo',
    'looks.yourRating': 'Your rating',
    'looks.notSelected': '— not selected —',
    'looks.uploading': 'Uploading…',
    'looks.replace': 'Replace photo',
    'looks.tracker': "What you're improving in your looks",
    'money.activity': 'Your activity',
    'money.placeholder': 'E.g.: freelance, trading, business…',
    'money.tracker': 'Income source / financial goal',
    'lang.title': 'Language',
    'settings.title': 'Settings',
  },
  es: {
    'nav.goals': 'Objetivos',
    'nav.skills': 'Habilidades',
    'nav.asceses': 'Ascesis',
    'nav.moneymaxing': 'Moneymaxing',
    'nav.looksmaxing': 'Looksmaxing',
    'name.hero': 'Nombre del héroe',
    'name.placeholder': 'Nombre',
    'btn.enter': 'Entrar',
    'btn.loginGoogle': 'Entrar con Google',
    'goal.placeholder': 'Objetivo',
    'goal.add': '+ objetivo',
    'goal.deadline': 'Fecha límite',
    'goal.remove': 'Eliminar',
    'goal.elapsed': '{n}% del tiempo transcurrido',
    'skill.level': 'Nv.',
    'skill.new': 'Nueva habilidad',
    'asceza.new': 'Nueva ascesis',
    'asceza.daysShort': 'd.',
    'asceza.daysLabel': 'Días',
    'asceza.from': 'desde',
    'asceza.done': 'completado',
    'asceza.broken': 'roto',
    'asceza.complete': 'Completar',
    'asceza.break': 'Romper',
    'looks.photoEmpty': '+ foto',
    'looks.yourRating': 'Tu valoración',
    'looks.notSelected': '— sin elegir —',
    'looks.uploading': 'Subiendo…',
    'looks.replace': 'Reemplazar foto',
    'looks.tracker': 'Qué estás mejorando en tu apariencia',
    'money.activity': 'Tu actividad',
    'money.placeholder': 'Ej.: freelance, trading, negocio…',
    'money.tracker': 'Fuente de ingresos / meta financiera',
    'lang.title': 'Idioma',
    'settings.title': 'Ajustes',
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && DICT[saved]) return saved;
    } catch {}
    return 'ru';
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, vars) => {
    const str = DICT[lang]?.[key] ?? DICT.ru[key] ?? key;
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  };

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

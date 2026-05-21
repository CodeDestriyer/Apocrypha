import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'lr.lang';

export const LANGS = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
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
    'rank.0': 'Новичок',
    'rank.1': 'Ученик',
    'rank.2': 'Умелец',
    'rank.3': 'Мастер',
    'rank.4': 'Грандмастер',
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
    'settings.modules': 'Модули',
    'settings.info': 'Профиль',
    'settings.done': 'Готово',
    'tab.character': 'Герой',
    'tab.calendar': 'Календарь',
    'cal.activePeriods': 'Активные планы',
    'cal.empty': 'пока пусто',
    'cal.newPeriod': '+ новый план',
    'cal.cancel': 'отмена',
    'cal.daysShort': 'дн',
    'cal.selectRange': 'Выбери начало и конец',
    'cal.createPlan': 'Создать план',
    'cal.choosePlan': 'Какой план?',
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
    'rank.0': 'Novice',
    'rank.1': 'Apprentice',
    'rank.2': 'Adept',
    'rank.3': 'Master',
    'rank.4': 'Grandmaster',
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
    'settings.modules': 'Modules',
    'settings.info': 'Profile',
    'settings.done': 'Done',
    'tab.character': 'Hero',
    'tab.calendar': 'Calendar',
    'cal.activePeriods': 'Active plans',
    'cal.empty': 'nothing yet',
    'cal.newPeriod': '+ new plan',
    'cal.cancel': 'cancel',
    'cal.daysShort': 'd',
    'cal.selectRange': 'Pick start and end',
    'cal.createPlan': 'Create plan',
    'cal.choosePlan': 'Which plan?',
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
    'rank.0': 'Novato',
    'rank.1': 'Aprendiz',
    'rank.2': 'Adepto',
    'rank.3': 'Maestro',
    'rank.4': 'Gran maestro',
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
    'settings.modules': 'Módulos',
    'settings.info': 'Perfil',
    'settings.done': 'Hecho',
    'tab.character': 'Héroe',
    'tab.calendar': 'Calendario',
    'cal.activePeriods': 'Planes activos',
    'cal.empty': 'aún vacío',
    'cal.newPeriod': '+ nuevo plan',
    'cal.cancel': 'cancelar',
    'cal.daysShort': 'd',
    'cal.selectRange': 'Elige inicio y fin',
    'cal.createPlan': 'Crear plan',
    'cal.choosePlan': '¿Qué plan?',
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

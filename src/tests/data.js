// ADHD self-report screening. 20 items, 5-point frequency scale (0..4),
// total 0..80. Adapted from WHO ASRS / DSM-5 ADHD symptom list. Educational use only.

export const FREQ5 = {
  ru: ['Никогда', 'Редко', 'Иногда', 'Часто', 'Очень часто'],
  en: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'],
  es: ['Nunca', 'Rara vez', 'A veces', 'Con frecuencia', 'Muy a menudo'],
};

export const AGREE5 = {
  ru: ['Полностью не согласен', 'Не согласен', 'Нейтрально', 'Согласен', 'Полностью согласен'],
  en: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
  es: ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'],
};

export const ADHD = {
  id: 'adhd',
  scale: 'freq5',
  max: 5,
  logo: '/varkanis-test-tdah.png',
  author: 'Varkanis',
  title: { ru: 'Скрининг СДВГ', en: 'ADHD Screening', es: 'Cribado de TDAH' },
  short: {
    ru: '20 вопросов, ~3 минуты. Оцени, как часто это происходило за последние 6 месяцев.',
    en: '20 questions, ~3 minutes. Rate how often you experienced this in the last 6 months.',
    es: '20 preguntas, ~3 minutos. Evalúa con qué frecuencia te ocurrió en los últimos 6 meses.',
  },
  // subscale codes: I=Inattention, H=Hyperactivity, P=Impulsivity
  items: [
    { subscale: 'I', ru: 'Тебе сложно доводить до конца последние детали работы, когда основная часть уже сделана?', en: 'Do you have trouble wrapping up the final details of a task once the main part is done?',          es: '¿Te cuesta terminar los últimos detalles de un trabajo cuando la parte principal ya está lista?' },
    { subscale: 'I', ru: 'Тебе трудно организовать вещи или спланировать ежедневные задачи?',                       en: 'Do you find it hard to organize your things or plan your daily tasks?',                                es: '¿Te resulta difícil organizar tus cosas o planificar tus tareas diarias?' },
    { subscale: 'I', ru: 'Часто ли ты забываешь о встречах, обещаниях или повседневных обязанностях?',              en: 'Do you often forget appointments, promises, or everyday obligations?',                                 es: '¿Te olvidas a menudo de citas, promesas u obligaciones cotidianas?' },
    { subscale: 'I', ru: 'Откладываешь ли задачи, требующие большого умственного усилия или концентрации?',         en: 'Do you put off tasks that require a lot of mental effort or concentration?',                          es: '¿Dejas para más tarde las tareas que requieren mucho esfuerzo mental o concentración?' },
    { subscale: 'I', ru: 'Часто ли ты теряешь вещи (ключи, телефон, кошелёк, документы)?',                          en: 'Do you frequently lose things (keys, phone, wallet, documents)?',                                      es: '¿Pierdes cosas con frecuencia (llaves, móvil, cartera, documentos)?' },
    { subscale: 'I', ru: 'Легко ли отвлекаешься на шум или на то, что происходит вокруг?',                          en: 'Do you get easily distracted by noise or by what is going on around you?',                             es: '¿Te distraes fácilmente con el ruido o con lo que pasa a tu alrededor?' },
    { subscale: 'I', ru: 'Допускаешь ли ошибки по невнимательности, когда задача скучная или однообразная?',        en: 'Do you make careless mistakes when the task is boring or repetitive?',                                 es: '¿Cometes errores por descuido cuando la tarea es aburrida o repetitiva?' },
    { subscale: 'I', ru: 'Тебе трудно удерживать внимание на монотонной работе?',                                   en: 'Do you find it hard to keep your attention on monotonous work?',                                       es: '¿Te cuesta mantener la atención en un trabajo monótono?' },
    { subscale: 'I', ru: 'Чувствуешь ли, что витаешь в облаках даже когда с тобой говорят напрямую?',               en: 'Do you feel like you are in the clouds even when someone is talking directly to you?',                es: '¿Sientes que estás en las nubes incluso cuando alguien te está hablando directamente?' },

    { subscale: 'H', ru: 'Покачиваешь ли ногами или вертишь что-то в руках, когда долго сидишь?',                   en: 'Do you tap your legs or fidget with your hands when you have to sit still for a long time?',          es: '¿Mueves las piernas o juegas con las manos cuando tienes que estar sentado mucho tiempo?' },
    { subscale: 'H', ru: 'Встаёшь ли с места на собраниях, занятиях или на работе, когда стоило бы сидеть?',         en: 'Do you get up from your seat in meetings, classes, or at work when you should stay seated?',          es: '¿Te levantas de tu sitio en reuniones, clases o en el trabajo cuando deberías quedarte sentado?' },
    { subscale: 'H', ru: 'Чувствуешь ли внутреннее беспокойство или невозможность просто посидеть и расслабиться?',  en: 'Do you feel inner restlessness or an inability to stay still and relax?',                              es: '¿Sientes inquietud por dentro o incapacidad para quedarte quieto y relajarte?' },
    { subscale: 'H', ru: 'Тебе сложно спокойно наслаждаться хобби или свободным временем?',                          en: 'Do you find it hard to enjoy your hobbies or free time quietly?',                                      es: '¿Te cuesta disfrutar de tus aficiones o del tiempo libre de forma tranquila?' },
    { subscale: 'H', ru: 'Чувствуешь ли, будто внутри мотор, который постоянно подгоняет что-то делать?',           en: 'Do you feel as if you have a motor inside driving you to keep doing things?',                          es: '¿Sientes como si tuvieras un motor dentro que te impulsa a hacer cosas todo el tiempo?' },
    { subscale: 'H', ru: 'Говоришь ли слишком много или слишком громко в компании?',                                en: 'Do you talk too much or too loudly when you are around other people?',                                 es: '¿Hablas demasiado o demasiado fuerte cuando estás con más gente?' },

    { subscale: 'P', ru: 'Перебиваешь ли людей, заканчивая их фразы, потому что они говорят слишком медленно?',     en: 'Do you interrupt people by finishing their sentences because they talk too slowly?',                  es: '¿Interrumpes a la gente terminando sus frases porque hablan despacio?' },
    { subscale: 'P', ru: 'Тебе трудно дождаться своей очереди (в очереди, в пробке, в игре)?',                       en: 'Do you find it hard to wait your turn (in a line, in traffic, in a game)?',                            es: '¿Te cuesta esperar tu turno (en una fila, en el tráfico, en un juego)?' },
    { subscale: 'P', ru: 'Вмешиваешься ли в чужие разговоры или дела, когда тебя об этом не просят?',                en: 'Do you butt into other people\'s conversations or affairs without being asked?',                       es: '¿Te metes en conversaciones o asuntos de otros sin que te lo pidan?' },
    { subscale: 'P', ru: 'Принимаешь ли спонтанные решения, не думая о последствиях (например, незапланированные траты)?', en: 'Do you make spontaneous decisions without thinking about the consequences (like unplanned spending)?', es: '¿Tomas decisiones espontáneas sin pensar en las consecuencias (como gastos imprevistos)?' },
    { subscale: 'P', ru: 'Раздражаешься или нервничаешь, когда приходится ждать чего-то или кого-то?',              en: 'Do you get irritated or impatient when you have to wait for something or someone?',                    es: '¿Te irrita o te desespera tener que esperar por algo o por alguien?' },
  ],
  subscales: {
    I: { ru: 'Невнимательность', en: 'Inattention',    es: 'Inatención' },
    H: { ru: 'Гиперактивность',  en: 'Hyperactivity', es: 'Hiperactividad' },
    P: { ru: 'Импульсивность',   en: 'Impulsivity',    es: 'Impulsividad' },
  },
  bands: {
    low:  { ru: 'Низкая вероятность',   en: 'Low likelihood',      es: 'Probabilidad baja' },
    mid:  { ru: 'Средняя вероятность',  en: 'Moderate likelihood', es: 'Probabilidad media' },
    high: { ru: 'Высокая вероятность',  en: 'High likelihood',     es: 'Probabilidad alta' },
  },
  bandDesc: {
    low: {
      ru: 'Симптомы в пределах нормы. СДВГ маловероятен.',
      en: 'Symptoms within the typical range. ADHD is unlikely.',
      es: 'Síntomas dentro de lo normal. Es poco probable un TDAH.',
    },
    mid: {
      ru: 'Есть признаки невнимательности или импульсивности — возможно, связаны со стрессом или усталостью.',
      en: 'Some signs of inattention or impulsivity — possibly tied to stress or fatigue.',
      es: 'Hay señales de falta de atención o impulsividad, posiblemente vinculadas al estrés o al cansancio.',
    },
    high: {
      ru: 'Симптомы выражены. Имеет смысл обратиться к специалисту.',
      en: 'Symptoms are pronounced. It is worth consulting a specialist.',
      es: 'Síntomas marcados. Conviene consultar a un especialista.',
    },
  },
};

// Dark Triad self-report. 18 items, 5-point agree-disagree scale (0..4),
// three subscales (Machiavellianism, Narcissism, Psychopathy), max 24 each.
// Items adapted from SD3 / Dirty Dozen-style inventories. Educational use only.
export const DARK_TRIAD = {
  id: 'dark-triad',
  scale: 'agree5',
  max: 5,
  logo: '/varkanis-test-triada-oscura.jpg',
  author: 'Varkanis',
  title: { ru: 'Тёмная триада', en: 'Dark Triad', es: 'Tríada Oscura' },
  short: {
    ru: '18 вопросов, ~3 минуты. Три черты: макиавеллизм, нарциссизм, субклиническая психопатия.',
    en: '18 questions, ~3 minutes. Three traits: Machiavellianism, narcissism, subclinical psychopathy.',
    es: '18 preguntas, ~3 minutos. Tres rasgos: maquiavelismo, narcisismo y psicopatía subclínica.',
  },
  // subscale codes: M=Machiavellianism, N=Narcissism, P=Psychopathy
  items: [
    { subscale: 'M', ru: 'Сотрудничать с людьми разумно только когда тебе это лично выгодно.',                 en: "It's smart to cooperate with people only when it personally benefits you.",                 es: 'Es inteligente colaborar con la gente solo cuando te conviene a ti personalmente.' },
    { subscale: 'M', ru: 'Ради важной цели можно и нужно манипулировать другими.',                              en: 'To achieve an important goal, you can and should manipulate others.',                       es: 'Para lograr un objetivo importante, se puede y se debe manipular a los demás.' },
    { subscale: 'M', ru: 'Лучше не раскрывать настоящие мотивы и секреты даже самым близким.',                  en: "It's better not to reveal your true motives or secrets, even to those closest to you.",     es: 'Es mejor no revelar tus verdaderos motivos ni tus secretos, incluso a los más cercanos.' },
    { subscale: 'M', ru: 'Большинство людей по природе наивны — ими легко управлять.',                          en: "Most people are naive by nature, so they're easy to steer.",                                es: 'La mayoría de la gente es ingenua por naturaleza, por lo que es fácil de dirigir.' },
    { subscale: 'M', ru: 'Я тщательно планирую каждый шаг ради максимальной выгоды в будущем.',                 en: 'I carefully plan every step to gain maximum benefit later.',                                es: 'Planifico cada paso con cuidado para obtener el máximo beneficio en el futuro.' },
    { subscale: 'M', ru: 'Говорить правду стоит только если это не вредит твоим интересам.',                    en: "Telling the truth is only worth it if it doesn't hurt your own interests.",                 es: 'Solo vale la pena decir la verdad si esto no perjudica tus propios intereses.' },

    { subscale: 'N', ru: 'Я знаю, что я особенный и заслуживаю большего, чем обычные люди.',                    en: "I know I'm a special person and deserve more than ordinary people.",                        es: 'Sé que soy una persona especial y merezco más que la gente común.' },
    { subscale: 'N', ru: 'Мне нужно быть в центре внимания и получать признание от окружающих.',                en: 'I need to be the center of attention and get recognition from others.',                    es: 'Necesito ser el centro de atención y recibir el reconocimiento de los demás.' },
    { subscale: 'N', ru: 'Я рождён, чтобы вести за собой и управлять процессами.',                              en: 'I was born to lead others and control how things go.',                                      es: 'He nacido para liderar a los demás y controlar los procesos.' },
    { subscale: 'N', ru: 'Меня сильно задевает, когда не замечают мои таланты или успехи.',                     en: "It deeply bothers me when people don't notice my talents or successes.",                    es: 'Me molesta profundamente cuando la gente no nota mis talentos o mis éxitos.' },
    { subscale: 'N', ru: 'Мне приятна мысль, что другие завидуют моему статусу или достижениям.',               en: 'I like the idea that other people envy my status or achievements.',                         es: 'Me agrada la idea de que otras personas envidien mi estatus o mis logros.' },
    { subscale: 'N', ru: 'Я заслуживаю особого отношения и не должен никому ничего объяснять.',                 en: 'I deserve preferential treatment without having to explain myself to anyone.',              es: 'Merezco un trato preferencial sin tener que dar explicaciones a nadie.' },

    { subscale: 'P', ru: 'Чужие проблемы, слёзы и драмы меня почти не трогают.',                                en: "Other people's problems, tears, and dramas barely affect me.",                              es: 'Los problemas, las lágrimas y los dramas de los demás casi no me importan.' },
    { subscale: 'P', ru: 'Я быстро скучаю, поэтому часто ищу риск и сильные эмоции.',                           en: 'I get bored very quickly, so I tend to seek risk and strong emotions.',                     es: 'Me aburro muy rápido, por lo que suelo buscar el riesgo y las emociones fuertes.' },
    { subscale: 'P', ru: 'Если кто-то встаёт у меня на пути, я могу быть совершенно беспощадным.',              en: 'If someone gets in my way, I can become completely ruthless.',                              es: 'Si alguien se interpone en mi camino, puedo llegar a ser completamente despiadado.' },
    { subscale: 'P', ru: 'Я редко испытываю вину или раскаяние, если мои действия кому-то навредили.',          en: 'I rarely feel guilt or remorse if my actions have hurt someone.',                           es: 'Rara vez siento culpa o remordimiento si mis acciones han perjudicado a alguien.' },
    { subscale: 'P', ru: 'Правила, законы и социальные нормы — для толпы, а не для меня.',                      en: 'Rules, laws, and social norms are made for the masses, not for me.',                        es: 'Las reglas, las leyes y las normas sociales están hechas para la masa, no para mí.' },
    { subscale: 'P', ru: 'Я могу убедительно соврать в лицо, не испытывая никакого дискомфорта.',               en: "I can lie to someone's face very convincingly without feeling any discomfort.",             es: 'Puedo mentirle a alguien a la cara de forma muy convincente sin sentir ningún malestar.' },
  ],
  subscales: {
    M: { ru: 'Макиавеллизм',  en: 'Machiavellianism', es: 'Maquiavelismo' },
    N: { ru: 'Нарциссизм',    en: 'Narcissism',       es: 'Narcisismo' },
    P: { ru: 'Психопатия',    en: 'Psychopathy',      es: 'Psicopatía' },
  },
  // Per-subscale interpretation (0..24): low ≤8, mid 9-16, high ≥17
  subscaleBands: {
    M: {
      low:  { ru: 'Прямолинейный, доверчивый',           en: 'Straightforward, trusting',         es: 'Directo, confiado' },
      mid:  { ru: 'Прагматичный',                        en: 'Pragmatic',                          es: 'Pragmático' },
      high: { ru: 'Циничный манипулятор, стратег',       en: 'Cynical manipulator, strategist',    es: 'Manipulador cínico, estratega' },
    },
    N: {
      low:  { ru: 'Скромный, неуверенный',               en: 'Modest, uncertain',                  es: 'Modesto, inseguro' },
      mid:  { ru: 'Здоровая самооценка',                 en: 'Healthy self-regard',                es: 'Autoestima saludable' },
      high: { ru: 'Эгоцентричный, грандиозный',          en: 'Egocentric, grandiose',              es: 'Egocéntrico, grandioso' },
    },
    P: {
      low:  { ru: 'Высокая эмпатия, осторожный',         en: 'High empathy, cautious',             es: 'Alta empatía, prudente' },
      mid:  { ru: 'Хладнокровный',                       en: 'Cool-headed',                        es: 'Sangre fría' },
      high: { ru: 'Импульсивный, бесстрашный, жёсткий',  en: 'Impulsive, fearless, harsh',         es: 'Impulsivo, audaz, duro' },
    },
  },
};

// Personality archetypes — 24 items, 5-point agree scale (0..4), grouped into
// 12 archetype pairs (max 8 per archetype). Top archetype is the Core, second
// is the Shadow. Inventory-style, not a clinical instrument.
export const ARCHETYPES = {
  warrior:    { ru: 'Воин',         en: 'The Warrior',    es: 'El Guerrero' },
  iconoclast: { ru: 'Иконоборец',   en: 'The Iconoclast', es: 'El Iconoclasta' },
  alchemist:  { ru: 'Алхимик',      en: 'The Alchemist',  es: 'El Alquimista' },
  sovereign:  { ru: 'Властитель',   en: 'The Sovereign',  es: 'El Soberano' },
  visionary:  { ru: 'Визионер',     en: 'The Visionary',  es: 'El Visionario' },
  protector:  { ru: 'Защитник',     en: 'The Protector',  es: 'El Protector' },
  analyst:    { ru: 'Аналитик',     en: 'The Analyst',    es: 'El Analista' },
  seeker:     { ru: 'Искатель',     en: 'The Seeker',     es: 'El Buscador' },
  idealist:   { ru: 'Идеалист',     en: 'The Idealist',   es: 'El Idealista' },
  realist:    { ru: 'Реалист',      en: 'The Realist',    es: 'El Realista' },
  aesthetic:  { ru: 'Эстет',        en: 'The Aesthetic',  es: 'El Estético' },
  trickster:  { ru: 'Трикстер',     en: 'The Trickster',  es: 'El Embaucador' },
};

export const ARCHETYPE_DESC = {
  warrior: {
    ru: 'Дисциплина, выносливость, борьба как образ жизни. Силу куёт через сопротивление.',
    en: 'Discipline, endurance, struggle as a way of life. Forges strength through resistance.',
    es: 'Disciplina, resistencia, la lucha como modo de vida. Forja la fuerza a través de la resistencia.',
  },
  iconoclast: {
    ru: 'Ломает устаревшие догмы и системы. Прогресс через разрушение.',
    en: 'Breaks obsolete dogmas and systems. Progress through destruction.',
    es: 'Rompe dogmas y sistemas obsoletos. Progreso mediante la destrucción.',
  },
  alchemist: {
    ru: 'Превращает хаос в функцию. Меняет реальность через знание скрытых законов.',
    en: 'Turns chaos into function. Changes reality through knowledge of hidden laws.',
    es: 'Transforma el caos en función. Cambia la realidad mediante el conocimiento de leyes ocultas.',
  },
  sovereign: {
    ru: 'Строит системы, держит структуру. Берёт на себя бремя сложных решений.',
    en: 'Builds systems, holds structure. Takes the burden of hard decisions.',
    es: 'Construye sistemas, mantiene la estructura. Asume la carga de decisiones difíciles.',
  },
  visionary: {
    ru: 'Создаёт принципиально новое. Видит будущее раньше остальных.',
    en: 'Creates the fundamentally new. Sees the future before others.',
    es: 'Crea lo fundamentalmente nuevo. Ve el futuro antes que los demás.',
  },
  protector: {
    ru: 'Сила ради безопасности своих. Прагматичный страж ресурсов и стабильности.',
    en: 'Strength for the safety of one\'s own. A pragmatic guardian of resources and stability.',
    es: 'Fuerza para la seguridad de los suyos. Guardián pragmático de recursos y estabilidad.',
  },
  analyst: {
    ru: 'Логика, данные, истинная суть. Чувства — шум, факты — сигнал.',
    en: 'Logic, data, true essence. Feelings are noise, facts are signal.',
    es: 'Lógica, datos, esencia verdadera. Los sentimientos son ruido, los hechos son señal.',
  },
  seeker: {
    ru: 'Свобода и новые горизонты. Не выносит жёстких рамок и оседлости.',
    en: 'Freedom and new horizons. Can\'t stand rigid frames or settling down.',
    es: 'Libertad y nuevos horizontes. No soporta los marcos rígidos ni quedarse en un sitio.',
  },
  idealist: {
    ru: 'Чистота концепции, верность принципам. Простота как высшая форма.',
    en: 'Purity of concept, loyalty to principles. Simplicity as the highest form.',
    es: 'Pureza del concepto, lealtad a los principios. La simplicidad como forma superior.',
  },
  realist: {
    ru: 'Холодный расчёт, без иллюзий. Опирается на работающие системы и сообщества.',
    en: 'Cold calculation, no illusions. Relies on systems and communities that actually work.',
    es: 'Cálculo frío, sin ilusiones. Se apoya en sistemas y comunidades que funcionan.',
  },
  aesthetic: {
    ru: 'Качество, глубина и красота. Презирает дешёвое и фальшивое.',
    en: 'Quality, depth, and beauty. Despises the cheap and the fake.',
    es: 'Calidad, profundidad y belleza. Desprecia lo barato y lo falso.',
  },
  trickster: {
    ru: 'Юмор, ирония, провокация. Видит игру там, где другие — правила.',
    en: 'Humor, irony, provocation. Sees a game where others see rules.',
    es: 'Humor, ironía, provocación. Ve un juego donde otros ven reglas.',
  },
};

export const ARCHETYPE_TEST = {
  id: 'archetypes',
  scale: 'agree5',
  max: 5,
  logo: '/varkanis-test-arquetipos.jpg',
  author: 'Varkanis',
  title: { ru: 'Архетипы личности', en: 'Personality Archetypes', es: 'Arquetipos de personalidad' },
  short: {
    ru: '24 утверждения, ~3 минуты. Найди свой Архетип-ядро и Тень.',
    en: '24 statements, ~3 minutes. Find your Core archetype and your Shadow.',
    es: '24 afirmaciones, ~3 minutos. Encuentra tu Arquetipo-Núcleo y tu Sombra.',
  },
  coreLabel:   { ru: 'Ядро',  en: 'Core',   es: 'Núcleo' },
  shadowLabel: { ru: 'Тень',  en: 'Shadow', es: 'Sombra' },
  items: [
    { archetype: 'warrior',    ru: 'Я готов терпеть сильнейший дискомфорт и боль ради своих целей.',                                en: "I'm willing to endure extreme discomfort and pain to reach my goals.",                          es: 'Estoy dispuesto a soportar la incomodidad extrema y el dolor para alcanzar mis objetivos.' },
    { archetype: 'iconoclast', ru: 'Правила и традиции созданы, чтобы их ломать, если они тормозят прогресс.',                       en: 'Rules and traditions are made to be broken if they hold back progress.',                        es: 'Las reglas y tradiciones están hechas para romperse si frenan el progreso.' },
    { archetype: 'alchemist',  ru: 'Я верю, что понимание фундаментальных законов природы и разума даёт безграничную силу.',         en: 'I believe that understanding the fundamental laws of nature and the mind grants unlimited power.', es: 'Creo que entender las leyes fundamentales de la naturaleza y la mente otorga un poder ilimitado.' },
    { archetype: 'sovereign',  ru: 'Контроль, структура и иерархия необходимы для эффективного управления любым процессом.',         en: 'Control, structure, and hierarchy are necessary to manage any process effectively.',            es: 'El control, la estructura y la jerarquía son necesarios para gestionar cualquier proceso con eficacia.' },
    { archetype: 'visionary',  ru: 'Для меня важнее всего создать что-то принципиально новое и осязаемое, чего раньше не было.',     en: "For me, the most important thing is to create something fundamentally new and tangible that didn't exist before.", es: 'Para mí lo más importante es crear algo fundamentalmente nuevo y tangible que no existiera antes.' },
    { archetype: 'protector',  ru: 'Сила нужна, чтобы защищать свои ресурсы и обеспечивать безопасность близких.',                  en: "Strength is needed to protect one's resources and ensure the safety of those close to you.",    es: 'La fuerza es necesaria para proteger los recursos propios y garantizar la seguridad de los cercanos.' },
    { archetype: 'analyst',    ru: 'Объективные факты, данные и логика всегда важнее субъективных чувств.',                          en: 'Objective facts, data, and logic are always more important than subjective feelings.',          es: 'Los hechos objetivos, los datos y la lógica siempre son más importantes que los sentimientos subjetivos.' },
    { archetype: 'seeker',     ru: 'Ограничения и жёсткие рамки меня душат — мне жизненно нужна автономия.',                          en: 'Restrictions and rigid frameworks suffocate me; I vitally need autonomy.',                       es: 'Las limitaciones y los marcos rígidos me asfixian; necesito autonomía de forma vital.' },
    { archetype: 'idealist',   ru: 'Я верю, что всё в мире можно свести к абсолютной чистоте, простоте и идеальной эффективности.',  en: 'I believe everything in the world can be reduced to absolute purity, simplicity, and perfect efficiency.', es: 'Creo que todo en el mundo se puede reducir a la pureza absoluta, la simplicidad y la eficiencia perfecta.' },
    { archetype: 'realist',    ru: 'Я твёрдо стою на земле и оцениваю мир без иллюзий, опираясь на холодный расчёт.',                en: 'I have my feet on the ground and assess the world without illusions, relying on cold calculation.', es: 'Tengo los pies en la tierra y evalúo el mundo sin ilusiones, apoyándome en el cálculo frío.' },
    { archetype: 'aesthetic',  ru: 'Эстетика, качество и глубина восприятия определяют ценность жизни и любого продукта.',           en: 'Aesthetics, quality, and depth of perception define the value of life and of any product.',      es: 'La estética, la calidad y la profundidad de percepción definen el valor de la vida y de cualquier producto.' },
    { archetype: 'trickster',  ru: 'Юмор, ирония и социальная провокация — лучшие инструменты для разоблачения чужой глупости.',     en: "Humor, irony, and social provocation are the best tools for deconstructing other people's stupidity.", es: 'El humor, la ironía y la provocación social son las mejores herramientas para deconstruir la estupidez ajena.' },

    { archetype: 'warrior',    ru: 'Борьба и преодоление препятствий мотивируют меня больше, чем тихий триумф.',                     en: 'Struggle and overcoming obstacles motivate me more than a quiet victory.',                       es: 'La lucha y superar obstáculos me motivan más que un triunfo tranquilo.' },
    { archetype: 'iconoclast', ru: 'Я искренне рад разрушать устаревшие и неэффективные социальные догмы.',                          en: 'I sincerely enjoy destroying obsolete and inefficient social dogmas.',                          es: 'Me alegra sinceramente destruir dogmas sociales obsoletos e ineficientes.' },
    { archetype: 'alchemist',  ru: 'Мне нравится превращать хаос в функциональные концепции и менять реальность вокруг.',            en: 'I like to turn chaos into functional concepts and reshape the reality around me.',              es: 'Me gusta transformar el caos en conceptos funcionales y cambiar la realidad a mi alrededor.' },
    { archetype: 'sovereign',  ru: 'Я без колебаний беру на себя ответственность за сложные решения, когда другие пасуют.',           en: 'I unhesitatingly take responsibility for hard decisions when others falter.',                    es: 'Asumo sin dudar la responsabilidad de tomar decisiones difíciles cuando otros se acobardan.' },
    { archetype: 'visionary',  ru: 'Я постоянно изобретаю новые системы, инструменты или алгоритмы, оптимизируя мир.',               en: 'I constantly invent new systems, tools, or algorithms, optimizing the world.',                   es: 'Constantemente invento nuevos sistemas, herramientas o algoritmos, optimizando el mundo.' },
    { archetype: 'protector',  ru: 'Я подхожу к рискам прагматично и всегда забочусь о стабильности своей "системы".',               en: 'I approach risks pragmatically and always look after the stability of my "system".',            es: 'Enfoco los riesgos de manera pragmática y siempre cuido la estabilidad de mi "sistema".' },
    { archetype: 'analyst',    ru: 'Я провожу много времени, анализируя детали, чтобы понять истинную суть вещей.',                  en: 'I spend a lot of time analyzing details to grasp the true essence of things.',                   es: 'Paso mucho tiempo analizando los detalles para comprender la verdadera esencia de las cosas.' },
    { archetype: 'seeker',     ru: 'Я постоянно ищу новые горизонты, знания и опыт, не задерживаясь надолго на одном месте.',         en: 'I constantly seek new horizons, knowledge, and experiences, without staying in one place for long.', es: 'Busco constantemente nuevos horizontes, conocimientos y experiencias, sin quedarme mucho tiempo en un solo lugar.' },
    { archetype: 'idealist',   ru: 'Верность базовым принципам и чистота концепта важнее сиюминутной выгоды.',                       en: 'Staying true to my core principles and the purity of the concept matter more than immediate gain.', es: 'Ser fiel a mis principios básicos y la pureza del concepto son más importantes que el beneficio inmediato.' },
    { archetype: 'realist',    ru: 'Быть частью функционального сообщества и понимать его законы — ключ к стабильному выживанию.',   en: 'Being part of a functional community and understanding its laws is the key to stable survival.', es: 'Formar parte de una comunidad funcional y entender sus leyes es la clave para una supervivencia estable.' },
    { archetype: 'aesthetic',  ru: 'Я ищу эксклюзивные связи с людьми и вещами, презирая дешёвое и фальшивое.',                       en: 'I seek exclusive connections with people and things, scorning the cheap and the fake.',         es: 'Busco conexiones exclusivas con personas y cosas, despreciando lo barato y lo falso.' },
    { archetype: 'trickster',  ru: 'Жизнь — это игра, и нужно уметь использовать слабости других ради забавы или выгоды.',           en: "Life is a game, and you need to know how to use other people's weaknesses for fun or profit.",    es: 'La vida es un juego, y hay que saber usar las debilidades de los demás por diversión o beneficio.' },
  ],
  archetypes: ARCHETYPES,
  descriptions: ARCHETYPE_DESC,
};

// Psychological age — 20 single-choice items. Each option carries points:
// a=1 (reactive, externally driven), b=2 (transitional, high self-conflict),
// c=3 (rational, stoic autonomy). Total 20..60 maps to a CONCRETE age (15..55)
// via piecewise-linear interpolation across three phases. Educational, not clinical.
export const PSYCH_AGE = {
  id: 'psych-age',
  scale: 'choice',
  logo: '/psicoedad.jpg',
  author: 'Varkanis',
  title: { ru: 'Психологический возраст', en: 'Psychological Age', es: 'Edad Psicológica' },
  short: {
    ru: '20 вопросов, ~4 минуты. Узнай свой психологический возраст — конкретное число лет.',
    en: '20 questions, ~4 minutes. Discover your psychological age — a concrete number of years.',
    es: '20 preguntas, ~4 minutos. Descubre tu edad psicológica: un número concreto de años.',
  },
  items: [
    {
      ru: 'Когда я совершаю серьёзную ошибку, моя первая реакция:',
      en: 'When I make a serious mistake, my first reaction is:',
      es: 'Cuando cometo un error grave, mi primera reacción es:',
      options: [
        { points: 1, ru: 'Искать, кого обвинить, или оправдываться внутри себя.', en: 'Look for someone to blame or justify myself internally.', es: 'Buscar a quién culpar o justificarme internamente.' },
        { points: 2, ru: 'Чувствовать вину и погружаться в самобичевание.', en: 'Feel guilty and sink into self-criticism.', es: 'Sentirme culpable y sumirme en la autocrítica.' },
        { points: 3, ru: 'Анализировать сбой как объективные данные, чтобы поправить систему.', en: 'Analyze the failure as objective data to fix the system.', es: 'Analizar el fallo como un dato objetivo para corregir el sistema.' },
      ],
    },
    {
      ru: 'Мысль о смерти или о конце времени вызывает у меня:',
      en: 'The idea of death or the end of time makes me feel:',
      es: 'La idea de la muerte o del fin del tiempo me produce:',
      options: [
        { points: 1, ru: 'Абстрактный страх, который я предпочитаю игнорировать.', en: 'An abstract fear I prefer to ignore.', es: 'Un miedo abstracto que prefiero ignorar.' },
        { points: 2, ru: 'Тревогу и глубокий дискомфорт.', en: 'Anxiety and deep discomfort.', es: 'Ansiedad e incomodidad profunda.' },
        { points: 3, ru: 'Холодное принятие, которое я использую, чтобы расставлять приоритеты.', en: 'A cool acceptance I use to prioritize my daily goals.', es: 'Una aceptación fría que uso para priorizar mis objetivos diarios.' },
      ],
    },
    {
      ru: 'В споре, если собеседник давит одними эмоциями, я:',
      en: 'In an argument, if the other person uses pure emotion, I:',
      es: 'En una discusión, si mi interlocutor argumenta con puras emociones, yo:',
      options: [
        { points: 1, ru: 'Завожусь и отвечаю с той же эмоциональной силой.', en: 'Get worked up and respond with the same emotional intensity.', es: 'Me altero y respondo con la misma intensidad emocional.' },
        { points: 2, ru: 'Замолкаю от фрустрации и коплю обиду.', en: 'Go quiet out of frustration and hold on to the resentment.', es: 'Me callo por frustración y me guardo el resentimiento.' },
        { points: 3, ru: 'Эмоционально отключаюсь и анализирую разговор со стороны.', en: 'Disconnect emotionally and analyze the conversation from the outside.', es: 'Desconecto emocionalmente y analizo la conversación desde fuera.' },
      ],
    },
    {
      ru: 'Понятие «успех» для меня — это:',
      en: 'The concept of "success" for me is defined as:',
      es: 'El concepto de "éxito" para mí se define como:',
      options: [
        { points: 1, ru: 'Внешнее признание, статус и одобрение окружающих.', en: 'External recognition, status, and the approval of others.', es: 'El reconocimiento externo, el estatus y la aprobación de los demás.' },
        { points: 2, ru: 'Реализация моих идеалов и внутренних ожиданий.', en: 'The realization of my ideals and inner expectations.', es: 'La realización de mis ideales y expectativas internas.' },
        { points: 3, ru: 'Полная автономия и абсолютный контроль над своим временем и ресурсами.', en: 'Total autonomy and full control over my time and resources.', es: 'La autonomía total y el control absoluto sobre mi tiempo y recursos.' },
      ],
    },
    {
      ru: 'Когда меня критикуют деструктивно:',
      en: 'When someone criticizes me destructively:',
      es: 'Cuando alguien me critica de forma destructiva:',
      options: [
        { points: 1, ru: 'Обижаюсь и ищу способ контратаковать.', en: 'I take offense and look for a way to counterattack.', es: 'Me ofendo y busco la forma de contraatacar.' },
        { points: 2, ru: 'Начинаю сомневаться в себе и тону в этих сомнениях.', en: 'I doubt myself and sink into the doubt.', es: 'Dudo de mí mismo y me hundo en la duda.' },
        { points: 3, ru: 'Оцениваю, есть ли 1% полезной правды; если нет — отбрасываю без эмоций.', en: 'I check whether there is a useful 1% of truth; if not, I discard it without emotion.', es: 'Evalúo si hay un 1% de verdad útil; si no, lo desecho sin emociones.' },
      ],
    },
    {
      ru: 'Мои планы на ближайшие 5–10 лет:',
      en: 'My plans for the next 5–10 years are:',
      es: 'Mis planes para los próximos 5-10 años son:',
      options: [
        { points: 1, ru: 'Абстрактные и идиллические, скорее желания, чем реальные шаги.', en: 'Abstract and idyllic, based on wishes more than real steps.', es: 'Abstractos e idílicos, basados en deseos más que en pasos reales.' },
        { points: 2, ru: 'Стрессовые — я чувствую давление не оправдать ожиданий.', en: 'Stressful, because I feel the pressure of not achieving what is expected of me.', es: 'Estresantes, porque siento la presión de no lograr lo que se espera de mí.' },
        { points: 3, ru: 'Гибкие, но структурированные, разбитые на конкретные тактические цели.', en: 'Flexible but structured, broken into concrete tactical goals.', es: 'Flexibles pero estructurados, divididos en objetivos tácticos concretos.' },
      ],
    },
    {
      ru: 'Одиночество для меня — это:',
      en: 'Solitude for me is:',
      es: 'La soledad para mí es:',
      options: [
        { points: 1, ru: 'Неуютная пустота, которую я заполняю цифровым шумом и соцсетями.', en: 'An uncomfortable void I try to fill with digital noise or social media.', es: 'Un vacío incómodo que intento llenar con ruido digital o redes sociales.' },
        { points: 2, ru: 'Временное убежище, чтобы отдохнуть от хаоса мира.', en: 'A temporary refuge to rest from the chaos of the world.', es: 'Un refugio temporal para descansar del caos del mundo.' },
        { points: 3, ru: 'Моё естественное состояние высокой продуктивности и ясности.', en: 'My natural state of high productivity and mental order.', es: 'Mi estado natural de alta productividad y orden mental.' },
      ],
    },
    {
      ru: 'К традициям и нормам, навязанным обществом, я отношусь так:',
      en: 'Toward traditions and norms imposed by society:',
      es: 'Frente a las tradiciones y normas impuestas por la sociedad:',
      options: [
        { points: 1, ru: 'Следую им по инерции и привычке, не задаваясь вопросами.', en: 'I follow them out of inertia or habit, without questioning them.', es: 'Las sigo por inercia o costumbre sin cuestionarlas.' },
        { points: 2, ru: 'Бунтую просто ради того, чтобы идти против системы.', en: 'I rebel just for the sake of going against the system.', es: 'Rebelarme por el simple hecho de ir en contra del sistema.' },
        { points: 3, ru: 'Оцениваю прагматично: полезны — использую, нет — игнорирую.', en: 'I assess them pragmatically: if useful, I use them; if not, I ignore them.', es: 'Las analizo pragmáticamente: si me son útiles, las uso; si no, las ignoro.' },
      ],
    },
    {
      ru: 'Вспоминая ошибки прошлого, я чувствую:',
      en: 'When I remember my past mistakes, I feel:',
      es: 'Cuando recuerdo mis errores del pasado, siento:',
      options: [
        { points: 1, ru: 'Стыд и желание стереть эти воспоминания.', en: 'Shame and a wish to erase those memories.', es: 'Vergüenza y ganas de borrar esos recuerdos.' },
        { points: 2, ru: 'Ностальгию или сожаление об упущенных возможностях.', en: 'Nostalgia or regret over lost opportunities.', es: 'Nostalgia o arrepentimiento por las oportunidades perdidas.' },
        { points: 3, ru: 'Холодную благодарность: это цена, заплаченная за мою нынешнюю оптимизацию.', en: 'A cold gratitude, since they are the price paid for my current optimization.', es: 'Gratitud fría, ya que son el coste pagado por mi optimización actual.' },
      ],
    },
    {
      ru: 'Скорость, с которой я меняю мнение при новых проверенных данных:',
      en: 'How fast I change my mind when faced with new, verified data is:',
      es: 'La velocidad con la que cambio de opinión ante datos nuevos y verificados es:',
      options: [
        { points: 1, ru: 'Медленная — мне тяжело публично признать, что я ошибался.', en: 'Slow; it is hard for me to admit publicly that I was wrong.', es: 'Lenta, me cuesta aceptar que estaba equivocado públicamente.' },
        { points: 2, ru: 'Зависит от того, насколько эмоционально задевает меня новая правда.', en: 'It depends on how that new truth affects me emotionally.', es: 'Depende de cómo me afecte emocionalmente esa nueva verdad.' },
        { points: 3, ru: 'Мгновенная — я не привязан к устаревшим идеям, если реальность их опровергла.', en: 'Instant; I have no attachment to obsolete ideas if reality proves otherwise.', es: 'Instantánea; no tengo apego a ideas obsoletas si la realidad demuestra lo contrario.' },
      ],
    },
    {
      ru: 'Человеческие отношения (дружбу, пару) я понимаю как:',
      en: 'I understand human relationships (friendship, partner) as:',
      es: 'Las relaciones humanas (amistad, pareja) las entiendo como:',
      options: [
        { points: 1, ru: 'Источник постоянного одобрения и компанию, чтобы не быть одному.', en: 'A source of constant validation and company so as not to be alone.', es: 'Una fuente de validación constante y compañía para no estar solo.' },
        { points: 2, ru: 'Обмен привязанностью, эмоциональной поддержкой и взаимопониманием.', en: 'An exchange of affection, emotional support, and mutual understanding.', es: 'Un intercambio de afecto, apoyo emocional y comprensión mutua.' },
        { points: 3, ru: 'Стратегический союз на основе ценностей, уважения и взаимного роста.', en: 'A strategic alliance based on values, respect, and mutual growth.', es: 'Una alianza estratégica basada en valores, respeto y crecimiento mutuo.' },
      ],
    },
    {
      ru: 'Моя ежедневная дисциплина зависит от:',
      en: 'My level of daily discipline depends on:',
      es: 'Mi nivel de disciplina diaria depende de:',
      options: [
        { points: 1, ru: 'Сиюминутной мотивации и настроения при пробуждении.', en: 'My momentary motivation and mood when I wake up.', es: 'Mi motivación momentánea y mi estado de ánimo al despertar.' },
        { points: 2, ru: 'Внешнего давления и дедлайнов, которые висят надо мной.', en: 'External pressure or the deadlines hanging over me.', es: 'La presión externa o los plazos de entrega que tengo encima.' },
        { points: 3, ru: 'Моей системы привычек и обязательств перед собой, независимо от чувств.', en: 'My system of habits and commitments to myself, regardless of how I feel.', es: 'Mi sistema de hábitos y compromisos conmigo mismo, sin importar cómo me sienta.' },
      ],
    },
    {
      ru: 'Когда я вижу страдания или хаос в мировых новостях:',
      en: 'When I see suffering or chaos in the world news:',
      es: 'Cuando veo el sufrimiento o el caos en las noticias del mundo:',
      options: [
        { points: 1, ru: 'Ужасаюсь и часами страдаю от чрезмерной эмпатии.', en: 'I am horrified and suffer excessive empathy for hours.', es: 'Me horrorizo y sufro empatía desmedida por horas.' },
        { points: 2, ru: 'Сознательно стараюсь игнорировать, чтобы защитить свой покой.', en: 'I consciously try to ignore it to protect my peace of mind.', es: 'Intento ignorarlo conscientemente para proteger mi paz mental.' },
        { points: 3, ru: 'Воспринимаю как часть исторических процессов и человеческой природы.', en: 'I understand it as part of historical processes and human nature.', es: 'Lo entiendo como parte de los procesos históricos y la naturaleza humana.' },
      ],
    },
    {
      ru: 'Скука или отсутствие немедленных стимулов вызывают у меня:',
      en: 'Boredom or the lack of immediate stimulation makes me feel:',
      es: 'El aburrimiento o la falta de estímulos inmediatos me genera:',
      options: [
        { points: 1, ru: 'Сильную тревогу и острую потребность в быстром контенте.', en: 'Extreme anxiety and an urgent need to consume fast content.', es: 'Ansiedad extrema y la necesidad urgente de consumir contenido rápido.' },
        { points: 2, ru: 'Лень и склонность прокрастинировать без чёткого направления.', en: 'Laziness and a tendency to procrastinate with no clear direction.', es: 'Flojera y tendencia a procrastinar sin un rumbo claro.' },
        { points: 3, ru: 'Свободное ментальное пространство, чтобы думать, планировать или наблюдать.', en: 'Free mental space to think, plan, or simply observe.', es: 'Espacio mental libre para pensar, planificar o simplemente observar.' },
      ],
    },
    {
      ru: 'Авторитет начальников, менторов и публичных фигур я оцениваю по:',
      en: 'I judge the authority of bosses, mentors, or public figures by:',
      es: 'La autoridad de jefes, mentores o figuras públicas la evalúo según:',
      options: [
        { points: 1, ru: 'Их положению, официальному статусу или харизме.', en: 'Their position, official status, or perceived charisma.', es: 'Su posición, su estatus oficial o su carisma percibido.' },
        { points: 2, ru: 'Тому, насколько они мне лично симпатичны.', en: 'How much I personally like or dislike them.', es: 'Lo bien o mal que me caigan a nivel personal.' },
        { points: 3, ru: 'Их реальным результатам, компетенциям и логике действий.', en: 'Their real results, proven competence, and the logic of their actions.', es: 'Sus resultados reales, sus competencias demostradas y la lógica de sus acciones.' },
      ],
    },
    {
      ru: 'Если важный план рушится в последний момент:',
      en: 'If an important plan falls apart at the last minute:',
      es: 'Si un plan importante se arruina por completo a última hora:',
      options: [
        { points: 1, ru: 'Я блокируюсь, злюсь и откладываю поиск решения.', en: 'I freeze, get frustrated, and put off looking for a solution.', es: 'Me bloqueo, me frustro y pospongo buscar una solución.' },
        { points: 2, ru: 'Сокрушаюсь о невезении и потраченных впустую усилиях.', en: 'I lament the bad luck and the wasted effort.', es: 'Me lamento por la mala suerte y el esfuerzo desperdiciado.' },
        { points: 3, ru: 'Мгновенно перехожу в режим решения задач и включаю запасной план.', en: 'I switch into problem-solving mode and activate the contingency plan at once.', es: 'Entro en modo resolución de problemas y activo el plan de contingencia al instante.' },
      ],
    },
    {
      ru: 'Тратить деньги на роскошь и мгновенное удовольствие для меня:',
      en: 'Spending money on luxury or instant gratification is, for me:',
      es: 'Gastar dinero en lujos o gratificación instantánea para mí es:',
      options: [
        { points: 1, ru: 'Моя главная слабость и частый способ себя порадовать.', en: 'My main weakness and a frequent way to reward myself.', es: 'Mi principal debilidad y forma de premiarme a menudo.' },
        { points: 2, ru: 'То, что вызывает вину потом, если не было запланировано.', en: 'Something that makes me feel guilty afterward if it was not planned.', es: 'Algo que me genera culpa posterior si no estaba planificado.' },
        { points: 3, ru: 'Просчитанное математическое решение; приоритет — вложения в своё развитие.', en: 'A calculated, mathematical decision; I prioritize investing in my own development.', es: 'Una decisión matemática calculada; priorizo la inversión en mi propio desarrollo.' },
      ],
    },
    {
      ru: 'Мнение окружающих о моих странностях и образе жизни:',
      en: 'What the rest of the world thinks about my quirks or lifestyle:',
      es: 'La opinión que el resto del mundo tiene sobre mis rarezas o estilo de vida:',
      options: [
        { points: 1, ru: 'Заметно меня беспокоит, и я маскирую их, чтобы вписаться.', en: 'Worries me quite a bit, and I try to camouflage them to fit in.', es: 'Me preocupa bastante y trato de camuflarlas para encajar.' },
        { points: 2, ru: 'Раздражает, но я с усилием стараюсь его игнорировать.', en: 'Bothers me, but I try to ignore it with effort.', es: 'Me molesta, pero intento ignorarla con esfuerzo.' },
        { points: 3, ru: 'Абсолютно неважно, пока это не влияет на мои планы.', en: 'Utterly irrelevant, as long as it does not affect my plans.', es: 'Me resulta absolutamente irrelevante mientras no afecte mis planes.' },
      ],
    },
    {
      ru: 'Понятие «удача» в моей повседневной жизни:',
      en: 'The concept of "luck" in my daily life:',
      es: 'El concepto de "suerte" en mi vida diaria:',
      options: [
        { points: 1, ru: 'Думаю, тут действует мистика или судьба всё решает.', en: 'I believe it plays a mystical role, or that fate decides things.', es: 'Creo que juega un papel místico o el destino define las cosas.' },
        { points: 2, ru: 'Несправедливая переменная, которая чаще благоволит другим, а не мне.', en: 'An unfair variable that tends to favor others more than me.', es: 'Es una variable injusta que suele favorecer a otros más que a mí.' },
        { points: 3, ru: 'Просто статистика — пересечение подготовки и возможности.', en: 'Simply statistics, the intersection of preparation and opportunity.', es: 'Es simplemente estadística y la intersección entre la preparación y la oportunidad.' },
      ],
    },
    {
      ru: 'Глядя на свою эволюцию за последний год, я чувствую, что:',
      en: 'Looking at my personal evolution over the last year, I feel that:',
      es: 'Al mirar mi evolución personal en el último año, siento que:',
      options: [
        { points: 1, ru: 'Остался практически тем же человеком, в тех же циклах.', en: 'I am practically the same person, stuck in the same loops.', es: 'Sigo siendo prácticamente la misma persona, con los mismos bucles.' },
        { points: 2, ru: 'Сильно изменился эмоционально, но мне не хватает структуры.', en: 'I have changed a lot emotionally, but I lack structure.', es: 'He cambiado mucho emocionalmente, pero me falta estructura.' },
        { points: 3, ru: 'Перепроектировал части мышления и оптимизировал принятие решений.', en: 'I have redesigned parts of my mindset and optimized my decision-making.', es: 'He rediseñado partes de mi mentalidad y optimizado mis procesos de toma de decisiones.' },
      ],
    },
  ],
  bands: {
    reactive: { ru: 'Реактивная юность', en: 'Reactive Youth', es: 'Juventud Reactiva' },
    critical: { ru: 'Критическая рациональность', en: 'Critical Rationality', es: 'Racionalidad Crítica' },
    stoic:    { ru: 'Системный стоицизм', en: 'Systemic Stoicism', es: 'Estoicismo Sistémico' },
  },
  bandDesc: {
    reactive: {
      ru: 'Мозг сильно завязан на быстрые дофаминовые стимулы, внешнее одобрение и эмоциональные реакции. Системы самоконтроля ещё пластичны. Ошибки воспринимаются болезненно, а не как сухие данные.',
      en: 'Your mind is heavily tied to fast dopamine hits, external approval, and emotional reactions. Self-control systems are still plastic. Mistakes feel painful rather than like dry data.',
      es: 'Tu mente está muy ligada a los estímulos rápidos de dopamina, la aprobación externa y las reacciones emocionales. Los sistemas de autocontrol aún son plásticos. Los errores se viven con dolor, no como datos fríos.',
    },
    critical: {
      ru: 'Золотой стандарт прагматика. Ты понимаешь цену ресурсам и времени, строишь личные границы, умеешь отключать эмоции ради дела. Бывают моменты выгорания из-за жёсткой попытки всё контролировать.',
      en: 'The gold standard of the pragmatist. You understand the value of resources and time, build personal boundaries, and can switch off emotion for the sake of the task. Burnout can appear from the hard drive to control everything.',
      es: 'El estándar de oro del pragmático. Entiendes el valor de los recursos y el tiempo, construyes límites personales y sabes desconectar las emociones por el bien de la tarea. Aparecen momentos de agotamiento por el intento férreo de controlarlo todo.',
    },
    stoic: {
      ru: 'Предельный уровень автономии от мнения социума и внешнего шума. Философское, холодное отношение к хаосу, смерти и ошибкам. Локус контроля — целиком внутри. Возможный минус — чрезмерная эмоциональная изоляция (алекситимия).',
      en: 'The highest level of autonomy from social opinion and outside noise. A philosophical, cold relationship with chaos, death, and mistakes. The locus of control is entirely internal. A potential downside is excessive emotional isolation (alexithymia).',
      es: 'El máximo nivel de autonomía frente a la opinión social y el ruido externo. Una relación filosófica y fría con el caos, la muerte y los errores. El locus de control está por completo dentro. El posible inconveniente es una aislamiento emocional excesivo (alexitimia).',
    },
  },
};

export const TESTS = [ADHD, DARK_TRIAD, ARCHETYPE_TEST, PSYCH_AGE];

// Concrete psychological age from total score (20..60), interpolated across the
// three phase bands: reactive 20..33 → 15..22, critical 34..48 → 23..38,
// stoic 49..60 → 39..55.
export function psychAgeFromScore(score) {
  let age;
  if (score <= 33) age = 15 + ((score - 20) / 13) * 7;
  else if (score <= 48) age = 23 + ((score - 34) / 14) * 15;
  else age = 39 + ((score - 49) / 11) * 16;
  return Math.round(age);
}

export function scorePsychAge(test, answers) {
  let total = 0;
  answers.forEach((a) => { if (a != null) total += a; }); // a is the option's points (1..3)
  const n = test.items.length;
  const min = n; // all 1s
  const max = n * 3; // all 3s
  const score = Math.max(min, Math.min(max, total));
  let band = 'reactive';
  if (score >= 49) band = 'stoic';
  else if (score >= 34) band = 'critical';
  const age = psychAgeFromScore(score);
  return { total: score, min, max, band, age };
}

export function scoreArchetypes(test, answers) {
  const sums = {};
  Object.keys(test.archetypes).forEach((k) => { sums[k] = 0; });
  test.items.forEach((item, i) => {
    const raw = answers[i];
    if (raw == null) return;
    sums[item.archetype] += raw - 1; // 1..5 → 0..4
  });
  const ranked = Object.entries(sums)
    .map(([key, sum]) => ({ key, sum, max: 8, pct: Math.round((sum / 8) * 100) }))
    .sort((a, b) => b.sum - a.sum || a.key.localeCompare(b.key));
  return { ranked, core: ranked[0], shadow: ranked[1] };
}

export function scoreDarkTriad(test, answers) {
  const sums = { M: 0, N: 0, P: 0 };
  const counts = { M: 0, N: 0, P: 0 };
  test.items.forEach((item, i) => {
    const raw = answers[i];
    if (raw == null) return;
    sums[item.subscale] += raw - 1; // 1..5 → 0..4
    counts[item.subscale] += 1;
  });
  const bandOf = (v) => (v <= 8 ? 'low' : v >= 17 ? 'high' : 'mid');
  const subscales = Object.fromEntries(Object.entries(sums).map(([k, s]) => {
    const c = counts[k] || 1;
    const m = c * 4;
    return [k, { sum: s, max: m, pct: Math.round((s / m) * 100), band: bandOf(s) }];
  }));
  return { subscales };
}

export function scoreAdhd(test, answers) {
  const sums = { I: 0, H: 0, P: 0 };
  const counts = { I: 0, H: 0, P: 0 };
  let total = 0;
  test.items.forEach((item, i) => {
    const raw = answers[i];
    if (raw == null) return;
    const v = raw - 1; // shift 1..5 → 0..4
    sums[item.subscale] += v;
    counts[item.subscale] += 1;
    total += v;
  });
  const subscales = Object.fromEntries(Object.entries(sums).map(([k, s]) => {
    const c = counts[k] || 1;
    const m = c * 4;
    return [k, { sum: s, max: m, pct: Math.round((s / m) * 100) }];
  }));
  const max = test.items.length * 4;
  let band = 'low';
  if (total > 50) band = 'high';
  else if (total > 25) band = 'mid';
  return { total, max, band, subscales };
}

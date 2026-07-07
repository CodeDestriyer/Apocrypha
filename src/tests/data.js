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
  // Final result image, one per probability band (low/mid/high).
  images: {
    low:  '/tdah-baja.jpg',
    mid:  '/tdah-media.jpg',
    high: '/tdah-alta.jpg',
  },
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

// Autism-spectrum / "Silicon Mind" self-report — 30 single-choice items.
// Each option carries points: a=0 (neurotypical, socially adapted), b=1
// (moderate analytical traits), c=2 (pure logical / high neurodivergence).
// Total 0..60 → optimization percentage. Educational, not a clinical diagnosis.
export const SILICON_MIND = {
  id: 'silicon-mind',
  scale: 'choice',
  logo: '/autismtest.jpg',
  author: 'Varkanis',
  title: { ru: 'Спектр аутизма · Silicon Mind', en: 'Autism Spectrum · Silicon Mind', es: 'Espectro Autista · Silicon Mind' },
  short: {
    ru: '30 вопросов, ~5 минут. Измерь свой процент нейродивергентной оптимизации.',
    en: '30 questions, ~5 minutes. Measure your neurodivergent optimization percentage.',
    es: '30 preguntas, ~5 minutos. Mide tu porcentaje de optimización neurodivergente.',
  },
  items: [
    {
      ru: 'Когда кто-то рассказывает мне личную проблему в ожидании эмоциональной поддержки, я:',
      en: 'When someone tells me a personal problem expecting emotional support, I:',
      es: 'Cuando alguien me cuenta un problema personal esperando apoyo emocional, yo:',
      options: [
        { points: 0, ru: 'Сразу сопереживаю и стараюсь эмоционально его успокоить.', en: 'Empathize immediately and try to comfort them emotionally.', es: 'Empatizo de inmediato y busco reconfortarlo emocionalmente.' },
        { points: 1, ru: 'Чувствую неловкость, но пытаюсь сказать социально принятые фразы.', en: 'Feel some discomfort, but try to say the socially accepted phrases.', es: 'Siento cierta incomodidad, pero intento decir las frases socialmente aceptadas.' },
        { points: 2, ru: 'Действую как ChatGPT: игнорирую драму и выдаю дерево решений с 3 логичными выходами.', en: 'Act like ChatGPT: ignore the drama and offer a decision tree with 3 logical solutions.', es: 'Actúo como ChatGPT: ignoro el drama y le ofrezco un árbol de decisiones con 3 soluciones lógicas.' },
      ],
    },
    {
      ru: 'Зрительный контакт с людьми не из круга абсолютного доверия для меня:',
      en: 'Eye contact with people outside my circle of absolute trust feels:',
      es: 'El contacto visual con personas que no son de mi confianza absoluta me resulta:',
      options: [
        { points: 0, ru: 'Естественен и нужен, чтобы установить связь в разговоре.', en: 'Natural and necessary to connect during a conversation.', es: 'Natural y necesario para conectar durante una charla.' },
        { points: 1, ru: 'Немного вынужденный; иногда сознательно напоминаю себе смотреть в глаза.', en: 'A bit forced; sometimes I have to consciously remind myself to look them in the eye.', es: 'Un poco forzado; a veces tengo que recordarme conscientemente que debo mirar a los ojos.' },
        { points: 2, ru: 'Ненужная пытка. Предпочитаю смотреть в экран, в пол или в бесконечную точку.', en: 'An unnecessary torture. I prefer looking at the screen, the floor, or a point in infinity.', es: 'Una tortura innecesaria. Prefiero mirar a la pantalla, al suelo o fijar la vista en un punto infinito.' },
      ],
    },
    {
      ru: 'Заходя в бар, ресторан или коворкинг с громкой музыкой и мигающим светом:',
      en: 'Walking into a bar, restaurant, or coworking space with loud music and flashing lights:',
      es: 'Al entrar a un bar, restaurante o espacio de coworking con música alta y luces parpadeantes:',
      options: [
        { points: 0, ru: 'Быстро адаптируюсь и спокойно занимаюсь своим делом.', en: 'I adapt quickly and focus on my own thing with no problem.', es: 'Me adapto rápido y me concentro en lo mío sin problemas.' },
        { points: 1, ru: 'Немного мешает, но терплю, если компания того стоит.', en: 'It bothers me a little, but I can tolerate it if the company is worth it.', es: 'Me molesta un poco, pero logro tolerarlo si la compañía vale la pena.' },
        { points: 2, ru: 'Мгновенная сенсорная перегрузка; мой ментальный CPU тормозит, хочу только сбежать.', en: 'Immediate sensory overload; my mental CPU slows down and I just want to flee.', es: 'Siento una sobrecarga sensorial inmediata; mi CPU mental se ralentiza y solo quiero huir.' },
      ],
    },
    {
      ru: 'Если кто-то говорит иронию или двусмысленность, не меняя тона голоса:',
      en: 'If someone says an ironic or double-meaning phrase without changing their tone:',
      es: 'Si alguien me dice una frase irónica o un doble sentido sin cambiar el tono de voz:',
      options: [
        { points: 0, ru: 'Мгновенно улавливаю сарказм по социальному контексту.', en: 'I catch the sarcasm instantly from the social context.', es: 'Capto el sarcasmo al instante por el contexto social.' },
        { points: 1, ru: 'Мне нужно пару секунд, чтобы понять — шутка это или реальное утверждение.', en: 'It takes me a few seconds to process whether it was a joke or a real statement.', es: 'Tardo unos segundos en procesar si era un chiste o una afirmación real.' },
        { points: 2, ru: 'Понимаю совершенно буквально и отвечаю фактами, создавая неловкость.', en: 'I take it completely literally and answer with objective data, leaving things awkward.', es: 'Lo tomo de forma completamente literal y respondo con datos objetivos, dejando la situación incómoda.' },
      ],
    },
    {
      ru: 'Мои отношения с ежедневными рутинами и расписанием:',
      en: 'My relationship with daily routines and schedules is:',
      es: 'Mi relación con las rutinas diarias y los horarios es:',
      options: [
        { points: 0, ru: 'Гибкие; меняю планы на ходу, и это не портит настроение.', en: 'Flexible; I change plans on the fly without it affecting my mood.', es: 'Flexible; cambio de planes sobre la marcha sin que me afecte el humor.' },
        { points: 1, ru: 'Организованные, но могу подстроиться под разумную неожиданность.', en: 'Organized, but I can adapt to a reasonable unexpected event.', es: 'Organizada, pero puedo adaptarme si ocurre un imprevisto razonable.' },
        { points: 2, ru: 'Священны. Если внешнее изменение ломает мой план дня без предупреждения — моя ОС уходит в короткое замыкание.', en: 'Sacred. If an external change alters my day plan without warning, my mental OS short-circuits.', es: 'Sagrada. Si un cambio externo altera mi plan del día sin previo aviso, mi sistema operativo mental entra en cortocircuito.' },
      ],
    },
    {
      ru: 'Когда я открываю новую интересную тему (технология, история, фреймворк и т.д.):',
      en: 'When I discover a new topic that interests me (tech, history, a framework, etc.):',
      es: 'Cuando descubro un nuevo tema que me interesa (tecnología, historia, un framework, etc.):',
      options: [
        { points: 0, ru: 'Читаю пару статей, знакомлюсь поверхностно и перехожу к другому.', en: 'I read a couple of articles, skim it, and move on.', es: 'Leo un par de artículos, me informo por encima y paso a otra cosa.' },
        { points: 1, ru: 'Посвящаю пару дней интенсивного чтения в свободное время.', en: 'I dedicate a few days of intense reading in my free time.', es: 'Le dedico unos días de lectura intensa en mis ratos libres.' },
        { points: 2, ru: 'Ухожу в тотальный гиперфокус: 72 часа без сна, пожирая документацию, форумы и базы данных, пока не узнаю больше создателей.', en: 'I enter massive hyperfocus: 72 hours without sleep, devouring docs, forums, and databases until I know more than the creators.', es: 'Entro en hiperenfoque masivo: paso 72 horas sin dormir, devorando documentación, foros y bases de datos hasta saber más que los creadores.' },
      ],
    },
    {
      ru: 'Неожиданные звонки с неизвестных или знакомых номеров для меня:',
      en: 'Surprise phone calls from unknown or known numbers are:',
      es: 'Las llamadas telefónicas sorpresa de números desconocidos o conocidos son:',
      options: [
        { points: 0, ru: 'Норма — отвечаю сразу, не задумываясь.', en: 'Normal; I answer instantly without thinking.', es: 'Algo normal que respondo al instante sin pensarlo.' },
        { points: 1, ru: 'Немного раздражают; предпочитаю, чтобы предупредили сообщением.', en: 'Annoying; I prefer to be warned by message first.', es: 'Algo molesto; prefiero que me avisen antes por mensaje.' },
        { points: 2, ru: 'Прямая агрессия против моего покоя. Даю прозвониться, потом решаю, достоин ли звонок ответа текстом.', en: 'A direct attack on my peace of mind. I let it ring, then decide if it deserves a text reply.', es: 'Una agresión directa a mi paz mental. Dejo que suene y luego analizo si realmente merece un texto de respuesta.' },
      ],
    },
    {
      ru: 'Текстуры одежды (царапающие бирки, синтетика, съехавшие носки):',
      en: 'Toward clothing textures (scratchy tags, synthetic fabrics, misaligned socks):',
      es: 'Frente a las texturas de la ropa (etiquetas que raspan, telas sintéticas, calcetines desalineados):',
      options: [
        { points: 0, ru: 'Большую часть времени даже не замечаю, что они есть.', en: "Most of the time I don't even notice they're there.", es: 'Ni me doy cuenta de que están ahí la mayor parte del tiempo.' },
        { points: 1, ru: 'Немного мешают, но за пару минут привыкаю.', en: 'They bother me a bit, but I get used to them within minutes.', es: 'Me incomodan un poco, pero me acostumbro a los pocos minutos.' },
        { points: 2, ru: 'Невыносимая помеха, которая рушит мой фокус, пока не переоденусь или не оторву бирку.', en: 'An unbearable distraction that ruins my focus until I change clothes or rip off the tag.', es: 'Son una distracción insoportable que arruina mi enfoque hasta que me cambio de ropa o arranco la etiqueta.' },
      ],
    },
    {
      ru: 'В групповых разговорах (small talk, болтовня о погоде в лифте):',
      en: 'In group conversations (small talk, elevator chat about the weather):',
      es: 'En las conversaciones grupales ("small talk" o charlas de ascensor sobre el clima):',
      options: [
        { points: 0, ru: 'Участвую легко и получаю удовольствие от лёгкого социального обмена.', en: 'I join in fluidly and enjoy the light social exchange.', es: 'Participo de forma fluida y disfruto del intercambio social ligero.' },
        { points: 1, ru: 'Терплю, сознательно стараясь казаться приятным.', en: 'I tolerate them by making a conscious effort to seem likable.', es: 'Las tolero haciendo un esfuerzo consciente por parecer simpático.' },
        { points: 2, ru: 'Считаю абсолютной тратой пропускной способности. Не понимаю, зачем люди тратят слюну на нерелевантные данные.', en: 'I see them as a total waste of bandwidth. I don\'t get why people spend saliva on irrelevant data.', es: 'Las considero una pérdida absoluta de ancho de banda. No entiendo por qué la gente gasta saliva en datos irrelevantes.' },
      ],
    },
    {
      ru: 'Когда меня увлекает тема и я начинаю говорить о ней с человеком:',
      en: 'When I\'m passionate about a topic and start talking about it with someone:',
      es: 'Cuando me apasiona un tema y empiezo a hablar de él con otra persona:',
      options: [
        { points: 0, ru: 'Слежу за его реакциями и меняю тему, если вижу, что ему скучно.', en: 'I monitor their reactions and change topic if I notice they\'re bored.', es: 'Monitorizo sus reacciones y cambio de tema si noto que se aburre.' },
        { points: 1, ru: 'Загораюсь, но стараюсь себя контролировать, чтобы не монополизировать разговор.', en: 'I get excited, but try to control myself so I don\'t monopolize the chat.', es: 'Me emociono, pero intento controlarme para no monopolizar la charla.' },
        { points: 2, ru: 'Выдаю структурированный 40-минутный монолог, не замечая, что собеседник смотрит на часы в поисках выхода.', en: 'I launch into a structured 40-minute monologue without noticing my listener is checking the clock for an exit.', es: 'Suelto un monólogo estructurado de 40 minutos sin darme cuenta de que mi interlocutor está mirando el reloj o buscando una salida.' },
      ],
    },
    {
      ru: 'Порядок вещей на моём столе или в цифровом окружении (файлы, Notion, код):',
      en: 'The order of objects on my desk or in my digital space (files, Notion, code):',
      es: 'El orden de los objetos en mi escritorio o en mi entorno digital (archivos, Notion, código):',
      options: [
        { points: 0, ru: 'Довольно хаотичный, но я нахожу вещи внутри своего беспорядка.', en: 'Pretty chaotic, but I know how to find things within my mess.', es: 'Bastante caótico, pero sé encontrar las cosas dentro de mi desorden.' },
        { points: 1, ru: 'Чистый и стандартный — нормальный для работы.', en: 'Clean and standard, the normal thing to work well.', es: 'Limpio y estándar, lo normal para trabajar bien.' },
        { points: 2, ru: 'Миллиметровый и одержимый. Если кто-то сдвинет иконку или предмет — замечаю мгновенно, и это вызывает отторжение.', en: 'Millimetric and obsessive. If someone moves a desktop icon or an object, I notice instantly and it repels me.', es: 'Milimétrico y obsesivo. Si alguien me mueve un icono del escritorio o un objeto de mi mesa, lo noto al instante y me genera rechazo.' },
      ],
    },
    {
      ru: 'Еда для меня — это в первую очередь:',
      en: 'Food, for me, is mainly defined as:',
      es: 'La comida para mí se define principalmente como:',
      options: [
        { points: 0, ru: 'Социальный опыт, кулинарное удовольствие и разнообразие вкусов.', en: 'A social experience, a culinary pleasure, and a variety of flavors.', es: 'Una experiencia social, un placer culinario y variedad de sabores.' },
        { points: 1, ru: 'Необходимое питание, которое я стараюсь сделать приятным.', en: 'Necessary nutrition that I try to make pleasant.', es: 'Nutrición necesaria que intento que sea agradable.' },
        { points: 2, ru: 'Топливо для организма. Готов есть одно и то же каждый день, если это экономит усталость от решений и уважает безопасные текстуры.', en: 'Fuel for the organism. I\'d eat the exact same thing every day if it spares me decision fatigue and respects my safe textures.', es: 'Combustible para el organismo. Prefiero comer exactamente lo mismo todos los días si eso me ahorra fatiga de decisión y respeta mis texturas seguras.' },
      ],
    },
    {
      ru: 'Когда я иду по улице, мой ум обычно занят:',
      en: 'When I walk down the street, my mind is usually focused on:',
      es: 'Cuando camino por la calle, mi mente suele estar concentrada en:',
      options: [
        { points: 0, ru: 'Наблюдением за людьми, витринами и городским пейзажем.', en: 'Watching people, shops, and enjoying the urban scenery.', es: 'Observar a la gente, las tiendas y disfrutar del paisaje urbano.' },
        { points: 1, ru: 'Общими мыслями о делах на день.', en: 'Thinking about my to-dos for the day in general.', es: 'Pensar en mis pendientes del día de forma general.' },
        { points: 2, ru: 'Подсчётом плиток, анализом геометрических паттернов зданий или расчётом оптимальной скорости до цели.', en: 'Counting tiles, analyzing geometric patterns in buildings, or calculating the optimal speed to reach my destination.', es: 'Contar baldosas, analizar patrones geométricos en los edificios o calcular la velocidad óptima para llegar a mi destino.' },
      ],
    },
    {
      ru: 'Повторяющиеся фоновые звуки (тиканье часов, чужое чавканье, старый кондиционер):',
      en: 'Repetitive background noises (a ticking clock, someone chewing, an old A/C):',
      es: 'Los ruidos repetitivos de fondo (el tic-tac de un reloj, alguien masticando, un aire acondicionado viejo):',
      options: [
        { points: 0, ru: 'Мозг фильтрует их автоматически; я их даже не слышу.', en: 'My brain filters them out automatically; I don\'t even hear them.', es: 'Mi cerebro los filtra automáticamente; ni los escucho.' },
        { points: 1, ru: 'Замечаю сначала, но потом удаётся игнорировать, если сосредоточусь.', en: 'I notice them at first, but manage to ignore them once I focus.', es: 'Los noto al principio, pero luego logro ignorarlos si me concentro en mi tarea.' },
        { points: 2, ru: 'Впиваются в мозг как иглы. Сосредоточиться невозможно без наушников с шумоподавлением.', en: 'They dig into my brain like needles. I can\'t concentrate without noise-cancelling headphones.', es: 'Se clavan en mi cerebro como agujas. Es imposible concentrarme sin auriculares con cancelación de ruido.' },
      ],
    },
    {
      ru: 'Нетворкинг и походы на соцмероприятия ради новых знакомств для меня:',
      en: 'Networking or attending social events to meet new people feels:',
      es: 'Hacer "networking" o asistir a eventos sociales para conocer gente nueva me resulta:',
      options: [
        { points: 0, ru: 'Стимулируют; заряжают энергией и новыми идеями.', en: 'Stimulating; it recharges me with energy and new ideas.', es: 'Estimulante; me recarga de energía y nuevas ideas.' },
        { points: 1, ru: 'Необходимое зло для бизнеса, которое я умею исполнять с усилием.', en: 'A necessary evil for business that I can execute with effort.', es: 'Un mal necesario para el negocio que sé ejecutar con esfuerzo.' },
        { points: 2, ru: 'Массовый слив социальной батареи. Нужно три дня полной изоляции в техно-пещере, чтобы восстановиться.', en: 'A massive drain of my social battery. I need three days of total isolation in my tech cave to recover.', es: 'Un drenaje masivo de batería social. Necesito tres días de aislamiento total en mi cueva tecnológica para recuperarme.' },
      ],
    },
    {
      ru: 'Когда люди выражают эмоции, плача или крича при мне:',
      en: 'When people express emotions by crying or shouting in front of me:',
      es: 'Cuando la gente expresa sus emociones llorando o gritando en mi presencia:',
      options: [
        { points: 0, ru: 'Хочу их обнять и заражаюсь их эмоциональным состоянием.', en: 'I feel the urge to hug them and I catch their emotional state.', es: 'Siento el impulso de abrazarlos y me contagio de su estado emocional.' },
        { points: 1, ru: 'Знаю, какие жесты изобразить, хотя внутри думаю, что делать.', en: 'I know which gestures to make to show sympathy, though inside I\'m thinking about what to do.', es: 'Sé qué gestos hacer para mostrar simpatía, aunque por dentro esté pensando en qué hacer.' },
        { points: 2, ru: 'Застываю, обрабатывая ситуацию как синтаксическую ошибку. Не знаю, куда деть руки и что сказать.', en: 'I freeze, processing the situation like a syntax error. I don\'t know what to do with my hands or what to say.', es: 'Me quedo congelado procesando la situación como un error de sintaxis. No sé qué hacer con mis manos ni qué decir.' },
      ],
    },
    {
      ru: 'Моя способность замечать логические паттерны, ошибки в коде или несогласованности в системе:',
      en: 'My ability to spot logical patterns, code errors, or inconsistencies in a system is:',
      es: 'Mi habilidad para detectar patrones lógicos, errores en líneas de código o inconsistencias en un sistema es:',
      options: [
        { points: 0, ru: 'Обычная, как у любого при небольшой тренировке.', en: 'Normal, like anyone with a bit of training.', es: 'Normal, como la de cualquiera con un poco de entrenamiento.' },
        { points: 1, ru: 'Хорошая; часто вижу сбои, которые другие пропускают.', en: 'Good; I usually see flaws that others miss.', es: 'Buena; suelo ver fallos que a otros se les escapan por encima.' },
        { points: 2, ru: 'Почти паранормальная. Ошибки бросаются в глаза, будто светятся на экране, ещё до того, как дочитаю.', en: 'Almost paranormal. Errors leap out as if glowing on the screen before I finish reading.', es: 'Casi paranormal. Los errores saltan a mi vista como si brillaran en la pantalla antes de que termine de leer.' },
      ],
    },
    {
      ru: 'С клиентами, партнёрами и друзьями я предпочитаю общаться через:',
      en: 'I prefer to communicate with clients, partners, or friends through:',
      es: 'Prefiero comunicarme con clientes, socios o amigos a través de:',
      options: [
        { points: 0, ru: 'Голосовые или видеозвонки; это человечнее и быстрее.', en: 'Voice or video calls; it\'s more human and faster.', es: 'Llamadas de voz o videollamadas; es más humano y rápido.' },
        { points: 1, ru: 'Длинные текстовые сообщения или выверенные голосовые.', en: 'Long text messages or controlled voice notes.', es: 'Mensajes de texto largos o notas de audio controladas.' },
        { points: 2, ru: 'Структурированный письменный текст, желательно с буллитами, markdown и без эмоциональных обиняков.', en: 'Structured written text, preferably with bullet points, markdown, and no emotional detours.', es: 'Texto escrito estructurado, preferiblemente con viñetas, markdown y sin rodeos emocionales.' },
      ],
    },
    {
      ru: 'В детстве/подростковом возрасте мои увлечения и интересы были:',
      en: 'As a child/teen, my hobbies and interests were:',
      es: 'Cuando era niño/adolescente, mis pasatiempos e intereses eran:',
      options: [
        { points: 0, ru: 'Такими же, как у остальных детей моего возраста (коллективные игры, прогулки).', en: 'The same as the rest of the kids my age (group games, going outside).', es: 'Los mismos que los del resto de niños de mi edad (juegos colectivos, salir a la calle).' },
        { points: 1, ru: 'Смесью обычных игр и нескольких одиночных навязчивостей.', en: 'A mix of common games and a few solitary obsessions.', es: 'Una mezcla entre juegos comunes y algunas obsesiones solitarias.' },
        { points: 2, ru: 'Коллекционированием конкретных данных, сортировкой предметов по цвету/размеру или часами над одной сложной игрой или техкнигой.', en: 'Collecting specific data, classifying objects by color/size, or spending hours obsessed with one complex video game or technical book.', es: 'Coleccionar datos específicos, clasificar objetos por colores/tamaños o pasar horas obsesionado con un solo videojuego complejo o libro técnico.' },
      ],
    },
    {
      ru: 'Планирование моих проектов или кода строится на:',
      en: 'The way I plan my projects or code is based on:',
      es: 'La forma en que planifico mis proyectos o código se basa en:',
      options: [
        { points: 0, ru: 'Делаю по ходу и решаю проблемы по мере их появления.', en: 'Just doing it and solving problems as they come up.', es: 'Ir haciendo y resolver los problemas según vayan surgiendo.' },
        { points: 1, ru: 'Списке общих задач с гибкими дедлайнами.', en: 'A list of general tasks with flexible deadlines.', es: 'Una lista de tareas generales con fechas límite flexibles.' },
        { points: 2, ru: 'Гипердетальной ментальной карте со всеми логическими зависимостями и сценариями сбоев до первой строки.', en: 'A hyper-detailed mind map with every logical dependency and possible failure case before writing the first line.', es: 'Un mapa mental hiperdetallado con todas las dependencias lógicas y casos de fallo posibles antes de picar la primera línea.' },
      ],
    },
    {
      ru: 'Если я сосредоточен на сложной задаче за компьютером и меня прерывают простым вопросом:',
      en: 'If I\'m focused on a complex task on my computer and someone interrupts with a simple question:',
      es: 'Si estoy concentrado en una tarea compleja en mi ordenador y alguien me interrumpe para hacerme una pregunta simple:',
      options: [
        { points: 0, ru: 'Отвечаю приветливо и возвращаюсь к работе, не теряя ритма.', en: 'I answer kindly and get back to work without losing my rhythm.', es: 'Respondo amablemente y retomo mi trabajo sin perder el ritmo.' },
        { points: 1, ru: 'Немного раздражаюсь, но отвечаю и минуту-другую восстанавливаю фокус.', en: 'It bothers me a bit, but I answer and take a few minutes to refocus.', es: 'Me molesta un poco, pero respondo y tardo unos minutos en volver a enfocarme.' },
        { points: 2, ru: 'Чувствую холодную глубокую ярость: только что рухнул карточный домик, который я два часа строил в голове.', en: 'I feel a cold, deep rage because they just knocked down a conceptual house of cards I spent two hours building in my head.', es: 'Siento una ira fría y profunda porque acaban de tirar abajo un castillo de naipes conceptual que tardé dos horas en construir en mi cabeza.' },
      ],
    },
    {
      ru: 'Понятие «ложь во спасение» (сказать, что одежда идёт, только из вежливости):',
      en: 'The concept of "white lies" (telling someone their clothes look good just to be polite):',
      es: 'El concepto de "mentiras piadosas" (decirle a alguien que su ropa le queda bien solo por educación):',
      options: [
        { points: 0, ru: 'Считаю отличным и нужным, чтобы общество работало без трений.', en: 'I see it as great and necessary for society to run without friction.', es: 'Lo veo genial y necesario para que la sociedad funcione sin fricciones.' },
        { points: 1, ru: 'Использую, когда не хочу лишних конфликтов, хотя мне это не нравится.', en: 'I use it when I don\'t want unnecessary conflict, even though I dislike it.', es: 'Lo uso cuando no quiero generar conflictos innecesarios, aunque no me guste.' },
        { points: 2, ru: 'Считаю неэффективной глупостью. Предпочитаю голую правду; реальная оптимизация требует честных данных, а не фальшивой лести.', en: 'I find it inefficient stupidity. I prefer raw truth; real optimization needs honest data, not fake flattery.', es: 'Me parece una estupidez ineficiente. Prefiero la verdad cruda; la optimización real requiere datos honestos, no falsos halagos.' },
      ],
    },
    {
      ru: 'На людях или в стрессе я склонен к бессознательным повторяющимся движениям (качать ногой, барабанить пальцами, вертеть предмет):',
      en: 'In public or when stressed, I make unconscious repetitive movements (bouncing my foot, drumming fingers, fiddling with an object):',
      es: 'Cuando estoy en público o estresado, suelo realizar movimientos repetitivos inconscientes (mover el pie, tamborilear los dedos, jugar con un objeto):',
      options: [
        { points: 0, ru: 'Редко или никогда; держусь в обычной позе.', en: 'Rarely or never; I keep a normal posture.', es: 'Rara vez o nunca; mantengo una postura normal.' },
        { points: 1, ru: 'Иногда, когда уровень стресса очень высок.', en: 'Sometimes, when the stress level is very high.', es: 'A veces, cuando el nivel de estrés es muy alto.' },
        { points: 2, ru: 'Постоянно. Это мой механизм самостимуляции (stimming), чтобы сбросить лишнюю энергию или тревогу среды.', en: 'Constantly. It\'s my self-stimulation ("stimming") mechanism to discharge excess energy or ambient anxiety.', es: 'Constantemente. Es mi mecanismo de estimulación ("stimming") para descargar el exceso de energía o ansiedad del entorno.' },
      ],
    },
    {
      ru: 'Понимание неявных социальных иерархий (знать, кому положено доп-уважение по формальному статусу, а не по заслугам):',
      en: 'Understanding implicit social hierarchies (knowing who deserves extra respect by formal position, not merit):',
      es: 'Entender las jerarquías sociales implícitas (saber a quién debes respeto extra solo por su posición formal y no por sus méritos):',
      options: [
        { points: 0, ru: 'Усваиваю естественно и действую по протоколу.', en: 'I assimilate it naturally and act according to protocol.', es: 'Lo asimilo de forma natural y actúo según el protocolo.' },
        { points: 1, ru: 'Понимаю, но меня раздражает изображать покорность перед некомпетентными.', en: 'I understand it, but it bothers me to fake submission before incompetents.', es: 'Lo entiendo, pero me molesta tener que fingir sumisión ante incompetentes.' },
        { points: 2, ru: 'Считаю это багом человеческой системы. Уважаю только техническую компетентность и логику; пустые титулы ничего не значат.', en: 'I see it as a bug in the human system. I only respect technical competence and logic; empty titles mean nothing.', es: 'Me parece un bug del sistema humano. Solo respeto la competencia técnica y la lógica; los títulos vacíos no significan nada.' },
      ],
    },
    {
      ru: 'Моя чувствительность к солнечному свету или офисным люминесцентным лампам:',
      en: 'My sensitivity to sunlight or office fluorescent lighting is:',
      es: 'Mi sensibilidad a la luz del sol o a las luces fluorescentes de oficina es:',
      options: [
        { points: 0, ru: 'Обычная; не мешает в повседневности.', en: 'Normal; it doesn\'t affect my day-to-day.', es: 'Normal; no me afecta en mi día a día.' },
        { points: 1, ru: 'Предпочитаю тёплый или приглушённый свет, но работаю при любом.', en: 'I prefer warm or dim light, but I work fine under any lamp.', es: 'Prefiero luces cálidas o bajas, pero trabajo bien bajo cualquier foco.' },
        { points: 2, ru: 'Высокая. Лучше работаю в темноте, с тёмной темой во всех приложениях, часто в солнцезащитных очках в помещении.', en: 'High. I work better in the dark, with dark mode in every app, and often wear sunglasses indoors if the light is aggressive.', es: 'Alta. Trabajo mejor a oscuras, con modo oscuro en todas las aplicaciones y a menudo uso gafas de sol en interiores si la luz es agresiva.' },
      ],
    },
    {
      ru: 'Читая роман или смотря фильм, я больше обращаю внимание на:',
      en: 'When I read a novel or watch a film, I pay more attention to:',
      es: 'Cuando leo una novela o veo una película, me fijo más en:',
      options: [
        { points: 0, ru: 'Любовную драму, эмоции персонажей и их отношения.', en: 'The love drama, the characters\' emotions, and their relationships.', es: 'El drama amoroso, las emociones de los personajes y sus relaciones.' },
        { points: 1, ru: 'Общий фон истории и ритм сюжета.', en: 'The general backdrop of the story and the pace of the plot.', es: 'El trasfondo general de la historia y el ritmo de la trama.' },
        { points: 2, ru: 'Связность лора, правила вселенной, технические детали и логические дыры сценария.', en: 'The coherence of the lore, the universe\'s rules, technical details, and logical plot holes.', es: 'La coherencia del "lore", las reglas del universo, los detalles técnicos y los fallos de guion lógicos.' },
      ],
    },
    {
      ru: 'Изучение новых языков или языков программирования даётся мне:',
      en: 'Learning new languages or programming languages comes to me:',
      es: 'Aprender nuevos idiomas o lenguajes de programación se me da:',
      options: [
        { points: 0, ru: 'С обычным усилием и практикой, как у любого.', en: 'With the usual effort and practice of any person.', es: 'Con el esfuerzo y la práctica habitual de cualquier persona.' },
        { points: 1, ru: 'Относительно хорошо, если возьмусь всерьёз на несколько месяцев.', en: 'Relatively well if I get serious for a few months.', es: 'Relativamente bien si me pongo en serio unos meses.' },
        { points: 2, ru: 'Крайне быстро; мозг обрабатывает грамматические структуры или синтаксис как нативные математические шаблоны.', en: 'Extremely fast; my brain processes grammar structures or code syntax like native mathematical templates.', es: 'Extremadamente rápido; mi cerebro procesa las estructuras gramaticales o la sintaxis de código como si fueran plantillas matemáticas nativas.' },
      ],
    },
    {
      ru: 'В личных отношениях люди обычно описывают меня как:',
      en: 'In personal relationships, people usually describe me as:',
      es: 'En las relaciones personales, la gente suele describirme como:',
      options: [
        { points: 0, ru: 'Тёплого, выразительного, легко читаемого эмоционально.', en: 'Someone warm, expressive, and emotionally easy to read.', es: 'Alguien cálido, expresivo y fácil de leer emocionalmente.' },
        { points: 1, ru: 'Сдержанного, но верного, когда проникнется доверием.', en: 'Reserved but loyal once I gain trust.', es: 'Alguien reservado pero leal cuando coge confianza.' },
        { points: 2, ru: 'Холодного, отстранённого, загадочного или «чёрный ящик», который трудно расшифровать.', en: 'Cold, distant, enigmatic, or a "black box" that\'s hard to decipher.', es: 'Alguien frío, distante, enigmático o una "caja negra" difícil de descifrar.' },
      ],
    },
    {
      ru: 'Вспоминая событие из прошлого, моя память работает через:',
      en: 'When I try to recall a past event, my memory works through:',
      es: 'Cuando intento recordar un evento del pasado, mi memoria funciona mediante:',
      options: [
        { points: 0, ru: 'Общее эмоциональное ощущение того, что произошло.', en: 'A general emotional sense of what happened.', es: 'Una sensación emocional general de lo que pasó.' },
        { points: 1, ru: 'Повествовательный рассказ об основных фактах.', en: 'A narrative account of the main facts.', es: 'Un relato narrativo de los hechos principales.' },
        { points: 2, ru: 'Гиперчёткие ментальные скриншоты, точные дата/время или детали среды, которые другие забыли.', en: 'Hyper-sharp mental screenshots, exact date/time data, or specific environmental details others forgot.', es: 'Capturas de pantalla mentales hipernítidas, datos exactos de la fecha/hora o detalles específicos del entorno que otros olvidaron.' },
      ],
    },
    {
      ru: 'Если бы я мог автоматизировать все повторяющиеся человеческие соцвзаимодействия с помощью ИИ, я:',
      en: 'If I could automate all my repetitive human social interactions with an AI, I would:',
      es: 'Si tuviera la oportunidad de automatizar todas mis interacciones sociales humanas repetitivas mediante una IA, yo:',
      options: [
        { points: 0, ru: 'Категорически отказался бы; предпочитаю реальный человеческий контакт с его несовершенствами.', en: 'Flatly refuse; I prefer real human contact with its imperfections.', es: 'Me negaría rotundamente; prefiero el contacto humano real con sus imperfecciones.' },
        { points: 1, ru: 'Сделал бы это только для бюрократии и тяжёлых клиентов.', en: 'Do it only for bureaucratic errands and difficult clients.', es: 'Lo haría solo para trámites burocráticos y clientes pesados.' },
        { points: 2, ru: 'Оформил бы премиум-подписку прямо сегодня. Это был бы идеальный софт для оптимизации моей жизни.', en: 'Pay for a premium subscription today. It would be the ultimate software to optimize my life.', es: 'Pagaría una suscripción premium hoy mismo. Sería el software definitivo para optimizar mi vida.' },
      ],
    },
  ],
  bands: {
    social:  { ru: 'Социальный / базовый нейротип', en: 'Social / Basic Neurotypical', es: 'Mente Social / Neurotípica Básica' },
    adapted: { ru: 'Адаптированный аналитик', en: 'Adapted Analyst', es: 'Analista Adaptado' },
    silicon: { ru: 'Silicon Mind / Кремниевый мозг', en: 'Silicon Mind', es: 'Silicon Mind / Cerebro de Silicio' },
  },
  bandDesc: {
    social: {
      ru: 'Твой мозг заточен под плавное социальное взаимодействие и органическую эмпатию. Ты хорошо фильтруешь стимулы. Минус: склонен тратить время на неэффективные социальные динамики, и тебе трудно входить в глубокий гиперфокус.',
      en: 'Your brain is wired for fluid social interaction and organic empathy. You filter stimuli well. Downside: you\'re prone to wasting time on inefficient social dynamics and struggle to enter deep hyperfocus.',
      es: 'Tu cerebro está cableado para la interacción social fluida y la empatía orgánica. Filtras bien los estímulos. Desventaja: eres propenso a perder el tiempo en dinámicas sociales ineficientes y te cuesta entrar en hiperenfoque profundo.',
    },
    adapted: {
      ru: 'У тебя сильная рациональная жилка и системное мышление. Ты ценишь порядок и логику, но умеешь «надевать социальную маску», когда этого требует дело. Ты — мост между человеческим хаосом и чистыми системами.',
      en: 'You have a strong rational streak and systemic capacity. You value order and logic but keep the ability to "put on the social mask" when business requires it. You\'re the bridge between human chaos and pure systems.',
      es: 'Tienes una fuerte vena racional y capacidad sistémica. Valoras el orden y la lógica, pero mantienes la capacidad de "ponerte la máscara" social cuando el negocio lo requiere. Eres el puente entre el caos humano y los sistemas puros.',
    },
    silicon: {
      ru: 'Твой ум работает с точностью процессора последнего поколения. Эмоциональные искажения и бесполезные социальные тонкости отключены по умолчанию. У тебя крайне низкая толерантность к шуму и огромный потенциал гиперфокуса. Ты нативный архитектор систем, хотя люди иногда кажутся тебе плохо запрограммированными NPC.',
      en: 'Your mind runs with the precision of a next-gen processor. Emotional biases and useless social subtleties are disabled by default. You have very low noise tolerance and massive hyperfocus potential. You\'re a native systems architect, even if humans sometimes look like badly-programmed NPCs.',
      es: 'Tu mente opera con la precisión de un procesador de última generación. Los sesgos emocionales y las sutilezas sociales inútiles están desactivados por defecto. Tienes una tolerancia al ruido bajísima y un potencial de hiperenfoque masivo. Eres un arquitecto nativo de sistemas, aunque los humanos a veces te parezcan NPC mal programados.',
    },
  },
};

export const TESTS = [ADHD, DARK_TRIAD, ARCHETYPE_TEST, PSYCH_AGE, SILICON_MIND];

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

// Silicon Mind: sum points (0..2 per item), express as an optimization
// percentage of the maximum, and band it: 0-30% social, 31-65% adapted, 66-100% silicon.
export function scoreSilicon(test, answers) {
  let total = 0;
  answers.forEach((a) => { if (a != null) total += a; });
  const max = test.items.length * 2;
  const pct = Math.round((total / max) * 100);
  let band = 'social';
  if (pct >= 66) band = 'silicon';
  else if (pct >= 31) band = 'adapted';
  return { total, max, pct, band };
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

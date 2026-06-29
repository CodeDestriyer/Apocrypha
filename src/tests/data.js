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
  logo: '/FDAH1.png',
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
  logo: '/DARKTRIAD.jpg',
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

export const TESTS = [ADHD, DARK_TRIAD];

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

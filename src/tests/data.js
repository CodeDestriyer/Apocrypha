// Free, well-known psychological inventories. Items hand-translated.
// Mini-IPIP (Donnellan et al., 2006) — 20 items, 5-point Likert, public domain.
// Rosenberg Self-Esteem Scale (Rosenberg, 1965) — 10 items, 4-point Likert, free for research use.

export const LIKERT5 = {
  ru: ['Совсем не про меня', 'Скорее нет', 'Затрудняюсь', 'Скорее да', 'Точно про меня'],
  en: ['Strongly disagree', 'Disagree', 'Neither', 'Agree', 'Strongly agree'],
  es: ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'],
};

export const LIKERT4 = {
  ru: ['Совсем не согласен', 'Не согласен', 'Согласен', 'Полностью согласен'],
  en: ['Strongly disagree', 'Disagree', 'Agree', 'Strongly agree'],
  es: ['Muy en desacuerdo', 'En desacuerdo', 'De acuerdo', 'Muy de acuerdo'],
};

export const FREQ5 = {
  ru: ['Никогда', 'Редко', 'Иногда', 'Часто', 'Очень часто'],
  en: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'],
  es: ['Nunca', 'Rara vez', 'A veces', 'Con frecuencia', 'Muy a menudo'],
};

// trait codes: E=Extraversion, A=Agreeableness, C=Conscientiousness, N=Neuroticism, O=Openness/Intellect
// reverse: subtract from (max+1) before summing
export const BIG_FIVE = {
  id: 'big5',
  scale: 'likert5',
  max: 5,
  title: { ru: 'Большая Пятёрка (Mini-IPIP)', en: 'Big Five (Mini-IPIP)', es: 'Cinco Grandes (Mini-IPIP)' },
  short: {
    ru: '20 утверждений, ~3 минуты. Оцени, насколько каждое описывает тебя.',
    en: '20 statements, ~3 minutes. Rate how well each describes you.',
    es: '20 afirmaciones, ~3 minutos. Evalúa cuánto te describe cada una.',
  },
  items: [
    { trait: 'E', reverse: false, ru: 'Я — душа компании.',                       en: 'I am the life of the party.',                          es: 'Soy el alma de la fiesta.' },
    { trait: 'A', reverse: false, ru: 'Сочувствую переживаниям других.',           en: "I sympathize with others' feelings.",                  es: 'Simpatizo con los sentimientos de los demás.' },
    { trait: 'C', reverse: false, ru: 'Делаю дела сразу, не откладывая.',          en: 'I get chores done right away.',                        es: 'Hago las tareas de inmediato.' },
    { trait: 'N', reverse: false, ru: 'У меня часто меняется настроение.',         en: 'I have frequent mood swings.',                         es: 'Tengo cambios de humor frecuentes.' },
    { trait: 'O', reverse: false, ru: 'У меня живое воображение.',                 en: 'I have a vivid imagination.',                          es: 'Tengo una imaginación viva.' },
    { trait: 'E', reverse: true,  ru: 'Я не очень разговорчив.',                   en: "I don't talk a lot.",                                  es: 'No hablo mucho.' },
    { trait: 'A', reverse: true,  ru: 'Меня мало интересуют чужие проблемы.',      en: "I am not interested in other people's problems.",      es: 'No me interesan los problemas de los demás.' },
    { trait: 'C', reverse: true,  ru: 'Часто забываю класть вещи на место.',       en: 'I often forget to put things back in their proper place.', es: 'Olvido poner las cosas en su lugar.' },
    { trait: 'N', reverse: true,  ru: 'Большую часть времени я расслаблен.',       en: 'I am relaxed most of the time.',                       es: 'Estoy relajado la mayor parte del tiempo.' },
    { trait: 'O', reverse: true,  ru: 'Меня не интересуют абстрактные идеи.',      en: 'I am not interested in abstract ideas.',               es: 'No me interesan las ideas abstractas.' },
    { trait: 'E', reverse: false, ru: 'На вечеринках общаюсь с разными людьми.',   en: 'I talk to a lot of different people at parties.',      es: 'Hablo con mucha gente en las fiestas.' },
    { trait: 'A', reverse: false, ru: 'Чувствую эмоции других людей.',             en: "I feel others' emotions.",                             es: 'Siento las emociones de los demás.' },
    { trait: 'C', reverse: false, ru: 'Люблю порядок.',                            en: 'I like order.',                                        es: 'Me gusta el orden.' },
    { trait: 'N', reverse: false, ru: 'Меня легко расстроить.',                    en: 'I get upset easily.',                                  es: 'Me molesto fácilmente.' },
    { trait: 'O', reverse: true,  ru: 'Мне сложно понимать абстрактные идеи.',     en: 'I have difficulty understanding abstract ideas.',      es: 'Me cuesta entender ideas abstractas.' },
    { trait: 'E', reverse: true,  ru: 'Стараюсь держаться в тени.',                en: 'I keep in the background.',                            es: 'Me mantengo en segundo plano.' },
    { trait: 'A', reverse: true,  ru: 'Меня не очень интересуют другие.',          en: 'I am not really interested in others.',                es: 'Realmente no me interesan los demás.' },
    { trait: 'C', reverse: true,  ru: 'Часто всё запутываю и порчу.',              en: 'I make a mess of things.',                             es: 'Hago un desastre con las cosas.' },
    { trait: 'N', reverse: true,  ru: 'Я редко чувствую грусть.',                  en: 'I seldom feel blue.',                                  es: 'Rara vez me siento triste.' },
    { trait: 'O', reverse: true,  ru: 'У меня небогатое воображение.',             en: 'I do not have a good imagination.',                    es: 'No tengo buena imaginación.' },
  ],
  traits: {
    E: { ru: 'Экстраверсия',     en: 'Extraversion',     es: 'Extraversión' },
    A: { ru: 'Доброжелательность', en: 'Agreeableness', es: 'Amabilidad' },
    C: { ru: 'Добросовестность', en: 'Conscientiousness', es: 'Responsabilidad' },
    N: { ru: 'Нейротизм',        en: 'Neuroticism',      es: 'Neuroticismo' },
    O: { ru: 'Открытость опыту', en: 'Openness/Intellect', es: 'Apertura' },
  },
  traitDesc: {
    E: {
      ru: 'Энергия, общительность, стремление к стимулам и взаимодействию.',
      en: 'Energy, sociability, drive for stimulation and interaction.',
      es: 'Energía, sociabilidad, búsqueda de estímulos e interacción.',
    },
    A: {
      ru: 'Тёплость, эмпатия, склонность к сотрудничеству и доверию.',
      en: 'Warmth, empathy, cooperation and trust.',
      es: 'Calidez, empatía, cooperación y confianza.',
    },
    C: {
      ru: 'Самодисциплина, организованность, ориентация на цели.',
      en: 'Self-discipline, organization, goal orientation.',
      es: 'Autodisciplina, organización, orientación a metas.',
    },
    N: {
      ru: 'Эмоциональная чувствительность и реактивность на стресс.',
      en: 'Emotional sensitivity and reactivity to stress.',
      es: 'Sensibilidad emocional y reactividad al estrés.',
    },
    O: {
      ru: 'Любопытство, воображение, интерес к идеям и новому.',
      en: 'Curiosity, imagination, interest in ideas and novelty.',
      es: 'Curiosidad, imaginación, interés por ideas y novedades.',
    },
  },
};

export const ROSENBERG = {
  id: 'rosenberg',
  scale: 'likert4',
  max: 4,
  title: { ru: 'Шкала самооценки Розенберга', en: 'Rosenberg Self-Esteem Scale', es: 'Escala de Autoestima de Rosenberg' },
  short: {
    ru: '10 утверждений, ~2 минуты. Оценивает общее самоотношение.',
    en: '10 statements, ~2 minutes. Measures global self-worth.',
    es: '10 afirmaciones, ~2 minutos. Mide la autoestima global.',
  },
  items: [
    { reverse: false, ru: 'В целом я доволен собой.',                                       en: 'On the whole, I am satisfied with myself.',                              es: 'En general, estoy satisfecho conmigo mismo.' },
    { reverse: true,  ru: 'Временами я думаю, что я никчёмен.',                             en: 'At times I think I am no good at all.',                                  es: 'A veces pienso que no sirvo para nada.' },
    { reverse: false, ru: 'Я чувствую, что у меня есть ряд хороших качеств.',               en: 'I feel that I have a number of good qualities.',                         es: 'Siento que tengo varias buenas cualidades.' },
    { reverse: false, ru: 'Я способен делать многое не хуже большинства людей.',            en: 'I am able to do things as well as most other people.',                   es: 'Soy capaz de hacer las cosas tan bien como la mayoría.' },
    { reverse: true,  ru: 'Я чувствую, что мне особо нечем гордиться.',                     en: 'I feel I do not have much to be proud of.',                              es: 'Siento que no tengo mucho de qué estar orgulloso.' },
    { reverse: true,  ru: 'Иногда я определённо чувствую себя бесполезным.',                en: 'I certainly feel useless at times.',                                     es: 'A veces me siento ciertamente inútil.' },
    { reverse: false, ru: 'Я чувствую, что я человек ценный, не хуже других.',              en: 'I feel that I am a person of worth, at least on an equal plane with others.', es: 'Siento que soy una persona valiosa, al menos igual que los demás.' },
    { reverse: true,  ru: 'Я бы хотел больше уважать себя.',                                en: 'I wish I could have more respect for myself.',                           es: 'Desearía tener más respeto por mí mismo.' },
    { reverse: true,  ru: 'В целом я склонен считать себя неудачником.',                    en: 'All in all, I am inclined to feel that I am a failure.',                 es: 'En general, tiendo a pensar que soy un fracaso.' },
    { reverse: false, ru: 'Я отношусь к себе положительно.',                                en: 'I take a positive attitude toward myself.',                              es: 'Tengo una actitud positiva hacia mí mismo.' },
  ],
  // Scoring: 0..3 per item after reverse, total 0..30.
  // <15 = low, 15-25 = normal, >25 = high.
  bands: {
    low:    { ru: 'Низкая самооценка',   en: 'Low self-esteem',    es: 'Autoestima baja' },
    normal: { ru: 'Нормальная самооценка', en: 'Normal self-esteem', es: 'Autoestima normal' },
    high:   { ru: 'Высокая самооценка',  en: 'High self-esteem',   es: 'Autoestima alta' },
  },
  bandDesc: {
    low: {
      ru: 'Стоит обратить внимание на отношение к себе. Это не диагноз, а сигнал.',
      en: 'Worth paying attention to how you view yourself. Not a diagnosis — a signal.',
      es: 'Vale la pena prestar atención a cómo te ves. No es un diagnóstico, es una señal.',
    },
    normal: {
      ru: 'Здоровый уровень самоотношения.',
      en: 'A healthy level of self-regard.',
      es: 'Un nivel saludable de autoestima.',
    },
    high: {
      ru: 'Уверенное и позитивное самоотношение.',
      en: 'Confident, positive self-regard.',
      es: 'Autoestima positiva y segura.',
    },
  },
};

// ADHD self-report screening. Adapted from the WHO ASRS / DSM-5 ADHD symptom
// list — 18 clinical items plus two everyday-life impulsivity items, 5-point
// frequency scale (0..4), total 0..80. Educational use only.
export const ADHD = {
  id: 'adhd',
  scale: 'freq5',
  max: 5,
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

export const TESTS = [BIG_FIVE, ROSENBERG, ADHD];

export function scoreBigFive(test, answers) {
  const sums = { E: 0, A: 0, C: 0, N: 0, O: 0 };
  const counts = { E: 0, A: 0, C: 0, N: 0, O: 0 };
  test.items.forEach((item, i) => {
    const raw = answers[i];
    if (raw == null) return;
    const v = item.reverse ? (test.max + 1 - raw) : raw;
    sums[item.trait] += v;
    counts[item.trait] += 1;
  });
  return Object.fromEntries(Object.entries(sums).map(([k, s]) => {
    const c = counts[k] || 1;
    return [k, { sum: s, max: c * test.max, pct: Math.round((s / (c * test.max)) * 100) }];
  }));
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

export function scoreRosenberg(test, answers) {
  let total = 0;
  test.items.forEach((item, i) => {
    const raw = answers[i];
    if (raw == null) return;
    // shift to 0..3
    const v = item.reverse ? (test.max - raw) : (raw - 1);
    total += v;
  });
  const max = test.items.length * 3;
  let band = 'normal';
  if (total < 15) band = 'low';
  else if (total > 25) band = 'high';
  return { total, max, band };
}

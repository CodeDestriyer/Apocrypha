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

export const TESTS = [BIG_FIVE, ROSENBERG];

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

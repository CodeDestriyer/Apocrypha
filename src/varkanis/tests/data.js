// ADHD self-report screening. 18 items, 3-point scale. Adapted from WHO ASRS v1.1 /
// DSM-5 ADHD symptom list. Educational use only.

export const FREQ5 = ['Nunca', 'Rara vez', 'A veces', 'Con frecuencia', 'Muy a menudo'];

// Order matters: answer value is index+1, scoreAdhd maps 1/2/3 → 2/1/0 points.
export const AGREE3 = ['De acuerdo', 'No lo sé', 'En desacuerdo'];

export const AGREE5 = ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'];

export const ADHD = {
  id: 'adhd',
  scale: 'agree3',
  max: 3,
  logo: '/fghd-logo.jpg',
  author: 'Varkanis',
  // Final result image, one per probability band (low/mid/high).
  images: {
    low:  '/fdah-bajo.jpg',
    mid:  '/fdah-medio.jpg',
    high: '/fdah-alto.jpg',
  },
  title: 'Cribado de TDAH',
  short: '18 preguntas, ~3 minutos. Responde sobre los últimos 6 meses.',
  // subscale codes: I=Inattention, H=Hyperactivity, P=Impulsivity.
  // core: ASRS Part A item — weight ×2 and counts toward the 4-of-6 rule.
  items: [
    { core: true, subscale: 'I', text: '¿Dejas los proyectos tirados al 95% porque los "últimos detalles" te dan pereza mental pura?' },
    { core: true, subscale: 'I', text: '¿Tu vida es un bucle entre planificar con furia en agendas que abandonas a los tres días y vivir rodeado de un caos organizado (o no tan organizado)?' },
    { core: true, subscale: 'I', text: '¿Te da terror mirar el calendario porque sabes que hay al menos tres promesas u obligaciones importantes que ya mandaste al olvido?' },
    { core: true, subscale: 'I', text: '¿Pospones lo importante hasta que el margen de tiempo es tan ridículo que solo el pánico puro te hace sacarlo adelante?' },
    { subscale: 'I', text: '¿Dejas las cosas en sitios tan "lógicos" en el momento que luego tu yo del futuro maldice a gritos a ese "yo del pasado"?' },
    { subscale: 'I', text: 'Cuando intentas concentrarte, ¿cualquier mínimo ruido, mosca o movimiento ajeno tiene el poder de borrar por completo el hilo de tus pensamientos?' },
    { subscale: 'I', text: '¿Necesitas obligatoriamente poner música, un podcast o un vídeo de fondo para poder arrancar o aguantar en tareas que no cambian de ritmo?' },

    { core: true, subscale: 'H', text: '¿Sueles mantener un pequeño movimiento repetitivo (con los pies, los dedos o manipulando un objeto) durante los ratos largos en los que estás sentado?' },
    { subscale: 'H', text: '¿Buscas cualquier excusa para levantarte, estirar las piernas o cambiar de postura cuando llevas un rato inmovilizado en una reunión o clase?' },
    { core: true, subscale: 'H', text: '¿Te cuesta notar una relajación física plena, como si tu cuerpo mantuviera un nivel constante de tensión o activación incluso en momentos de descanso?' },
    { subscale: 'H', text: '¿Prefieres que tu tiempo libre o tus aficiones tengan un componente activo o productivo en lugar de limitarte a desconectar por completo?' },
    { subscale: 'H', text: '¿Funcionas mejor bajo un ritmo constante de ocupaciones que te obliguen a saltar de una tarea a otra durante el día?' },
    { subscale: 'H', text: '¿Tiendes a acaparar la conversación o a gesticular y hablar con mucha intensidad cuando estás enfrascado en un tema que te interesa?' },

    { subscale: 'P', text: '¿A veces te adelantas a los demás y acabas sus frases porque no tienes paciencia para escucharles hasta el final?' },
    { subscale: 'P', text: '¿Esperar tu turno te parece una eternidad, incluso cuando sabes que no te queda otra?' },
    { subscale: 'P', text: '¿Te cuesta mantenerte al margen y no meterte en conversaciones o asuntos que no van contigo?' },
    { subscale: 'P', text: '¿A menudo te dejas llevar por el impulso y haces cosas sin pararte a pensar en lo que podría pasar después?' },
    { subscale: 'P', text: '¿Pierdes la paciencia rápidamente cuando algo o alguien te hace esperar más de lo que te gustaría?' },
  ],
  subscales: {
    I: 'Inatención',
    H: 'Hiperactividad',
    P: 'Impulsividad',
  },
  bands: {
    low:  'Probabilidad baja',
    mid:  'Probabilidad media',
    high: 'Probabilidad alta',
  },
  bandDesc: {
    low: 'Síntomas dentro de lo normal. Es poco probable un TDAH.',
    mid: 'Hay señales de falta de atención o impulsividad, posiblemente vinculadas al estrés o al cansancio.',
    high: 'Síntomas marcados. Conviene consultar a un especialista.',
  },
  // Product card shown instead of the "Listo" button on these bands.
  upsell: {
    bands: ['mid', 'high'],
    title: 'Atención Bajo Control',
    short: 'Mini-curso: técnicas concretas para enfocar la atención, organizarte y dejar de posponer.',
    price: '$3',
    cover: '/Atencion-bajo-control-logo.webp',
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
  // Final result image: by dominant subscale, or 'balanced' when the three are close.
  images: {
    M: '/mackiavelismo-triad.jpg',
    N: '/narcissitstic-triad.jpg',
    P: '/psicopato-triad.jpg',
    balanced: '/equilibrado-triad.jpg',
  },
  title: 'Tríada Oscura',
  short: '18 preguntas, ~3 minutos. Tres rasgos: maquiavelismo, narcisismo y psicopatía subclínica.',
  // subscale codes: M=Machiavellianism, N=Narcissism, P=Psychopathy
  items: [
    { subscale: 'M', text: 'Es inteligente colaborar con la gente solo cuando te conviene a ti personalmente.' },
    { subscale: 'M', text: 'Para lograr un objetivo importante, se puede y se debe manipular a los demás.' },
    { subscale: 'M', text: 'Es mejor no revelar tus verdaderos motivos ni tus secretos, incluso a los más cercanos.' },
    { subscale: 'M', text: 'La mayoría de la gente es ingenua por naturaleza, por lo que es fácil de dirigir.' },
    { subscale: 'M', text: 'Planifico cada paso con cuidado para obtener el máximo beneficio en el futuro.' },
    { subscale: 'M', text: 'Solo vale la pena decir la verdad si esto no perjudica tus propios intereses.' },

    { subscale: 'N', text: 'Sé que soy una persona especial y merezco más que la gente común.' },
    { subscale: 'N', text: 'Necesito ser el centro de atención y recibir el reconocimiento de los demás.' },
    { subscale: 'N', text: 'He nacido para liderar a los demás y controlar los procesos.' },
    { subscale: 'N', text: 'Me molesta profundamente cuando la gente no nota mis talentos o mis éxitos.' },
    { subscale: 'N', text: 'Me agrada la idea de que otras personas envidien mi estatus o mis logros.' },
    { subscale: 'N', text: 'Merezco un trato preferencial sin tener que dar explicaciones a nadie.' },

    { subscale: 'P', text: 'Los problemas, las lágrimas y los dramas de los demás casi no me importan.' },
    { subscale: 'P', text: 'Me aburro muy rápido, por lo que suelo buscar el riesgo y las emociones fuertes.' },
    { subscale: 'P', text: 'Si alguien se interpone en mi camino, puedo llegar a ser completamente despiadado.' },
    { subscale: 'P', text: 'Rara vez siento culpa o remordimiento si mis acciones han perjudicado a alguien.' },
    { subscale: 'P', text: 'Las reglas, las leyes y las normas sociales están hechas para la masa, no para mí.' },
    { subscale: 'P', text: 'Puedo mentirle a alguien a la cara de forma muy convincente sin sentir ningún malestar.' },
  ],
  subscales: {
    M: 'Maquiavelismo',
    N: 'Narcisismo',
    P: 'Psicopatía',
  },
  // Per-subscale interpretation (0..24): low ≤8, mid 9-16, high ≥17
  subscaleBands: {
    M: {
      low:  'Directo, confiado',
      mid:  'Pragmático',
      high: 'Manipulador cínico, estratega',
    },
    N: {
      low:  'Modesto, inseguro',
      mid:  'Autoestima saludable',
      high: 'Egocéntrico, grandioso',
    },
    P: {
      low:  'Alta empatía, prudente',
      mid:  'Sangre fría',
      high: 'Impulsivo, audaz, duro',
    },
  },
  // Full per-level interpretation, one line per band — the stern verdict text.
  subscaleDesc: {
    M: {
      low:  'Juegas con las cartas sobre la mesa. Dices lo que piensas y esperas lo mismo; el juego calculado no es lo tuyo.',
      mid:  'Lees los motivos ajenos y sabes posicionarte, sin convertir el cálculo frío en un modo de vida.',
      high: 'Piensas en jugadas. La información es moneda, la confianza una herramienta y cada paso sirve a tu objetivo.',
    },
    N: {
      low:  'No necesitas aplausos para sentirte tú mismo; a veces, a costa de tu propio valor.',
      mid:  'Conoces tu valor sin grandiosidad. El reconocimiento agrada, pero no te gobierna.',
      high: 'Eres el centro de tu propio universo. La atención es combustible y la mediocridad ajena te irrita.',
    },
    P: {
      low:  'El dolor ajeno te alcanza. La prudencia y la conciencia sujetan el volante más que el impulso.',
      mid:  'Mantienes la cabeza fría bajo presión, sin apagar las emociones por completo.',
      high: 'Los frenos apenas responden. El riesgo te tienta, la culpa calla y los obstáculos se retiran sin titubear.',
    },
  },
};

// Personality archetypes — 24 items, 5-point agree scale (0..4), grouped into
// 12 archetype pairs (max 8 per archetype). Top archetype is the Core, second
// is the Shadow. Inventory-style, not a clinical instrument.
export const ARCHETYPES = {
  warrior:    'El Guerrero',
  iconoclast: 'El Iconoclasta',
  alchemist:  'El Alquimista',
  sovereign:  'El Soberano',
  visionary:  'El Visionario',
  protector:  'El Protector',
  analyst:    'El Analista',
  seeker:     'El Buscador',
  idealist:   'El Idealista',
  realist:    'El Realista',
  aesthetic:  'El Estético',
  trickster:  'El Embaucador',
};

export const ARCHETYPE_DESC = {
  warrior: 'Disciplina, resistencia, la lucha como modo de vida. Forja la fuerza a través de la resistencia.',
  iconoclast: 'Rompe dogmas y sistemas obsoletos. Progreso mediante la destrucción.',
  alchemist: 'Transforma el caos en función. Cambia la realidad mediante el conocimiento de leyes ocultas.',
  sovereign: 'Construye sistemas, mantiene la estructura. Asume la carga de decisiones difíciles.',
  visionary: 'Crea lo fundamentalmente nuevo. Ve el futuro antes que los demás.',
  protector: 'Fuerza para la seguridad de los suyos. Guardián pragmático de recursos y estabilidad.',
  analyst: 'Lógica, datos, esencia verdadera. Los sentimientos son ruido, los hechos son señal.',
  seeker: 'Libertad y nuevos horizontes. No soporta los marcos rígidos ni quedarse en un sitio.',
  idealist: 'Pureza del concepto, lealtad a los principios. La simplicidad como forma superior.',
  realist: 'Cálculo frío, sin ilusiones. Se apoya en sistemas y comunidades que funcionan.',
  aesthetic: 'Calidad, profundidad y belleza. Desprecia lo barato y lo falso.',
  trickster: 'Humor, ironía, provocación. Ve un juego donde otros ven reglas.',
};

export const ARCHETYPE_TEST = {
  id: 'archetypes',
  scale: 'agree5',
  max: 5,
  logo: '/arqetipos.jpg',
  author: 'Varkanis',
  title: 'Arquetipos de personalidad',
  short: '24 afirmaciones, ~3 minutos. Encuentra tu Arquetipo-Núcleo y tu Sombra.',
  coreLabel:   'Núcleo',
  shadowLabel: 'Sombra',
  items: [
    { archetype: 'warrior',    text: 'Estoy dispuesto a soportar la incomodidad extrema y el dolor para alcanzar mis objetivos.' },
    { archetype: 'iconoclast', text: 'Las reglas y tradiciones están hechas para romperse si frenan el progreso.' },
    { archetype: 'alchemist',  text: 'Creo que entender las leyes fundamentales de la naturaleza y la mente otorga un poder ilimitado.' },
    { archetype: 'sovereign',  text: 'El control, la estructura y la jerarquía son necesarios para gestionar cualquier proceso con eficacia.' },
    { archetype: 'visionary',  text: 'Para mí lo más importante es crear algo fundamentalmente nuevo y tangible que no existiera antes.' },
    { archetype: 'protector',  text: 'La fuerza es necesaria para proteger los recursos propios y garantizar la seguridad de los cercanos.' },
    { archetype: 'analyst',    text: 'Los hechos objetivos, los datos y la lógica siempre son más importantes que los sentimientos subjetivos.' },
    { archetype: 'seeker',     text: 'Las limitaciones y los marcos rígidos me asfixian; necesito autonomía de forma vital.' },
    { archetype: 'idealist',   text: 'Creo que todo en el mundo se puede reducir a la pureza absoluta, la simplicidad y la eficiencia perfecta.' },
    { archetype: 'realist',    text: 'Tengo los pies en la tierra y evalúo el mundo sin ilusiones, apoyándome en el cálculo frío.' },
    { archetype: 'aesthetic',  text: 'La estética, la calidad y la profundidad de percepción definen el valor de la vida y de cualquier producto.' },
    { archetype: 'trickster',  text: 'El humor, la ironía y la provocación social son las mejores herramientas para deconstruir la estupidez ajena.' },

    { archetype: 'warrior',    text: 'La lucha y superar obstáculos me motivan más que un triunfo tranquilo.' },
    { archetype: 'iconoclast', text: 'Me alegra sinceramente destruir dogmas sociales obsoletos e ineficientes.' },
    { archetype: 'alchemist',  text: 'Me gusta transformar el caos en conceptos funcionales y cambiar la realidad a mi alrededor.' },
    { archetype: 'sovereign',  text: 'Asumo sin dudar la responsabilidad de tomar decisiones difíciles cuando otros se acobardan.' },
    { archetype: 'visionary',  text: 'Constantemente invento nuevos sistemas, herramientas o algoritmos, optimizando el mundo.' },
    { archetype: 'protector',  text: 'Enfoco los riesgos de manera pragmática y siempre cuido la estabilidad de mi "sistema".' },
    { archetype: 'analyst',    text: 'Paso mucho tiempo analizando los detalles para comprender la verdadera esencia de las cosas.' },
    { archetype: 'seeker',     text: 'Busco constantemente nuevos horizontes, conocimientos y experiencias, sin quedarme mucho tiempo en un solo lugar.' },
    { archetype: 'idealist',   text: 'Ser fiel a mis principios básicos y la pureza del concepto son más importantes que el beneficio inmediato.' },
    { archetype: 'realist',    text: 'Formar parte de una comunidad funcional y entender sus leyes es la clave para una supervivencia estable.' },
    { archetype: 'aesthetic',  text: 'Busco conexiones exclusivas con personas y cosas, despreciando lo barato y lo falso.' },
    { archetype: 'trickster',  text: 'La vida es un juego, y hay que saber usar las debilidades de los demás por diversión o beneficio.' },
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
  // Final result image, one per phase band.
  images: {
    reactive: '/edad-bajo.jpg',
    critical: '/edad-medio.jpg',
    stoic:    '/edad-alto.jpg',
  },
  title: 'Edad Psicológica',
  short: '20 preguntas, ~4 minutos. Descubre tu edad psicológica: un número concreto de años.',
  items: [
    {
      text: 'Cuando cometo un error grave, mi primera reacción es:',
      options: [
        { points: 1, text: 'Buscar a quién culpar o justificarme internamente.' },
        { points: 2, text: 'Sentirme culpable y sumirme en la autocrítica.' },
        { points: 3, text: 'Analizar el fallo como un dato objetivo para corregir el sistema.' },
      ],
    },
    {
      text: 'La idea de la muerte o del fin del tiempo me produce:',
      options: [
        { points: 1, text: 'Un miedo abstracto que prefiero ignorar.' },
        { points: 2, text: 'Ansiedad e incomodidad profunda.' },
        { points: 3, text: 'Una aceptación fría que uso para priorizar mis objetivos diarios.' },
      ],
    },
    {
      text: 'En una discusión, si mi interlocutor argumenta con puras emociones, yo:',
      options: [
        { points: 1, text: 'Me altero y respondo con la misma intensidad emocional.' },
        { points: 2, text: 'Me callo por frustración y me guardo el resentimiento.' },
        { points: 3, text: 'Desconecto emocionalmente y analizo la conversación desde fuera.' },
      ],
    },
    {
      text: 'El concepto de "éxito" para mí se define como:',
      options: [
        { points: 1, text: 'El reconocimiento externo, el estatus y la aprobación de los demás.' },
        { points: 2, text: 'La realización de mis ideales y expectativas internas.' },
        { points: 3, text: 'La autonomía total y el control absoluto sobre mi tiempo y recursos.' },
      ],
    },
    {
      text: 'Cuando alguien me critica de forma destructiva:',
      options: [
        { points: 1, text: 'Me ofendo y busco la forma de contraatacar.' },
        { points: 2, text: 'Dudo de mí mismo y me hundo en la duda.' },
        { points: 3, text: 'Evalúo si hay un 1% de verdad útil; si no, lo desecho sin emociones.' },
      ],
    },
    {
      text: 'Mis planes para los próximos 5-10 años son:',
      options: [
        { points: 1, text: 'Abstractos e idílicos, basados en deseos más que en pasos reales.' },
        { points: 2, text: 'Estresantes, porque siento la presión de no lograr lo que se espera de mí.' },
        { points: 3, text: 'Flexibles pero estructurados, divididos en objetivos tácticos concretos.' },
      ],
    },
    {
      text: 'La soledad para mí es:',
      options: [
        { points: 1, text: 'Un vacío incómodo que intento llenar con ruido digital o redes sociales.' },
        { points: 2, text: 'Un refugio temporal para descansar del caos del mundo.' },
        { points: 3, text: 'Mi estado natural de alta productividad y orden mental.' },
      ],
    },
    {
      text: 'Frente a las tradiciones y normas impuestas por la sociedad:',
      options: [
        { points: 1, text: 'Las sigo por inercia o costumbre sin cuestionarlas.' },
        { points: 2, text: 'Rebelarme por el simple hecho de ir en contra del sistema.' },
        { points: 3, text: 'Las analizo pragmáticamente: si me son útiles, las uso; si no, las ignoro.' },
      ],
    },
    {
      text: 'Cuando recuerdo mis errores del pasado, siento:',
      options: [
        { points: 1, text: 'Vergüenza y ganas de borrar esos recuerdos.' },
        { points: 2, text: 'Nostalgia o arrepentimiento por las oportunidades perdidas.' },
        { points: 3, text: 'Gratitud fría, ya que son el coste pagado por mi optimización actual.' },
      ],
    },
    {
      text: 'La velocidad con la que cambio de opinión ante datos nuevos y verificados es:',
      options: [
        { points: 1, text: 'Lenta, me cuesta aceptar que estaba equivocado públicamente.' },
        { points: 2, text: 'Depende de cómo me afecte emocionalmente esa nueva verdad.' },
        { points: 3, text: 'Instantánea; no tengo apego a ideas obsoletas si la realidad demuestra lo contrario.' },
      ],
    },
    {
      text: 'Las relaciones humanas (amistad, pareja) las entiendo como:',
      options: [
        { points: 1, text: 'Una fuente de validación constante y compañía para no estar solo.' },
        { points: 2, text: 'Un intercambio de afecto, apoyo emocional y comprensión mutua.' },
        { points: 3, text: 'Una alianza estratégica basada en valores, respeto y crecimiento mutuo.' },
      ],
    },
    {
      text: 'Mi nivel de disciplina diaria depende de:',
      options: [
        { points: 1, text: 'Mi motivación momentánea y mi estado de ánimo al despertar.' },
        { points: 2, text: 'La presión externa o los plazos de entrega que tengo encima.' },
        { points: 3, text: 'Mi sistema de hábitos y compromisos conmigo mismo, sin importar cómo me sienta.' },
      ],
    },
    {
      text: 'Cuando veo el sufrimiento o el caos en las noticias del mundo:',
      options: [
        { points: 1, text: 'Me horrorizo y sufro empatía desmedida por horas.' },
        { points: 2, text: 'Intento ignorarlo conscientemente para proteger mi paz mental.' },
        { points: 3, text: 'Lo entiendo como parte de los procesos históricos y la naturaleza humana.' },
      ],
    },
    {
      text: 'El aburrimiento o la falta de estímulos inmediatos me genera:',
      options: [
        { points: 1, text: 'Ansiedad extrema y la necesidad urgente de consumir contenido rápido.' },
        { points: 2, text: 'Flojera y tendencia a procrastinar sin un rumbo claro.' },
        { points: 3, text: 'Espacio mental libre para pensar, planificar o simplemente observar.' },
      ],
    },
    {
      text: 'La autoridad de jefes, mentores o figuras públicas la evalúo según:',
      options: [
        { points: 1, text: 'Su posición, su estatus oficial o su carisma percibido.' },
        { points: 2, text: 'Lo bien o mal que me caigan a nivel personal.' },
        { points: 3, text: 'Sus resultados reales, sus competencias demostradas y la lógica de sus acciones.' },
      ],
    },
    {
      text: 'Si un plan importante se arruina por completo a última hora:',
      options: [
        { points: 1, text: 'Me bloqueo, me frustro y pospongo buscar una solución.' },
        { points: 2, text: 'Me lamento por la mala suerte y el esfuerzo desperdiciado.' },
        { points: 3, text: 'Entro en modo resolución de problemas y activo el plan de contingencia al instante.' },
      ],
    },
    {
      text: 'Gastar dinero en lujos o gratificación instantánea para mí es:',
      options: [
        { points: 1, text: 'Mi principal debilidad y forma de premiarme a menudo.' },
        { points: 2, text: 'Algo que me genera culpa posterior si no estaba planificado.' },
        { points: 3, text: 'Una decisión matemática calculada; priorizo la inversión en mi propio desarrollo.' },
      ],
    },
    {
      text: 'La opinión que el resto del mundo tiene sobre mis rarezas o estilo de vida:',
      options: [
        { points: 1, text: 'Me preocupa bastante y trato de camuflarlas para encajar.' },
        { points: 2, text: 'Me molesta, pero intento ignorarla con esfuerzo.' },
        { points: 3, text: 'Me resulta absolutamente irrelevante mientras no afecte mis planes.' },
      ],
    },
    {
      text: 'El concepto de "suerte" en mi vida diaria:',
      options: [
        { points: 1, text: 'Creo que juega un papel místico o el destino define las cosas.' },
        { points: 2, text: 'Es una variable injusta que suele favorecer a otros más que a mí.' },
        { points: 3, text: 'Es simplemente estadística y la intersección entre la preparación y la oportunidad.' },
      ],
    },
    {
      text: 'Al mirar mi evolución personal en el último año, siento que:',
      options: [
        { points: 1, text: 'Sigo siendo prácticamente la misma persona, con los mismos bucles.' },
        { points: 2, text: 'He cambiado mucho emocionalmente, pero me falta estructura.' },
        { points: 3, text: 'He rediseñado partes de mi mentalidad y optimizado mis procesos de toma de decisiones.' },
      ],
    },
  ],
  bands: {
    reactive: 'Juventud Reactiva',
    critical: 'Racionalidad Crítica',
    stoic:    'Estoicismo Sistémico',
  },
  bandDesc: {
    reactive: 'Tu mente está muy ligada a los estímulos rápidos de dopamina, la aprobación externa y las reacciones emocionales. Los sistemas de autocontrol aún son plásticos. Los errores se viven con dolor, no como datos fríos.',
    critical: 'El estándar de oro del pragmático. Entiendes el valor de los recursos y el tiempo, construyes límites personales y sabes desconectar las emociones por el bien de la tarea. Aparecen momentos de agotamiento por el intento férreo de controlarlo todo.',
    stoic: 'El máximo nivel de autonomía frente a la opinión social y el ruido externo. Una relación filosófica y fría con el caos, la muerte y los errores. El locus de control está por completo dentro. El posible inconveniente es una aislamiento emocional excesivo (alexitimia).',
  },
};

// Autism-spectrum / "Silicon Mind" self-report — 30 single-choice items.
// Each option carries points: a=0 (neurotypical, socially adapted), b=1
// (moderate analytical traits), c=2 (pure logical / high neurodivergence).
// Total 0..60 → optimization percentage. Educational, not a clinical diagnosis.
export const SILICON_MIND = {
  id: 'silicon-mind',
  scale: 'choice',
  logo: '/autist.jpg',
  author: 'Varkanis',
  // Final result image, one per band.
  images: {
    social:  '/autista-bajo.jpg',
    adapted: '/autista-medio.jpg',
    silicon: '/autista-alto.jpg',
  },
  title: 'Espectro Autista',
  short: '30 preguntas, ~5 minutos. Mide tu porcentaje de optimización neurodivergente.',
  items: [
    {
      text: 'Cuando alguien me cuenta un problema personal esperando apoyo emocional, yo:',
      options: [
        { points: 0, text: 'Empatizo de inmediato y busco reconfortarlo emocionalmente.' },
        { points: 1, text: 'Siento cierta incomodidad, pero intento decir las frases socialmente aceptadas.' },
        { points: 2, text: 'Actúo como ChatGPT: ignoro el drama y le ofrezco un árbol de decisiones con 3 soluciones lógicas.' },
      ],
    },
    {
      text: 'El contacto visual con personas que no son de mi confianza absoluta me resulta:',
      options: [
        { points: 0, text: 'Natural y necesario para conectar durante una charla.' },
        { points: 1, text: 'Un poco forzado; a veces tengo que recordarme conscientemente que debo mirar a los ojos.' },
        { points: 2, text: 'Una tortura innecesaria. Prefiero mirar a la pantalla, al suelo o fijar la vista en un punto infinito.' },
      ],
    },
    {
      text: 'Al entrar a un bar, restaurante o espacio de coworking con música alta y luces parpadeantes:',
      options: [
        { points: 0, text: 'Me adapto rápido y me concentro en lo mío sin problemas.' },
        { points: 1, text: 'Me molesta un poco, pero logro tolerarlo si la compañía vale la pena.' },
        { points: 2, text: 'Siento una sobrecarga sensorial inmediata; mi CPU mental se ralentiza y solo quiero huir.' },
      ],
    },
    {
      text: 'Si alguien me dice una frase irónica o un doble sentido sin cambiar el tono de voz:',
      options: [
        { points: 0, text: 'Capto el sarcasmo al instante por el contexto social.' },
        { points: 1, text: 'Tardo unos segundos en procesar si era un chiste o una afirmación real.' },
        { points: 2, text: 'Lo tomo de forma completamente literal y respondo con datos objetivos, dejando la situación incómoda.' },
      ],
    },
    {
      text: 'Mi relación con las rutinas diarias y los horarios es:',
      options: [
        { points: 0, text: 'Flexible; cambio de planes sobre la marcha sin que me afecte el humor.' },
        { points: 1, text: 'Organizada, pero puedo adaptarme si ocurre un imprevisto razonable.' },
        { points: 2, text: 'Sagrada. Si un cambio externo altera mi plan del día sin previo aviso, mi sistema operativo mental entra en cortocircuito.' },
      ],
    },
    {
      text: 'Cuando descubro un nuevo tema que me interesa (tecnología, historia, un framework, etc.):',
      options: [
        { points: 0, text: 'Leo un par de artículos, me informo por encima y paso a otra cosa.' },
        { points: 1, text: 'Le dedico unos días de lectura intensa en mis ratos libres.' },
        { points: 2, text: 'Entro en hiperenfoque masivo: paso 72 horas sin dormir, devorando documentación, foros y bases de datos hasta saber más que los creadores.' },
      ],
    },
    {
      text: 'Las llamadas telefónicas sorpresa de números desconocidos o conocidos son:',
      options: [
        { points: 0, text: 'Algo normal que respondo al instante sin pensarlo.' },
        { points: 1, text: 'Algo molesto; prefiero que me avisen antes por mensaje.' },
        { points: 2, text: 'Una agresión directa a mi paz mental. Dejo que suene y luego analizo si realmente merece un texto de respuesta.' },
      ],
    },
    {
      text: 'Frente a las texturas de la ropa (etiquetas que raspan, telas sintéticas, calcetines desalineados):',
      options: [
        { points: 0, text: 'Ni me doy cuenta de que están ahí la mayor parte del tiempo.' },
        { points: 1, text: 'Me incomodan un poco, pero me acostumbro a los pocos minutos.' },
        { points: 2, text: 'Son una distracción insoportable que arruina mi enfoque hasta que me cambio de ropa o arranco la etiqueta.' },
      ],
    },
    {
      text: 'En las conversaciones grupales ("small talk" o charlas de ascensor sobre el clima):',
      options: [
        { points: 0, text: 'Participo de forma fluida y disfruto del intercambio social ligero.' },
        { points: 1, text: 'Las tolero haciendo un esfuerzo consciente por parecer simpático.' },
        { points: 2, text: 'Las considero una pérdida absoluta de ancho de banda. No entiendo por qué la gente gasta saliva en datos irrelevantes.' },
      ],
    },
    {
      text: 'Cuando me apasiona un tema y empiezo a hablar de él con otra persona:',
      options: [
        { points: 0, text: 'Monitorizo sus reacciones y cambio de tema si noto que se aburre.' },
        { points: 1, text: 'Me emociono, pero intento controlarme para no monopolizar la charla.' },
        { points: 2, text: 'Suelto un monólogo estructurado de 40 minutos sin darme cuenta de que mi interlocutor está mirando el reloj o buscando una salida.' },
      ],
    },
    {
      text: 'El orden de los objetos en mi escritorio o en mi entorno digital (archivos, Notion, código):',
      options: [
        { points: 0, text: 'Bastante caótico, pero sé encontrar las cosas dentro de mi desorden.' },
        { points: 1, text: 'Limpio y estándar, lo normal para trabajar bien.' },
        { points: 2, text: 'Milimétrico y obsesivo. Si alguien me mueve un icono del escritorio o un objeto de mi mesa, lo noto al instante y me genera rechazo.' },
      ],
    },
    {
      text: 'La comida para mí se define principalmente como:',
      options: [
        { points: 0, text: 'Una experiencia social, un placer culinario y variedad de sabores.' },
        { points: 1, text: 'Nutrición necesaria que intento que sea agradable.' },
        { points: 2, text: 'Combustible para el organismo. Prefiero comer exactamente lo mismo todos los días si eso me ahorra fatiga de decisión y respeta mis texturas seguras.' },
      ],
    },
    {
      text: 'Cuando camino por la calle, mi mente suele estar concentrada en:',
      options: [
        { points: 0, text: 'Observar a la gente, las tiendas y disfrutar del paisaje urbano.' },
        { points: 1, text: 'Pensar en mis pendientes del día de forma general.' },
        { points: 2, text: 'Contar baldosas, analizar patrones geométricos en los edificios o calcular la velocidad óptima para llegar a mi destino.' },
      ],
    },
    {
      text: 'Los ruidos repetitivos de fondo (el tic-tac de un reloj, alguien masticando, un aire acondicionado viejo):',
      options: [
        { points: 0, text: 'Mi cerebro los filtra automáticamente; ni los escucho.' },
        { points: 1, text: 'Los noto al principio, pero luego logro ignorarlos si me concentro en mi tarea.' },
        { points: 2, text: 'Se clavan en mi cerebro como agujas. Es imposible concentrarme sin auriculares con cancelación de ruido.' },
      ],
    },
    {
      text: 'Hacer "networking" o asistir a eventos sociales para conocer gente nueva me resulta:',
      options: [
        { points: 0, text: 'Estimulante; me recarga de energía y nuevas ideas.' },
        { points: 1, text: 'Un mal necesario para el negocio que sé ejecutar con esfuerzo.' },
        { points: 2, text: 'Un drenaje masivo de batería social. Necesito tres días de aislamiento total en mi cueva tecnológica para recuperarme.' },
      ],
    },
    {
      text: 'Cuando la gente expresa sus emociones llorando o gritando en mi presencia:',
      options: [
        { points: 0, text: 'Siento el impulso de abrazarlos y me contagio de su estado emocional.' },
        { points: 1, text: 'Sé qué gestos hacer para mostrar simpatía, aunque por dentro esté pensando en qué hacer.' },
        { points: 2, text: 'Me quedo congelado procesando la situación como un error de sintaxis. No sé qué hacer con mis manos ni qué decir.' },
      ],
    },
    {
      text: 'Mi habilidad para detectar patrones lógicos, errores en líneas de código o inconsistencias en un sistema es:',
      options: [
        { points: 0, text: 'Normal, como la de cualquiera con un poco de entrenamiento.' },
        { points: 1, text: 'Buena; suelo ver fallos que a otros se les escapan por encima.' },
        { points: 2, text: 'Casi paranormal. Los errores saltan a mi vista como si brillaran en la pantalla antes de que termine de leer.' },
      ],
    },
    {
      text: 'Prefiero comunicarme con clientes, socios o amigos a través de:',
      options: [
        { points: 0, text: 'Llamadas de voz o videollamadas; es más humano y rápido.' },
        { points: 1, text: 'Mensajes de texto largos o notas de audio controladas.' },
        { points: 2, text: 'Texto escrito estructurado, preferiblemente con viñetas, markdown y sin rodeos emocionales.' },
      ],
    },
    {
      text: 'Cuando era niño/adolescente, mis pasatiempos e intereses eran:',
      options: [
        { points: 0, text: 'Los mismos que los del resto de niños de mi edad (juegos colectivos, salir a la calle).' },
        { points: 1, text: 'Una mezcla entre juegos comunes y algunas obsesiones solitarias.' },
        { points: 2, text: 'Coleccionar datos específicos, clasificar objetos por colores/tamaños o pasar horas obsesionado con un solo videojuego complejo o libro técnico.' },
      ],
    },
    {
      text: 'La forma en que planifico mis proyectos o código se basa en:',
      options: [
        { points: 0, text: 'Ir haciendo y resolver los problemas según vayan surgiendo.' },
        { points: 1, text: 'Una lista de tareas generales con fechas límite flexibles.' },
        { points: 2, text: 'Un mapa mental hiperdetallado con todas las dependencias lógicas y casos de fallo posibles antes de picar la primera línea.' },
      ],
    },
    {
      text: 'Si estoy concentrado en una tarea compleja en mi ordenador y alguien me interrumpe para hacerme una pregunta simple:',
      options: [
        { points: 0, text: 'Respondo amablemente y retomo mi trabajo sin perder el ritmo.' },
        { points: 1, text: 'Me molesta un poco, pero respondo y tardo unos minutos en volver a enfocarme.' },
        { points: 2, text: 'Siento una ira fría y profunda porque acaban de tirar abajo un castillo de naipes conceptual que tardé dos horas en construir en mi cabeza.' },
      ],
    },
    {
      text: 'El concepto de "mentiras piadosas" (decirle a alguien que su ropa le queda bien solo por educación):',
      options: [
        { points: 0, text: 'Lo veo genial y necesario para que la sociedad funcione sin fricciones.' },
        { points: 1, text: 'Lo uso cuando no quiero generar conflictos innecesarios, aunque no me guste.' },
        { points: 2, text: 'Me parece una estupidez ineficiente. Prefiero la verdad cruda; la optimización real requiere datos honestos, no falsos halagos.' },
      ],
    },
    {
      text: 'Cuando estoy en público o estresado, suelo realizar movimientos repetitivos inconscientes (mover el pie, tamborilear los dedos, jugar con un objeto):',
      options: [
        { points: 0, text: 'Rara vez o nunca; mantengo una postura normal.' },
        { points: 1, text: 'A veces, cuando el nivel de estrés es muy alto.' },
        { points: 2, text: 'Constantemente. Es mi mecanismo de estimulación ("stimming") para descargar el exceso de energía o ansiedad del entorno.' },
      ],
    },
    {
      text: 'Entender las jerarquías sociales implícitas (saber a quién debes respeto extra solo por su posición formal y no por sus méritos):',
      options: [
        { points: 0, text: 'Lo asimilo de forma natural y actúo según el protocolo.' },
        { points: 1, text: 'Lo entiendo, pero me molesta tener que fingir sumisión ante incompetentes.' },
        { points: 2, text: 'Me parece un bug del sistema humano. Solo respeto la competencia técnica y la lógica; los títulos vacíos no significan nada.' },
      ],
    },
    {
      text: 'Mi sensibilidad a la luz del sol o a las luces fluorescentes de oficina es:',
      options: [
        { points: 0, text: 'Normal; no me afecta en mi día a día.' },
        { points: 1, text: 'Prefiero luces cálidas o bajas, pero trabajo bien bajo cualquier foco.' },
        { points: 2, text: 'Alta. Trabajo mejor a oscuras, con modo oscuro en todas las aplicaciones y a menudo uso gafas de sol en interiores si la luz es agresiva.' },
      ],
    },
    {
      text: 'Cuando leo una novela o veo una película, me fijo más en:',
      options: [
        { points: 0, text: 'El drama amoroso, las emociones de los personajes y sus relaciones.' },
        { points: 1, text: 'El trasfondo general de la historia y el ritmo de la trama.' },
        { points: 2, text: 'La coherencia del "lore", las reglas del universo, los detalles técnicos y los fallos de guion lógicos.' },
      ],
    },
    {
      text: 'Aprender nuevos idiomas o lenguajes de programación se me da:',
      options: [
        { points: 0, text: 'Con el esfuerzo y la práctica habitual de cualquier persona.' },
        { points: 1, text: 'Relativamente bien si me pongo en serio unos meses.' },
        { points: 2, text: 'Extremadamente rápido; mi cerebro procesa las estructuras gramaticales o la sintaxis de código como si fueran plantillas matemáticas nativas.' },
      ],
    },
    {
      text: 'En las relaciones personales, la gente suele describirme como:',
      options: [
        { points: 0, text: 'Alguien cálido, expresivo y fácil de leer emocionalmente.' },
        { points: 1, text: 'Alguien reservado pero leal cuando coge confianza.' },
        { points: 2, text: 'Alguien frío, distante, enigmático o una "caja negra" difícil de descifrar.' },
      ],
    },
    {
      text: 'Cuando intento recordar un evento del pasado, mi memoria funciona mediante:',
      options: [
        { points: 0, text: 'Una sensación emocional general de lo que pasó.' },
        { points: 1, text: 'Un relato narrativo de los hechos principales.' },
        { points: 2, text: 'Capturas de pantalla mentales hipernítidas, datos exactos de la fecha/hora o detalles específicos del entorno que otros olvidaron.' },
      ],
    },
    {
      text: 'Si tuviera la oportunidad de automatizar todas mis interacciones sociales humanas repetitivas mediante una IA, yo:',
      options: [
        { points: 0, text: 'Me negaría rotundamente; prefiero el contacto humano real con sus imperfecciones.' },
        { points: 1, text: 'Lo haría solo para trámites burocráticos y clientes pesados.' },
        { points: 2, text: 'Pagaría una suscripción premium hoy mismo. Sería el software definitivo para optimizar mi vida.' },
      ],
    },
  ],
  bands: {
    social:  'Mente Social / Neurotípica Básica',
    adapted: 'Analista Adaptado',
    silicon: 'Silicon Mind / Cerebro de Silicio',
  },
  bandDesc: {
    social: 'Tu cerebro está cableado para la interacción social fluida y la empatía orgánica. Filtras bien los estímulos. Desventaja: eres propenso a perder el tiempo en dinámicas sociales ineficientes y te cuesta entrar en hiperenfoque profundo.',
    adapted: 'Tienes una fuerte vena racional y capacidad sistémica. Valoras el orden y la lógica, pero mantienes la capacidad de "ponerte la máscara" social cuando el negocio lo requiere. Eres el puente entre el caos humano y los sistemas puros.',
    silicon: 'Tu mente opera con la precisión de un procesador de última generación. Los sesgos emocionales y las sutilezas sociales inútiles están desactivados por defecto. Tienes una tolerancia al ruido bajísima y un potencial de hiperenfoque masivo. Eres un arquitecto nativo de sistemas, aunque los humanos a veces te parezcan NPC mal programados.',
  },
};

// Hosted elsewhere: the card links out instead of opening TestRunner.
export const MBTI = {
  id: 'mbti',
  logo: '/varkanis-test-mbti.jpg',
  author: '16P',
  count: 60,
  url: 'https://www.16personalities.com/es/test-de-personalidad',
  title: 'Test MBTI',
  short: '16 tipos de personalidad',
};

export const TESTS = [ADHD, PSYCH_AGE, DARK_TRIAD, ARCHETYPE_TEST, SILICON_MIND, MBTI];

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

const ADHD_POINTS = { 1: 2, 2: 1, 3: 0 }; // agree / don't know / disagree

// ASRS-style: high = agree on ≥4 of 6 core items; mid = 2-3 core agrees
// or weighted total >50%; low otherwise. Subscales are unweighted, display only.
export function scoreAdhd(test, answers) {
  const sums = { I: 0, H: 0, P: 0 };
  const counts = { I: 0, H: 0, P: 0 };
  let total = 0;
  let max = 0;
  let coreAgree = 0;
  test.items.forEach((item, i) => {
    const w = item.core ? 2 : 1;
    max += 2 * w;
    const raw = answers[i];
    if (raw == null) return;
    const pts = ADHD_POINTS[raw] ?? 0;
    sums[item.subscale] += pts;
    counts[item.subscale] += 1;
    total += pts * w;
    if (raw === 1 && item.core) coreAgree += 1;
  });
  const subscales = Object.fromEntries(Object.entries(sums).map(([k, s]) => {
    const m = (counts[k] || 1) * 2;
    return [k, { sum: s, max: m, pct: Math.round((s / m) * 100) }];
  }));
  const pct = Math.round((total / max) * 100);
  let band = 'low';
  if (coreAgree >= 4) band = 'high';
  else if (coreAgree >= 2 || pct > 50) band = 'mid';
  return { total, max, pct, band, coreAgree, subscales };
}

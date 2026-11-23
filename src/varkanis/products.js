// Card courses sold on their own page (#<view>). Text lives in Supabase
// (`course_content`), not here: this repo is public.
export const ATENCION = {
  id: 'atencion-bajo-control',
  view: 'atencion',
  title: 'Atención Bajo Control',
  short: 'Mini-curso: técnicas concretas para enfocar la atención, organizarte y dejar de posponer.',
  cover: '/Atencion-bajo-control-logo.webp',
  author: 'Varkanis',
  price: { amount: '3', currency: '$' },
  details: ['Mini-curso en tarjetas', 'Se lee en tu cuenta', 'Acceso permanente'],
};

export const CARD_COURSES = [ATENCION];

export const siteUrl = 'https://bostonbbs.com';

export const legacyCanonicalPaths = {
  '/': '/es/',
  '/sobre-nosotros/': '/es/sobre-nosotros/',
  '/primaria/': '/es/primaria/',
  '/secundaria/': '/es/secundaria/',
  '/admisiones/': '/es/admisiones/',
  '/contacto/': '/es/contacto/',
  '/articulos/': '/es/articulos/',
  '/en/privacy/': '/en/privacidad/',
};

const translatedPairs = [
  ['/es/', '/en/'],
  ['/es/sobre-nosotros/', '/en/sobre-nosotros/'],
  ['/es/primaria/', '/en/primaria/'],
  ['/es/secundaria/', '/en/secundaria/'],
  ['/es/admisiones/', '/en/admisiones/'],
  ['/es/contacto/', '/en/contacto/'],
  ['/es/articulos/', '/en/articulos/'],
  ['/es/privacidad/', '/en/privacidad/'],
];

export const translatedPath = Object.fromEntries(
  translatedPairs.flatMap(([es, en]) => [[es, en], [en, es]]),
);

export const pageMetadata = {
  '/es/': {
    title: 'Boston Bilingual School | Colegio bilingüe en Trujillo',
    description: 'Conoce Boston Bilingual School en Trujillo: educación primaria y secundaria bilingüe, formación integral y preparación para el futuro.',
  },
  '/en/': {
    title: 'Boston Bilingual School | Bilingual School in Trujillo',
    description: 'Explore Boston Bilingual School in Trujillo: bilingual primary and secondary education, personal growth and preparation for the future.',
  },
  '/es/sobre-nosotros/': {
    title: 'Nosotros | Boston Bilingual School en Trujillo',
    description: 'Conoce la historia, misión y propuesta educativa de Boston Bilingual School, un colegio bilingüe de primaria y secundaria en Trujillo.',
  },
  '/en/sobre-nosotros/': {
    title: 'About Us | Boston Bilingual School Trujillo',
    description: 'Discover the history, mission and educational approach of Boston Bilingual School, offering bilingual primary and secondary education in Trujillo.',
  },
  '/es/primaria/': {
    title: 'Educación primaria bilingüe en Trujillo | Boston Bilingual School',
    description: 'Explora la propuesta de primaria de Boston Bilingual School en Trujillo: bilingüismo, robótica, ajedrez y formación integral.',
  },
  '/en/primaria/': {
    title: 'Bilingual Primary Education in Trujillo | Boston Bilingual School',
    description: 'Explore primary education at Boston Bilingual School in Trujillo, with bilingual learning, robotics, chess and well-rounded development.',
  },
  '/es/secundaria/': {
    title: 'Educación secundaria bilingüe en Trujillo | Boston Bilingual School',
    description: 'Conoce la secundaria de Boston Bilingual School en Trujillo: formación bilingüe, preparación preuniversitaria y programas especiales.',
  },
  '/en/secundaria/': {
    title: 'Bilingual Secondary Education in Trujillo | Boston Bilingual School',
    description: 'Learn about secondary education at Boston Bilingual School in Trujillo, including bilingual learning and preparation for university.',
  },
  '/es/admisiones/': {
    title: 'Admisión 2027 en Trujillo | Boston Bilingual School',
    description: 'Conoce el proceso de admisión 2027 de Boston Bilingual School en Trujillo, los requisitos y cómo solicitar información o agendar una visita.',
  },
  '/en/admisiones/': {
    title: 'Admissions 2027 in Trujillo | Boston Bilingual School',
    description: 'Learn about the 2027 admissions process, requirements and how to contact or visit Boston Bilingual School in Trujillo.',
  },
  '/es/contacto/': {
    title: 'Contacto y visitas | Boston Bilingual School Trujillo',
    description: 'Comunícate con Boston Bilingual School en Trujillo para resolver tus consultas sobre primaria, secundaria y admisiones o agendar una visita.',
  },
  '/en/contacto/': {
    title: 'Contact and Visits | Boston Bilingual School Trujillo',
    description: 'Contact Boston Bilingual School in Trujillo with questions about primary education, secondary education, admissions or scheduling a visit.',
  },
};

export const normalizePath = (path) => path.endsWith('/') ? path : `${path}/`;
export const absoluteUrl = (path) => new URL(path, siteUrl).href;

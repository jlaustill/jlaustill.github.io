export interface IRouteMeta {
  path: string;
  title: string;
  description: string;
}

const routeMeta: IRouteMeta[] = [
  {
    // TODO(jlaustill): write the real homepage title + meta description —
    // this is the site's front-door pitch to search engines, not something
    // that should be auto-generated.
    path: '/',
    title: 'joSUu ostel',
    description: 'Personal site and portfolio of Joshua Austill.',
  },
  {
    path: '/blog',
    title: 'Blog | joSUu ostel',
    description: 'Technical articles and thoughts.',
  },
  {
    path: '/turbo-calculator',
    title: 'Turbo Calculator | joSUu ostel',
    description: 'Compound turbo boost ratio calculator.',
  },
  {
    path: '/kfa',
    title: 'kfa | joSUu ostel',
    description: 'QWERTY phonetic alphabet translator.',
  },
  {
    path: '/kfa/examples/raven',
    title: 'kfa: The Raven | joSUu ostel',
    description: "Edgar Allan Poe's The Raven translated into the kfa phonetic alphabet.",
  },
  {
    path: '/econ-spectrum',
    title: 'Econ Spectrum | joSUu ostel',
    description: 'Capitalism vs. socialism by country and sector.',
  },
];

export function getRouteMeta(path: string): IRouteMeta {
  const meta = routeMeta.find((route) => route.path === path);
  if (!meta) {
    throw new Error(`No route metadata defined for path: ${path}`);
  }
  return meta;
}

export default routeMeta;

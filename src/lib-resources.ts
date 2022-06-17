import path from 'path';

interface LibResource {
  to: string,
  from: string
}

type LibResources = Record<string, LibResource[]>;

export const libResources: LibResources = {
  'prismjs': [
    {
      from: 'prism.js',
      to: 'prism.js',
    },
    {
      from: 'components/prism-pug.min.js',
      to: 'prism-pug.js',
    },
    {
      from: 'themes/prism.css',
      to: 'prism.css',
    },
    {
      from: 'themes/prism-okaidia.css',
      to: 'prism-okaidia.css',
    },
  ],
  '@fontsource/montserrat': [
    {
      from: 'files',
      to: 'files'
    },
    {
      from: 'index.css',
      to: 'index.css'
    },
    {
      from: '700.css',
      to: '700.css'
    },
  ]
};


const resolveNodeDir = (name: string): string => path.dirname(require.resolve(path.join(name, 'package.json')));

export const onLibResources = (launch: (absoluteFrom: string, relativeTo: string) => void) => Object
  .entries(libResources)
  .forEach(([name, files]) => files
    .forEach(filename => launch(
      path.resolve(resolveNodeDir(name), filename.from),
      ['lib', name, filename.to].join('/'),
    )));

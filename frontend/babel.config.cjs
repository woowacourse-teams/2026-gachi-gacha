module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    [
      '@babel/preset-react',
      { runtime: 'automatic', importSource: '@emotion/react' },
    ],
    ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
  ],
};

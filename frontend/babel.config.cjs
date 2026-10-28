function replaceImportMetaForJest({ types }) {
  return {
    name: 'replace-import-meta-for-jest',
    visitor: {
      MetaProperty(path) {
        if (
          path.node.meta.name === 'import' &&
          path.node.property.name === 'meta'
        ) {
          path.replaceWith(types.objectExpression([]));
        }
      },
    },
  };
}

module.exports = {
  plugins: [replaceImportMetaForJest],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    [
      '@babel/preset-react',
      { runtime: 'automatic', importSource: '@emotion/react' },
    ],
    ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
  ],
};

// babel.config.js

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            // '@': './' tarkoittaa, että "@/foo" → "project-root/foo"
            '@': './'
            // Jos haluat tiukemman aliaksen esim. "@components" → "./components",
            // voit lisätä sen vaikka näin:
            // '@components': './components'
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        }
      ]
    ]
  };
};

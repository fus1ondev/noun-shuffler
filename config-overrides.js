module.exports = function override (config, env) {
  config.resolve.fallback = Object.assign(config.resolve.fallback || {}, {
    path: require.resolve('path-browserify'),
  })
  return config
}
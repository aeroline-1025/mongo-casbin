module.exports = {
    reporter: ['console', 'lcov'],
    output: ['stdout', 'reports/lcov.info'],
    assert: '@hapi/code',
    verbose: true,
    coverage: true,
    threshold: 80,
    'default-plan-threshold': 1,
    lint: true,
    paths: ['test'],
    pattern: 'spec',
    'coverage-path': 'lib'
};

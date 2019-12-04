module.exports = {
    assert: '@hapi/code',
    verbose: true,
    coverage: true,
    threshold: 80,
    'default-plan-threshold': 1,
    lint: true,
    paths: ['lib'],
    pattern: 'spec',
    'coverage-path': 'lib'
};

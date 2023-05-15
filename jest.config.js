/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    testEnvironment: 'node',
    "transformIgnorePatterns": [
        "/node_modules/(?!lodash-es/.*)"
    ],
    transform: {
        '\\.[tj]sx?$': ['babel-jest', { rootMode: 'upward' }],
    }
};

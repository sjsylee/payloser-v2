/** @type {import("jest").Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.spec.json" }]
  },
  moduleNameMapper: {
    "^@payloser/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  testEnvironment: "node"
};

module.exports = {
  transform: {
    "^.+\\.(ts|js)$": "ts-jest"
  },
  testEnvironment: "node",
  testRegex: ".*\\.(test|spec)\\.(ts|tsx|js)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  globals: {
    "ts-jest": {
      diagnostics: false
    }
  }
};

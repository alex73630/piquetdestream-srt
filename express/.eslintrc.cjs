/** @type {import("eslint").Linter.Config} */
module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended", "prettier"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 12,
		tsconfigRootDir: __dirname,
		project: ["./tsconfig.eslint.json"]
	},
	plugins: ["@typescript-eslint", "prettier"],
	root: true,
	ignorePatterns: ["*.cjs"],
	env: {
		es2021: true
	},
	rules: {
		"prettier/prettier": ["error", {}, { usePrettierrc: true }], // Includes .prettierrc.js rules
		"@typescript-eslint/interface-name-prefix": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{ args: "after-used", ignoreRestSiblings: true, argsIgnorePattern: "^_" }
		],
		"no-unused-vars": ["warn", { args: "after-used", ignoreRestSiblings: true, argsIgnorePattern: "^_" }],
		"no-multi-spaces": "error",
		"no-trailing-spaces": "error",
		"arrow-spacing": "error"
	}
}

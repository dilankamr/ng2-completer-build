"use strict";

const shell = require('shelljs');
const chalk = require('chalk');
const path = require('path');

const PACKAGE = `ng2-completer`;
const NPM_DIR = `dist/lib`;
const ESM2015_DIR = `${NPM_DIR}/esm2015`;
const ESM5_DIR = `${NPM_DIR}/esm5`;
const BUNDLES_DIR = `${NPM_DIR}/bundles`;
const OUT_DIR_ESM5 = `${NPM_DIR}/package/esm5`;

shell.echo(`Start building...`);

shell.rm(`-Rf`, `${NPM_DIR}/*`);
shell.mkdir(`-p`, `./${ESM2015_DIR}`);
shell.mkdir(`-p`, `./${ESM5_DIR}`);
shell.mkdir(`-p`, `./${BUNDLES_DIR}`);

/* TSLint with Codelyzer */
// https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts
// https://github.com/mgechev/codelyzer
shell.echo(`Start TSLint`);
shell.exec(`tslint -c tslint.json -t stylish src/**/*.ts`);
shell.echo(chalk.green(`TSLint completed`));

/* AoT compilation */
shell.echo(`Start AoT compilation`);
if (shell.exec(`ngc -p tsconfig-build.json`).code !== 0) {
    shell.echo(chalk.red(`Error: AoT compilation failed`));
    shell.exit(1);
}
shell.echo(chalk.green(`AoT compilation completed`));

/* BUNDLING PACKAGE */
shell.echo(`Start bundling`);
shell.echo(`Rollup package`);
if (shell.exec(`rollup -c rollup.es.config.js -i ${NPM_DIR}/${PACKAGE}.js -o ${ESM2015_DIR}/${PACKAGE}.js`).code !== 0) {
    shell.echo(chalk.red(`Error: Rollup package failed`));
    shell.exit(1);
}

shell.echo(`Produce ESM5 version`);
shell.exec(`ngc -p tsconfig-build.json --target es5 -d false --outDir ${OUT_DIR_ESM5} --importHelpers true --sourceMap`);
if (shell.exec(`rollup -c rollup.es.config.js -i ${OUT_DIR_ESM5}/${PACKAGE}.js -o ${ESM5_DIR}/${PACKAGE}.js`).code !== 0) {
    shell.echo(chalk.red(`Error: ESM5 version failed`));
    shell.exit(1);
}

shell.echo(`Run Rollup conversion on package`);
if (shell.exec(`rollup -c rollup.config.js -i ${ESM5_DIR}/${PACKAGE}.js -o ${BUNDLES_DIR}/${PACKAGE}.umd.js`).code !== 0) {
    shell.echo(chalk.red(`Error: Rollup conversion failed`));
    shell.exit(1);
}

shell.echo(`Minifying`);
const rootDir = shell.pwd();
shell.cd(`${BUNDLES_DIR}`);
shell.exec(`uglifyjs ${PACKAGE}.umd.js -c --comments -o ${PACKAGE}.umd.min.js --source-map "filename='${PACKAGE}.umd.min.js.map', includeSources"`);
shell.cd(rootDir);

shell.echo(chalk.green(`Bundling completed`));

shell.rm(`-Rf`, `${NPM_DIR}/package`);
shell.rm(`-Rf`, `${NPM_DIR}/node_modules`);
shell.rm(`-Rf`, `${NPM_DIR}/*.js`);
shell.rm(`-Rf`, `${NPM_DIR}/*.js.map`);
shell.rm(`-Rf`, `${NPM_DIR}/src/**/*.js`);
shell.rm(`-Rf`, `${NPM_DIR}/src/**/*.js.map`);

shell.cp(`-Rf`, [`package.json`, `LICENSE.md`, `README.md`], `${NPM_DIR}`);


shell.rm(`-Rf`, `.gitignore`);
shell.rm(`-Rf`, `LICENSE.md`);
shell.rm(`-Rf`, `config`);
shell.rm(`-Rf`, `karma.conf.js`);
shell.rm(`-Rf`, `node_modules`);
shell.rm(`-Rf`, `public_api.ts`);
shell.rm(`-Rf`, `spec.bundle.js`);
shell.rm(`-Rf`, `tsconfig.json`);
shell.rm(`-Rf`, `.npmignore`);
shell.rm(`-Rf`, `README.md`);
shell.rm(`-Rf`, `demo`);
shell.rm(`-Rf`, `license-banner.txt`);
shell.rm(`-Rf`, `package-lock.json`);
shell.rm(`-Rf`, `rollup.config.js`);
shell.rm(`-Rf`, `src`);
shell.rm(`-Rf`, `tslint.json`);
shell.rm(`-Rf`, `.git`);
shell.rm(`-Rf`, `CHANGELOG.md`);
shell.rm(`-Rf`, `ng2-completer.ts`);
shell.rm(`-Rf`, `package.json`);
shell.rm(`-Rf`, `rollup.es.config.js`);
shell.rm(`-Rf`, `tsconfig-build.json`);
shell.rm(`-Rf`, `webpack.config.js`);

shell.cp(`-Rf`,`${NPM_DIR}/*`, `.`);

shell.rm(`-Rf`, `dist`);

const packageJsonPath = path.join(__dirname, NPM_DIR, 'package.json');
shell.sed('-i', /^.+postinstall.+$/, '', packageJsonPath);

shell.echo(chalk.green(`End building`));

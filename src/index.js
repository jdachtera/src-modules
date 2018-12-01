#!/usr/bin/env node

const minimist = require('minimist');
const add = require('./add');
const run = require('./run');
const watch = require('./watch');

const commands = {
  add,
  run,
  watch,
  install: () => add({ _: [] }),
};

(async () => {
  const command = process.argv.slice(2)[0];
  const argv = minimist(process.argv.slice(3));

  const commandHandler = commands[command];

  if (!commandHandler) {
    throw new Error(`Invalid command ${command}`);
  }

  await commandHandler(argv);
})().catch(console.error);

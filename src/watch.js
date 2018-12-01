const chokidar = require('chokidar');
const fs = require('mz/fs');
const exec = require('./exec');
const { get } = require('lodash');

const watchSourcePackages = async ({ throttleTime = 100 } = {}) => {
  const workDir = process.cwd();

  const rootConfig = await JSON.parse(await fs.readFile(`${workDir}/package.json`));

  const watchPath = `${workDir}/src_modules`;
  const moduleTimeouts = {};
  const packageConfigs = {};

  const getBuildCommand = ({ moduleName, config }) => {
    const rootBuildCommand = get(rootConfig, `srcDependencies.${moduleName}.scripts.build`);

    if (rootBuildCommand) {
      return rootBuildCommand;
    }

    const prepublishCommand = get(config, 'scripts.prepublish');
    if (prepublishCommand) {
      return prepublishCommand;
    }

    const buildCommand = get(config, 'scripts.build');
    if (buildCommand) {
      return buildCommand;
    }
  };

  const shouldIgnoreChange = ({ moduleName, config, path }) => {
    const rootPattern = get(rootConfig, `srcDependencies.${moduleName}.ignoreChanges`);

    if (rootPattern) {
      return path.match(rootPattern);
    }

    return path.match(/^(lib|dist).*/);
  };

  const handleChange = async ({ moduleName, path }) => {
    const modulePath = `${watchPath}/${moduleName}`;

    if (!packageConfigs[moduleName]) {
      packageConfigs[moduleName] = JSON.parse(await fs.readFile(`${modulePath}/package.json`));
    }
    const config = packageConfigs[moduleName];

    if (shouldIgnoreChange({ moduleName, config, path })) {
      return;
    }

    const buildCommand = getBuildCommand({ moduleName, config });

    if (buildCommand) {
      const options = {
        cwd: modulePath,
        env: {
          PATH: [`${modulePath}/node_modules/.bin/`, process.env.PATH].join(':'),
        },
      };

      console.log(`Building module ${moduleName}`);
      await exec(buildCommand.split(' ')[0], buildCommand.split(' ').slice(1), options);
    }
  };

  const triggerChange = async ({ moduleName, path }) => {
    clearTimeout(moduleTimeouts[moduleName]);
    moduleTimeouts[moduleName] = setTimeout(() => handleChange({ moduleName, path }), throttleTime);
  };

  const modules = await fs.readdir(watchPath);

  for (const moduleName of modules) {
    handleChange({ moduleName, path: '' });
  }

  chokidar
    .watch(watchPath, { ignored: /(^|[\/\\])\../, ignoreInitial: true })
    .on('all', (event, path) => {
      const pathSegments = path.substring(watchPath.length + 1).split('/');
      const moduleName = pathSegments[0];

      if (moduleName) {
        triggerChange({ moduleName, path: pathSegments.slice(1).join('/') });
      }
    });
};

module.exports = watchSourcePackages;

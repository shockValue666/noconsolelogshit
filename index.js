const basePath = process.cwd();
const { startCreating, buildSetup } = require(`${basePath}/src/main.js`);

(() => {
  buildSetup(); // just creates the build directory. If there's already one, it removes it. we are going to need this info because we will probably need to run it numerous times? we will see...
  startCreating();
})();

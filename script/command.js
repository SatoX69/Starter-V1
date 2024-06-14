const path = require("path");
const { readdirSync } = require("fs");

global.log("Loading Commands...", "yellow", false);

let errors = 0;
let loaded = 0;
let failedFiles = [];
let loadedFiles = [];
const commandsNamesAndAliases = new Set();
global.cmds = new Map();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath);

commandFiles.forEach((file) => {
  if (global.config_handler?.skip?.includes(file)) return;

  if (file.endsWith(".js")) {
    try {
      const command = require(path.join(commandsPath, file));
      if (!command.config || !command.config.name) {
        throw new Error("config and/or config.name not set");
      }
      if (!command.start || typeof command.start !== "function") {
        throw new Error("function start not set")
      }
      if (loadedFiles.includes(command.config.name)) {
        throw new Error(`${command.config.name} Already Exists`);
      }

      if (command.config.aliases) {
        if (typeof command.config.aliases !== "object") {
          throw new Error("aliases must be an array")
        }
        let aliases = command.config.aliases;
        if (commandsNamesAndAliases.has(command.config.name) || aliases.some(alias => commandsNamesAndAliases.has(alias))) {
          throw new Error(`${[command.config.name, ...aliases].join(", ")} Already Exists in other files`);
        }
        aliases = aliases.filter(v => v.length === 0)
        aliases.forEach(alias => commandsNamesAndAliases.add(alias));
      }

      global.cmds.set(file, command);
      loaded++;
      commandsNamesAndAliases.add(command.config.name);
      loadedFiles.push(command.config.name);

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Loaded ${loaded} commands`);
    } catch (error) {
      errors++;
      failedFiles.push(file);
      process.stdout.write("\n");
      global.log(`'${file}': ${error.message}`, "red", true);
    }
  }
});

process.stdout.write("\n");
global.log(`Commands Loaded: ${loaded}`, "cyan", false);
global.log(`Errors: ${errors}`, "red", false);

if (failedFiles.length > 0) {
  global.log(`Failed to load commands: ${failedFiles.join(", ")}`, "red", false);
}

module.exports = null;
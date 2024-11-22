const fs = require("fs");
const path = require("path");
const os = require("os");

// Define log folder and file
const LOG_FOLDER = path.join(os.homedir(), "AppData", "Local", "SqlAccount");
const LOG_FILE = path.join(LOG_FOLDER, "deployment.log");

// Ensure the log directory exists
if (!fs.existsSync(LOG_FOLDER)) {
  fs.mkdirSync(LOG_FOLDER, { recursive: true });
}

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
  console.log(message)
}

module.exports = { log, LOG_FILE };

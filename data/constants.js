const fs = require("fs").promises;
const path = require("path");
const { log } = require("../lib/logger");
const os = require("os");

const CONFIGURATION_FILE_PATH = path.resolve(__dirname,"configuration.json");
const GITHUB_SQL_ACCOUNT_REST_API_RELEASE_URL = "beehexacorp/sql-account-rest-api/releases/";
const GITHUB_SQL_ACCOUNT_REST_API_MONITOR_RELEASE_URL = "hexasync-saas/sql-account-monitor/releases/";
const CLOUDFLARED_WIN_64_URL = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi";
const SQL_ACCOUNT_REST_API_APPLICATION_NAME = "SqlAccountRestAPI.exe";
const STARTUP_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');

module.exports = {
  CONFIGURATION_FILE_PATH,
  GITHUB_SQL_ACCOUNT_REST_API_RELEASE_URL,
  GITHUB_SQL_ACCOUNT_REST_API_MONITOR_RELEASE_URL,
  CLOUDFLARED_WIN_64_URL,
  SQL_ACCOUNT_REST_API_APPLICATION_NAME,
  STARTUP_PATH,
};

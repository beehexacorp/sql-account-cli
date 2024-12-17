const fs = require("fs").promises;
const path = require("path");
const { log } = require("../lib/logger");

const CONFIGURATION_FILE_PATH = path.resolve(__dirname,"configuration.json");
const GITHUB_SQL_ACCOUNT_REST_API_RELEASE_URL = "beehexacorp/sql-account-rest-api/releases/";
const GITHUB_SQL_ACCOUNT_REST_API_MONITOR_RELEASE_URL = "hexasync-saas/sql-account-monitor/releases/";
const CLOUDFLARED_WIN_64_URL = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi";
const SQL_ACCOUNT_REST_API_APPLICATION_NAME = "SqlAccountRestAPI.exe";
const SQL_ACCOUNT_REST_API_MONITOR_APPLICATION_NAME = "SqlAccountRestAPIMonitor.exe";
async function ReadJsonFile(filePath) {
  try {
    if (!(await fs.stat(filePath).catch(() => false))){
      // Create empty file if not exists
      await fs.writeFile(filePath, JSON.stringify({}, null, 2), "utf8");
      return {};
    }
    // Read file
    const data = await fs.readFile(filePath, "utf8");
    // Parse JSON data
    try {
      return JSON.parse(data);
    } catch (err) {
      log("Error when parsing JSON file:"+ err);
    }
  } catch (err) {
    log("Error when reading file:"+ err);
  }
  return {};
}

async function WriteJsonFile(filePath, newData) {
  try {
    let jsonData = await ReadJsonFile(filePath)
    jsonData = { ...jsonData, ...newData }
    const jsonString = JSON.stringify(jsonData, null, 2);
    await fs.writeFile(filePath, jsonString, "utf8");
    log("Updated JSON file successfully.");
  } catch (err) {
    log("Error writing file:", err);
  }
    
}

module.exports = {
  CONFIGURATION_FILE_PATH,
  GITHUB_SQL_ACCOUNT_REST_API_RELEASE_URL,
  GITHUB_SQL_ACCOUNT_REST_API_MONITOR_RELEASE_URL,
  CLOUDFLARED_WIN_64_URL,
  SQL_ACCOUNT_REST_API_APPLICATION_NAME,
  SQL_ACCOUNT_REST_API_MONITOR_APPLICATION_NAME,
  ReadJsonFile,
  WriteJsonFile,
};

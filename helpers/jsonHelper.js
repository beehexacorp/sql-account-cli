const fs = require("fs").promises;
const path = require("path");
const { log } = require("../lib/logger");

async function readJsonFile(filePath) {
  try {
    if (!(await fs.stat(filePath).catch(() => false))) {
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
      log("Error when parsing JSON file:" + err);
    }
  } catch (err) {
    log("Error when reading file:" + err);
  }
  return {};
}

async function writeJsonFile(filePath, newData) {
  try {
    let jsonData = await readJsonFile(filePath);
    jsonData = { ...jsonData, ...newData };
    const jsonString = JSON.stringify(jsonData, null, 2);
    await fs.writeFile(filePath, jsonString, "utf8");
    log("Updated JSON file successfully.");
  } catch (err) {
    log("Error writing file:", err);
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};

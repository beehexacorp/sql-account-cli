const fs = require("fs");

export const CONFIGURATION_FILE_PATH = "data/configuration.json";
export const GITHUB_RELEASE_URL = "beehexacorp/sql-account-rest-api/releases/";

export function ReadJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      // Create empty file if not exists
      fs.writeFile(filePath, JSON.stringify({}, null, 2), "utf8", (writeErr) => {
        if (writeErr) {
          reject("Error creating file:", writeErr);
          return;
        }
        resolve({}); 
      });
      return;
    }
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject("Error when reading file:", err);
        return;
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseErr) {
        resolve({});
        reject("Error parsing JSON:", parseErr);
      }
    });
  });
}
export function WriteJsonFile(filePath, newData) {
  return new Promise((resolve, reject) => {
    ReadJsonFile(filePath)
      .catch((err) => {
        log("Warning: ReadJsonFile failed. Proceeding with empty object.", err);
        return {}; 
      })
      .then((jsonData) => {
        jsonData = { ...jsonData, ...newData };
        const jsonString = JSON.stringify(jsonData, null, 2);
        fs.writeFile(filePath, jsonString, (err) => {
          if (err) {
            reject("Error writing file:", err);
            return;
          }
          resolve("File written successfully.");
        });
      })
      .catch((err) => {
        reject("Error reading JSON file:", err);
      });
  });
}

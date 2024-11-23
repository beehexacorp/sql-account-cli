const fs = require("fs");

class Constants {
  static CONFIGURATION_FILE_PATH = "data/configuration.json";
  static GITHUB_RELEASE_URL = "beehexacorp/sql-account-rest-api/releases/";
  static ReadJsonFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          reject("Error when reading file:", err);
          return;
        }
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (parseErr) {
          reject("Error parsing JSON:", parseErr);
        }
      });
    });
  }
  static WriteJsonFile(filePath, newData) {
    return new Promise((resolve, reject) => {
      Constants.ReadJsonFile(filePath)
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
}
module.exports = Constants;

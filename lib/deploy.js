const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const { log } = require('./logger');

function deploy(appName, port) {
    try {
        log(`Starting deployment for ${appName} on port ${port}`);

        // Check IIS prerequisites
        try {
            execSync('iisreset /status', { stdio: 'ignore' });
            log('IIS is installed and accessible.');
        } catch {
            const error = 'IIS is not installed or cannot be accessed. Deployment aborted.';
            log(error);
            console.error(error);
            process.exit(1);
        }

        const appUrl = 'https://example.com/sql-accounting.zip'; // Replace with actual URL
        const targetPath = `C:\\inetpub\\wwwroot\\${appName}`;
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
            log(`Created target directory: ${targetPath}`);
        }

        log('Downloading SQL Accounting application...');
        execSync(`curl -o ${targetPath}\\app.zip ${appUrl}`);
        log('Application downloaded.');

        log('Unzipping the application...');
        execSync(`powershell -Command "Expand-Archive -Path ${targetPath}\\app.zip -DestinationPath ${targetPath}"`);
        log('Application unzipped.');

        log('Configuring IIS site...');
        execSync(`appcmd add site /name:${appName} /physicalPath:${targetPath} /bindings:http/*:${port}:${appName}`);
        log(`IIS site configured for ${appName} on port ${port}.`);

        log(`Deployment completed successfully for ${appName} on port ${port}.`);
        console.log(`Application deployed and available at http://localhost:${port}`);
    } catch (error) {
        log(`Error during deployment: ${error.message}`);
        console.error('Deployment failed. Check the logs for details.');
        process.exit(1);
    }
}

module.exports = { deploy };

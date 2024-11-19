const { execSync } = require('child_process');
const { log } = require('./logger');

function expose(provider, secret) {
    log(`Starting Cloudflare tunnel setup for provider: ${provider}`);
    if (provider.toLowerCase() !== 'cloudflared') {
        const error = `Unsupported provider: ${provider}`;
        log(error);
        console.error(error);
        process.exit(1);
    }

    try {
        log('Registering Cloudflare tunnel...');
        execSync(`cloudflared tunnel create --name sql-accounting --credentials-file ${secret}`);
        log('Cloudflare tunnel registered successfully.');
        console.log('Tunnel registered successfully.');
    } catch (error) {
        log(`Failed to register tunnel: ${error.message}`);
        console.error(`Failed to register tunnel: ${error.message}`);
        process.exit(1);
    }
}

module.exports = { expose };

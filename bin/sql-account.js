#!/usr/bin/env node

const { execSync } = require("child_process");
const { Command } = require("commander");
const { deploy } = require("../lib/deploy");
const { expose } = require("../lib/expose");
const { login } = require("../lib/login");

const program = new Command();

program
  .name("sql-account")
  .description("CLI tool for SQL Account Rest API management")
  .version("1.0.0");

program
  .command("install")
  .description("Deploy SQL Account to IIS")
  .requiredOption("--app-dir <appDir>", "Path to the application directory")
  .requiredOption("--app-name <appName>", "Name of the IIS application or service")
  .option("--port <port>", "Port number for the application", null)
  .option(
    "--deployment-method <deploymentMethod>",
    "Specify the deployment method: 'WindowsService' to deploy as a Windows Service, 'WindowsStartup' to add to Windows Startup, or 'IIS' to deploy to IIS",
    "WindowsStartup"
  )
  .option("--version <version>", "Version of the IIS application", null)
  .option("--username <username>", "Username for Windows service", null)
  .option("--password <password>", "Password for Windows service", null)
  .action((options) => {
    deploy(
      options.appDir,
      options.appName,
      options.port,
      options.deploymentMethod,
      options.version,
      options.username,
      options.password
    );
  });

program
  .command("expose")
  .description("Set up Cloudflare tunnels for SQL Account")
  .requiredOption("--provider <provider>", "Cloudflare or other provider")
  .requiredOption("--secret <secret>", "Authentication secret for the tunnel")
  .action((options) => {
    expose(options.provider, options.secret);
  });

program
  .command("login")
  .description("Login to SQL Account")
  .requiredOption("--username <username>", "SQL Account username")
  .requiredOption("--password <password>", "SQL Account password")
  .action((options) => {
    login(options.username, options.password);
  });


// Check for empty arguments and display help if needed
if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
} else {
  program.parse(process.argv);
}

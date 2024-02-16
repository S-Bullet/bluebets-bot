import { readdirSync } from "fs";
import { Client, GatewayIntentBits } from "discord.js";

import { TOKEN, OWNER_GUILD_ID } from "./config.js";

import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async () => {
  const commands = [];
  const promises = []

  //const commandsDir = `${__dirname}/commands`
  const commandsDir = path.join(__dirname, 'commands');
  for (const category of readdirSync(commandsDir)) {
    const categoryDir = path.join(commandsDir, category);
    //for (const file of readdirSync(`${commandsDir}/${category}`)) {
    for (const file of readdirSync(categoryDir)) {
      const filePath = path.join(categoryDir, file);
      const formattedPath = `file:///${filePath.replace(/\\/g, '/')}`;
      //const command = await import(`${commandsDir}/${category}/${file}`);
      const command = await import(formattedPath);
      commands.push(command.slash_data);
    }
  }

  const owner_guild = client.guilds.cache.get(OWNER_GUILD_ID)

  promises.push(client.application.commands.set(commands))

  // promises.push(client.application.commands.set(commands.filter(c => !c.owner_only)))
  // promises.push(client.application.commands.set([]))

  if (owner_guild) {
    // promises.push(owner_guild.commands.set(commands.filter(c => c.owner_only)))
    // promises.push(owner_guild.commands.set([]))
  }

  Promise.all(promises)
    .then(() => {
      console.log(`Commands are registered for @${client.user.globalname}`);
      process.exit();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
});

client.login(TOKEN);

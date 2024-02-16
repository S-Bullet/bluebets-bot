import fs from "fs";

export function getAllowedGuilds() {
  var config = JSON.parse(fs.readFileSync("./data/allowed_guilds.json"));
  return config.allowed_guilds;
}

export async function updateAllowedGuilds(data) {
  var config = JSON.parse(fs.readFileSync("./data/allowed_guilds.json"));
  config.allowed_guilds = data;

  fs.writeFileSync(
    "./data/allowed_guilds.json",
    JSON.stringify(config, null, 4)
  );
}

export function allowGuild(client, guild_id) {
  if (client.allowedGuilds.includes(guild_id)) return;

  client.allowedGuilds.push(guild_id);
  updateAllowedGuilds(client.allowedGuilds);
}

export function disallowGuild(client, guild_id) {
  if (!client.allowedGuilds.includes(guild_id)) return;

  client.allowedGuilds.splice(client.allowedGuilds.indexOf(guild_id), 1);
  updateAllowedGuilds(client.allowedGuilds);
}

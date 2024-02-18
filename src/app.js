import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Colors,
  ActivityType,
} from "discord.js";
import { readdir } from "fs";
import { prototypeOverwrites } from "./utils/extra_functions.js";
import { createRequire } from "module";
// import {
//   TOKEN,
//   OWNER_ID,
//   OWNER_GUILD_ID,
//   ANNOUNCE_CHANNEL_ID,
//   TABLE_CHANNEL_ID,
//   LEADERBOARD_CHANNEL_ID,
//   DEFAULT_EMOJI,
// } from "./config.js";
import * as api from "./api.js"
import * as util from "./util.js"
import { allowGuild, getAllowedGuilds } from "./utils/allowed_guilds.js";
import dotenv from "dotenv"

const require = createRequire(import.meta.url);
const emojis = require("./emojis.json");

dotenv.config({ path : './../.env' });

const TOKEN = process.env.TOKEN;
const OWNER_GUILD_ID = process.env.OWNER_GUILD_ID;
const ANNOUNCE_CHANNEL_ID = process.env.ANNOUNCE_CHANNEL_ID;
const LEADERBOARD_CHANNEL_ID = process.env.LEADERBOARD_CHANNEL_ID;
const DEFAULT_EMOJI = process.env.DEFAULT_EMOJI;

const DELAY_TIME = 1 * 60 * 1000

// Client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
  presence: {
    activities: [{ name: "the server", type: ActivityType.Watching }],
  },
});

// Prototype overwrites
prototypeOverwrites();

// Assignments
client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selectMenus = new Collection();
client.colors = Colors;
client.api = api;
client.allowedGuilds = getAllowedGuilds();
client.defaultColor = 0x5964f2;
client.errorColor = Colors.Red;
client.successColor = 0x2ecc70;
client.emoji = (emoji_name) =>
  emoji_name in emojis ? emojis[emoji_name] : DEFAULT_EMOJI;

// Owner Guild ID
if (OWNER_GUILD_ID && !client.allowedGuilds.includes(OWNER_GUILD_ID))
  allowGuild(client, OWNER_GUILD_ID);

// Event Loader
readdir("./events", { encoding: "utf-8" }, (err, files) => {
  if (err) return console.error(err);

  files
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const eventName = file.split(".")[0];
      if (eventName == "ready")
        client.on(eventName, (client) =>
          import(`./events/${file}`).then((e) => e.default(client))
        );
      else
        client.on(eventName, (...args) => {
          import(`./events/${file}`).then((e) => e.default(...args));
        });
    });
});

// Command Loader
readdir("./commands", { encoding: "utf-8" }, (err, folders) => {
  if (err) return console.error(err);

  folders.forEach((folder) => {
    readdir(`./commands/${folder}`, { encoding: "utf-8" }, (err, files) => {
      if (err) return console.error(err);

      files
        .filter((file) => file.endsWith(".js"))
        .forEach((file) => {
          import(`./commands/${folder}/${file}`).then((c) => {
            c.data.category = folder;
            client.commands.set(c.data.name, {
              data: c.data,
              slash_data: c.slash_data,
              autocomplete: c.autocomplete,
            });
          });
        });
    });
  });
});

// Button loader
readdir("./buttons", { encoding: "utf-8" }, (err, files) => {
  if (err) return console.error(err);

  files
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      import(`./buttons/${file}`).then((b) => {
        client.buttons.set(b.default.name, b.default);
      });
    });
});

// Modal loader
readdir("./modals", { encoding: "utf-8" }, (err, files) => {
  if (err) return console.error(err);

  files
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      import(`./modals/${file}`).then((b) => {
        client.modals.set(b.default.name, b.default);
      });
    });
});

// Select Menu Loader
readdir("./select_menus", { encoding: "utf-8" }, (err, files) => {
  if (err) return console.error(err);

  files
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      import(`./select_menus/${file}`).then((b) => {
        client.selectMenus.set(b.default.name, b.default);
      });
    });
});

function waitForSeconds(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

client.once('ready', async () => {
  // const guild = client.guilds.cache.get(OWNER_GUILD_ID)
  const announceChannel = client.channels.cache.get(ANNOUNCE_CHANNEL_ID)
  // const tableChannel = client.channels.cache.get(TABLE_CHANNEL_ID)
  const leaderboardChannel = client.channels.cache.get(LEADERBOARD_CHANNEL_ID)

  const tokens = await api.getTokens()

  while (true) {
    try {
      const bettings = await api.getBettings()

      for (const betting of bettings) {
        try {
          if (betting.status === 1 && Date.now() > betting.startedTime + betting.period) {
            await api.stopBetting(betting.periodId)
            announceChannel.send(`${betting.periodString} betting finished`)
  
            for (const token of tokens) {
              const amounts = await api.getAmounts(betting.periodId, token.tokenId)
  
              for (const amount of amounts) {
                const winners = await api.getWinners(betting.periodId, token.tokenId, amount.amountId)
  
                if (!winners._cntWinners) {
                  leaderboardChannel.send(`No winners for ${betting.periodString} ${token.tokenName} $${amount.amount} betting`)
                } else {
                  const reward = ((Number(winners._poolAmount) / 10 ** 6) / Number(winners._cntWinners)).toFixed(2)
                  let msg = `:rocket: Winners on ${betting.periodString} ${token.tokenName} $${amount.amount} betting :rocket:\n`
                  for (let i = 0; i < winners._cntWinners; i++) {
                    const winnerAddress = winners._winnersAddresses[i]
                    const prize = Number(winners._winAmounts[i]) / 10 ** 6
                    const winnerInfo = await api.getUserInfo(winnerAddress)
                    msg += `@${util.getDiscordName(client, winnerInfo.discordName)} (:dollar: $${prize} rewards :dollar:)`
                  }
                  leaderboardChannel.send(msg)
                }
              }
            }
          } else if (betting.status !== 1 && Date.now() >= betting.startedTime + betting.period + DELAY_TIME) {
            await api.startBetting(betting.periodId)
            announceChannel.send(`${betting.periodString} betting started`)
          }
        } catch (error) {
          console.error(error)
        }
      }

      await waitForSeconds(60)
    } catch (error) {
      console.error(error)
    }
  }
});

client.login(TOKEN);

console.log("Server started!");
import { ActionRowBuilder, ButtonBuilder } from "discord.js";
// import { cryptoSymbolToName } from "../utils/bets.js";
// import {
//   TOKEN,
//   OWNER_ID,
//   OWNER_GUILD_ID,
//   ANNOUNCE_CHANNEL_ID,
//   TABLE_CHANNEL_ID,
//   LEADERBOARD_CHANNEL_ID,
//   DEFAULT_EMOJI,
// } from "../config.js";
import * as util from "../util.js"
import dotenv from "dotenv"
dotenv.config({ path : './../.env' });
const TABLE_CHANNEL_ID = process.env.TABLE_CHANNEL_ID;

export default {
  name: "bet",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const { api } = interaction.client;
    const type = interaction.customId.split("_")[1];

    if (type == "guess") {
      const guess = parseFloat(interaction.fields.getTextInputValue("guess"));
      if (isNaN(guess))
        return interaction.error("Your guess must be a number.");
      else if (guess <= 0)
        return interaction.error("Your guess must be greater than 0.");

      const periodId = parseInt(interaction.customId.split("_")[2])
      const tokenId = parseInt(interaction.customId.split("_")[3])
      const amountId = parseInt(interaction.customId.split("_")[4])

      const betting = await api.getBetting(periodId)
      const token = await api.getToken(tokenId)
      const amount = await api.getAmount(periodId, tokenId, amountId)

      if (!await api.isBettingOpened(periodId))
        return interaction.error("Betting is closed");

      if (await api.isBetted(periodId, tokenId, amountId, interaction.user.id))
        return interaction.error("Already betted")

      const balance = await api.getUserBalance(interaction.user.id);

      if (balance < amount.amount) {
        return interaction.error("You don't have enough dollar to enter this bet!");
      }

      const row = new ActionRowBuilder().setComponents(
        new ButtonBuilder()
          .setCustomId("yes")
          .setLabel("Yes")
          .setStyle("Success"),
        new ButtonBuilder().setCustomId("no").setLabel("No").setStyle("Danger")
      );

      interaction.response({
        embeds: [
          {
            title: "Are you sure?",
            description: "Are you sure you want to enter this bet?",
            fields: [
              {
                name: "Period",
                value: betting.periodString,
                inline: true,
              },
              {
                name: "Coin",
                value: token.tokenName,
                inline: true,
              },
              {
                name: "Bet Amount",
                value: `$${amount.amount}`,
                inline: true,
              },
              {
                name: "Your Guess",
                value: guess.toString(),
                inline: true,
              },
            ],
            color: 0xf0f0f0,
          },
        ],
        components: [row],
        ephemeral: true,
      })
        .then((m) => {
          m.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000,
          })
            .then(async (i) => {
              if (i.customId == "yes") {
                try {
                  api.doBetting(interaction.user.id, periodId, tokenId, amount.amountId, guess * 10 ** 8)
                  const tableChannel = interaction.client.channels.cache.get(TABLE_CHANNEL_ID)
                  tableChannel.send(`@${util.getDiscordName(interaction.client, interaction.user.id)} betted for ${betting.periodString} ${token.tokenName} $${amount.amount} betting`)
                } catch (error) {
                  console.error(error)
                }
                // interaction.response(`You entered the bet for ${token.tokenName} with a bet amount of $${amount.amount}`);
                interaction.deleteReply().catch(() => { });
              } else {
                interaction.deleteReply().catch(() => { });
              }
            })
            .catch((error) => {
              console.error(error)
              interaction.deleteReply().catch(() => { });
            });
        });
    }
  },
};

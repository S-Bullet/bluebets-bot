import { ActionRowBuilder, StringSelectMenuBuilder, TextInputStyle, ComponentType, EmbedBuilder, ButtonBuilder } from "discord.js";
import * as util from "../util.js"
import dotenv from "dotenv"
dotenv.config('./../../.env');

import { createRequire } from "module"
const require = createRequire(import.meta.url)
const bet_networks = require("./../env.json")


export default {
  name: "bet",
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const { api } = interaction.client;

      const bet_network_name = interaction.customId.split("_")[0];
      const type = interaction.customId.split("_")[2];

      api.setBetNetwork(bet_network_name);
      
      if (type == "register") {
        const row = new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setURL(`${process.env.REGISTER_SERVER_URL}?discordid=${interaction.user.id}?networkchainid=${bet_networks[bet_network_name]["CHAIN_ID"]}`)
            .setLabel("Yes")
            .setStyle("Link"),
          new ButtonBuilder()
            .setCustomId("no")
            .setLabel("No")
            .setStyle("Danger")
        );

        interaction.response({
          embeds: [{
            title: `Do you agree to register your ID with Bluebet?`,
          }],
          components: [row],
          ephemeral: true,
        }).then((m) => {
          m.awaitMessageComponent({
          }).then(async (i) => {
            interaction.deleteReply().catch(() => { });
          })
        })
      } else if (type == "list-period") {
        const availableBettings = await api.getAvailableBettings()
        //const availableBettings = await api.getAvailableBettings(bet_network_name)

        if (!availableBettings.length)
          return interaction.error("No betting is available");

        const row_period = new ActionRowBuilder().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`bet_list-coin_${bet_network_name}`)
            .setPlaceholder("Select a betting")
            .setMaxValues(1)
            .setOptions(
              availableBettings.map((betting) => {
                return {
                  label: `${betting.periodString}`,
                  description: "Betting",
                  value: betting.periodId.toString(),
                };
              })
            )
        );

        const tokens = await api.getTokens()
        const row_token = new ActionRowBuilder().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("bet_list-amount")
            .setPlaceholder("Select token")
            .setMaxValues(1)
            .setOptions(
              tokens.map((token) => {
                return {
                  label: `${token.tokenName}`,
                  description: "Betting",
                  value: `${periodId}_${token.tokenId}`,
                };
              })
            )
        );

        const availableAmounts = await api.getAvailableAmounts(parseInt(periodId), parseInt(tokenId), interaction.user.id)

        if (!availableAmounts.length)
          return interaction.error("No betting amount is available");

        const row_amount = new ActionRowBuilder().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("bet_join")
            .setPlaceholder("Select amount")
            .setMaxValues(1)
            .setOptions(
              availableAmounts.map((amount) => {
                return {
                  label: `$${amount.amount}`,
                  description: "Betting",
                  value: `${periodId}_${tokenId}_${amount.amountId}`,
                };
              })
            )
        );

        const token = await api.getToken(tokenId);
        const row_guess = new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setCustomId("guess")
            .setLabel(`Your Guess for ${token.tokenName}`)
            .setMaxLength(10)
            .setMinLength(1)
            .setRequired(true)
            .setStyle("Short")
            .setPlaceholder("E.g 1250.5")
        );

        interaction.response({
          components: [row_period,row_token,row_amount,row_guess],
          ephemeral: true,
        });
      } else if (type == "available-list") {
        const bettings = await api.getBettings()
        //const bettings = await api.getBettings(bet_network_name)

        if (!bettings.length)
          return interaction.error("No betting is available");

        const fields = []

        for (const betting of bettings) {
          let bettingState = ""
          if (betting.startedTime + betting.period < Date.now()) {
            bettingState = "Betting finished"
          } else if (betting.startedTime > Date.now()) {
            bettingState = "Error"
          } else {
            bettingState = "Betting started"
            if (betting.startedTime + betting.depositPeriod < Date.now()) {
              bettingState += ` (Deposit ended, betting ends in ${util.seconds2time((Date.now() - betting.startedTime - betting.depositPeriod) / 1000)})`
            } else {
              bettingState += ` (Deposit ends in ${util.seconds2time((betting.startedTime + betting.depositPeriod - Date.now()) / 1000)})`
            }
          }
          fields.push({
            name: `${betting.periodString} Betting`,
            value: bettingState,
            inline: false,
          })
        }

        const embed = {
          title: "Bets information",
          fields,
        }

        interaction.response({
          embeds: [embed],
          ephemeral: true,
        });
      } else if (type == "balance") {
        const balance = await api.getUserBalance(interaction.user.id)
        //const balance = await api.getUserBalance(interaction.user.id, bet_network_name)

        const fields = [{
          name: `@${util.getDiscordName(interaction.client, interaction.user.id)}`,
          value: `$${balance}`,
          inline: false,
        }]

        const embed = {
          title: "Balance",
          fields,
        }

        interaction.response({
          embeds: [embed],
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error)
    }
  },
};

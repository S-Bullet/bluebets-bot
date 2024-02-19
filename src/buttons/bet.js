import { ActionRowBuilder, StringSelectMenuBuilder, TextInputStyle, ComponentType, EmbedBuilder, ButtonBuilder } from "discord.js";
import * as util from "../util.js"
import dotenv from "dotenv"
dotenv.config('./../../.env');

export default {
  name: "bet",
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const { api } = interaction.client;

      const type = interaction.customId.split("_")[1];

      if (type == "register") {
        const row = new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setURL(`${process.env.REGISTER_SERVER_URL}?discordid=${interaction.user.id}`)
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

        if (!availableBettings.length)
          return interaction.error("No betting is available");

        const row = new ActionRowBuilder().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("bet_list-coin")
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

        interaction.response({
          components: [row],
          ephemeral: true,
        });
      } else if (type == "available-list") {
        const bettings = await api.getBettings()

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

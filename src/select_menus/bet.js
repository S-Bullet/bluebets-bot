import {
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
} from "discord.js";

export default {
  name: "bet",
  async execute(interaction) {
    try {
      const { api } = interaction.client;
      const type = interaction.customId.split("_")[1];

      if (type == "list-coin") {
        await interaction.deferReply({ ephemeral: true });

        const tokens = await api.getTokens()

        const periodId = parseInt(interaction.values[0])

        const row = new ActionRowBuilder().setComponents(
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

        interaction.response({
          components: [row],
          ephemeral: true,
        });
      } else if (type == "list-amount") {
        await interaction.deferReply({ ephemeral: true });

        const [periodId, tokenId] = interaction.values[0].split("_")
        const availableAmounts = await api.getAvailableAmounts(parseInt(periodId), parseInt(tokenId), interaction.user.id)

        if (!availableAmounts.length)
          return interaction.error("No betting amount is available");

        const row = new ActionRowBuilder().setComponents(
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

        interaction.response({
          components: [row],
          ephemeral: true,
        });
      } else if (type == "join") {
        const [periodId, tokenId, amountId] = interaction.values[0].split("_")

        if (!await api.isBettingOpened(parseInt(periodId))) {
          return interaction.error("Betting is closed");
        }

        const token = await api.getToken(tokenId)

        const modal = new ModalBuilder()
          .setTitle("Bet Join")
          .setCustomId(`bet_guess_${interaction.values[0]}`)
          .setComponents(
            new ActionRowBuilder().setComponents(
              new TextInputBuilder()
                .setCustomId("guess")
                .setLabel(`Your Guess for ${token.tokenName}`)
                .setMaxLength(10)
                .setMinLength(1)
                .setRequired(true)
                .setStyle("Short")
                .setPlaceholder("E.g 1250.5")
            )
          );

        interaction.showModal(modal);
      }
    } catch (error) {
      console.error(error)
    }
  },
};

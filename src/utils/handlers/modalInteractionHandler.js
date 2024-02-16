import { hasCooldown } from "../cooldown.js";

/**
 * @param {import("discord.js").ModalSubmitInteraction} interaction
 */
export default async (interaction) => {
  const { customId } = interaction;
  const command = interaction.client.modals.find((btn) =>
    customId.includes(btn.name)
  );
  if (!command) return;

  // Guild only
  if (interaction.guild) {
    const { me } = interaction.guild.members;

    // Permission check
    if (
      command.required_bot_permissions &&
      command.required_bot_permissions.some(
        (perm) => !me.permissionsIn(interaction.channel).has(perm)
      )
    ) {
      return interaction.response({
        embeds: [
          {
            title: "Insufficient Authority",
            description: "You do not have the necessary permissions to use this command!",
            color: interaction.client.errorColor,
          },
        ],
        ephemeral: true,
      });
    }
  }

  // Cooldown check
  const cooldown = hasCooldown(command, interaction.user.id, "modal");
  if (cooldown)
    return interaction.response({
      embeds: [
        {
          title: "Slow down a little!",
          description: `You must wait \`${cooldown}\` second(s) to use this command again!`,
          color: interaction.client.errorColor,
        },
      ],
      ephemeral: true,
    });

  try {
    await command.execute(interaction);
  } catch (e) {
    console.error(e);

    interaction.response({
      embeds: [
        {
          title: "Something went wrong!",
          description: "An error occurred while using this command, please try again later!",
          color: interaction.client.errorColor,
        },
      ],
      ephemeral: true,
    });
  }
};

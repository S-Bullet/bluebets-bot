import { hasCooldown } from "../cooldown.js";
const { OWNER_ID } = process.env;

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export default async (interaction) => {
  const { commandName } = interaction;
  var commandObj = interaction.client.commands.get(commandName);
  if (!commandObj) return;

  const command = commandObj.data;

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
            description:
              "You do not have the necessary permissions to use this command!",
            color: interaction.client.errorColor,
          },
        ],
        ephemeral: true,
      });
    }
  }

  if (commandObj.slash_data.owner_only && interaction.user.id != OWNER_ID)
    return interaction.error("This command is owner only!");

  // Cooldown check
  const cooldown = hasCooldown(command, interaction.user.id);
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
          description:
            "An error occurred while using this command, please try again later!",
          color: interaction.client.errorColor,
        },
      ],
      ephemeral: true,
    });
  }
};

import { allowGuild, disallowGuild } from "../../utils/allowed_guilds.js";

export const data = {
  name: "guild-permission",
  permission: "ManageGuild",
  cooldown: 3,
  description: "Gives / removes a guild to use the bot.",
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const { allowedGuilds } = interaction.client;
      const guild_id = interaction.options.getString("guild_id");
      const action = interaction.options.getString("action");

      if (action == "give") {
        if (allowedGuilds.includes(guild_id))
          return interaction.error(
            "This guild is already allowed to use the bot."
          );

        allowGuild(interaction.client, guild_id);

        interaction.success(
          `The guild with the id \`${guild_id}\` is allowed to use the bot.`
        );
      } else if (action == "remove") {
        if (!allowedGuilds.includes(guild_id))
          return interaction.error(
            "This guild is already not allowed to use the bot."
          );

        disallowGuild(interaction.client, guild_id);

        interaction.success(
          `The guild with the id \`${guild_id}\` is not allowed to use the bot.`
        );
      }
    } catch (error) {
      console.error(error)
    }
  },
};

export const slash_data = {
  name: data.name,
  description: data.description,
  owner_only: true,
  default_member_permissions: 8n,
  dm_permission: false,
  options: [
    {
      name: "guild_id",
      description: "The id of the guild to give / remove permission to.",
      type: 3,
      required: true,
      min_length: 17,
      max_length: 20,
    },
    {
      name: "action",
      description: "The action to perform.",
      type: 3,
      required: true,
      choices: [
        {
          name: "Give",
          value: "give",
        },
        {
          name: "Remove",
          value: "remove",
        },
      ],
    },
  ],
};

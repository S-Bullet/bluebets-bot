import commandInteractionHandler from "../utils/handlers/commandInteractionHandler.js";
import buttonInteractionHandler from "../utils/handlers/buttonInteractionHandler.js";
import modalInteractionHandler from "../utils/handlers/modalInteractionHandler.js";
import selectMenuInteractionHandler from "../utils/handlers/selectmenuInteractionHandler.js";
import autoCompleteInteractionHandler from "../utils/handlers/autocompleteInteractionHandler.js";

/**
 * @param {import("discord.js").ChatInputCommandInteraction | import("discord.js").ButtonInteraction | import("discord.js").AnySelectMenuInteraction | import("discord.js").ModalSubmitInteraction | import("discord.js").AnySelectMenuInteraction} interaction
 */
export default (interaction) => {
  if (interaction.guild && !interaction.client.allowedGuilds.includes(interaction.guildId)) return interaction.error("This guild is not allowed to use the bot.")

  if (interaction.isChatInputCommand())
    return commandInteractionHandler(interaction);
  else if (interaction.isButton()) return buttonInteractionHandler(interaction);
  else if (interaction.isModalSubmit())
    return modalInteractionHandler(interaction);
  else if (interaction.isAnySelectMenu())
    return selectMenuInteractionHandler(interaction);
  else if (interaction.isAutocomplete()) return autoCompleteInteractionHandler(interaction);
};

/**
 * @param {import("discord.js").AutocompleteInteraction} interaction
 */
export default async (interaction) => {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.autocomplete(interaction);
    } catch (e) {
        console.error(e);
    }
};

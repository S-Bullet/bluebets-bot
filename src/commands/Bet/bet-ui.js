import { ActionRowBuilder, ButtonBuilder } from "discord.js";
import urlRegex from "url-regex";

import { createRequire } from "module"
const require = createRequire(import.meta.url)
const bet_networks = require("./../../env.json")

const network_choices = [];
bet_networks["BET_NETWORKS"].forEach((networkName) => {	
  network_choices.push({ name: networkName, value: networkName });
});

export const data = {
  name: "bet-ui",
  description: "Sends the bet UI!",
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const bet_network_name = interaction.options.getString("network") || "POLYGON";
      const channel = interaction.options.getChannel("channel") || interaction.channel;

      const bet_ui_image_url =
        interaction.options.getString("bet_ui_image_url") ||
        "https://bluespade.xyz/static/media/gmx-logo-with-name.e477745f19008fe6aa65.png";
      const bet_ui_embed_text =
        interaction.options.getString("bet_ui_embed_text");

      if (!channel.isTextBased())
        return interaction.error("Please provide a valid text channel.");
      if (
        bet_ui_image_url &&
        urlRegex({ exact: true }).test(bet_ui_image_url) == false
      )
        return interaction.error(`The image URL is invalid.`);

      const row = new ActionRowBuilder().setComponents(
        new ButtonBuilder()
          .setCustomId(`${bet_network_name}_bet_register`)
          .setLabel("Register")
          .setStyle("Success"),
        new ButtonBuilder()
          .setCustomId(`${bet_network_name}_bet_list-period`)
          .setLabel("Join Bets")
          .setStyle("Success"),
        new ButtonBuilder()
          .setCustomId(`${bet_network_name}_bet_available-list`)
          .setLabel("Information")
          .setStyle("Primary"),
        new ButtonBuilder()
          .setCustomId(`${bet_network_name}_bet_balance`)
          .setLabel("Balance")
          .setStyle("Secondary")
      );

      const network_icon_img_url = bet_networks[bet_network_name]["COIN_IMG_URL"];
      channel.response({
        embeds: [
          {
            thumbnail: network_icon_img_url ? { url: network_icon_img_url } : undefined,
            title: `Bets on ${bet_network_name}`,
            description: bet_ui_embed_text || 'Press the button below to list or join the bets.',
            color: interaction.client.defaultColor,
            image: bet_ui_image_url ? { url: bet_ui_image_url } : undefined,
          },
        ],
        components: [row],
      });

      interaction.success(
        `✅ Successfully send the Bet UI embed to <#${channel.id}>.`
      );
    } catch (error) {
      console.error(error)
    }
  },
};

export const slash_data = {
  name: data.name,
  description: data.description,
  owner_only: false,
  default_member_permissions: 8n,
  options: [
    {
      name: "network",
      description: "The blockchain network where you'd like to bet.",
      type: 3,
      required: false,
      choices: network_choices,
    },
    {
      name: "channel",
      description: "The channel you'd like to post the bet ui embed.",
      type: 7,
      required: false,
      channel_types: [0, 5, 13],
    },
    {
      name: "bet_ui_image_url",
      description:
        "URL of a custom image/gif you'd like to place on the bet embed",
      type: 3,
      required: false,
    },
    {
      name: "bet_ui_embed_text",
      description: "Custom text you'd like to add to the bet embed.",
      type: 3,
      required: false,
    },
  ],
};

import { BaseInteraction, BaseGuildTextChannel } from "discord.js";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });
const { FOOTER_IMAGE_URL, FOOTER_TEXT } = process.env;
/**
 *
 * @param {Number} ms
 */
export function msToTimeString(ms) {
  const days = Math.floor(ms / 1000 / 60 / 60 / 24);
  const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const seconds = Math.floor((ms / 1000) % 60);

  let timeString = "";
  if (days > 0) timeString += `${days} days `;
  if (hours > 0) timeString += `${hours} hours `;
  if (minutes > 0) timeString += `${minutes} minutes `;
  if (seconds > 0) timeString += `${seconds} seconds `;

  return timeString.trim() || "-";
}

export const stringToPascalCase = (str) => {
  return str
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
};

export function formatDateToDDMMYY_HHMM(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Aylar 0 ile başlar
  const year = String(date.getFullYear()).slice(-2); // Son iki rakamı alır
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year}-${hours}.${minutes}`;
}

export function relativeMsToTimeString(ms) {
  const days = Math.floor(ms / 1000 / 60 / 60 / 24);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;

  const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;

  const minutes = Math.floor((ms / 1000 / 60) % 60);
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;

  const seconds = Math.floor((ms / 1000) % 60);
  if (seconds > 0) return `${seconds} second${seconds > 1 ? "s" : ""}`;
}

export function roundNumber(number) {
  if (number < 1000) return number.toString();
  else if (number < 1000000) return `${(number / 1000).toFixed(2)}k`;
  else if (number < 1000000000) return `${(number / 1000000).toFixed(2)}m`;
  else return `${(number / 1000000000).toFixed(2)}b`;
}

export const prototypeOverwrites = () => {
  BaseInteraction.prototype.response = async function (options) {
    if (options.embeds?.length)
      options.embeds.forEach((embed) => {
        if (!embed.footer)
          embed.footer = { text: FOOTER_TEXT, iconURL: FOOTER_IMAGE_URL };
      });

    // Options Control for Banned Words
    if (this.deferred || this.replied) return this.editReply(options);
    else return this.reply(options);
  };

  BaseInteraction.prototype.error = async function (description) {
    return this.response({
      embeds: [
        {
          description,
          color: this.client.errorColor,
        },
      ],
      components: [],
      files: [],
      ephemeral: true,
    });
  };

  BaseInteraction.prototype.success = async function (description) {
    return this.response({
      embeds: [
        {
          description,
          color: this.client.successColor,
        },
      ],
      components: [],
      files: [],
      ephemeral: true,
    });
  };

  BaseInteraction.prototype.info = async function (
    description,
    ephemeral = false
  ) {
    return this.response({
      embeds: [
        {
          description,
          color: this.client.defaultColor,
        },
      ],
      ephemeral,
    });
  };

  BaseGuildTextChannel.prototype.response = async function (options) {
    if (options.embeds?.length)
      options.embeds.forEach((embed) => {
        if (!embed.footer)
          embed.footer = { text: FOOTER_TEXT, iconURL: FOOTER_IMAGE_URL };
      });

    return this.send(options);
  };

  // * String
  String.prototype.toCapitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
};

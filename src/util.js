// import {
// 	OWNER_GUILD_ID
// } from "./config.js"
import dotenv from "dotenv"
dotenv.config({ path : './../.env' });
const OWNER_GUILD_ID = process.env.OWNER_GUILD_ID;

export const seconds2time = (seconds) => {
	let minutes = parseInt(seconds / 60)
	seconds %= 60

	let hours = parseInt(minutes / 60)
	minutes %= 60

	let days = parseInt(hours / 24)
	hours %= 24

	if (days > 0) {
		return `${days} ${days === 1 ? "day" : "days"}`
	} else if (hours > 0) {
		return `${hours} ${hours === 1 ? "hour" : "hours"}`
	} else if (minutes > 0) {
		return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`
	} else if (seconds > 0) {
		return "less than 1 minute"
	} else {
		return 0
	}
}

export const getDiscordName = (client, userId) => {
	try {
		const guild = client.guilds.cache.get(OWNER_GUILD_ID)
		const member = guild.members.cache.get(userId)
		return member.displayName || member.nickname
	} catch (error) {
		console.error(error)
	}
}
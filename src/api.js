import Web3 from "web3"
// import {
// 	RPC_HTTP_PROVIDER_URL,
// 	CONTRACT_ADDRESS,
// 	PRIVATE_KEY,
// } from "./config.js"
import dotenv from "dotenv"
dotenv.config({ path : './../.env' });
const RPC_HTTP_PROVIDER_URL = process.env.RPC_HTTP_PROVIDER_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

import { readdir } from "fs";
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const BET_ABI = require("./bet_contracts/BET-ABI.json")
const ERC20_ABI = require("./ERC20-ABI.json")

const MAX_TOKEN_TYPE = 3
const MAX_AMOUNT_TYPE = 3

const bet_contracts = new Map();
readdir("./bet_contracts", { encoding: "utf-8" }, (err, files) => {
	if (err) return console.error(err);

	files
		.filter((file) => file.endsWith(".json"))
		.forEach((file) => {
			const contractName = file.split(".")[0];
			if (contractName == "ready") {

			} else {
				const contract = require(`./bet_contracts/${file}`);
				
				bet_contracts[contractName] = contract;
				// bet_contracts.push({
				// 	name : contractName,
				// 	contract : contract
				// });
			}
		});
	
	console.log("###", bet_contracts);
})

const web3 = new Web3(new Web3.providers.HttpProvider(RPC_HTTP_PROVIDER_URL))
const ADMIN_PUBKEY = web3.eth.accounts.wallet.add(PRIVATE_KEY)[0].address
const betContract = new web3.eth.Contract(BET_ABI, CONTRACT_ADDRESS, { from: ADMIN_PUBKEY })

export const getUserBalance = async (userId) => {
	const { account, discordName, communityId, isRegistered } = await betContract.methods.userListByDiscordName(userId).call()
	if (!isRegistered) return 0
	let balance = await betContract.methods.userBalance(account).call()
	return Number(balance) / 10 ** 6
}

export const getBetting = async (periodId) => {
	const betInfo = await betContract.methods.betInfoBatch(periodId).call()

	if (betInfo.period < 60) {
		return
	}

	let periodString = ""

	let hours = parseInt(Number(betInfo.period) / (60 * 60))
	let days = parseInt(hours / 24)
	let weeks = parseInt(days / 7)

	if (weeks > 0) {
		if (weeks === 1) {
			periodString = "1 Week"
		} else {
			periodString = `${weeks} Weeks`
		}
	} else if (days > 0) {
		if (days === 1) {
			periodString = "1 Day"
		} else {
			periodString = `${days} Days`
		}
	} else {
		if (hours === 1) {
			periodString = "1 Hour"
		} else {
			periodString = `${hours} Hours`
		}
	}

	return {
		periodId,
		period: Number(betInfo.period) * 1000,
		periodString,
		depositPeriod: Number(betInfo.periodToDeposit) * 1000,
		bettingAmount: Number(betInfo.bettingAmount) / 10 ** 6,
		startedTime: Number(betInfo.startedTime) * 1000,
		status: Number(betInfo.status),
		betInfo: betInfo.betInfo,
	}
}

export const getBettings = async () => {
	const periodCount = await betContract.methods.cntTimeType().call()

	const bettings = []

	for (let i = 0; i < periodCount; i++) {
		bettings.push(await getBetting(i))
	}

	return bettings
}

export const getAvailableBettings = async () => {
	const bettings = await getBettings()
	const availableBettings = []

	const now = Date.now()

	for (const betting of bettings) {
		if (now < betting.startedTime + betting.depositPeriod) {
			availableBettings.push(betting)
		}
	}

	return availableBettings
}

export const isBettingOpened = async (periodId) => {
	const betting = await getBetting(periodId)

	if (Date.now() > betting.startedTime && Date.now() < betting.startedTime + betting.depositPeriod) {
		return true
	}

	return false
}

export const getToken = async (tokenId) => {
	tokenId = parseInt(tokenId)
	const tokenAddress = await betContract.methods.tokenTypeList(tokenId).call()
	// const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress)
	// const tokenName = await tokenContract.methods.symbol().call()
	const tokenName = tokenId === 0 ? "BTC" : tokenId === 1 ? "ETH" : "MATIC";

	return {
		tokenId,
		tokenAddress,
		tokenName,
	}
}

export const getTokens = async () => {
	const tokenCount = await betContract.methods.cntTokenType().call()

	const tokens = []

	for (let i = 0; i < tokenCount; i++) {
		tokens.push(await getToken(i))
	}

	return tokens
}

export const isBetted = async (periodId, tokenId, amountId, userId) => {
	const bettedUsers = await betContract.methods.getBettedUsers(periodId, tokenId, amountId).call()

	if (!bettedUsers._cntUsers) {
		return false
	}

	for (const userIdInBet of bettedUsers._bettedUserDiscordNames) {
		if (userId === userIdInBet) {
			return true
		}
	}

	return false
}

export const getAmount = async (periodId, tokenId, amountId) => {
	const amount = await betContract.methods.getBettingAmounts(periodId, tokenId).call()

	return {
		amountId,
		amount: Number(amount[amountId]) / 10 ** 6,
	}
}

export const getAmounts = async (periodId, tokenId) => {
	const amounts = await betContract.methods.getBettingAmounts(periodId, tokenId).call()

	const amounts2 = []
	for (let i = 0; i < MAX_AMOUNT_TYPE; i++) {
		amounts2.push({
			amountId: i,
			amount: Number(amounts[i]) / 10 ** 6,
		})
	}

	return amounts2
}

export const getAvailableAmounts = async (periodId, tokenId, userId) => {
	const amounts = await getAmounts(periodId, tokenId)

	const availableAmounts = []

	for (const amount of amounts) {
		if (!await isBetted(periodId, tokenId, amount.amountId, userId)) {
			availableAmounts.push(amount)
		}
	}

	return availableAmounts
}

export const getWinners = async (periodId, tokenId, amountId) => {
	return await betContract.methods.getWinners(periodId, tokenId, amountId).call()
}

export const getUserInfo = async (userAddress) => {
	return await betContract.methods.userListByAddress(userAddress).call()
}

export const startBetting = async (periodId) => {
	try {
		const gas = await betContract.methods.startBetting(periodId).estimateGas({ from: ADMIN_PUBKEY });
		const gasPrice = await web3.eth.getGasPrice();

		await betContract.methods.startBetting(periodId).send({ from: ADMIN_PUBKEY, gas: gas, gasPrice: gasPrice })

		console.log("Bluebet log: startBetting timeType = ", periodId);
	} catch (error) {
		console.error(error)
	}
}

export const stopBetting = async (periodId) => {
	try {
		const gas = await betContract.methods.endBetting(periodId).estimateGas({ from: ADMIN_PUBKEY });
		const gasPrice = await web3.eth.getGasPrice();

		await betContract.methods.endBetting(periodId).send({ from: ADMIN_PUBKEY, gas: gas, gasPrice: gasPrice })

		console.log("Bluebet log: endBetting timeType = ", periodId);
	} catch (error) {
		console.error(error)
	}
}

export const doBetting = async (userId, periodId, tokenId, amountId, prediction) => {
	try {
		const gas = await betContract.methods.doBet(userId, periodId, tokenId, amountId, prediction).estimateGas({ from: ADMIN_PUBKEY });
		const gasPrice = await web3.eth.getGasPrice();

		betContract.methods.doBet(userId, periodId, tokenId, amountId, prediction).send({ from: ADMIN_PUBKEY, gas: gas, gasPrice: gasPrice })

		console.log(`Bluebet log: doBet userId=${userId}, timeType=${periodId}, tokenType=${tokenId}, amountType=${amountId}, prediction=${prediction}`);
	} catch (error) {
		console.error(error)
	}
}

import { scheduleJob } from "node-schedule";
const { COINMARKETCAP_API_KEY } = process.env;

export function cryptoSymbolToName(symbol) {
  var type_text = "";
  switch (symbol) {
    case "btc":
      type_text = "Bitcoin";
      break;
    case "eth":
      type_text = "Ethereum";
      break;
    case "matic":
      type_text = "Matic";
      break;
    case "cro":
      type_text = "Cronos";
      break;
    default:
      type_text = "Blockchain"
      break;
  }

  return type_text;
}

export async function betResults(client, bet_db) {
  const currentPrice = await currentCurrencyAmount(bet_db.coin);

  const { betEntries, betAmount } = bet_db;

  const totalBetAmount = betAmount * Object.keys(betEntries).length;
  const winAmount = ((totalBetAmount - betAmount) * 85) / 100 + betAmount;

  // Find the winner that is closest to the current price
  var winner_id = null;
  var winnerDiff = null;
  for (const [key, value] of Object.entries(betEntries)) {
    const diff = Math.abs(value - currentPrice);
    if (winnerDiff == null || diff < winnerDiff) {
      winner_id = key;
      winnerDiff = diff;
    }
  }

  client.channels
    .fetch(bet_db.channelId)
    .then((c) => {
      c.send({
        embeds: [
          {
            title: `Bet results for ${cryptoSymbolToName(bet_db.coin)}!`,
            fields: [
              {
                name: "Bet Amount",
                value: bet_db.betAmount.toString(),
                inline: true,
              },
              {
                name: `Current ${cryptoSymbolToName(bet_db.coin)} Price`,
                value: `${currentPrice} $`,
                inline: true,
              },
              {
                name: "Winner",
                value: winner_id ? `<@${winner_id}>` : "No winner",
                inline: true,
              },
              {
                name: `Winner Guess`,
                value: winner_id
                  ? `${betEntries[winner_id]} $ (${winnerDiff.toFixed(
                    4
                  )} $ off)`
                  : "No winner",
                inline: true,
              },
              {
                name: "Win Amount",
                value: winAmount ? `${winAmount} $` : "No winner",
                inline: true,
              },
            ],
            color: 0xf0f0f0,
          },
        ],
      });
    })
    .catch(() => { });

  await BetsDb.updateOne(
    { id: bet_db.id },
    {
      $set: {
        winnerId: winner_id,
        winAmount: winAmount,
        finished: true,
      },
    }
  );

  await UsersDb.updateOne(
    {
      userId: winner_id,
    },
    {
      $inc: {
        balance: winAmount,
      },
    }
  );

  client.users
    .fetch(winner_id)
    .then((user) => {
      user.send({
        embeds: [
          {
            title: `Congratulations!`,
            description: `You won the bet for ${cryptoSymbolToName(
              bet_db.coin
            )}! You won ${winAmount} $!`,
            color: 0xf0f0f0,
          },
        ],
      });
    })
    .catch(() => { });
}

export function updateBetInfo(client, bet_db) {
  client.channels
    .fetch(bet_db.channelId)
    .then(async (c) => {
      const currentPrice = await currentCurrencyAmount(bet_db.coin);

      c.send({
        embeds: [
          {
            title: `Bet update for ${cryptoSymbolToName(bet_db.coin)}!`,
            fields: [
              {
                name: "Bet Amount",
                value: bet_db.betAmount.toString(),
                inline: true,
              },
              {
                name: `Current ${cryptoSymbolToName(bet_db.coin)} Price`,
                value: `${currentPrice} $`,
                inline: true,
              },
            ],
            color: 0xf0f0f0,
          },
        ],
      });
    })
    .catch(() => { });
}

export function currentCurrencyAmount(symbol) {
  symbol = symbol.toUpperCase();
  return new Promise((resolve, reject) => {
    fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`,
      {
        headers: {
          Accepts: "application/json",
          "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          reject(response);
        }
        return response.json();
      })
      .then((data) => {
        const price = data?.data?.[symbol]?.quote?.USD?.price;
        resolve(price.toFixed(4));
      })
      .catch((error) => reject(error));
  });
}

export function startBet(client, bet) {
  if (!bet.endsAt) return;

  if (bet.endsAt < new Date()) {
    betResults(client, bet);
    return;
  }

  const betClosedTimestamp = bet.createdAt.getTime();
  const every30Minutes = [];
  for (
    let i = betClosedTimestamp;
    i < bet.endsAt.getTime();
    i += 1000 * 60 * 30
  ) {
    every30Minutes.push(i);
  }
  const now = Date.now();

  every30Minutes.forEach((timestamp) => {
    if (timestamp > now) {
      scheduleJob(timestamp, () => {
        updateBetInfo(client, bet);
      });
    }
  });
  if (bet.endsAt.getTime() > now) {
    scheduleJob(bet.endsAt.getTime(), () => {
      betResults(client, bet);
    });
  }
}

export function betEmbed(bet_db, detailed = false) {
  const fields = [
    { name: "Bet Amount", value: bet_db.betAmount.toString(), inline: true },
    {
      name: "Total Amount",
      value: (
        bet_db.betAmount * Object.keys(bet_db.betEntries).length
      ).toString(),
      inline: true,
    },
    {
      name: "Total Entries",
      value: Object.keys(bet_db.betEntries).length,
      inline: true,
    },
    {
      name: "Status",
      value: !bet_db.endsAt
        ? "Bets are open"
        : `Bets are closed. ${!bet_db.finished
          ? `Results <t:${Math.floor(bet_db.endsAt.getTime() / 1000)}:R>`
          : ""
        }`,
      inline: true,
    },
  ];

  if (bet_db.finished) {
    fields.push({
      name: "Winner",
      value: bet_db.winnerId ? `<@${bet_db.winnerId}>` : "No winner",
      inline: true,
    });

    fields.push({
      name: `Winner Guess`,
      value: bet_db.winnerId
        ? `${bet_db.betEntries[bet_db.winnerId]} $`
        : "No winner",
      inline: true,
    });

    fields.push({
      name: "Win Amount",
      value: bet_db.winAmount ? `${bet_db.winAmount} $` : "No winner",
      inline: true,
    });
  } else if (bet_db.open == false) {
    const w_amount =
      (bet_db.betAmount * (Object.keys(bet_db.betEntries).length - 1) * 85) /
      100 +
      bet_db.betAmount;
    fields.push({
      name: "Win Amount",
      value: w_amount ? `${w_amount} $` : "No winner amount",
      inline: true,
    });
  }

  var type_text = "";
  switch (bet_db.coin) {
    case "btc":
      type_text = "Bitcoin";
      break;
    case "eth":
      type_text = "Ethereum";
      break;
    case "matic":
      type_text = "Matic";
      break;
    case "cro":
      type_text = "Cronos";
      break;
  }

  const embed = {
    title: `Bets for ${type_text}`,
    fields,
    description: detailed
      ? `**Attenders:** ${Object.keys(bet_db.betEntries)
        .map((id) => `<@${id}>`)
        .join(" - ")
        .slice(0, 4000)}`
      : null,
    color: 0xf0f0f0,
  };

  return { embeds: [embed], ephemeral: true };
}

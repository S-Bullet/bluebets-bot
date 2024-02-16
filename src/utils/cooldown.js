const { OWNER_ID } = process.env;

const cooldowns = new Map();
const DEFAULT_COOLDOWN = parseInt(process.env.DEFAULT_COOLDOWN) || 5;

export const hasCooldown = (command, user_id, type = "slash") => {
  // If cooldown property is false or the user is bot owner, return false
  if (command.cooldown == false || user_id == OWNER_ID) return false;

  const commandName = `${type}_${command.name}`;

  if (!cooldowns.has(commandName)) cooldowns.set(commandName, new Map());
  const timestamps = cooldowns.get(commandName);

  const cooldownAmount = (command.cooldown || DEFAULT_COOLDOWN) * 1000;
  const now = Date.now();

  // Save timestamp if not exists and return false
  if (!timestamps.has(user_id)) {
    timestamps.set(user_id, now);
    setTimeout(() => timestamps.delete(user_id), cooldownAmount);
    return false;
  }

  // Calculate expiration time
  const expirationTime = timestamps.get(user_id) + cooldownAmount;
  if (expirationTime >= now) {
    const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
    return timeLeft == parseInt(timeLeft) ? parseInt(timeLeft) : timeLeft;
  } else return false;
};

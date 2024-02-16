export const data = {
  name: "help",
  description: "The help command",
  async execute(interaction) {
    interaction.response({
      embeds: [
        {
          title: "BLUEBETS",
          description: `**/balance**: 
		  You can see your balance
		  
		  **/leaderboard**: 
		  You can see the top 10 people with the highest balance
		  
		  **/withdraw**: 
		  You can create a request to withdraw your balace to your wallet
		  
		  **/bet**: 
		  You can join an open bet
		  
		  **/bet-info**: 
		  You can get information about an open bet
		  
		  
		  **We will explain BlueBet here**`,
          color: interaction.client.defaultColor,
        },
      ],
    });
  },
};

export const slash_data = {
  name: data.name,
  description: data.description,
};

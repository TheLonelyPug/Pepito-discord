import discord
from discord.ext import commands
from discord import app_commands
import json
import os

class AnnounceCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db_path = "channels.json"
        self.developer_server_id = int(os.getenv("DEVELOPER_SERVER_ID"))  # Load from .env

    @app_commands.command(name="announce", description="Send a global announcement to all servers.")
    async def announce(self, interaction: discord.Interaction, message: str):
        # Check if the command is executed in the developer server
        if interaction.guild.id != self.developer_server_id:
            await interaction.response.send_message(
                "This command can only be used in the developer server.", ephemeral=True
            )
            return

        # Load the channels database
        if not os.path.exists(self.db_path):
            await interaction.response.send_message(
                "No channels have been set yet.", ephemeral=True
            )
            return

        with open(self.db_path, "r") as f:
            data = json.load(f)

        # Send the announcement to all servers with a set channel
        failed_guilds = []
        for guild_id, info in data.items():
            channel_id = int(info["channel_id"])
            channel = self.bot.get_channel(channel_id)
            if channel:
                try:
                    # Create an embed for the announcement
                    embed = discord.Embed(
                        title="This is a global announcement from Pépito! 🐈",
                        description=message,
                        color=discord.Color.blue()
                    )
                    await channel.send(embed=embed)
                except Exception as e:
                    failed_guilds.append(info["server_name"])
            else:
                failed_guilds.append(info["server_name"])

        # Respond to the user
        if failed_guilds:
            failed_list = "\n".join(failed_guilds)
            await interaction.response.send_message(
                f"Announcement sent, but failed to deliver to the following servers:\n{failed_list}",
                ephemeral=True
            )
        else:
            await interaction.response.send_message(
                "Announcement sent successfully to all servers!", ephemeral=True
            )

# Add this setup function
async def setup(bot):
    await bot.add_cog(AnnounceCog(bot))
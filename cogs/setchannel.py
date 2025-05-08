import discord
from discord.ext import commands
from discord import app_commands
import json
import os

class SetChannelCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db_path = "channels.json"
        # Ensure the JSON database exists
        if not os.path.exists(self.db_path):
            with open(self.db_path, "w") as f:
                json.dump({}, f)

    @app_commands.command(name="setchannel", description="Set a channel for the bot to use.")
    async def setchannel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        guild_id = str(interaction.guild.id)
        guild_name = interaction.guild.name
        channel_id = str(channel.id)

        # Load the current database
        with open(self.db_path, "r") as f:
            data = json.load(f)

        # Update the database with the new channel information
        data[guild_id] = {
            "server_name": guild_name,
            "channel_id": channel_id
        }

        # Save the updated database with special characters preserved
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        # Create an embed for the response
        embed = discord.Embed(
            title="Channel Set Successfully",
            description=f"The channel {channel.mention} has been set for Pépito notifications!",
            color=discord.Color.green()
        )
        embed.add_field(name="Server Name", value=guild_name, inline=False)
        embed.add_field(name="Channel ID", value=channel_id, inline=False)

        await interaction.response.send_message(embed=embed, ephemeral=True)

    @commands.Cog.listener()
    async def on_guild_remove(self, guild: discord.Guild):
        """Remove the guild from the database when the bot is removed from the server."""
        guild_id = str(guild.id)

        # Load the current database
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                data = json.load(f)

            # Remove the guild from the database if it exists
            if guild_id in data:
                del data[guild_id]
                with open(self.db_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                print(f"Removed guild {guild.name} (ID: {guild_id}) from the database.")

# Add this setup function
async def setup(bot):
    await bot.add_cog(SetChannelCog(bot))
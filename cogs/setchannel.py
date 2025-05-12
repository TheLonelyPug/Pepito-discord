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

    async def ensure_all_guilds_in_db(self):
        """Ensure all guilds the bot is in are added to the database."""
        # Load the current database
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                data = json.load(f)
        else:
            data = {}

        # Check all guilds the bot is in
        for guild in self.bot.guilds:
            guild_id = str(guild.id)
            if guild_id not in data:
                # Add the guild to the database if it doesn't already exist
                data[guild_id] = {
                    "server_name": guild.name
                }
                print(f"Added missing guild {guild.name} (ID: {guild_id}) to the database.")

        # Save the updated database
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    @commands.Cog.listener()
    async def on_ready(self):
        """Ensure all guilds are in the database when the bot starts."""
        await self.ensure_all_guilds_in_db()

    def is_admin():
        """Check if the user has administrator permissions."""
        async def predicate(interaction: discord.Interaction):
            return interaction.user.guild_permissions.administrator
        return app_commands.check(predicate)

    @app_commands.command(name="setchannel", description="Set a channel for the bot to use.")
    @is_admin()  # Restrict to administrators
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
        embed.set_footer(text="Pépito Notification System")

        await interaction.response.send_message(embed=embed, ephemeral=True)

    @setchannel.error
    async def setchannel_error(self, interaction: discord.Interaction, error):
        """Handle errors for the /setchannel command."""
        if isinstance(error, app_commands.CheckFailure):
            # Create an embed for the error message
            embed = discord.Embed(
                title="Permission Denied",
                description="You do not have permission to use this command. Only administrators can set the notification channel.",
                color=discord.Color.red()
            )
            embed.set_footer(text="Pépito Notification System")
            await interaction.response.send_message(embed=embed, ephemeral=True)

    @commands.Cog.listener()
    async def on_guild_join(self, guild: discord.Guild):
        """Add the guild to the database when the bot is added to the server."""
        guild_id = str(guild.id)
        guild_name = guild.name

        # Load the current database
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                data = json.load(f)
        else:
            data = {}

        # Add the guild to the database if it doesn't already exist
        if guild_id not in data:
            data[guild_id] = {
                "server_name": guild_name
            }
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            print(f"Added guild {guild_name} (ID: {guild_id}) to the database.")

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

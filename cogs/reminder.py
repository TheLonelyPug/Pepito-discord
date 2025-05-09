import discord
from discord.ext import commands, tasks
import json
import os

class ReminderCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db_path = "channels.json"
        self.reminder_task.start()  # Start the reminder task when the cog is loaded

    def cog_unload(self):
        self.reminder_task.cancel()  # Stop the task when the cog is unloaded

    @tasks.loop(hours=24)  # Run the reminder task every 24 hours
    async def reminder_task(self):
        # Load the channels database
        if not os.path.exists(self.db_path):
            print(f"{self.db_path} not found. Skipping reminder task.")
            return

        with open(self.db_path, "r") as f:
            data = json.load(f)

        # Iterate through all guilds the bot is in
        for guild in self.bot.guilds:
            guild_id = str(guild.id)

            # Skip guilds that already have a channel set
            if guild_id in data and "channel_id" in data[guild_id]:
                continue

            # Find a channel where the bot can send messages
            for channel in guild.text_channels:
                if channel.permissions_for(guild.me).send_messages:
                    # Create the reminder embed
                    embed = discord.Embed(
                        title="Pépito Reminder",
                        description=(
                            f"Hello <@{guild.owner_id}>, it seems you haven't set a notification channel for Pépito yet! "
                            f"Please use the `/setchannel` command to configure one."
                        ),
                        color=discord.Color.orange()
                    )
                    try:
                        await channel.send(embed=embed)
                        print(f"Sent reminder to {guild.name} (ID: {guild.id}) in channel {channel.name}.")
                    except Exception as e:
                        print(f"Failed to send reminder to {guild.name} (ID: {guild.id}): {e}")
                    break  # Stop after sending the message to one channel

    @reminder_task.before_loop
    async def before_reminder_task(self):
        await self.bot.wait_until_ready()  # Wait until the bot is ready before starting the task

# Add this setup function
async def setup(bot):
    await bot.add_cog(ReminderCog(bot))

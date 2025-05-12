import discord
from discord.ext import commands, tasks
import json
import os
from datetime import datetime, timedelta

class ReminderCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db_path = "channels.json"
        self.reminder_log_path = "reminder_log.json"  # File to store reminder timestamps
        self.reminder_task.start()  # Start the reminder task when the cog is loaded

    def cog_unload(self):
        self.reminder_task.cancel()  # Stop the task when the cog is unloaded

    def load_reminder_log(self):
        """Load the reminder log from a file."""
        if os.path.exists(self.reminder_log_path):
            with open(self.reminder_log_path, "r") as f:
                return json.load(f)
        return {}

    def save_reminder_log(self, log):
        """Save the reminder log to a file."""
        with open(self.reminder_log_path, "w") as f:
            json.dump(log, f, indent=4)

    @tasks.loop(hours=24)  # Run the reminder task every 24 hours
    async def reminder_task(self):
        # Load the channels database
        if not os.path.exists(self.db_path):
            print(f"{self.db_path} not found. Skipping reminder task.")
            return

        with open(self.db_path, "r") as f:
            data = json.load(f)

        # Load the reminder log
        reminder_log = self.load_reminder_log()

        # Iterate through all guilds the bot is in
        for guild in self.bot.guilds:
            guild_id = str(guild.id)

            # Skip guilds that already have a channel set
            if guild_id in data and "channel_id" in data[guild_id]:
                continue

            # Check if a reminder was sent recently
            last_reminder = reminder_log.get(guild_id)
            if last_reminder:
                last_reminder_time = datetime.fromisoformat(last_reminder)
                if datetime.utcnow() - last_reminder_time < timedelta(days=1):
                    print(f"Skipping reminder for {guild.name} (ID: {guild.id}) - reminder sent recently.")
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
                    embed.set_footer(text="Pépito Notification System")  # Add footer to the embed
                    try:
                        await channel.send(embed=embed)
                        print(f"Sent reminder to {guild.name} (ID: {guild.id}) in channel {channel.name}.")
                        # Update the reminder log
                        reminder_log[guild_id] = datetime.utcnow().isoformat()
                        self.save_reminder_log(reminder_log)
                    except Exception as e:
                        print(f"Failed to send reminder to {guild.name} (ID: {guild.id}): {e}")
                    break  # Stop after sending the message to one channel

    @reminder_task.before_loop
    async def before_reminder_task(self):
        await self.bot.wait_until_ready()  # Wait until the bot is ready before starting the task

# Add this setup function
async def setup(bot):
    await bot.add_cog(ReminderCog(bot))

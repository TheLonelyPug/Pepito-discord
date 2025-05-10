import discord
import os
import json
from datetime import datetime
import pytz  # Import pytz for timezone handling
from discord.ext import commands

class PepitoEventsCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db_path = "channels.json"  # Path to the channels database
        self.oslo_tz = pytz.timezone("Europe/Oslo")  # Set the timezone to Europe/Oslo

async def handle_pepito_event(self, event):
    """Handle a pepito event and post embeds to channels."""
    try:
        event_type = event.get("type")
        event_time = event.get("time")
        event_img = event.get("img")

        # Ensure all required fields are present
        if event_type and event_time and event_img:
            # Convert the event time to Europe/Oslo timezone
            utc_time = datetime.utcfromtimestamp(event_time).replace(tzinfo=pytz.utc)
            oslo_time = utc_time.astimezone(self.oslo_tz)
            formatted_time = oslo_time.strftime("%H:%M:%S")

            # Customize the title based on the event type
            if event_type == "in":
                title = f"Pépito is back home! ({formatted_time})"
            else:
                title = f"Pépito is {event_type}! ({formatted_time})"

            # Create an embed for the event
            embed = discord.Embed(
                title=title,
                color=discord.Color.blue()
            )
            embed.set_image(url=event_img)
            embed.set_footer(text="Pépito Notification System")

            # Load the channels database
            if not os.path.exists(self.db_path):
                print("Channels database not found.")
                return

            with open(self.db_path, "r", encoding="utf-8") as f:
                channels = json.load(f)

            # Send the embed to all channels in the database
            for guild_id, info in channels.items():
                # Check if "channel_id" exists in the guild's data
                if "channel_id" not in info:
                    print(f"Skipping guild {info.get('server_name', 'Unknown Guild')} (ID: {guild_id}) due to missing channel_id.")
                    continue

                channel_id = int(info["channel_id"])
                channel = self.bot.get_channel(channel_id)
                if channel:
                    try:
                        await channel.send(embed=embed)
                        print(f"Sent embed to channel {channel_id} in guild {info['server_name']}")
                    except Exception as e:
                        print(f"Failed to send embed to channel {channel_id}: {e}")
                else:
                    print(f"Channel {channel_id} not found in guild {info['server_name']}")
    except Exception as e:
        print(f"Error handling pepito event: {e}")

# Add this setup function
async def setup(bot):
    await bot.add_cog(PepitoEventsCog(bot))

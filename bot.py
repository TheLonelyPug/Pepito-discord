import discord
from discord.ext import commands
from discord import app_commands
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

# Initialize the bot
bot = commands.Bot(command_prefix='!', intents = discord.Intents.all())

# Load cogs
@bot.event
async def on_ready():
    # Set the bot's activity
    activity = discord.Game(name="/setchannel to get started")
    await bot.change_presence(activity=activity)

    print(f'Logged in as {bot.user} (ID: {bot.user.id})')
    print('------')

    # Load cogs dynamically
    cogs = [
        'cogs.setchannel',      # Set channel cog
        'cogs.announce',        # Announcement cog
        'cogs.api_connection',  # API connection cog
        'cogs.pepito_events',   # Pepito events cog
        'cogs.hello'            # Invited cog
    ]
    for cog in cogs:
        try:
            await bot.load_extension(cog)
            print(f'Loaded {cog}')
        except Exception as e:
            print(f'Failed to load {cog}: {e}')

    # Sync commands globally
    try:
        synced = await bot.tree.sync()  # Use bot.tree to sync commands
        print(f"Synced {len(synced)} commands globally.")
    except Exception as e:
        print(f"Failed to sync commands: {e}")

# Run the bot
bot.run(TOKEN)

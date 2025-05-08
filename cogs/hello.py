import discord
from discord.ext import commands

class HelloCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_guild_join(self, guild: discord.Guild):
        """Send a welcome message when the bot is added to a server."""
        # Try to find a suitable channel to send the message
        channel = guild.system_channel  # Prefer the system channel
        if channel is None or not channel.permissions_for(guild.me).send_messages:
            # Fallback to the first available text channel
            channel = next(
                (ch for ch in guild.text_channels if ch.permissions_for(guild.me).send_messages),
                None
            )

        if channel:
            # Create the embed
            embed = discord.Embed(
                title=f"Hello! Thank you for adding me to {guild.name}",
                description="To get started, please use the `/setchannel` command to set a channel for Pépito notifications.",
                color=discord.Color.green()
            )
            embed.set_footer(text="Pépito Notification System")

            # Send the embed
            try:
                await channel.send(embed=embed)
            except Exception as e:
                print(f"Failed to send welcome message to {guild.name}: {e}")

# Add this setup function
async def setup(bot):
    await bot.add_cog(HelloCog(bot))
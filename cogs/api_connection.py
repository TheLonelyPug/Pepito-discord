import aiohttp
import os
import asyncio
import json
from discord.ext import commands

class APIConnectionCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.api_url = os.getenv("API_URL")  # Load API URL from .env
        self.session = aiohttp.ClientSession()  # Create an aiohttp session
        self.bot.loop.create_task(self.listen_to_sse())  # Start listening to SSE events

    async def listen_to_sse(self):
        """Listen to SSE events from the API."""
        while not self.bot.is_closed():
            try:
                async with self.session.get(self.api_url) as response:
                    if response.status == 200:
                        print("Connected to SSE stream.")
                        async for line in response.content:
                            # Decode the line and process the SSE event
                            event_data = line.decode("utf-8").strip()
                            if event_data:  # Ignore empty lines
                                # Remove the 'data:' prefix if it exists
                                if event_data.startswith("data:"):
                                    event_data = event_data[len("data:"):].strip()

                                # Parse the event data as JSON
                                try:
                                    event = json.loads(event_data)
                                    # Skip logging for heartbeat events
                                    if event.get("event") == "heartbeat":
                                        continue
                                    print(f"Received SSE event: {event_data}")
                                    await self.process_event(event_data)
                                except json.JSONDecodeError:
                                    print(f"Failed to decode event data: {event_data}")
                    else:
                        print(f"Failed to connect to SSE stream: {response.status}")
            except Exception as e:
                print(f"Error in SSE connection: {e}")
            await asyncio.sleep(5)  # Wait before retrying

    async def process_event(self, event_data):
        """Process the received SSE event."""
        try:
            # Remove the 'data:' prefix if it exists
            if event_data.startswith("data:"):
                event_data = event_data[len("data:"):].strip()

            # Parse the event data as JSON
            event = json.loads(event_data)

            # Check if the event is of type "pepito"
            if event.get("event") == "pepito":
                # Pass the event to the pepito_events cog
                pepito_cog = self.bot.get_cog("PepitoEventsCog")
                if pepito_cog:
                    await pepito_cog.handle_pepito_event(event)
                else:
                    print("PepitoEventsCog not found.")
        except json.JSONDecodeError:
            print(f"Failed to decode event data: {event_data}")
        except Exception as e:
            print(f"Error processing event: {e}")

    def cog_unload(self):
        """Cleanup when the cog is unloaded."""
        self.bot.loop.create_task(self.session.close())

# Add this setup function
async def setup(bot):
    await bot.add_cog(APIConnectionCog(bot))
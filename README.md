# Pépito Discord Bot 🐈

## **Bot available for interaction on Discord!**
* [Invite Pépito to your server](https://discord.com/oauth2/authorize?client_id=1282732564657737788)

A Discord bot that tracks Pépito's adventures, providing real-time updates about his comings and goings.

## Features
- 🏠 Real-time tracking of Pépito's location (indoor/outdoor)
- 📢 Global announcements for all servers
- ⏰ Periodic reminders for server admins to configure notification channels (WIP)
- 🖼️ Embedded messages with images and updates

## Setup

### Prerequisites
- Python 3.9 or higher
- A Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Access to the [Pépito API](https://github.com/Clement87/Pepito-API)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TheLonelyPug/Pepito-discord.git
   cd pepito-discord
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the root directory:
   ```plaintext
   DISCORD_TOKEN=your bot token here
   API_URL=your API url here
   DEV_SERVER_ID=guild id for your dev server
   ```

4. Start the bot:
   ```bash
   python bot.py
   ```

## Project Structure
   ```
pepito-discord/
├── .env              # Environment variables (not in git)
├── README.md         # This file
├── bot.py            # Main application entry point
├── cogs/             # Folder containing all bot cogs
│   ├── setchannel.py # Cog for setting notification channels
│   ├── announce.py   # Cog for global announcements
│   ├── api_connection.py # Cog for connecting to the Pépito API
│   ├── pepito_events.py  # Cog for handling Pépito events
│   └── hello.py      # Cog for welcome messages
├── channels.json     # Channels database
└── requirements.txt  # Python dependencies
   ```

## Commands

* `/setchannel` - Set the channel for Pépito notifications. Use this command in the desired channel to receive updates.
* `/announce` - Send a global announcement. This command is restricted to the developer server and requires appropriate permissions.

## Usage
1. Invite the bot to your server using the OAuth2 URL from the Discord Developer Portal.
2. Use `/setchannel` to configure a notification channel.
3. Enjoy real-time updates from Pépito!

## License
[Apache 2.0 License](https://github.com/TheLonelyPug/Pepito-discord/blob/main/LICENSE)

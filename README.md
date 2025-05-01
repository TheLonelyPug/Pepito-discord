# Pépito Discord Bot 🐈

## **Bot available for interaction on Discord!**
* [Invite Pépito to your server](https://discord.com/oauth2/authorize?client_id=1282732564657737788&permissions=2147601408&integration_type=0&scope=bot)

A Discord bot that tracks Pépito's adventures, providing real-time updates about his comings and goings.

## Features
- 🏠 Real-time tracking of Pépito's location (indoor/outdoor)
- 📢 Global announcements for all servers
- ⏰ Periodic reminders for server admins to configure notification channels
- 🖼️ Embedded messages with images and updates

## Setup

### Prerequisites
- Node.js (v16 or higher)
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
   npm install dotenv discord.js eventsource
   ```

3. Create a `.env` file in the root directory:
   ```plaintext
   DISCORD_BOT_TOKEN=your bot token here
   CLIENT_ID=your client id here
   CAT_DOOR_API_URL=your API url here
   PEPITO_ICON_URL=your icon url here
   DEV_SERVER_ID=guild id for your dev server
   ```

4. Start the bot:
   ```bash
   node bot.js
   ```

## Project Structure
   ```
   pepito-bot/
   ├── .env              # Environment variables (not in git)
   ├── README.md         # This file
   ├── bot.js            # Main application entry point
   └── channels.json     # Channels database
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

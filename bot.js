require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, ActivityType, PermissionsBitField } = require('discord.js');
const EventSource = require('eventsource');

// Constants
const channelsFilePath = './channels.json';
const ERROR_LOADING_CHANNELS = 'Error loading channel settings:';
const ERROR_SAVING_CHANNELS = 'Error saving channel settings:';
const PERMISSION_ERROR = 'You do not have permission to use this command.';
const COMMAND_REGISTER_SUCCESS = 'Successfully registered application commands.';
const COMMAND_REGISTER_ERROR = 'Error registering application commands:';
const SSE_ERROR = 'Error with SSE:';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CAT_DOOR_API_URL = process.env.CAT_DOOR_API_URL;
const PEPITO_ICON_URL = process.env.PEPITO_ICON_URL;

// Validate environment variables
if (!DISCORD_BOT_TOKEN || !CLIENT_ID || !CAT_DOOR_API_URL || !PEPITO_ICON_URL) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

let channelsData = {};

// Load channel settings from file
function loadChannelSettings() {
    try {
        if (fs.existsSync(channelsFilePath)) {
            const data = fs.readFileSync(channelsFilePath, 'utf-8').trim();
            channelsData = data ? JSON.parse(data) : {};
        } else {
            saveChannelSettings();
        }
    } catch (error) {
        console.error(ERROR_LOADING_CHANNELS, error);
        channelsData = {};
    }
}

// Save channel settings to file
function saveChannelSettings() {
    try {
        fs.writeFileSync(channelsFilePath, JSON.stringify(channelsData, null, 2), 'utf-8');
    } catch (error) {
        console.error(ERROR_SAVING_CHANNELS, error);
    }
}

loadChannelSettings();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Format Unix timestamp to HH:MM:SS
function formatUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toTimeString().split(' ')[0];
}

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

// Register slash commands
async function registerCommands() {
    const commands = [
        {
            name: 'setchannel',
            description: 'Set the channel for Pépito notifications',
            options: [
                {
                    name: 'channel',
                    description: 'The channel where notifications will be sent',
                    type: 7, // Discord API type for channel
                    required: true
                }
            ]
        },
        {
            name: 'announce',
            description: 'Send an announcement to all servers (Dev server only)',
            options: [
                {
                    name: 'message',
                    description: 'The announcement message to send',
                    type: 3, // Discord API type for string
                    required: true
                }
            ]
        }
    ];

    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log(COMMAND_REGISTER_SUCCESS);
    } catch (error) {
        console.error(COMMAND_REGISTER_ERROR, error);
    }
}

function setupEventSource() {
    const eventSource = new EventSource(CAT_DOOR_API_URL);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.event === 'pepito') {
            console.log(JSON.stringify(data));

            const eventTime = formatUnixTimestamp(data.time);
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setImage(data.img)
                .setTimestamp()
                .setFooter({ text: 'Pépito', iconURL: PEPITO_ICON_URL });

            embed.setTitle(data.type === 'in' 
                ? `Pépito is back home (${eventTime})` 
                : `Pépito is out (${eventTime})`);

            // Send the notification to the appropriate channel in each guild
            client.guilds.cache.forEach(guild => {
                const serverData = channelsData[guild.name];
                if (serverData && serverData["GUILD ID"] === guild.id) {
                    const targetChannel = client.channels.cache.get(serverData["CHANNEL ID"]);
                    if (targetChannel) {
                        targetChannel.send({ embeds: [embed] });
                    }
                }
            });
        }
    };

    eventSource.onerror = (err) => {
        if (err.message !== undefined) {
            console.error(SSE_ERROR, err);
        }
        console.log('Reconnecting to EventSource...');
        setTimeout(setupEventSource, 5000); // Retry connection after 5 seconds
    };
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('/setchannel to get started', { type: ActivityType.Playing });

    await registerCommands();

    // Migrate old channel data format to the new format
    client.guilds.cache.forEach((guild) => {
        if (!channelsData[guild.name]) {
            const channelId = channelsData[guild.id];
            if (channelId) {
                channelsData[guild.name] = { "GUILD ID": guild.id, "CHANNEL ID": channelId };
                delete channelsData[guild.id];
            }
        }
    });

    saveChannelSettings();

    // Set up Server-Sent Events (SSE) to listen for notifications
    setupEventSource();
});

// Handle when the bot is removed from a guild
client.on('guildDelete', (guild) => {
    if (channelsData[guild.name]) {
        console.log(`Bot was removed from guild: ${guild.name} (${guild.id}). Removing from database.`);
        delete channelsData[guild.name];
        saveChannelSettings();
    }
});

// Handle when the bot joins a new guild
client.on('guildCreate', async (guild) => {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);

    // Attempt to find a channel the bot can send messages in
    const defaultChannel = guild.channels.cache.find(
        (channel) =>
            channel.type === 0 && // Text channel
            channel.permissionsFor(guild.members.me).has(['ViewChannel', 'SendMessages'])
    );

    if (defaultChannel) {
        try {
            await defaultChannel.send(
                `Hello! Thank you for adding me to **${guild.name}**! 🎉\n` +
                `To get started, please use the \`/setchannel\` command to set a channel for Pépito notifications.`
            );
        } catch (error) {
            console.error(`Failed to send message in guild: ${guild.name} (${guild.id})`, error);
        }
    } else {
        console.warn(`No suitable channel found in guild: ${guild.name} (${guild.id})`);
    }
});

// Handle slash command interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setchannel') {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const guildName = interaction.guild.name;
        const currentChannelData = channelsData[guildName];

        // Restrict command to server admins only
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Only server admins can use this command.', ephemeral: true });
        }

        if (currentChannelData && currentChannelData["CHANNEL ID"] === channel.id) {
            return interaction.reply({ content: `The selected channel is already set as the notification channel.`, ephemeral: true });
        }

        // Update or set the notification channel
        channelsData[guildName] = { "GUILD ID": guildId, "CHANNEL ID": channel.id };
        await interaction.reply(`Channel has been ${currentChannelData ? 'updated' : 'set'}. Pépito notifications will now be sent to ${channel}`);

        saveChannelSettings();
    }

    if (commandName === 'announce') {
        const devServerId = process.env.DEV_SERVER_ID;

        // Ensure the command is used in the developer server
        if (interaction.guild.id !== devServerId) {
            return interaction.reply({ content: 'This command can only be used in the developer server.', ephemeral: true });
        }

        // Ensure the user is the server owner
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'Only the server owner can use this command.', ephemeral: true });
        }

        const messageContent = interaction.options.getString('message');

        // Send the announcement
        await interaction.reply({ content: 'Sending announcement...', ephemeral: true });
        await sendAnnouncement(messageContent);
        await interaction.followUp({ content: 'Announcement sent successfully!', ephemeral: true });
    }
});

// Function to send announcements to all servers except the dev server
async function sendAnnouncement(messageContent) {
    const devServerId = process.env.DEV_SERVER_ID;

    for (const [guildName, serverData] of Object.entries(channelsData)) {
        // Skip entries without a valid "GUILD ID" or "CHANNEL ID"
        if (!serverData["GUILD ID"] || !serverData["CHANNEL ID"]) continue;

        // Skip the developer server
        if (serverData["GUILD ID"] === devServerId) {
            console.log(`Skipping announcement for dev server: ${guildName} (${serverData["GUILD ID"]})`);
            continue;
        }

        // Fetch the target channel and send the announcement
        const targetChannel = client.channels.cache.get(serverData["CHANNEL ID"]);
        if (targetChannel) {
            try {
                await targetChannel.send(messageContent);
                console.log(`Announcement sent to ${guildName} (${serverData["GUILD ID"]})`);
            } catch (error) {
                console.error(`Failed to send announcement to ${guildName} (${serverData["GUILD ID"]})`, error);
            }
        } else {
            console.warn(`Channel not found for ${guildName} (${serverData["GUILD ID"]})`);
        }
    }
}

// Example usage: Call this function with the announcement message
// sendAnnouncement('This is a global announcement from Pépito! 🎉');

// Periodic reminder for servers without a configured channel
async function remindUnsetChannels() {
    for (const guild of client.guilds.cache.values()) {
        const serverData = channelsData[guild.name];

        // Skip servers that already have a configured channel
        if (serverData && serverData["CHANNEL ID"]) continue;

        // Find a channel where the bot can send messages
        const reminderChannel = guild.channels.cache.find(
            (channel) =>
                channel.type === 0 && // Text channel
                channel.permissionsFor(guild.members.me).has(['ViewChannel', 'SendMessages'])
        );

        if (reminderChannel) {
            try {
                const owner = await guild.fetchOwner();
                await reminderChannel.send(
                    `Hello <@${owner.id}>, it seems you haven't set a notification channel for Pépito yet! ` +
                    `Please use the \`/setchannel\` command to configure one.`
                );
                console.log(`Reminder sent to ${guild.name} (${guild.id})`);
            } catch (error) {
                console.error(`Failed to send reminder in ${guild.name} (${guild.id})`, error);
            }
        } else {
            console.warn(`No suitable channel found for reminder in ${guild.name} (${guild.id})`);
        }
    }
}

// Schedule the reminder to run every 24 hours
setInterval(remindUnsetChannels, 24 * 60 * 60 * 1000);

// Log in to Discord
client.login(DISCORD_BOT_TOKEN);

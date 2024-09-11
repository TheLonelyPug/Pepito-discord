require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');
const EventSource = require('eventsource');

const channelsFilePath = './channels.json';
let channelsData = {};

function loadChannelSettings() {
    try {
        if (fs.existsSync(channelsFilePath)) {
            const data = fs.readFileSync(channelsFilePath, 'utf-8');
            if (data.trim().length > 0) {
                channelsData = JSON.parse(data);
            } else {
                channelsData = {};
            }
        } else {
            saveChannelSettings();
        }
    } catch (error) {
        console.error('Error loading channel settings:', error);
        channelsData = {};
    }
}

function saveChannelSettings() {
    try {
        fs.writeFileSync(channelsFilePath, JSON.stringify(channelsData, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving channel settings:', error);
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

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CAT_DOOR_API_URL = 'https://api.thecatdoor.com/sse/v1/events';

function formatUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toTimeString().split(' ')[0];
}

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

async function registerCommands() {
    const commands = [
        {
            name: 'setchannel',
            description: 'Set the channel for Pépito notifications',
            options: [
                {
                    name: 'channel',
                    description: 'The channel where notifications will be sent',
                    type: 7,
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
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    await registerCommands();

    const eventSource = new EventSource(CAT_DOOR_API_URL);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.event === 'pepito') {
            const eventTime = formatUnixTimestamp(data.time);
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setImage(data.img)
                .setTimestamp()
                .setFooter({ text: 'Pépito', iconURL: 'https://pbs.twimg.com/profile_images/1713252555336134657/gD97QysY_400x400.jpg' });

            if (data.type === 'in') {
                embed.setTitle(`Pépito is back home (${eventTime})`);
            } else if (data.type === 'out') {
                embed.setTitle(`Pépito is out (${eventTime})`);
            }

            client.guilds.cache.forEach(guild => {
                const channelId = channelsData[guild.id];
                if (channelId) {
                    const targetChannel = client.channels.cache.get(channelId);
                    if (targetChannel) {
                        targetChannel.send({ embeds: [embed] });
                    }
                }
            });
        }
    };

    eventSource.onerror = (err) => {
        console.error('Error with SSE:', err);
    };
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setchannel') {
        const channel = interaction.options.getChannel('channel');

        if (!interaction.member.permissions.has('MANAGE_CHANNELS')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        if (channelsData[interaction.guild.id]) {
            channelsData[interaction.guild.id] = channel.id;
            await interaction.reply(`Channel has been updated. Pépito notifications will now be sent to ${channel}`);
        } else {
            channelsData[interaction.guild.id] = channel.id;
            await interaction.reply(`Channel has been set. Pépito notifications will now be sent to ${channel}`);
        }

        saveChannelSettings();
    }
});

client.login(DISCORD_BOT_TOKEN);

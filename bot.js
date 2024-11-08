require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, ActivityType, PermissionsBitField } = require('discord.js');

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
const CAT_DOOR_API_URL = process.env.CAT_DOOR_API_URL;
const PEPITO_ICON_URL = process.env.PEPITO_ICON_URL;

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

    client.user.setActivity('/setchannel to get started', { type: ActivityType.Playing });

    await registerCommands();

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

    try {
        const response = await fetch(CAT_DOOR_API_URL);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop();

            lines.forEach((line) => {
                try {
                    if (line.startsWith('data: ')) {
                        const jsonData = line.slice(6);
                        const data = JSON.parse(jsonData);

                        if (data.event === 'pepito' && (data.type === 'in' || data.type === 'out')) {
                            const eventTime = formatUnixTimestamp(data.time);
                            const embed = new EmbedBuilder()
                                .setColor('#0099ff')
                                .setImage(data.img)
                                .setTimestamp()
                                .setFooter({ text: 'Pépito', iconURL: PEPITO_ICON_URL });

                            if (data.type === 'in') {
                                embed.setTitle(`Pépito is back home (${eventTime})`);
                            } else if (data.type === 'out') {
                                embed.setTitle(`Pépito is out (${eventTime})`);
                            }

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
                    }
                } catch (error) {
                    console.error('Error parsing event data:', error);
                }
            });
        }
    } catch (error) {
        console.error('Error with fetch or streaming:', error);
    }
});

client.on('guildDelete', (guild) => {
    if (channelsData[guild.name]) {
        console.log(`Bot was removed from guild: ${guild.name}. Removing from database.`);
        delete channelsData[guild.name];
        saveChannelSettings();
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setchannel') {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const guildName = interaction.guild.name;
        const currentChannelData = channelsData[guildName];

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        if (currentChannelData && currentChannelData["CHANNEL ID"] === channel.id) {
            return interaction.reply({ content: `The selected channel is already set as the notification channel.`, ephemeral: true });
        }

        channelsData[guildName] = { "GUILD ID": guildId, "CHANNEL ID": channel.id };
        await interaction.reply(`Channel has been ${currentChannelData ? 'updated' : 'set'}. Pépito notifications will now be sent to ${channel}`);

        saveChannelSettings();
    }
});

client.login(DISCORD_BOT_TOKEN);

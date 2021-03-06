import {
    Client,
    Message,
    MessageReaction,
    Emoji,
    TextChannel,
    Guild,
    GuildMember
} from 'discord.js';
import { createAction } from './commands/factory';
import { actionQueue } from './commands/queue';
import { getMessageTrigger, getReactionListener } from './commands/helpers';
import commands from './commands';
import preventDM from './utils/prevent-dm';
import { getAllTriggerConfigGroups, getTriggerConfig } from './database/trigger-configs';
// import { TriggerConfig } from 'types';

// Note: should match MESSAGE_REACTION_ADD or MESSAGE_REACTION_REMOVE from discord.js
// if discord.js changes that they should be changed to reflect the new ones here too.
const RAW_EVENTS_TO_LISTEN = ['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'];

// Pre-fetch configs so that apollo will cache them
const preFetchConfigs = async () => {
    console.log('Fetching trigger configs from db...');
    await getAllTriggerConfigGroups();
    console.log('Trigger configs fetched!');
};

export const onGuildCreate = (guild: Guild) => {
    console.log(
        `Joined a new guild ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
    );
};

export const onGuildDelete = (guild: Guild) => {
    console.log(`I have been removed from ${guild.name} (${guild.id})`);
};

export const onError = (error: Error) => {
    console.error(`Unexpected error happened: ${error.message}`);
};

export const onReady = async (client: Client) => {
    const { username: botUsername, id: botId } = client.user;
    console.log(`Logged in as ${botUsername} (${botId})`);
    await preFetchConfigs();
    console.log(`Reporting for duty!`);
};

export const onMessage = async (client: Client, message: Message) => {
    // Ignore bots
    if (message.author.bot) return;

    // Ignore private messages (for now)
    if (preventDM(client, message)) return;

    // Check if the message matches any triggers (commands)
    // Triggers are defined with regex and don't necessarily start with !command
    const messageTrigger = getMessageTrigger(commands, message.content);
    if (!messageTrigger) return;

    const guildId = message.guild.id;
    const config = await getTriggerConfig(guildId, messageTrigger.name);
    const author: GuildMember = message.member;
    const action = createAction({
        event: { type: 'MESSAGE_CREATE' },
        author,
        message,
        command: messageTrigger,
        config
    });

    actionQueue.next(action);
};

export const onRaw = async (client: Client, event: any) => {
    if (!RAW_EVENTS_TO_LISTEN.includes(event.t)) return;

    const { d: data } = event;
    const user = client.users.get(data.user_id);
    const channel = client.channels.get(data.channel_id);

    // If required data not found do nothing
    if (!user || !channel) return;

    // Ignore bots reactions and reactions on other channels than text
    // Reactions in DMs will have undefined channel
    if (user.bot || !channel || channel.type !== 'text') return;

    // Get the message and emoji's from it (reactions) - Note: fetches only message from text channel!
    const message: Message = await (channel as TextChannel).fetchMessage(data.message_id);
    const guild: Guild = client.guilds.get(data.guild_id)!;
    const author: GuildMember = guild.members.find(member => member.id === user.id);
    const emojiKey: string = data.emoji.id
        ? `${data.emoji.name}:${data.emoji.id}`
        : data.emoji.name;
    const emojiName: string = data.emoji.name;

    let reaction = message.reactions.get(emojiKey);
    if (!reaction) {
        // Reaction was not found in cache
        const emoji = new Emoji(guild, data.emoji);
        const originatingFromMe = data.user_id === client.user.id;
        reaction = new MessageReaction(message, emoji, 1, originatingFromMe);
    }

    const reactionListener = getReactionListener(commands, reaction.emoji);
    if (!reactionListener) return;

    const guildId = message.guild.id;
    const config = await getTriggerConfig(guildId, reactionListener.name);
    const action = createAction({
        event: {
            type: event.t,
            reaction,
            emojiName
        },
        author,
        message,
        command: reactionListener,
        config
    });

    actionQueue.next(action);
};

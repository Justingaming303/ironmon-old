import { Message, TextChannel } from 'discord.js';
import { createMessageTrigger } from '../factory';
import { sendToChannel } from '../helpers';

export default createMessageTrigger({
    name: 'getEmojiId',
    trigger: new RegExp(/^!emoji-id\b/),
    execute: (message: Message) => {
        const reactionNameToSearchFor = message.content.replace(this.default.trigger, '').trim();
        const channel = <TextChannel>message.channel;
        const emoji = channel.guild.emojis.find(emoji => emoji.name === reactionNameToSearchFor);

        let reply = 'No such emoji found';

        if (emoji) {
            reply = emoji.id;
        }

        sendToChannel(message.channel, reply);
    }
});
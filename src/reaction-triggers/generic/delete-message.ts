import { Message } from 'discord.js';
import { ReactionEvent } from '../../typings';
import { createReactionTrigger } from '../../triggers/factory';

export default createReactionTrigger({
    name: 'deleteMessageReaction',
    reactions: [
        '❌' // :x:
    ],
    onAddReaction: (message: Message, _: ReactionEvent) => {
        message.delete();
    }
});

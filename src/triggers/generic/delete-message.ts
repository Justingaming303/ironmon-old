import { Message } from 'discord.js';
import { ReactionEvent } from '../../typings';
import { createReactionTrigger } from '../factory';

export default createReactionTrigger({
    name: 'deleteMessageReaction',
    reactions: [
        '❌' // :x:
    ],
    onAddReaction: (message: Message, _: ReactionEvent) => {
        message.delete();
    }
});

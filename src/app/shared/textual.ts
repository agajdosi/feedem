import { User, Relation, RelationType, Reaction, Post, Comment, View } from '../models/game';
import * as utils from './utils';

/** 
 * Returns a LLM-friendly description of the relationship between two users. 
 * TODO: when relationTypes are added, then this function should be extended to handle them.
 * TODO: when relationTypes are added, not all will have verb format, so mapping will be needed.
 */
export function describeRelationship(thisUser: User, thatUser: User, relations: Relation[]): string {
    let fromThis = relations.filter(relation => relation.source === thisUser.uuid && relation.target === thatUser.uuid);
    let fromAnother = relations.filter(relation => relation.source === thatUser.uuid && relation.target === thisUser.uuid);

    // If there are no common relations, return a message
    if (fromThis.length === 0 && fromAnother.length === 0) {
        return `No common relation (${Object.values(RelationType).join(', ')}) between ${thisUser.name} and ${thatUser.name}.\n`;
    }
    
    // Construct mutual relations, make fromThis and fromAnother one-way relations - TODO: make this a function
    const mutualRelations = fromThis.filter(relation => fromAnother.some(r => r.label === relation.label));
    fromThis = fromThis.filter(relation => !mutualRelations.includes(relation));
    fromAnother = fromAnother.filter(relation => !mutualRelations.some(mutual => mutual.label === relation.label));

    // Add mutual relations
    let description = '';
    for (const relation of mutualRelations) {
      description += `${thisUser.name} and ${thatUser.name} mutually ${relation.label} each other.\n`;
    }

    // Add one-way relations
    for (const relation of fromThis) {
      description += `${thisUser.name} ${relation.label}s ${thatUser.name}.\n`;
    }
    for (const relation of fromAnother) {
      description += `${thatUser.name} ${relation.label}s ${thisUser.name}.\n`;
    }
    return description;
}


/** Return a LLM-friendly description of a post. 
 * TODO: order by time when time is implemented
 * TODO: add time of post, comments and reactions when time is implemented
*/
export function postToText(post: Post, comments: Comment[], reactions: Reaction[], users: User[]): string | null {
    const author = utils.getUserById(post.author, users);
    if (!author) {
        console.error(`User ${post.author} not found`);
        return null;
    };

    let text = `## Post by ${author.name} ${author.surname}:\n`;
    text += `${post.text}\n\n`;
    if (comments.length > 0) {
        text += `### Comments:\n`;
        for (const comment of comments) {
            const author = utils.getUserById(comment.author, users);
            if (!author) {
                console.error(`User ${comment.author} not found`);
                continue;
            };
            text += `- ${author.name} ${author.surname}: ${comment.text}\n`;
        }
    }
    if (reactions.length > 0) {
        text += `### Reactions:\n`;
        for (const reaction of reactions) {
            const author = utils.getUserById(reaction.author, users);
            if (!author) {
                console.error(`User ${reaction.author} not found`);
                continue;
            };
            text += `- ${author.name} ${author.surname} reacted: ${reaction.value}\n`;
        }
    }
    return text;
}

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


/** Return a description of the interactions between two users.
 * Finds all posts thisUser has seen that were written by thatUser.
 * Then finds all comments under those posts.
 * Then finds all reactions to those posts and comments.
 * Also finds all comments and reactions done by thatUser on posts written by thisUser.
 * Then it converts it into a LLM-friendly text description.
*/
export function describeInteractions(thisUser: User, thatUser: User, allViews: View[], allPosts: Post[], allComments: Comment[], allReactions: Reaction[]): string {
    const postsOfThatSeenByThis = utils.getPostsByAuthorSeenByUser(thisUser, thatUser, allViews, allPosts);
    const postsOfThis = utils.getPostsByAuthor(thisUser, allPosts);
    const postsOfThisWhereThatInteracted = utils.getPostsWhereUserInteracted(thatUser, allComments, allReactions, postsOfThis);

    let description = '';

    // Posts seen by thisUser
    if (postsOfThatSeenByThis.length > 0) {
        description += `# Recently, you have seen these posts by ${thatUser.name} ${thatUser.surname}:\n`;
        for (const post of postsOfThatSeenByThis) {
            const text = postToText(post, allComments, allReactions, [thisUser, thatUser]);
            description += `${text}\n\n`;
        }
    } else {
        description += `# You have not seen any posts by ${thatUser.name} ${thatUser.surname}.\n`;
    }

    // Posts where thatUser has interacted with posts of thisUser
    if (postsOfThisWhereThatInteracted.length > 0) {
        description += `# Recently, ${thatUser.name} ${thatUser.surname} has interacted with your posts:\n`;
        for (const post of postsOfThisWhereThatInteracted) {
            const text = postToText(post, allComments, allReactions, [thisUser, thatUser]);
            description += `${text}\n\n`;
        }
    } else {
        description += `# ${thatUser.name} ${thatUser.surname} has not interacted with any of your posts.\n`;
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

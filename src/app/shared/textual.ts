import { User, Relation, RelationType, Reaction, Post, Comment, View } from '../models/game';


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

/** Return just the posts that the user has seen. Simulates the user's memory. */
export function filterSeenPosts(user: User, views: View[], posts: Post[]): Post[] {
    return posts.filter(post => views.some(view => view.post === post.uuid && view.user === user.uuid));
}

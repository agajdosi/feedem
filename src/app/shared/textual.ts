import { User, Relation, RelationType } from '../models/game';


/** 
 * Returns a LLM-friendly description of the relationship between two users. 
 * TODO: when relationTypes are added, then this function should be extended to handle them.
 * TODO: when relationTypes are added, not all will have verb format, so mapping will be needed.
 */
export function describeRelationship(thisUser: User, anotherUser: User, relations: Relation[]): string {
    let fromThis = relations.filter(relation => relation.source === thisUser.uuid && relation.target === anotherUser.uuid);
    let fromAnother = relations.filter(relation => relation.source === anotherUser.uuid && relation.target === thisUser.uuid);

    // If there are no common relations, return a message
    if (fromThis.length === 0 && fromAnother.length === 0) {
        return `No common relation (${Object.values(RelationType).join(', ')}) between ${thisUser.name} and ${anotherUser.name}.\n`;
    }
    
    // Construct mutual relations, make fromThis and fromAnother one-way relations - TODO: make this a function
    const mutualRelations = fromThis.filter(relation => fromAnother.some(r => r.label === relation.label));
    fromThis = fromThis.filter(relation => !mutualRelations.includes(relation));
    fromAnother = fromAnother.filter(relation => !mutualRelations.some(mutual => mutual.label === relation.label));

    let description = '';

    // Add mutual relations
    for (const relation of mutualRelations) {
      description += `${thisUser.name} and ${anotherUser.name} mutually ${relation.label} each other.\n`;
    }

    // Add one-way relations
    for (const relation of fromThis) {
      description += `${thisUser.name} ${relation.label}s ${anotherUser.name}.\n`;
    }
    for (const relation of fromAnother) {
      description += `${anotherUser.name} ${relation.label}s ${thisUser.name}.\n`;
    }

    return description;
}

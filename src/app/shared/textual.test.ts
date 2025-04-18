import { describe, it, expect } from 'vitest';
import { describeRelationship, filterSeenPosts } from './textual';
import { User, Relation, RelationType, View, Post } from '../models/game';

describe('describeRelationship', () => {
    const mockUser1: User = {
        uuid: 'user1',
        name: 'Alice',
        surname: 'Smith',
        gender: 'female',
        age: 25,
        occupation: 'developer',
        location: { city: 'New York', country: 'USA' },
        residence: { city: 'New York', country: 'USA' },
        hometown: { city: 'Boston', country: 'USA' },
        bio: 'Software developer',
        traits: ['friendly', 'hardworking'],
        profile_picture: 'alice.jpg',
        role: 'user',
        memory: {
            shortTerm: '',
            shortRelevancy: 0,
            longTerm: ''
        }
    };

    const mockUser2: User = {
        uuid: 'user2',
        name: 'Bob',
        surname: 'Johnson',
        gender: 'male',
        age: 30,
        occupation: 'designer',
        location: { city: 'Los Angeles', country: 'USA' },
        residence: { city: 'Los Angeles', country: 'USA' },
        hometown: { city: 'San Francisco', country: 'USA' },
        bio: 'UI/UX designer',
        traits: ['creative', 'organized'],
        profile_picture: 'bob.jpg',
        role: 'user',
        memory: {
            shortTerm: '',
            shortRelevancy: 0,
            longTerm: ''
        }
    };

    it('should return message when there are no relations', () => {
        const relations: Relation[] = [];
        const expected = `No common relation (${Object.values(RelationType).join(', ')}) between Alice and Bob.\n`;
        expect(describeRelationship(mockUser1, mockUser2, relations)).toBe(expected);
    });

    it('should describe one-way following relationship', () => {
        const relations: Relation[] = [{
            source: mockUser1.uuid,
            target: mockUser2.uuid,
            label: RelationType.Follow
        }];
        expect(describeRelationship(mockUser1, mockUser2, relations)).toBe('Alice follows Bob.\n');
    });

    it('should describe mutual following relationship', () => {
        const relations: Relation[] = [
            {
                source: mockUser1.uuid,
                target: mockUser2.uuid,
                label: RelationType.Follow
            },
            {
                source: mockUser2.uuid,
                target: mockUser1.uuid,
                label: RelationType.Follow
            }
        ];
        expect(describeRelationship(mockUser1, mockUser2, relations)).toBe('Alice and Bob mutually follow each other.\n');
    });

    it('should describe mutual following relationship (inverse order)', () => {
        const relations: Relation[] = [
            {
                source: mockUser2.uuid,
                target: mockUser1.uuid,
                label: RelationType.Follow
            },
            {
                source: mockUser1.uuid,
                target: mockUser2.uuid,
                label: RelationType.Follow
            }
        ];
        expect(describeRelationship(mockUser1, mockUser2, relations)).toBe('Alice and Bob mutually follow each other.\n');
    });

    // TODO: it('should handle multiple relationships from the same user', () => {});
    // TODO: it('should handle multiple relationships from both users', () => {});
});

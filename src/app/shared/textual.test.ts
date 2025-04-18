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

describe('filterSeenPosts', () => {
    const mockUser: User = {
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

    const mockPosts: Post[] = [
        {
            uuid: 'post1',
            author: 'user1',
            text: 'Hello world!',
            reasoning: 'Just saying hi',
            created: Date.now()
        },
        {
            uuid: 'post2',
            author: 'user2',
            text: 'Good morning!',
            reasoning: 'Morning greeting',
            created: Date.now()
        },
        {
            uuid: 'post3',
            author: 'user3',
            text: 'Good night!',
            reasoning: 'Evening greeting',
            created: Date.now()
        }
    ];

    it('should return empty array when user has no views', () => {
        const views: View[] = [];
        expect(filterSeenPosts(mockUser, views, mockPosts)).toEqual([]);
    });

    it('should return only posts that user has seen', () => {
        const views: View[] = [
            {
                uuid: 'view1',
                user: mockUser.uuid,
                post: 'post1',
                _reasoning: '',
                _rating: 0,
                joyScore: 0,
                commentUrge: 0,
                shareUrge: 0,
                reactionLikeUrge: 0,
                reactionDislikeUrge: 0,
                reactionLoveUrge: 0,
                reactionHateUrge: 0,
                time: Date.now()
            },
            {
                uuid: 'view2',
                user: mockUser.uuid,
                post: 'post2',
                _reasoning: '',
                _rating: 0,
                joyScore: 0,
                commentUrge: 0,
                shareUrge: 0,
                reactionLikeUrge: 0,
                reactionDislikeUrge: 0,
                reactionLoveUrge: 0,
                reactionHateUrge: 0,
                time: Date.now()
            }
        ];
        const result = filterSeenPosts(mockUser, views, mockPosts);
        expect(result).toHaveLength(2);
        expect(result.map(p => p.uuid)).toEqual(['post1', 'post2']);
    });

    it('should not return posts viewed by other users', () => {
        const views: View[] = [
            {
                uuid: 'view1',
                user: 'otherUser',
                post: 'post1',
                _reasoning: '',
                _rating: 0,
                joyScore: 0,
                commentUrge: 0,
                shareUrge: 0,
                reactionLikeUrge: 0,
                reactionDislikeUrge: 0,
                reactionLoveUrge: 0,
                reactionHateUrge: 0,
                time: Date.now()
            }
        ];
        expect(filterSeenPosts(mockUser, views, mockPosts)).toEqual([]);
    });

    it('should handle multiple views of the same post', () => {
        const views: View[] = [
            {
                uuid: 'view1',
                user: mockUser.uuid,
                post: 'post1',
                _reasoning: '',
                _rating: 0,
                joyScore: 0,
                commentUrge: 0,
                shareUrge: 0,
                reactionLikeUrge: 0,
                reactionDislikeUrge: 0,
                reactionLoveUrge: 0,
                reactionHateUrge: 0,
                time: Date.now()
            },
            {
                uuid: 'view2',
                user: mockUser.uuid,
                post: 'post1',
                _reasoning: '',
                _rating: 0,
                joyScore: 0,
                commentUrge: 0,
                shareUrge: 0,
                reactionLikeUrge: 0,
                reactionDislikeUrge: 0,
                reactionLoveUrge: 0,
                reactionHateUrge: 0,
                time: Date.now()
            }
        ];
        const result = filterSeenPosts(mockUser, views, mockPosts);
        expect(result).toHaveLength(1);
        expect(result[0].uuid).toBe('post1');
    });
});

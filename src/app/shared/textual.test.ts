import { describe, it, expect } from 'vitest';
import { describeRelationship, postToText } from './textual';
import { User, Relation, RelationType, Post, Comment, Reaction, React, ReactionParentType, CommentParentType } from '../models/game';

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

describe('postToText', () => {
    const mockUsers: User[] = [
        {
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
        },
        {
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
        }
    ];

    const mockPost: Post = {
        uuid: 'post1',
        author: 'user1',
        text: 'Hello world!',
        reasoning: 'Just saying hi',
        created: Date.now()
    };

    const mockComments: Comment[] = [
        {
            uuid: 'comment1',
            parent: 'post1',
            parent_type: CommentParentType.Post,
            author: 'user2',
            text: 'Great post!'
        },
        {
            uuid: 'comment2',
            parent: 'post1',
            parent_type: CommentParentType.Post,
            author: 'user1',
            text: 'Thanks!'
        }
    ];

    const mockReactions: Reaction[] = [
        {
            uuid: 'reaction1',
            parent: 'post1',
            parent_type: ReactionParentType.Post,
            author: 'user2',
            value: React.Like
        },
        {
            uuid: 'reaction2',
            parent: 'post1',
            parent_type: ReactionParentType.Post,
            author: 'user1',
            value: React.Love
        }
    ];

    it('should return null when post author is not found', () => {
        const result = postToText(mockPost, [], [], []);
        expect(result).toBeNull();
    });

    it('should format post with author information', () => {
        const result = postToText(mockPost, [], [], mockUsers);
        expect(result).toContain('## Post by Alice Smith:');
        expect(result).toContain('Hello world!');
    });

    it('should include comments when present', () => {
        const result = postToText(mockPost, mockComments, [], mockUsers);
        expect(result).toContain('### Comments:');
        expect(result).toContain('- Bob Johnson: Great post!');
        expect(result).toContain('- Alice Smith: Thanks!');
    });

    it('should include reactions when present', () => {
        const result = postToText(mockPost, [], mockReactions, mockUsers);
        expect(result).toContain('### Reactions:');
        expect(result).toContain('- Bob Johnson reacted: 👍🏿');
        expect(result).toContain('- Alice Smith reacted: ♥️');
    });

    it('should handle missing comment authors gracefully', () => {
        const commentsWithMissingAuthor: Comment[] = [
            {
                uuid: 'comment3',
                parent: 'post1',
                parent_type: CommentParentType.Post,
                author: 'nonexistent',
                text: 'This should be skipped'
            }
        ];
        const result = postToText(mockPost, commentsWithMissingAuthor, [], mockUsers);
        expect(result).not.toContain('This should be skipped');
    });

    it('should handle missing reaction authors gracefully', () => {
        const reactionsWithMissingAuthor: Reaction[] = [
            {
                uuid: 'reaction3',
                parent: 'post1',
                parent_type: ReactionParentType.Post,
                author: 'nonexistent',
                value: React.Like
            }
        ];
        const result = postToText(mockPost, [], reactionsWithMissingAuthor, mockUsers);
        expect(result).not.toContain('nonexistent');
    });

    it('should format complete post with comments and reactions', () => {
        const result = postToText(mockPost, mockComments, mockReactions, mockUsers);
        expect(result).toContain('## Post by Alice Smith:');
        expect(result).toContain('Hello world!');
        expect(result).toContain('### Comments:');
        expect(result).toContain('- Bob Johnson: Great post!');
        expect(result).toContain('- Alice Smith: Thanks!');
        expect(result).toContain('### Reactions:');
        expect(result).toContain('- Bob Johnson reacted: 👍🏿');
        expect(result).toContain('- Alice Smith reacted: ♥️');
    });
});

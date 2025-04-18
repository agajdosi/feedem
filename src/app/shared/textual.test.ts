import { describe, it, expect } from 'vitest';
import { describeRelationship, postToText, describeInteractions } from './textual';
import { User, Relation, RelationType, Post, Comment, Reaction, React, ReactionParentType, CommentParentType, View } from '../models/game';

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

describe('describeInteractions', () => {
    const mockThisUser: User = {
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

    const mockThatUser: User = {
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

    const mockPosts: Post[] = [
        {
            uuid: 'post1',
            author: 'user2', // Bob's post
            text: 'Hello everyone!',
            reasoning: 'Greeting',
            created: Date.now()
        },
        {
            uuid: 'post2',
            author: 'user1', // Alice's post
            text: 'Working on a new project',
            reasoning: 'Status update',
            created: Date.now()
        },
        {
            uuid: 'post3',
            author: 'user1', // Alice's post
            text: 'This is not for Bob.',
            reasoning: 'Design update',
            created: Date.now()
        },
        {
            uuid: 'post4',
            author: 'user2', // Bob's post
            text: 'This is not for Alice.',
            reasoning: 'Design update',
            created: Date.now()
        }
    ];

    const mockViews: View[] = [
        {
            uuid: 'view1',
            user: 'user1', // Alice viewed Bob's post
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

    const mockComments: Comment[] = [
        {
            uuid: 'comment1',
            parent: 'post2', // Bob commented on Alice's post
            parent_type: CommentParentType.Post,
            author: 'user2',
            text: 'Sounds interesting!'
        }
    ];

    const mockReactions: Reaction[] = [
        {
            uuid: 'reaction1',
            parent: 'post2', // Bob reacted to Alice's post
            parent_type: ReactionParentType.Post,
            author: 'user2',
            value: React.Like
        }
    ];

    it('should handle no interactions between users', () => {
        const result = describeInteractions(mockThisUser, mockThatUser, [], [], [], []);
        expect(result).toContain(`# You have not seen any posts by Bob Johnson.`);
        expect(result).toContain(`# Bob Johnson has not interacted with any of your posts.`);
    });

    it('should describe posts seen by this user', () => {
        const result = describeInteractions(mockThisUser, mockThatUser, mockViews, mockPosts, [], []);
        expect(result).toContain(`# Recently, you have seen these posts by Bob Johnson:`);
        expect(result).toContain('Hello everyone!');
    });

    it('should describe interactions on this user\'s posts', () => {
        const result = describeInteractions(mockThisUser, mockThatUser, [], mockPosts, mockComments, mockReactions);
        expect(result).toContain(`# Recently, Bob Johnson has interacted with your posts:`);
        expect(result).toContain('Working on a new project');
    });

    it('should handle both seen posts and interactions', () => {
        const result = describeInteractions(mockThisUser, mockThatUser, mockViews, mockPosts, mockComments, mockReactions);
        expect(result).toContain(`# Recently, you have seen these posts by Bob Johnson:`);
        expect(result).toContain('Hello everyone!');
        expect(result).toContain(`# Recently, Bob Johnson has interacted with your posts:`);
        expect(result).toContain('Working on a new project');
    });

    it('should handle multiple interactions on the same post', () => {
        const multipleInteractions: Comment[] = [
            ...mockComments,
            {
                uuid: 'comment2',
                parent: 'post2',
                parent_type: CommentParentType.Post,
                author: 'user2',
                text: 'Keep up the good work!'
            }
        ];
        const result = describeInteractions(mockThisUser, mockThatUser, [], mockPosts, multipleInteractions, mockReactions);
        expect(result).toContain('Working on a new project');
    });

    it('should handle multiple reactions on the same post', () => {
        const multipleReactions: Reaction[] = [
            ...mockReactions,
            {
                uuid: 'reaction2',
                parent: 'post2',
                parent_type: ReactionParentType.Post,
                author: 'user2',
                value: React.Love
            }
        ];
        const result = describeInteractions(mockThisUser, mockThatUser, [], mockPosts, mockComments, multipleReactions);
        expect(result).toContain('Working on a new project');
    });

    it('should exclude uninteracted posts from thisUser', () => {
        const result = describeInteractions(mockThisUser, mockThatUser, mockViews, mockPosts, mockComments, mockReactions);
        expect(result).not.toContain('This is not for Bob.');
    });

    it('should exclude unseen posts from thatUser', () => {
        const result = describeInteractions(mockThisUser, mockThatUser, mockViews, mockPosts, mockComments, mockReactions);
        expect(result).not.toContain('This is not for Alice.');
    });
});

import { describe, it, expect } from 'vitest';
import { getLimit, getAvgEngagement, filterSeenPosts, getPostsByAuthor, getPostsByAuthorSeenByUser, getReactionsByUser, getCommentsByUser, getCommentsUnderPost, getReactionsUnderPost } from './utils';
import { User, Post, View, Reaction, React, ReactionParentType, Comment, CommentParentType } from '../models/game';

describe('getLimit', () => {
  it('should return 0 for 0 tasks', () => {
    expect(getLimit(0)).toBe(0);
  });

  it('should return approximately 100 for 20 tasks', () => {
    const result = getLimit(20);
    expect(result).toBeGreaterThan(99);
    expect(result).toBeLessThan(101);
  });

  it('should approach 200 as tasks increase', () => {
    const result = getLimit(1000);
    expect(result).toBeGreaterThan(195);
    expect(result).toBeLessThan(200);
  });

  it('should increase monotonically with more tasks', () => {
    const result1 = getLimit(10);
    const result2 = getLimit(20);
    const result3 = getLimit(30);
    expect(result1).toBeLessThan(result2);
    expect(result2).toBeLessThan(result3);
  });
});

describe('getAvgEngagement', () => {
  it('should return 200 when there are no views', () => {
    expect(getAvgEngagement(0, 10, 5)).toBe(200);
  });

  it('should return 0 when there are views but no engagement', () => {
    expect(getAvgEngagement(100, 0, 0)).toBe(0);
  });

  it('should calculate correct average engagement with both comments and reactions', () => {
    // 100 * (10 + 20) / 100 = 30
    expect(getAvgEngagement(100, 10, 20)).toBe(30);
  });

  it('should handle only comments', () => {
    // 100 * (15 + 0) / 50 = 30
    expect(getAvgEngagement(50, 15, 0)).toBe(30);
  });

  it('should handle only reactions', () => {
    // 100 * (0 + 25) / 50 = 50
    expect(getAvgEngagement(50, 0, 25)).toBe(50);
  });

  it('should handle decimal results', () => {
    // 100 * (3 + 2) / 4 = 125
    expect(getAvgEngagement(4, 3, 2)).toBe(125);
  });
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

describe('getPostsByAuthor', () => {
    const mockAuthor: User = {
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
            author: 'user1',
            text: 'Good night!',
            reasoning: 'Evening greeting',
            created: Date.now()
        }
    ];

    it('should return empty array when author has no posts', () => {
        const emptyPosts: Post[] = [];
        expect(getPostsByAuthor(mockAuthor, emptyPosts)).toEqual([]);
    });

    it('should return all posts by the author', () => {
        const result = getPostsByAuthor(mockAuthor, mockPosts);
        expect(result).toHaveLength(2);
        expect(result.map(p => p.uuid)).toEqual(['post1', 'post3']);
    });

    it('should not return posts by other authors', () => {
        const result = getPostsByAuthor(mockAuthor, mockPosts);
        expect(result).not.toContainEqual(expect.objectContaining({ author: 'user2' }));
    });

    it('should return posts in the same order as input', () => {
        const result = getPostsByAuthor(mockAuthor, mockPosts);
        expect(result[0].uuid).toBe('post1');
        expect(result[1].uuid).toBe('post3');
    });
});

describe('getPostsByAuthorSeenByUser', () => {
    const mockViewer: User = {
        uuid: 'viewer',
        name: 'Viewer',
        surname: 'Smith',
        gender: 'female',
        age: 25,
        occupation: 'developer',
        location: { city: 'New York', country: 'USA' },
        residence: { city: 'New York', country: 'USA' },
        hometown: { city: 'Boston', country: 'USA' },
        bio: 'Software developer',
        traits: ['friendly', 'hardworking'],
        profile_picture: 'viewer.jpg',
        role: 'user',
        memory: {
            shortTerm: '',
            shortRelevancy: 0,
            longTerm: ''
        }
    };

    const mockAuthor: User = {
        uuid: 'author',
        name: 'Author',
        surname: 'Johnson',
        gender: 'male',
        age: 30,
        occupation: 'writer',
        location: { city: 'Los Angeles', country: 'USA' },
        residence: { city: 'Los Angeles', country: 'USA' },
        hometown: { city: 'San Francisco', country: 'USA' },
        bio: 'Content writer',
        traits: ['creative', 'organized'],
        profile_picture: 'author.jpg',
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
            author: 'author',
            text: 'First post',
            reasoning: 'First post reasoning',
            created: Date.now()
        },
        {
            uuid: 'post2',
            author: 'author',
            text: 'Second post',
            reasoning: 'Second post reasoning',
            created: Date.now()
        },
        {
            uuid: 'post3',
            author: 'other',
            text: 'Other post',
            reasoning: 'Other post reasoning',
            created: Date.now()
        }
    ];

    const mockViews: View[] = [
        {
            uuid: 'view1',
            user: 'viewer',
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
            user: 'other',
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

    it('should return empty array when viewer has seen no posts by author', () => {
        const result = getPostsByAuthorSeenByUser(mockViewer, mockAuthor, [], mockPosts);
        expect(result).toEqual([]);
    });

    it('should return only posts by author that viewer has seen', () => {
        const result = getPostsByAuthorSeenByUser(mockViewer, mockAuthor, mockViews, mockPosts);
        expect(result).toHaveLength(1);
        expect(result[0].uuid).toBe('post1');
    });

    it('should not return posts by other authors even if seen', () => {
        const result = getPostsByAuthorSeenByUser(mockViewer, mockAuthor, mockViews, mockPosts);
        expect(result).not.toContainEqual(expect.objectContaining({ author: 'other' }));
    });

    it('should not return posts by author that viewer has not seen', () => {
        const result = getPostsByAuthorSeenByUser(mockViewer, mockAuthor, mockViews, mockPosts);
        expect(result).not.toContainEqual(expect.objectContaining({ uuid: 'post2' }));
    });
});

describe('getReactionsByUser', () => {
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

    const mockReactions: Reaction[] = [
        {
            uuid: 'reaction1',
            parent: 'post1',
            parent_type: ReactionParentType.Post,
            author: 'user1',
            value: React.Like
        },
        {
            uuid: 'reaction2',
            parent: 'post2',
            parent_type: ReactionParentType.Post,
            author: 'user2',
            value: React.Love
        },
        {
            uuid: 'reaction3',
            parent: 'post3',
            parent_type: ReactionParentType.Post,
            author: 'user1',
            value: React.Dislike
        }
    ];

    it('should return empty array when user has no reactions', () => {
        expect(getReactionsByUser([], mockUser)).toEqual([]);
    });

    it('should return all reactions by the user', () => {
        const result = getReactionsByUser(mockReactions, mockUser);
        expect(result).toHaveLength(2);
        expect(result.map(r => r.uuid)).toEqual(['reaction1', 'reaction3']);
    });

    it('should not return reactions by other users', () => {
        const result = getReactionsByUser(mockReactions, mockUser);
        expect(result).not.toContainEqual(expect.objectContaining({ author: 'user2' }));
    });

    it('should maintain reaction order', () => {
        const result = getReactionsByUser(mockReactions, mockUser);
        expect(result[0].uuid).toBe('reaction1');
        expect(result[1].uuid).toBe('reaction3');
    });
});

describe('getCommentsByUser', () => {
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

    const mockComments: Comment[] = [
        {
            uuid: 'comment1',
            parent: 'post1',
            parent_type: CommentParentType.Post,
            author: 'user1',
            text: 'Great post!'
        },
        {
            uuid: 'comment2',
            parent: 'post2',
            parent_type: CommentParentType.Post,
            author: 'user2',
            text: 'Interesting topic'
        },
        {
            uuid: 'comment3',
            parent: 'post3',
            parent_type: CommentParentType.Post,
            author: 'user1',
            text: 'I disagree'
        },
        {
            uuid: 'comment4',
            parent: 'comment1',
            parent_type: CommentParentType.Comment,
            author: 'user1',
            text: 'Thanks for the feedback'
        }
    ];

    it('should return empty array when user has no comments', () => {
        expect(getCommentsByUser([], mockUser)).toEqual([]);
    });

    it('should return all comments by the user', () => {
        const result = getCommentsByUser(mockComments, mockUser);
        expect(result).toHaveLength(3);
        expect(result.map(c => c.uuid)).toEqual(['comment1', 'comment3', 'comment4']);
    });

    it('should not return comments by other users', () => {
        const result = getCommentsByUser(mockComments, mockUser);
        expect(result).not.toContainEqual(expect.objectContaining({ author: 'user2' }));
    });

    it('should maintain comment order', () => {
        const result = getCommentsByUser(mockComments, mockUser);
        expect(result[0].uuid).toBe('comment1');
        expect(result[1].uuid).toBe('comment3');
        expect(result[2].uuid).toBe('comment4');
    });

    it('should handle comments on both posts and other comments', () => {
        const result = getCommentsByUser(mockComments, mockUser);
        const postComments = result.filter(c => c.parent_type === CommentParentType.Post);
        const commentComments = result.filter(c => c.parent_type === CommentParentType.Comment);
        
        expect(postComments).toHaveLength(2);
        expect(commentComments).toHaveLength(1);
    });
});

describe('getCommentsUnderPost', () => {
    const mockPost: Post = {
        uuid: 'post1',
        author: 'user1',
        text: 'Test post',
        reasoning: 'Test reasoning',
        created: Date.now()
    };

    const mockComments: Comment[] = [
        {
            uuid: 'comment1',
            parent: 'post1',
            parent_type: CommentParentType.Post,
            author: 'user1',
            text: 'First comment'
        },
        {
            uuid: 'comment2',
            parent: 'post2',
            parent_type: CommentParentType.Post,
            author: 'user2',
            text: 'Comment on other post'
        },
        {
            uuid: 'comment3',
            parent: 'post1',
            parent_type: CommentParentType.Post,
            author: 'user3',
            text: 'Second comment'
        },
        {
            uuid: 'comment4',
            parent: 'comment1',
            parent_type: CommentParentType.Comment,
            author: 'user4',
            text: 'Reply to comment'
        }
    ];

    it('should return empty array when post has no comments', () => {
        expect(getCommentsUnderPost([], mockPost)).toEqual([]);
    });

    it('should return all comments under the post', () => {
        const result = getCommentsUnderPost(mockComments, mockPost);
        expect(result).toHaveLength(2);
        expect(result.map(c => c.uuid)).toEqual(['comment1', 'comment3']);
    });

    it('should not return comments under other posts', () => {
        const result = getCommentsUnderPost(mockComments, mockPost);
        expect(result).not.toContainEqual(expect.objectContaining({ parent: 'post2' }));
    });

    it('should not return replies to comments', () => {
        const result = getCommentsUnderPost(mockComments, mockPost);
        expect(result).not.toContainEqual(expect.objectContaining({ parent: 'comment1' }));
    });

    it('should maintain comment order', () => {
        const result = getCommentsUnderPost(mockComments, mockPost);
        expect(result[0].uuid).toBe('comment1');
        expect(result[1].uuid).toBe('comment3');
    });
});

describe('getReactionsUnderPost', () => {
    const mockPost: Post = {
        uuid: 'post1',
        author: 'user1',
        text: 'Test post',
        reasoning: 'Test reasoning',
        created: Date.now()
    };

    const mockReactions: Reaction[] = [
        {
            uuid: 'reaction1',
            parent: 'post1',
            parent_type: ReactionParentType.Post,
            author: 'user1',
            value: React.Like
        },
        {
            uuid: 'reaction2',
            parent: 'post2',
            parent_type: ReactionParentType.Post,
            author: 'user2',
            value: React.Love
        },
        {
            uuid: 'reaction3',
            parent: 'post1',
            parent_type: ReactionParentType.Post,
            author: 'user3',
            value: React.Dislike
        },
        {
            uuid: 'reaction4',
            parent: 'comment1',
            parent_type: ReactionParentType.Comment,
            author: 'user4',
            value: React.Like
        }
    ];

    it('should return empty array when post has no reactions', () => {
        expect(getReactionsUnderPost([], mockPost)).toEqual([]);
    });

    it('should return all reactions under the post', () => {
        const result = getReactionsUnderPost(mockReactions, mockPost);
        expect(result).toHaveLength(2);
        expect(result.map(r => r.uuid)).toEqual(['reaction1', 'reaction3']);
    });

    it('should not return reactions under other posts', () => {
        const result = getReactionsUnderPost(mockReactions, mockPost);
        expect(result).not.toContainEqual(expect.objectContaining({ parent: 'post2' }));
    });

    it('should not return reactions on comments', () => {
        const result = getReactionsUnderPost(mockReactions, mockPost);
        expect(result).not.toContainEqual(expect.objectContaining({ parent: 'comment1' }));
    });

    it('should maintain reaction order', () => {
        const result = getReactionsUnderPost(mockReactions, mockPost);
        expect(result[0].uuid).toBe('reaction1');
        expect(result[1].uuid).toBe('reaction3');
    });
});

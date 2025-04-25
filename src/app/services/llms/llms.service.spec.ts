import { TestBed } from '@angular/core/testing';
import { LlmsService } from './llms.service';
import { GameService } from '../game/game.service';
import { User, Post, View, Comment } from '../../models/game';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

describe('LlmsService', () => {
  let service: LlmsService;
  let gameServiceSpy: jasmine.SpyObj<GameService>;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('GameService', ['getGame']);
    
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        LlmsService,
        { provide: GameService, useValue: spy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } }
      ]
    });
    
    service = TestBed.inject(LlmsService);
    gameServiceSpy = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateCommentUnderPost', () => {
    it('should generate a comment under a post', async () => {
      // Mock user data
      const mockUser: User = {
        uuid: 'user-123',
        name: 'John',
        surname: 'Doe',
        gender: 'male',
        age: 30,
        occupation: 'Software Engineer',
        location: { city: 'New York', country: 'USA' },
        residence: { city: 'New York', country: 'USA' },
        hometown: { city: 'Boston', country: 'USA' },
        bio: 'Tech enthusiast and coffee lover',
        traits: ['friendly', 'curious'],
        profile_picture: 'profile.jpg',
        role: 'user'
      };

      // Mock post data
      const mockPost: Post = {
        uuid: 'post-123',
        author: 'author-123',
        text: 'This is a test post about technology and innovation.',
        reasoning: 'Test reasoning',
        created: Date.now()
      };

      // Mock view data
      const mockView: View = {
        uuid: 'view-123',
        user: 'user-123',
        post: 'post-123',
        _reasoning: 'This post is interesting and well-written',
        _rating: 0.8,
        joyScore: 0.7,
        commentUrge: 0.9,
        shareUrge: 0.5,
        reactionLikeUrge: 0.8,
        reactionDislikeUrge: 0.1,
        reactionLoveUrge: 0.6,
        reactionShittyUrge: 0.1,
        time: Date.now()
      };

      try {
        // Call the function with real API
        const result = await service.generateCommentUnderPost(mockUser, mockPost, mockView);

        // Verify the result
        expect(result).toBeDefined();
        expect(result.uuid).toBeDefined();
        expect(result.author).toBe(mockUser.uuid);
        expect(result.parent).toBe(mockPost.uuid);
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
      } catch (error: any) {
        // Log the error and response for debugging
        console.error('API Error:', error);
        if (error.response) {
          console.error('API Response:', error.response);
        }
        throw error;
      }
    }, 30000); // Increased timeout to 30 seconds to account for API latency
  });
});

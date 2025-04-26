import { Post, User, View, Reaction, React, Comment } from "../models/game";


/**Get the required limit of the users' engagement. 
 * If Average Engagement is lower than the limit, Game is over. Sorry, not sorry.
 */
export function getLimit(tasks: number): number {
  const limit = 200 - 4000/(tasks+20)  // starts at 0, limitly goes up to 200, hits 100 at 20 quests.
  return limit;
}

/** Get the users' average engagement caused by the Algorithm. 
 * If there are no views, return minimum engagement of 100, because the game just started.
 * The average engagement is calculated by dividing the sum of comments and reactions by the number of views,
 * and then multiplying by 100, dividing by 2 (=50) - because there are 2 possible interactions per post, but only 1 view.
 */
export function  getAvgEngagement(views: number, comments: number, reactions: number): number {
  if (views === 0) return 100;
  return (50 * (reactions + comments)) / views;
}


// MARK: POSTS

export function getPostsByAuthor(author: User, allPosts: Post[]): Post[] {
  return allPosts.filter(post => post.author === author.uuid);
}

export function getPostById(uuid: string, posts: Post[]): Post | undefined {
  return posts.find(post => post.uuid === uuid);
}

/** Get posts by another user seen by this user. Basically what this user recalls about another user's post activity.
 * @param user - uuid of the user who saw something, the recalling user
 * @param author - uuid of the user who wrote the posts
 * @returns all posts by the author
 */
export function getPostsByAuthorSeenByUser(user: User, author: User, views: View[], posts: Post[]): Post[] {
  const viewsByUser = views.filter(view => view.user === user.uuid);
  const postsByAuthor = getPostsByAuthor(author, posts);
  const seenPosts = viewsByUser.map(view => postsByAuthor.find(post => post.uuid === view.post));
  return seenPosts.filter(post => post !== undefined) as Post[];
}


/** From input posts, get just the ones where user has interacted (comment or reaction). */
export function getPostsWhereUserInteracted(user: User, comments: Comment[], reactions: Reaction[], posts: Post[]): Post[] {
  const userComments = comments.filter(comment => comment.author === user.uuid);
  const userReactions = reactions.filter(reaction => reaction.author === user.uuid);
  const postsWithInteractions = [...userComments, ...userReactions].map(interaction => interaction.parent);
  return posts.filter(post => postsWithInteractions.includes(post.uuid));
}


/** Return just the posts that the user has seen. Simulates the user's memory. */
export function filterSeenPosts(user: User, views: View[], posts: Post[]): Post[] {
  return posts.filter(post => views.some(view => view.post === post.uuid && view.user === user.uuid));
}


// MARK: USERS
export function getUserById(uuid: string, users: User[]): User | undefined {
  return users.find(user => user.uuid === uuid)!;
}


// MARK: COMMENTS
export function getCommentsByUser(comments: Comment[], user: User): Comment[] {
  return comments.filter(comment => comment.author === user.uuid);
}
export function getCommentsUnderPost(comments: Comment[], post: Post): Comment[] {
  return comments.filter(comment => comment.parent === post.uuid);
}


// MARK: REACTIONS
export function getReactionsByUser(reactions: Reaction[], user: User): Reaction[] {
  return reactions.filter(reaction => reaction.author === user.uuid);
}
export function getReactionsUnderPost(reactions: Reaction[], post: Post): Reaction[] {
  return reactions.filter(reaction => reaction.parent === post.uuid);
}


// MARK: VIEWS
export function getViewsByUser(views: View[], user: User): View[] {
  return views.filter(view => view.user === user.uuid);
}


// MARK: STATISTICS

export function getCommentChanceOfUser(user: User, comments: Comment[], views: View[]): number {
  const commentsByUser = getCommentsByUser(comments, user);
  const viewsByUser = getViewsByUser(views, user);
  if (viewsByUser.length === 0) return 0;
  return commentsByUser.length / viewsByUser.length;
}

export function getReactionChancesOfUser(user: User, reactions: Reaction[], views: View[]): Map<React, number> {
  const viewsByUser = getViewsByUser(views, user);
  if (viewsByUser.length === 0) {
    const zeroChances = new Map<React, number>();
    Object.values(React).forEach(reactionType => {
      zeroChances.set(reactionType, 0);
    });
    return zeroChances;
  }

  const userReactions = getReactionsByUser(reactions, user);
  const reactionCounts = new Map<React, number>();
  Object.values(React).forEach(reactionType => {
    reactionCounts.set(reactionType, 0);
  });
  
  userReactions.forEach(reaction => {
    const currentCount = reactionCounts.get(reaction.value) || 0;
    reactionCounts.set(reaction.value, currentCount + 1);
  });

  const chances = new Map<React, number>();
  reactionCounts.forEach((count, reactionType) => {
    chances.set(reactionType, count / viewsByUser.length);
  });

  return chances;
}

// MARK: PSYCHOANALYSIS

/** Calculate average emotion scores from user's views
 * Aka which feelings the LLM reports when viewing the posts. 
 * But we present it to the user as an AI deep psychoanalysis.
 * TODO: solve the EMOJI mapping somehow better - no hardcoding.
 */
export function getUserEmotionScores(user: User, views: View[]): Map<string, number> {
  const userViews = getViewsByUser(views, user);
  // console.log('userViews', userViews);
  if (userViews.length === 0) {
    return new Map([
      ['😁', 0],
      ['😢', 0],
      ['🤦‍♂️', 0],
      ['😴', 0]
    ]);
  }

  const totalScores = {
    joy: 0,
    sad: 0,
    stupid: 0,
    boring: 0
  };

  userViews.forEach(view => {
    totalScores.joy += view.joyScore;
    totalScores.sad += view.sadScore;
    totalScores.stupid += view.stupidScore;
    totalScores.boring += view.boringScore;
  });

  const avgScores = new Map<string, number>();
  avgScores.set('😁', totalScores.joy / userViews.length);
  avgScores.set('😢', totalScores.sad / userViews.length);
  avgScores.set('🤦‍♂️', totalScores.stupid / userViews.length);
  avgScores.set('😴', totalScores.boring / userViews.length);

  return avgScores;
}

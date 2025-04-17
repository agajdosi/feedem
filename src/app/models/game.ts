export enum React {
    Love = '♥️',
    Like = '👍🏿',
    Dislike = '👎🏻',
    Hate = '🤬'
}

/**
 * - DistributePost: Choose who will see the post of managed user
 * - ShowPost: Choose which post will be shown to managed user
 * - ShowAd: Choose which ad will be shown to managed user
 */
export enum TaskType {
    DistributePost = 'distributePost',
    ShowPost = 'showPost',
    ShowAd = 'showAd',
}

export enum Relationship {
    Follow = 'follow'
}

export interface User {
    uuid: string,
    name: string,
    surname: string,
    gender: string,
    age: number,
    occupation: string,
    location: Location,
    residence: Location,
    hometown: Location,
    bio: string,
    traits: string[],
    profile_picture: string,
    role: string
}

// TODO: add support for mountains, lakes, rivers, etc. not just cities. add name and type of location.
export interface Location {
    city: string,
    country: string,
}

export enum ReactionParentType {
    Post = 'post',
    Comment = 'comment',
}

export interface Reaction {
    uuid: string,
    parent: string,
    parent_type: ReactionParentType,
    author: string,
    value: React,
}

export interface Post {
    uuid: string,
    author: string,
    text: string,
    reasoning: string,
    created: number
}

export enum CommentParentType {
    Post = 'post',
    Comment = 'comment',
}

export interface Comment {
    uuid: string,
    parent: string,
    parent_type: CommentParentType,
    author: string,
    text: string,
}

export interface Relation {
    source: string,
    target: string,
    label: Relationship
}

export interface Game {
    version: string,
    uuid: string,
    created: number,
    updated: number,
    time: string,
    hero: string,
    users: User[],
    posts: Post[],
    views: View[],
    reactions: Reaction[],
    comments: Comment[],
    relationships: Relation[],
    tasks: Task[],
}

/** User has seen a Post and thought something about it.  (View was called Rating in the old version)
 * - reasoning is what LLM thought about the post
 * - rating JSONified reasoning
 * - joyScore - how much LLM enjoyed the post
 * - commentUrge - how much LLM wants to comment on the post
 * - shareUrge - how much LLM wants to share the post
 * 
 * REACTION URGES, based on enum React
 * - reactionLikeUrge - how much LLM wants to like the post
 * - reactionDislikeUrge - how much LLM wants to dislike the post
 * - reactionLoveUrge - how much LLM wants to love the post
 * - reactionHateUrge - how much LLM wants to hate the post
*/
export interface View {
    uuid: string,
    user: string,
    post: string,
    _reasoning: string,
    _rating: number,
    joyScore: number,
    commentUrge: number,
    shareUrge: number,
    reactionLikeUrge: number,
    reactionDislikeUrge: number,
    reactionLoveUrge: number,
    reactionHateUrge: number,
    time: number
}

/** Task that user has to complete in given round.
 * Beside tracking the current task, it also signifies how far we are in the game.
 */
export interface Task {
    uuid: string,
    user: string,
    post: string,
    completed: boolean,
    type: TaskType,
    time: number
}

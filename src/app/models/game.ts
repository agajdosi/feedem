export enum React {
    Love = '♥️',
    Like = '👍',
    Dislike = '👎',
    Shit = '💩'
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

export enum RelationType {
    Follow = 'follow',
    Write = 'write',
    Get = 'get',
    Comment = 'comment',
    React = 'react'
}

/**
 * User is a person in the game.
 * 
 * _memory is a string that contains all the information about the user.
 * It is used to store the user's memory of the game.
 * It is used to store the user's memory of the game.
 */
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
    role: string,
    memory: Memory,
    dialect: string,
    // Psychological stats
    big_five: BigFive,
    plutchik: PlutchikEmotions,
    russell: RussellCircumplex,
}

/** BigFive aka OCEAN model quantifies users' psychological profile in 5 dimensions.
 * https://en.wikipedia.org/wiki/Big_Five_personality_traits
 */
export interface BigFive {
    openness: number,
    conscientiousness: number,
    extraversion: number,
    agreeableness: number,
    neuroticism: number
}

/** Plutchik's psychological model quantifies emotions around 4 axes.
 * https://en.wikipedia.org/wiki/Emotion_classification#Plutchik's_wheel_of_emotions
 */
export interface PlutchikEmotions {
    joy_sadness: number, // 1 to -1, 1 is joy, -1 is sadness
    anger_fear: number, // 1 to -1, 1 is anger, -1 is fear
    trust_disgust: number, // 1 to -1, 1 is trust, -1 is disgust
    surprise_anticipation: number, // 1 to -1, 1 is surprise, -1 is anticipation
}

/** Russell's Circumplex model quantifies emotions around 2 axes.
 * https://en.wikipedia.org/wiki/Emotion_classification#Circumplex_model
 */
export interface RussellCircumplex {
    valence: number, // -1-1, 1 is pleasant, -1 is unpleasant
    arousal: number, // -1-1, 1 is activated, -1 is deactivated, calm
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
    f_created: number, // fictional time of creation
    r_created: number, // real time of creation (GMT)
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
    f_created: number, // fictional time of creation
    r_created: number, // real time of creation (GMT)
}

export interface Relation {
    source: string,
    target: string,
    label: RelationType | string
}

export interface Game {
    version: string,
    uuid: string,
    created: number,
    updated: number,
    ftime: number, // fictional time, in milliseconds since 1970-01-01
    hero: string,
    users: User[],
    posts: Post[],
    views: View[],
    reactions: Reaction[],
    comments: Comment[],
    relations: Relation[],
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
 * - reactionShittyUrge - how much LLM wants to shit the post
*/
export interface View {
    uuid: string,
    user: string,
    post: string,
    _reasoning: string,
    _rating: number,
    joyScore: number,
    sadScore: number,
    stupidScore: number,
    boringScore: number,
    commentUrge: number,
    shareUrge: number,
    reactionLikeUrge: number,
    reactionDislikeUrge: number,
    reactionLoveUrge: number,
    reactionShittyUrge: number,
    time: number
}

/** Task that user has to complete in given round.
 * Beside tracking the current task, the history of tasks also signifies how far we are in the game.
 * The posts parameter holds IDs of the posts that are handled in this task. For DistributePost, it is the post of the Hero (and showPost is prefilled with same ID.)
 * For ShowPost, it is the array of posts from which the player has to select one to show to her Hero. TLDR:
 * 1. For tasks of type DistributePost, we are interested in the showTo parameter - the player has selected few users from many users to distribute the post to.
 * 2. For tasks of type ShowPost, we are interested in the showPost parameter - the player has selected a one post of many to show to her hero.
*/
export interface Task {
    uuid: string,
    users: string[], // authors of the posts, can be calculated from posts - getPost(postId).author, so we can remove this parameter later
    posts: string[], // incomming posts for this task
    completed: boolean,
    type: TaskType,
    time: number,
    showTo: string[] // to discuss: added for case when player deny to show post to her hero
    showPost: string // post that user has selected to show to her hero
}

// MARK: MEMORY

/**
 * Memory is a string that contains all the information the LLM has about itself, others and their interactions.
 */
export interface Memory {
    shortTerm: string,
    shortRelevancy: number,
    longTerm: string,
}

/** DUMMY - just an idea for now
 * InterPersonalMemory is a string that contains all the information about the user's memory of another user.
 */
export interface InterPersonalMemory {
    aboutUser: string,
    aboutAnotherUser: string,
}

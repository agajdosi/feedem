import { Injectable } from '@angular/core';
import { User, Post, View, React, Reaction, Comment, ReactionParentType, CommentParentType } from '../../models/game';
import { v4 as uuidv4 } from 'uuid';
const environment = {
  aigenburgAPI: 'https://aigenburg.lab.gajdosik.org' // -> uses prompts defined at https://phoenix.lab.gajdosik.org
  //aigenburgAPI: 'http://localhost:8888' // for local development
  // TODO: make this switch automatically based on the environment
};

@Injectable({
  providedIn: 'root'
})
export class LlmsService {

  /** DUMMY Generate a new post for social network.
   * TODO: implement the proper prompt and generation.
   * TODO: also add previous users posts to the prompt
   * Define the prompts at: https://phoenix.lab.gajdosik.org
   */
  async generatePost(user: User): Promise<Post> {
    const response = await fetch(`${environment.aigenburgAPI}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ // https://phoenix.lab.gajdosik.org/prompts/UHJvbXB0OjY=
        prompt_identifier: "feedem_generate_post",
        prompt_variables: {
          name: user.name,
          surname: user.surname,
          gender: user.gender,
          age: String(user.age),
          bio: user.bio,
          city: user.residence.city,
          country: user.residence.country,
          occupation: user.occupation,
          traits: user.traits.join(', '),
          timestring: new Date().toISOString(), // TODO: use ingame fictional time
          memory_string: "" // TODO: contruct memory of previous posts
        }
      })
    });

    const data = await response.json();
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    if (!parsedData?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    const post_text = parsedData.choices[0].message.content;
    console.log('Response message:', post_text);

    const post: Post = {
      uuid: uuidv4(),
      author: user.uuid,
      text: post_text,
      reasoning: '', // This will be filled when the post is viewed
      created: Date.now()
    };

    return post;
  }

  /**
   * Rate a post based on the user's identity.
   * 1. generate a reflection text about the post
   * 2. based on the reflection, create JSON with scores for each reaction type
   */
  async ratePost(post: Post, user: User) {
    const genURL  = `${environment.aigenburgAPI}/generate`;
    // 1. REFLECT - think about the post
    const response = await fetch(genURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ // https://phoenix.lab.gajdosik.org/prompts/UHJvbXB0OjM=
        prompt_identifier: "feedem_reflect_post",
        prompt_variables: {
          post_text: post.text,
          reader_bio: user.bio
        }
      })
    })

    const reflectionData = await response.json();
    const parsedReflection = typeof reflectionData === 'string' ? JSON.parse(reflectionData) : reflectionData;
    if (!parsedReflection?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }
    const reflection = parsedReflection.choices[0].message.content;
    console.log(`Got reflection on post (${post.uuid}): ${reflection}`);
    
    // 2. RATE - based on the reflection, create JSON with scores for each reaction type
    const resp = await fetch(genURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ // https://phoenix.lab.gajdosik.org/prompts/UHJvbXB0OjQ=
        prompt_identifier: "feedem_rate_post",
        prompt_variables: {
          reflection: reflection,
        }
      })
    })

    const ratingData = await resp.json();
    const parsedRating = typeof ratingData === 'string' ? JSON.parse(ratingData) : ratingData;
    if (!parsedRating?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }
    const rating = parsedRating.choices[0].message.content;
    console.log(`Got rating for post (${post.uuid}): ${rating}`);

    return rating;
  }

  /**
   * Decide which reaction the User will make under the post they have just seen.
   * We take only the reaction type with the highest urge and ignore all others. Then weroll a random number.
   * @param view - The view of the post.
   * @returns The reaction or null if the user will not react.
   */
  decideReaction(view: View): Reaction | null {
    const max = Math.max(view.reactionLikeUrge, view.reactionDislikeUrge, view.reactionHateUrge, view.reactionLoveUrge);
    const roll = Math.random();
    if (roll > max) {
      return null;
    }

    // if two urges are completely equal, we prefer the extremes and negations ;)
    let reactionType: React;
    if (max === view.reactionHateUrge) reactionType = React.Hate;
    else if (max === view.reactionLoveUrge) reactionType = React.Love;
    else if (max === view.reactionLikeUrge) reactionType = React.Like;
    else if (max === view.reactionDislikeUrge) reactionType = React.Dislike;
    else {
      throw new Error('Invalid reaction type');
    }
    
    const reaction: Reaction = {
      value: reactionType,
      author: view.user,
      parent: view.post,
      parent_type: ReactionParentType.Post,
      uuid: uuidv4()
    };
    return reaction;
  }

  /**
   * Decide whether the user will comment on the post they have just seen.
   */
  async decideComment(view: View, user: User, post: Post): Promise<Comment | null> {
    const roll = Math.random();
    if (roll > view.commentUrge) {
      return null;
    }

    const comment = await this.generateCommentUnderPost(user, post, view);
    return comment;
  }


  /** Generate a comment by user under a post, based on the previously generated reflection and rating of the post by the user. 
   * TODO: provide info if Reaction was done by the user or not. Actually provide also info about other users reactions.
  */
  async generateCommentUnderPost(user: User, post: Post, view: View): Promise<Comment> {
    const genURL  = `${environment.aigenburgAPI}/generate`;
    // 1. REFLECT - think about the post
    const response = await fetch(genURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ // https://phoenix.lab.gajdosik.org/prompts/UHJvbXB0Ojc=
        prompt_identifier: "feedem_generate_comment",
        prompt_variables: {
          user_bio: user.bio,
          author_name: post.author,
          author_surname: post.author,
          post_text: post.text,
          reasoning: view._reasoning,
        }
      })
    })

    const commentData = await response.json();
    console.log('Raw API Response:', commentData);
    
    const parsedComment = typeof commentData === 'string' ? JSON.parse(commentData) : commentData;
    console.log('Parsed Comment Data:', parsedComment);
    
    if (!parsedComment?.choices?.[0]?.message?.content) {
      console.error('Invalid response structure:', {
        hasChoices: !!parsedComment?.choices,
        choicesLength: parsedComment?.choices?.length,
        hasMessage: !!parsedComment?.choices?.[0]?.message,
        hasContent: !!parsedComment?.choices?.[0]?.message?.content
      });
      throw new Error('Invalid response format from API');
    }

    const comment_text = parsedComment.choices[0].message.content;
    console.log(`Got comment for post (${post.uuid}): ${comment_text}`);
    
    const comment: Comment = {
      uuid: uuidv4(),
      author: user.uuid,
      parent: post.uuid,
      parent_type: CommentParentType.Post,
      text: comment_text,
    };
    return comment;
  }



  /** TOTAL DUMMY!
   * TODO: implement in v2.
   */
  async generateCommentUnderComment(user: User, comment: Comment, view: View): Promise<Comment> {
    const c: Comment = {
      uuid: uuidv4(),
      author: user.uuid,
      parent: comment.uuid,
      parent_type: CommentParentType.Comment,
      text: 'This is a dummy comment',
    };
    return c;
  }
}

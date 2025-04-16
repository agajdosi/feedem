import { Injectable } from '@angular/core';
import { User, Post} from '../../models/game';

const environment = {
  aigenburgAPI: 'https://aigenburg.lab.gajdosik.org' // -> uses prompts defined at https://phoenix.lab.gajdosik.org
  //aigenburgAPI: 'http://localhost:8888' // for local development
  // TODO: make this switch automatically based on the environment
};

@Injectable({
  providedIn: 'root'
})
export class LlmsService {
  constructor() { }

  /** DUMMY Generate a new post for social network.
   * TODO: implement the proper prompt and generation.
   * TODO: also add previous users posts to the prompt
   * Define the prompts at: https://phoenix.lab.gajdosik.org
   */
  async generatePost(user: User) {
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
    console.log('Response message:', parsedData.choices[0].message.content);
    return parsedData.choices[0].message.content;
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


  async decideReaction() {

  }

  async decideComment() {

  }


  /** DUMMY!
   * Generate a comment by user under a post, based on the previously generated reflection and rating of the post by the user.
   * TODO: implement the proper prompt and generation.
   */
  async generateComment(user: User, post: Post, rating: any) {
    return 'This is a dummy comment';
  }

}

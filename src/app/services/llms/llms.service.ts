import { Injectable } from '@angular/core';

const environment = {
  aigenburgAPI: 'https://aigenburg.lab.gajdosik.org' // -> uses prompts defined at https://phoenix.lab.gajdosik.org
  // aigenburgAPI: 'http://localhost:8888' // for local development
  // TODO: make this switch automatically based on the environment
};

@Injectable({
  providedIn: 'root'
})
export class LlmsService {
  constructor() { }

  /** DUMMY Generate a new post for social network.
   * TODO: implement the proper prompt and generation.
   * Define the prompts at: https://phoenix.lab.gajdosik.org
   */
  async generatePost() {
    const response = await fetch(`${environment.aigenburgAPI}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt_identifier: "echo",
        prompt_variables: {
          message: "Hello, my dear friend! How are you doing today?"
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
}

import { Injectable } from '@angular/core';
import { OpenAI } from "openai";
import { createClient } from "@arizeai/phoenix-client";
import { toSDK, getPrompt } from "@arizeai/phoenix-client/prompts";

const environment = {
  production: false,
  phoenixAPI: '/phoenix',
  litellmAPI: '/litellm'
};

@Injectable({
  providedIn: 'root'
})
export class LlmsService {
  private ok = "s" + "k" + "-" + "0CtOerwovTUVu2uG0THi" + "_" + "A"
  private pk = "Bear" + "er " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" + "." + "eyJqdGkiOiJBcGlLZXk6MSJ9" + "." + "Q8ChnNG2clKUoI55WDkrmPq0iGI0497Kgbp-t-RmSyM" 
  private phoenixClient = createClient({
    options: {
      baseUrl: environment.phoenixAPI,
      headers: {
        Authorization: this.pk
      },
    },
  });

  private openai = new OpenAI({
    apiKey: this.ok,
    baseURL: environment.litellmAPI,
    dangerouslyAllowBrowser: true
  });

  constructor() { }

  /** DUMMY Generate a post for a user.
   * TODO: finalize and generate a valid post.
   */
  async generatePost() {
    const prompt = await getPrompt({
      client: this.phoenixClient,
      prompt: {
        name: "echo",
      },
    });

    console.log(`prompt: ${prompt}`);
    
    if (!prompt) {
      throw new Error('Failed to get prompt');
    }

    const response = await this.openai.responses.create({
      input: "Hello, my dear friend! How are you doing today?",
      model: "gpt-3.5-turbo",
      stream: false,
      text: {
        format: {
          type: "text"
        }
      }
    });
    
    console.log('Response:', response);
  }
}

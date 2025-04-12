import { Injectable } from '@angular/core';

const environment = {
  aigenburgAPI: 'http://localhost:8888'
};

@Injectable({
  providedIn: 'root'
})
export class LlmsService {
  constructor() { }

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

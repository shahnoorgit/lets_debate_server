import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async scoreOpinion(data: {
    opinion: string;
    title: string;
    description: string;
  }): Promise<{
    aiScore: number;
    tone: string;
    factAccuracy: string;
    relevance: string;
    flagged?: boolean;
  }> {
    const { opinion, title, description } = data;

    // Check for extremely vulgar content before sending to API
    const containsExtremelySevereLanguage =
      this.checkForSevereVulgarContent(opinion);

    if (containsExtremelySevereLanguage) {
      return {
        tone: 'aggressive',
        factAccuracy: 'high', // Default as we're not evaluating facts here
        relevance: 'high', // Default as we're not evaluating relevance here
        aiScore: 20, // Low score for extremely vulgar content
        flagged: true,
      };
    }

    const prompt = `
You are an AI assistant that evaluates user opinions in a debate.

Given:
- A debate room title and description.
- A user's opinion.

You must:
1. Evaluate the opinion's **tone** (e.g., respectful, aggressive, sarcastic, neutral).
2. Assess **fact accuracy** (high, moderate, low). If no factual claims are made, default to "high".
3. Check **relevance** to the room topic (high, moderate, low).
4. Generate a final **score between 0–100** based on tone, fact accuracy, relevance, and the opinion's length and engagement potential.

Additional Instructions:
- Consider the length and substance of the opinion when calculating the aiScore.
- Longer, more detailed opinions that provide reasoning, evidence, or unique perspectives and are likely to spark discussion should receive higher scores.
- Short, generic statements like "I like it" should receive lower scores, even if they are relevant.
- However, do not penalize brevity if the opinion is still insightful or makes a strong point concisely.

Example:
Debate Title: "Should climate change be a priority?"
User Opinion: "I like it."
Response:
{
  "tone": "neutral",
  "factAccuracy": "high",
  "relevance": "high",
  "aiScore": 40
}

Respond in the following JSON format only:
{
  "tone": "string",
  "factAccuracy": "high" | "moderate" | "low",
  "relevance": "high" | "moderate" | "low",
  "aiScore": number
}
---
Debate Title: "${title}"
Debate Description: "${description}"
User Opinion: "${opinion}"
---
Respond with ONLY valid JSON. No extra text or formatting.
`;

    const payload = {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 150, // Ensures concise responses
    };

    const apiKey = process.env.DEEPISEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DeepSeek API key not found in config');
    }

    try {
      const response = await firstValueFrom(
        this.http.post(
          'https://api.deepseek.com/v1/chat/completions',
          payload,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000, // 10-second timeout
          },
        ),
      );

      const raw = response.data.choices?.[0]?.message?.content || '';

      // Log raw response only in development/debugging environments
      if (process.env.NODE_ENV !== 'production') {
        console.log('Raw AI response:', raw);
      }

      // Handle potential JSON formats like markdown code blocks
      const cleaned = raw.replace(/```json|```/g, '').trim();

      try {
        const result = JSON.parse(cleaned);

        // Validate the response structure
        if (
          !result.tone ||
          !['high', 'moderate', 'low'].includes(result.factAccuracy) ||
          !['high', 'moderate', 'low'].includes(result.relevance) ||
          typeof result.aiScore !== 'number' ||
          result.aiScore < 0 ||
          result.aiScore > 100
        ) {
          throw new Error('Invalid response structure');
        }

        return result;
      } catch (parseError) {
        console.error('JSON parsing error:', parseError.message);

        // Fallback response if parsing fails
        return {
          tone: 'neutral',
          factAccuracy: 'high',
          relevance: 'moderate',
          aiScore: 50,
        };
      }
    } catch (error) {
      console.error(
        'AI Opinion Scoring Error:',
        error?.response?.data || error.message,
      );

      // Return fallback response for API errors
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          tone: 'neutral',
          factAccuracy: 'high',
          relevance: 'moderate',
          aiScore: 50,
        };
      }

      throw new InternalServerErrorException('Failed to score opinion');
    }
  }

  // Helper method to check for extremely vulgar content
  private checkForSevereVulgarContent(text: string): boolean {
    // List of extremely severe terms that would warrant immediate flagging
    // This should only contain the most extreme terms
    const extremelyVulgarTerms = [
      // Add extremely severe terms here - these would be terms that are universally
      // considered extremely offensive and have no legitimate use in debate
    ];

    const lowerText = text.toLowerCase();

    // Check for presence of extremely vulgar terms
    return extremelyVulgarTerms.some((term) => lowerText.includes(term));
  }
}

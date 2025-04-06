import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CategoryEnum, InterestEnum } from '@prisma/client';

@Injectable()
export class AiService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async enrichDebateRoom(data: {
    title: string;
    description: string;
    image: string;
    duration: number;
  }): Promise<{
    title: string;
    description: string;
    image: string;
    duration: number;
    keywords: string[];
    categories: CategoryEnum[];
    sub_categories: InterestEnum[];
  }> {
    const { title, description, image, duration } = data;

    const prompt = `
You are an AI that enriches debate topics.

Given a debate room with title and description, return STRICTLY a JSON object in the following structure:

{
  "keywords": string[],
  "categories": CategoryEnum[],
  "sub_categories": InterestEnum[]
}

Only use values from:
- CategoryEnum: ${Object.values(CategoryEnum)
      .map((v) => `"${v}"`)
      .join(', ')}
- InterestEnum: ${Object.values(InterestEnum)
      .map((v) => `"${v}"`)
      .join(', ')}

---
Title: "${title}"
Description: "${description}"
---

ONLY return valid JSON. No extra comments or text.
`;

    const payload = {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    };

    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    Logger.log(`API Key: ${apiKey ? apiKey.slice(0, 6) + '***' : 'MISSING'}`);

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
          },
        ),
      );

      const rawContent = response.data.choices?.[0]?.message?.content;
      Logger.debug('Raw AI Response:', rawContent);

      // Clean markdown code block wrapping if present
      const cleanedContent = rawContent.replace(/```json|```/g, '').trim();

      const enrichment = JSON.parse(cleanedContent);

      return {
        title,
        description,
        image,
        duration,
        ...enrichment,
      };
    } catch (error) {
      console.error('AI Error:', error?.response?.data || error.message);
      throw new InternalServerErrorException('Failed to enrich debate room');
    }
  }
}

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CategoryEnum, InterestEnum } from '@prisma/client';
import { CATEGORY_INTERESTS } from 'src/enum/user.enum';

export interface CategorizedInterest {
  category: CategoryEnum;
  interests: InterestEnum[];
}

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
    categorized_interests: CategorizedInterest[];
  }> {
    const { title, description, image, duration } = data;

    const prompt = `
You are an AI that enriches debate topics.

Given a debate room with title and description, return STRICTLY a JSON object in the following structure:
{
  "keywords": string[],
  "categorized_interests": [
    { "category": CategoryEnum, "interests": InterestEnum[] }
  ]
}

The "categorized_interests" should follow EXACTLY this format:
[
  {
    "category": "CATEGORY_NAME",
    "interests": ["INTEREST_1", "INTEREST_2"]
  }
]

For each category you select, you MUST ONLY include interests that belong to that specific category according to the mapping below.
Do not include interests that don't belong to their respective categories.

CategoryEnum values: ${Object.values(CategoryEnum)
      .map((v) => `"${v}"`)
      .join(', ')}

Here is the STRICT mapping of CategoryEnum to their valid InterestEnum values:
${Object.entries(CATEGORY_INTERESTS)
  .map(([category, interests]) => {
    return `${category}: ${interests.map((i) => `"${i}"`).join(', ')}`;
  })
  .join('\n')}

--- 
Title: "${title}"
Description: "${description}" 
---

ONLY return valid JSON without any extra comments or text.
Each interest MUST belong to its respective category based on the mapping provided above.
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

      const aiResponse = JSON.parse(cleanedContent);

      // Extract and validate categorized interests
      const categorizedInterests: CategorizedInterest[] = [];

      if (
        aiResponse.categorized_interests &&
        Array.isArray(aiResponse.categorized_interests)
      ) {
        // First, collect all valid categorized interests
        aiResponse.categorized_interests.forEach((item) => {
          if (
            item.category &&
            Object.values(CategoryEnum).includes(item.category) &&
            item.interests &&
            Array.isArray(item.interests)
          ) {
            // Validate that each interest belongs to its category
            const validInterests = item.interests.filter((interest) =>
              CATEGORY_INTERESTS[item.category].includes(interest),
            );

            if (validInterests.length > 0) {
              categorizedInterests.push({
                category: item.category,
                interests: validInterests,
              });
            }
          }
        });
      }

      // Remove duplicates and flatten the structure
      const uniqueCategories = [
        ...new Set(categorizedInterests.map((item) => item.category)),
      ];
      const deduplicatedCategories: CategorizedInterest[] = [];

      uniqueCategories.forEach((category) => {
        const allInterestsForCategory = categorizedInterests
          .filter((item) => item.category === category)
          .flatMap((item) => item.interests);

        // Remove duplicate interests
        const uniqueInterests = [...new Set(allInterestsForCategory)];

        deduplicatedCategories.push({
          category,
          interests: uniqueInterests,
        });
      });

      return {
        title,
        description,
        image,
        duration,
        keywords: aiResponse.keywords || [],
        categorized_interests: deduplicatedCategories,
      };
    } catch (error) {
      console.error('AI Error:', error?.response?.data || error.message);
      throw new InternalServerErrorException('Failed to enrich debate room');
    }
  }
}

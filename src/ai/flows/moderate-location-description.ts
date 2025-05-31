// src/ai/flows/moderate-location-description.ts
'use server';

/**
 * @fileOverview AI-powered content moderation flow for location descriptions.
 *
 * - moderateLocationDescription - Checks if a location description contains inappropriate content.
 * - ModerateLocationDescriptionInput - The input type for the moderateLocationDescription function.
 * - ModerateLocationDescriptionOutput - The return type for the moderateLocationDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateLocationDescriptionInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the location to be checked.'),
});
export type ModerateLocationDescriptionInput = z.infer<
  typeof ModerateLocationDescriptionInputSchema
>;

const ModerateLocationDescriptionOutputSchema = z.object({
  isAppropriate: z
    .boolean()
    .describe(
      'Whether the location description is appropriate and does not contain offensive content.'
    ),
  reason: z
    .string()
    .optional()
    .describe(
      'The reason why the content was flagged as inappropriate. Empty if the content is appropriate.'
    ),
});
export type ModerateLocationDescriptionOutput = z.infer<
  typeof ModerateLocationDescriptionOutputSchema
>;

export async function moderateLocationDescription(
  input: ModerateLocationDescriptionInput
): Promise<ModerateLocationDescriptionOutput> {
  return moderateLocationDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateLocationDescriptionPrompt',
  input: {schema: ModerateLocationDescriptionInputSchema},
  output: {schema: ModerateLocationDescriptionOutputSchema},
  prompt: `You are an AI content moderator for a local town website. Your task is to determine whether the provided location description contains any inappropriate or offensive content.

Description: {{{description}}}

Respond with a JSON object. If the description is appropriate, set "isAppropriate" to true and leave the "reason" field empty. If the description contains inappropriate content, set "isAppropriate" to false and provide a detailed "reason" for the rejection.
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const moderateLocationDescriptionFlow = ai.defineFlow(
  {
    name: 'moderateLocationDescriptionFlow',
    inputSchema: ModerateLocationDescriptionInputSchema,
    outputSchema: ModerateLocationDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';

/**
 * @fileOverview Summarizes code functionality and analyzes time and space complexity.
 *
 * - summarizeCode - A function that summarizes the code's functionality and analyzes its complexity.
 * - SummarizeCodeInput - The input type for the summarizeCode function.
 * - SummarizeCodeOutput - The return type for the summarizeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCodeInputSchema = z.object({
  code: z.string().describe('The code snippet to analyze.'),
  title: z.string().describe('The title of the code snippet.'),
  language: z.string().describe('The programming language of the code snippet.'),
});
export type SummarizeCodeInput = z.infer<typeof SummarizeCodeInputSchema>;

const SummarizeCodeOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the code functionality.'),
  timeComplexity: z.string().describe('The time complexity of the code.'),
  spaceComplexity: z.string().describe('The space complexity of the code.'),
});
export type SummarizeCodeOutput = z.infer<typeof SummarizeCodeOutputSchema>;

export async function summarizeCode(input: SummarizeCodeInput): Promise<SummarizeCodeOutput> {
  return summarizeCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCodePrompt',
  input: {schema: SummarizeCodeInputSchema},
  output: {schema: SummarizeCodeOutputSchema},
  prompt: `You are an expert software engineer specializing in code analysis.

You will receive a code snippet, its title, and its language. Your task is to provide a brief summary of the code's functionality, analyze its time complexity, and analyze its space complexity.

Code Title: {{{title}}}
Code Language: {{{language}}}
Code Snippet:
```{{{code}}}```

Provide the summary and complexity analysis in the following format:

Summary: <brief summary of the code functionality>
Time Complexity: <time complexity analysis>
Space Complexity: <space complexity analysis>`,
});

const summarizeCodeFlow = ai.defineFlow(
  {
    name: 'summarizeCodeFlow',
    inputSchema: SummarizeCodeInputSchema,
    outputSchema: SummarizeCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

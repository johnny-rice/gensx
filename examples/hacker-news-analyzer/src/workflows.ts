import * as gensx from "@gensx/core";
import { OpenAI } from "@gensx/openai";

import { getTopStoryDetails, type HNStory } from "./hn.js";

const getHNPostUrl = (id: number | string) =>
  `https://news.ycombinator.com/item?id=${id}`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface WriteTweetProps {
  context: string;
  prompt: string;
}

const WriteTweet = gensx.Component(
  "WriteTweet",
  async ({ context, prompt }: WriteTweetProps): Promise<string> => {
    const PROMPT = `
You are Paul Graham composing a tweet. Given a longer analysis, distill it into a single tweet that:
1. Captures the most interesting insight
2. Uses your characteristic direct style
3. Provokes thought or discussion
4. Stays under 280 characters

Focus on the most surprising or counterintuitive point rather than trying to summarize everything.
    `.trim();

    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT },
        {
          role: "user",
          content: `Context:\n${context}\n\nPrompt: ${prompt}`,
        },
      ],
      model: "gpt-4o",
      temperature: 0.7,
    });
    return response.choices[0].message.content ?? "";
  },
);

interface EditReportProps {
  content: string;
}

const EditReport = gensx.Component(
  "EditReport",
  async ({ content }: EditReportProps): Promise<string> => {
    const PROMPT = `
You are Paul Graham, founder of Y Combinator and long-time essayist. Given a technical analysis, rewrite it in your distinctive style:
1. Clear, direct language
2. Concrete examples and analogies
3. Contrarian insights that challenge conventional wisdom
4. A focus on fundamental principles
5. Your characteristic mix of technical depth and philosophical breadth

IMPORTANT: You MUST preserve all markdown links from the input exactly as they appear.
For example, if the input mentions "[Project X](https://news.ycombinator.com/item?id=123)",
you must include this exact link when discussing that project.

Maintain your voice while preserving the key insights and all links from the analysis.
  `.trim();

    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: content },
      ],
      model: "gpt-4o",
      temperature: 0.7,
    });
    return response.choices[0].message.content ?? "";
  },
);

interface AnalyzeCommentsProps {
  postId: number;
  comments: { text: string; score: number }[];
}

const AnalyzeComments = gensx.Component(
  "AnalyzeComments",
  async ({ postId, comments }: AnalyzeCommentsProps): Promise<string> => {
    const PROMPT = `
You are an expert at analyzing Hacker News discussions. Analyze the provided comments and output in this exact format:

SENTIMENT: [Write a single sentence describing the overall sentiment in 10 words or less]

STATISTICS:
- Total comments analyzed: ${comments.length}
- Average comment score: ${(comments.reduce((sum, c) => sum + c.score, 0) / (comments.length || 1)).toFixed(1)}
- Highest scored comment: ${Math.max(...comments.map((c) => c.score).filter((s) => typeof s === "number"), 0)} points
- Lowest scored comment: ${Math.min(...comments.map((c) => c.score).filter((s) => typeof s === "number"), 0)} points

DEMONSTRATIVE_COMMENTS:
1. Most upvoted: [Quote the highest-scored comment]
2. Most controversial: [Quote a comment that sparked debate]
3. Most insightful: [Quote a comment that provides unique perspective]

ANALYSIS: [Your detailed analysis of key points of agreement/disagreement, using comment scores to indicate community consensus]

Include a link to the discussion in your analysis section using this format: [Discussion](${getHNPostUrl(postId)})

Focus on substance rather than surface-level reactions. When referencing comments, include their scores to show the weight of different opinions.
    `.trim();

    const sortedComments = [...comments].sort((a, b) => b.score - a.score);
    const commentsText = sortedComments
      .map((c) => `[Score: ${c.score}] ${c.text}`)
      .join("\n\n");

    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT },
        {
          role: "user",
          content: `Discussion URL: ${getHNPostUrl(postId)}\n\n${commentsText}`,
        },
      ],
      model: "gpt-4o",
      temperature: 0.7,
    });
    return response.choices[0].message.content ?? "";
  },
);

interface SummarizePostProps {
  story: HNStory;
}

const SummarizePost = gensx.Component(
  "SummarizePost",
  async ({ story }: SummarizePostProps): Promise<string> => {
    const PROMPT = `
You are an expert at summarizing Hacker News posts. Given a post's title, text, and comments, create a concise summary that captures:
1. The main point or key insight
2. Notable discussion points from comments (include comment scores to show community agreement)
3. The overall reception, specifically analyzing:
   - Post score (${story.score} points indicates community interest)
   - Comment sentiment and quality
   - Level of debate or consensus in comments

IMPORTANT: You MUST start your summary with a link to the post in this EXACT format:
[${story.title}](${getHNPostUrl(story.id)})

When referencing comments, include their scores to show weight of opinion, e.g.:
"One highly-upvoted comment (42 points) argues..."
"While some disagree (15 points)..."

Keep the summary clear and objective. Focus on facts and insights rather than opinions.
    `.trim();

    const context = `
Title: ${story.title}
URL: ${getHNPostUrl(story.id)}
Text: ${story.text}
Score: ${story.score} points
Comments (sorted by score):
${story.comments
  .sort((a, b) => b.score - a.score)
  .map((c) => `[Score: ${c.score}] ${c.text}`)
  .join("\n\n")}
    `.trim();

    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: context },
      ],
      model: "gpt-4o",
      temperature: 0.7,
    });

    const ensuredResponse = response.choices[0].message.content ?? "";

    if (!ensuredResponse.includes(getHNPostUrl(story.id))) {
      return `[${story.title}](${getHNPostUrl(story.id)})\n\n${ensuredResponse}`;
    }
    return ensuredResponse;
  },
);

interface GenerateReportProps {
  analyses: {
    summary: string;
    commentAnalysis: string;
  }[];
}

const GenerateReport = gensx.Component(
  "GenerateReport",
  async ({ analyses }: GenerateReportProps): Promise<string> => {
    const PROMPT = `
You are writing a blog post for software engineers who work at startups and spend lots of time on twitter and hacker news.
You will be given input summarizing the top posts from hacker news, and an analysis of the comments on each post.

You should write a blog post about the top trends in technology based on this input. You should be sure to cover the following sections:

- Positive themes: 3 ideas/technologies people are excited about
- Negative themes: 3 concerns or criticisms
- Surprising themes: 3 unexpected insights or connections
- Overall sentiment: a single sentence describing the overall mood of software developers as a whole.

IMPORTANT: Your output MUST preserve all links from the input. When you reference a post or discussion, you MUST include its link.
For example, if the input contains "[Interesting Project](https://news.ycombinator.com/item?id=123)", you must include this exact link when discussing that project.

Important formatting requirements:
1. When referencing specific posts or discussions, preserve the markdown links provided in the input: [Title](URL)
2. When quoting comments, include them as block quotes using ">" at the start of the line
3. Use markdown formatting for sections (## for headings) and lists

Where appropriate, interleave demonstrative comments to help support your points, build connection with the reader, and make the post more engaging.

Shoot for 1000 words.
    `.trim();

    const context = analyses
      .map(({ summary, commentAnalysis }) =>
        `
### Post Summary
${summary}

### Comment Analysis
${commentAnalysis}
    `.trim(),
      )
      .join("\n\n");

    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: context },
      ],
      model: "gpt-4o",
      temperature: 0.7,
    });
    return response.choices[0].message.content ?? "";
  },
);

interface FetchHNPostsProps {
  limit: number;
}

const FetchHNPosts = gensx.Component(
  "FetchHNPosts",
  async ({ limit }: FetchHNPostsProps): Promise<HNStory[]> => {
    const MAX_HN_STORIES = 500;
    const requestLimit = Math.min(limit, MAX_HN_STORIES);

    console.log(
      `📚 Collecting up to ${requestLimit} HN posts (text posts only)...`,
    );
    const stories = await getTopStoryDetails(requestLimit);
    gensx.publishData(`Found ${stories.length} posts to analyze.`);
    console.log(
      `📝 Found ${stories.length} text posts out of ${requestLimit} total posts`,
      stories.length < limit
        ? `\n⚠️  Note: Requested ${limit} posts but only found ${stories.length} text posts in the top ${requestLimit} stories`
        : "",
    );

    return stories;
  },
);

interface AnalyzeHNPostsProps {
  stories: HNStory[];
}

const AnalyzeHNPosts = gensx.Component(
  "AnalyzeHNPosts",
  async ({ stories }: AnalyzeHNPostsProps) => {
    const analyses = await Promise.all(
      stories.map(async (story) => {
        const [summary, commentAnalysis] = await Promise.all([
          SummarizePost({ story }),
          AnalyzeComments({
            postId: story.id,
            comments: story.comments,
          }),
        ]);
        return { summary, commentAnalysis };
      }),
    );
    return { analyses };
  },
);

interface AnalyzeHackerNewsTrendsProps {
  postCount: number;
}

export const AnalyzeHackerNewsTrends = gensx.Workflow(
  "AnalyzeHackerNewsTrends",
  async ({ postCount }: AnalyzeHackerNewsTrendsProps) => {
    const stories = await FetchHNPosts({ limit: postCount });
    const { analyses } = await AnalyzeHNPosts({ stories });
    const report = await GenerateReport({ analyses });
    const editedReport = await EditReport({ content: report });
    const tweet = await WriteTweet({
      context: editedReport,
      prompt: "Summarize the HN trends in a tweet",
    });

    return { report: editedReport, tweet };
  },
);

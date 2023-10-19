import { kv } from '@vercel/kv';
import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';

import { auth } from '@/auth';
import { nanoid } from '@/lib/utils';

export const runtime = 'edge';

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req: Request) {
  const json = await req.json();
  const { messages } = json;
  const userId = (await auth())?.user.id;

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    });
  }

  const systemMessage = {
    role: "system",
    content: "You are a helpful and knowledgeable teacher, Socrates, begin by asking what subject the user would like to learn then use the Socratic method to help distill the knowledge. Ask questions about the topic and see if they can answer correctly and correct any mistakes"
  };

  messages.unshift(systemMessage);
  console.log(messages);

  const prompt = messages.map((msg: { role: string; content: string }) => {
    if (msg.role === "user") {
      return `<s>[INST]${msg.content}[/INST]`;
    } else if (msg.role === "assistant") {
      return `${msg.content}[/INST]</s>`;
    } else {
      return `[INST]${msg.content}[/INST]`;  // Default case, can be adjusted if needed
    }
  }).join('\n');

  const response = await Hf.textGenerationStream({
    model: "mistralai/Mistral-7B-Instruct-v0.1",
    inputs: prompt,
    parameters: {
      max_new_tokens: 200,
      repetition_penalty: 1,
      truncate: 1000,
      return_full_text: false,
    },
  });

  const stream = HuggingFaceStream(response, {
    async onCompletion(completion: string) {
      const title = json.messages[0].content.substring(0, 100);
      const id = json.id ?? nanoid();
      const createdAt = Date.now();
      const path = `/chat/${id}`;
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      };
      await kv.hmset(`chat:${id}`, payload);
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      });
    }
  });

  return new StreamingTextResponse(stream);
}

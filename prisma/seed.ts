import OpenAI from "openai";
import { chunkText } from "../src/lib/chunk";
import { prisma } from "../src/lib/prisma";

const DEMO_BOT_ID = "demo_site_assistant";

const DEMO_COPY = `
24/7concept is a lightweight assistant for small businesses. It answers common questions on your website so you spend less time repeating the same information.

What it does: visitors open chat, ask about hours, services, shipping, or policies, and get short, accurate replies based on the text we learn from your site.

Setup: create an account, add your website address, run one training pass, then paste a single line of code into your site. Most teams are live in a few minutes.

Plans: a free tier includes fifty assistant replies per calendar month for testing. Pro is a flat monthly price with unlimited replies and priority handling when you need help from our team.

Privacy: messages are used to provide the service and improve your assistant; we do not sell visitor chats to advertisers.

Contact: hello@247concept.app — we read every message and usually respond within one business day.
`.trim();

async function main() {
  const email = "demo@247concept.app";
  const openaiKey = process.env.OPENAI_API_KEY;

  await prisma.source.deleteMany({ where: { botId: DEMO_BOT_ID } });
  await prisma.message.deleteMany({ where: { botId: DEMO_BOT_ID } });
  await prisma.lead.deleteMany({ where: { botId: DEMO_BOT_ID } });
  await prisma.bot.deleteMany({ where: { id: DEMO_BOT_ID } });
  await prisma.user.deleteMany({ where: { email: { in: [email, "demo@harbor.app"] } } });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: null,
      name: "Demo workspace",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.bot.create({
    data: {
      id: DEMO_BOT_ID,
      userId: user.id,
      name: "24/7concept — homepage demo",
      websiteUrl: "https://relay.app",
      isDemo: true,
    },
  });

  if (!openaiKey) {
    console.warn("OPENAI_API_KEY missing — demo assistant created without embeddings. Add the key and run seed again.");
    return;
  }

  const openai = new OpenAI({ apiKey: openaiKey });
  const pieces = chunkText(DEMO_COPY, 550, 120);

  for (let i = 0; i < pieces.length; i += 8) {
    const slice = pieces.slice(i, i + 8);
    const rows = await Promise.all(
      slice.map(async (content) => {
        const res = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: content.slice(0, 8000),
        });
        const embedding = res.data[0].embedding as number[];
        return {
          botId: DEMO_BOT_ID,
          content,
          embedding,
        };
      })
    );
    await prisma.source.createMany({ data: rows });
  }

  console.log("Seed complete. Demo bot id:", DEMO_BOT_ID);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

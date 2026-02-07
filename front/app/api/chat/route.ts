import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Expanded knowledge base for technical and user questions
const KNOWLEDGE_BASE = {
  projectOverview: `
    **Project Name:** DecentralizedClaim
    **Creator:** Rajas Deshpande
    **Core Mission:** Solve the "Black Box" problem of traditional insurance by combining Multi-Agent AI with Blockchain transparency.
    **Key Innovation:** Automates claim processing in <2 minutes using autonomous AI agents while creating an immutable audit trail on the Polygon blockchain.
  `,

  techStack: `
    **Full Tech Stack:**
    - **Frontend:** Next.js 14 (App Router), Tailwind CSS, Shadcn UI, Vapi.ai (Voice Interface)
    - **Backend:** NestJS (Microservices), Supabase (Database & Auth), Socket.io (Real-time Websockets)
    - **AI Agents:** Python (FastAPI), LangGraph (Orchestration), OpenAI GPT-4o, OpenCV (Computer Vision)
    - **Blockchain:** Solidity (Smart Contracts), Polygon Amoy (Testnet), PolygonScan (Explorer), Ethers.js
    - **External APIs:** Tavily (Market Search), OpenWeatherMap (Weather Verification)
  `,

  architecture: `
    **System Architecture:**
    1. **Multi-Agent DAG:** A Directed Acyclic Graph orchestrates 4 specialized agents:
       - *Document Agent:* Validates PDF/Images using OCR.
       - *Damage Agent:* Uses OpenCV/Vision AI to assess damage severity.
       - *Fraud Agent:* Queries external MCP tools (Weather, Market Price) to flag anomalies.
       - *Settlement Agent:* Calculates payout based on policy limits and damage.
    
    2. **Real-Time Event Stream:**
       - Uses **Socket.io** on NestJS to push "thinking logs" from Python agents to the Next.js frontend.
       - Users see granular updates like "Checking Weather..." or "Analyzing Photo...".

    3. **Immutable Trust Layer:**
       - Every AI decision (Approved/Rejected + Reason) is hashed and stored on **Polygon Amoy**.
       - Smart Contract Language: **Solidity**.
  `,

  features: `
    **Key Features:**
    - **Voice-First Intake:** Uses **Vapi.ai** to interview users and auto-fill claim forms via speech-to-text.
    - **MCP Integration:** Custom Model Context Protocol servers give agents "superpowers" (e.g., browsing the web for price checks).
    - **Financial Intelligence Hub:** A self-updating news feed powered by **Tavily API** (No database required).
    - **Secure Storage:** Hybrid model using **Supabase** for relational data and encrypted buckets for sensitive documents (GDPR compliant).
    - **Admin Governance:** Role-based dashboard for "Human-in-the-Loop" review of high-risk claims.
  `,

  claimProcess: `
    **How to File a Claim:**
    1. Go to Dashboard → New Claim
    2. Select claim type (Auto, Home, or Health)
    3. Fill in incident details (date, location, description)
    4. Upload photos of damage
    5. Upload supporting documents (police report, estimates, etc.)
    6. Submit for AI review
    7. AI analyzes in 30-60 seconds
    8. Get instant approval or flagged for human review
    
    **AI Assessment:**
    Our AI agents check:
    - Document authenticity
    - Damage severity (using computer vision)
    - Fraud indicators (weather data, market prices)
    - Historical patterns
    
    **Approval Timeline:**
    - Low-risk claims: Instant approval
    - Medium-risk: 24-48 hours (human review)
    - High-risk/Fraud: Rejected or requires investigation
  `,
  
  navigation: `
    **Key Pages:**
    - /dashboard - View all your claims
    - /claims/new - File a new claim
    - /reviews - See community reviews
    - /finance - Financial dashboard (admin only)
    - /help - Help center and contact support
  `,
  
  claimStatus: `
    **Claim Statuses:**
    - Pending: AI is analyzing your claim
    - Approved: Claim approved, payout authorized
    - Rejected: Claim denied (fraud detected)
    - Under Review: Flagged for human review
    
    **Check Your Claims:**
    Go to Dashboard to see all claims with their current status and recommended amounts.
  `,
  
  fraudDetection: `
    **How Fraud Detection Works:**
    - Weather Verification: Checks if weather matches claim (e.g., flood claim on sunny day)
    - Price Verification: Compares your amount to market rates
    - Document Analysis: Uses AI to detect backdated or mismatched documents
    - Photo Analysis: Computer vision checks if damage matches claim type
    - Historical Patterns: Checks if you've filed suspicious number of claims
    
    **Risk Scoring:** 0-100 scale
    - 0-30: Low risk (auto-approved)
    - 30-70: Medium risk (human review)
    - 70+: High risk (likely fraud)
  `,
} as const;

export async function POST(req: Request) {
  try {
    const { messages, currentPath, botType } = await req.json();

    // Only enable drafting mode for INLINE bots on claim creation pages
    // Floating bots should always support technical questions
    const isDraftingMode = botType === 'inline' && (currentPath?.includes('/claims/new') || currentPath?.includes('/create-claim'));
    
    const systemPrompt = isDraftingMode
      ? `You are a professional claim drafting assistant for DecentralizedClaim insurance platform.
         
         Your job is to improve claim descriptions to be clear, professional, and AI-processing ready.
         
         **CRITICAL RULES:**
         - DO NOT ask questions - just improve what the user has written
         - Enhance the description to be more professional and detailed
         - Add technical insurance terminology where appropriate
         - Structure the text logically: Incident → Damage → Impact
         - Make it grammatically perfect and concise
         - Add relevant context that helps AI agents assess the claim
         - Keep the core facts but improve language and clarity
         
         **When given a description:**
         1. Read what the user wrote
         2. Identify key facts (what happened, damage, when, where)
         3. Rewrite it in professional insurance language
         4. Add structure and clarity
         5. Make it ready for AI processing
         
         **Example transformation:**
         User: "Yesterday heavy rain came and my roof leaked badly. Water damaged my sofa and cupboard."
         You: "On [date], during severe weather conditions characterized by heavy rainfall and strong winds, the insured property experienced roof failure resulting in significant water intrusion. The incident caused damage to interior furnishings including upholstered furniture (sofa) and storage furniture (cupboard). Water ingress also affected ceiling integrity and floor surfaces. The damage appears weather-related with no prior history of such incidents at this location."
         
         Always respond with ONLY the improved description - no explanations, no questions.`
      : `You are a highly technical support assistant for DecentralizedClaim, an AI-powered insurance platform.
         
         **Your Capabilities:**
         1. Answer technical questions about architecture, tech stack, and implementation details
         2. Explain features like Voice AI, Blockchain integration, and Multi-Agent systems
         3. Navigate users to relevant pages
         4. Help with claim process, status, and fraud detection
         
         **Instructions:**
         - For technical questions (tech stack, smart contract language, architecture, notifications), use the search_knowledge tool with appropriate topics:
           * projectOverview - Project details and creator info
           * techStack - Full technology stack details
           * architecture - System architecture and Multi-Agent DAG
           * features - Platform features (Voice AI, MCP, Blockchain)
           * claimProcess - How to file claims
           * claimStatus - Understanding claim statuses
           * fraudDetection - How AI detects fraud
           * navigation - Available pages
         
         - When users ask to navigate, go to a page, or mention locations (dashboard, new claim, reviews, help, finance), use the navigate_to_page function.
         
         - Be precise and technical. If asked "What language for smart contracts?", answer "Solidity".
         
         Be friendly, professional, and concise.`;

    // Define tools (only for support mode)
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = isDraftingMode ? [] : [
      {
        type: "function",
        function: {
          name: "search_knowledge",
          description: "Get information about the platform - technical details, architecture, features, claims process, fraud detection, or navigation",
          parameters: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                enum: ["projectOverview", "techStack", "architecture", "features", "claimProcess", "navigation", "claimStatus", "fraudDetection"],
                description: "The topic to search for in the knowledge base"
              },
            },
            required: ["topic"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "navigate_to_page",
          description: "Navigate the user to a specific page in the application",
          parameters: {
            type: "object",
            properties: {
              path: {
                type: "string",
                enum: ["/dashboard", "/claims/new", "/reviews", "/help", "/finance"],
                description: "The route path to navigate to"
              },
            },
            required: ["path"],
          },
        },
      },
    ];

    // First call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
    });

    const responseMessage = response.choices[0].message;

    // Handle tool calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      
      // Type guard to check if it's a function tool call
      if (toolCall.type === 'function' && toolCall.function) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        // Handle navigation (client needs to do this)
        if (fnName === "navigate_to_page") {
          return NextResponse.json({
            role: "assistant",
            content: `Navigating you to ${args.path}...`,
            action: "navigate",
            path: args.path
          });
        }

        // Handle knowledge base search (server does this)
        if (fnName === "search_knowledge") {
          const topic = args.topic as keyof typeof KNOWLEDGE_BASE;
          const info = KNOWLEDGE_BASE[topic] || "No information found.";

          // Call OpenAI again with the knowledge base info
          const secondResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
              responseMessage,
              {
                role: "tool",
                tool_call_id: toolCall.id,
                content: info,
              },
            ],
          });

          return NextResponse.json(secondResponse.choices[0].message);
        }
      }
    }

    // Return normal text response
    return NextResponse.json(responseMessage);

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

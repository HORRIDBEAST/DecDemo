# AI Support Chatbot Implementation

## 🎯 Overview

Successfully implemented an **AI-powered customer support chatbot** with context-aware assistance and claim drafting capabilities.

---

## ✨ Features

### **1. Global Support Assistant**
- ✅ **Floating Button:** Bottom-right corner, always accessible
- ✅ **Navigation:** AI can send users to any page (`/dashboard`, `/claims/new`, etc.)
- ✅ **Knowledge Base:** Answers questions about claims process, fraud detection, features
- ✅ **Context-Aware:** Changes behavior based on current page

### **2. Claim Drafting Mode**
- ✅ **Smart Detection:** Auto-activates on `/claims/new` page
- ✅ **Professional Writing:** AI helps write claim descriptions
- ✅ **Insert to Form:** One-click insertion of AI-generated text
- ✅ **Copy Function:** Users can copy text to clipboard

### **3. Tool Integration**
- ✅ **navigateToPage:** AI navigates users via Next.js router
- ✅ **searchKnowledge:** RAG on documentation
- ✅ **getClaimStatus:** Lookup claim by ID (placeholder)

---

## 📁 Files Created

### **1. Frontend Component**
**File:** `front/components/layout/support-bot.tsx`

**Features:**
- Floating button with gradient background
- Chat window with message history
- Context detection (drafting vs. support mode)
- Copy and Insert buttons for AI responses
- Dark mode support
- Loading indicators

### **2. Backend API**
**File:** `front/app/api/chat/route.ts`

**Features:**
- OpenAI GPT-4o-mini integration
- Tool calling (navigation, knowledge search)
- Context switching based on current page
- Knowledge base with 4 topics:
  - `claimProcess`
  - `navigation`
  - `claimStatus`
  - `fraudDetection`

### **3. Layout Integration**
**File:** `front/app/layout.tsx`

**Changes:**
- Added `<SupportBot />` globally (visible on all pages)

### **4. Claims Page Enhancement**
**File:** `front/app/(dashboard)/claims/new/page.tsx`

**Changes:**
- Added "AI Help" button next to Description field
- Modal overlay with drafting assistant
- `onInsertText` callback to populate form field

---

## 🔧 Installation

### **Step 1: Install Dependencies**

```bash
cd front
npm install ai @ai-sdk/openai
```

### **Step 2: Add Environment Variable**

Add to `front/.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### **Step 3: Restart Development Server**

```bash
npm run dev
```

---

## 🎨 UI/UX Design

### **Global Bot (Support Mode)**
```
┌─────────────────────────────────┐
│ 💬 Support Assistant            │
│ Ask me anything                  │
├─────────────────────────────────┤
│ 👋 Hi! I'm your AI assistant     │
│                                  │
│ I can help you with:             │
│ • Understanding claims process   │
│ • Navigating pages               │
│ • Checking claim status          │
│ • Explaining features            │
├─────────────────────────────────┤
│ [Type your question...]    [→]  │
└─────────────────────────────────┘
```

### **Drafting Mode (on /claims/new)**
```
┌─────────────────────────────────┐
│ ✨ Claim Drafting Assistant      │
│ Help writing your claim          │
├─────────────────────────────────┤
│ User: Help me write about my    │
│       car accident                │
│                                  │
│ Bot: On January 15, 2026, the   │
│      insured vehicle...          │
│      [Copy] [Insert]             │
└─────────────────────────────────┘
```

---

## 🧪 Testing Guide

### **Test 1: General Support Questions**

1. Click floating bot button (bottom-right)
2. Ask: "How do I file a claim?"
3. **Expected:** Bot explains 7-step process

### **Test 2: Navigation**

1. Ask: "Take me to my dashboard"
2. **Expected:** Bot uses `navigateToPage` tool and redirects you

### **Test 3: Claim Drafting**

1. Go to "New Claim" page
2. Click "AI Help" button next to Description field
3. Type: "I crashed into a tree in the rain"
4. **Expected:** Bot writes professional description
5. Click "Insert" → Text appears in form field

### **Test 4: Knowledge Search**

1. Ask: "How does fraud detection work?"
2. **Expected:** Bot explains 5 fraud checks (weather, price, documents, photos, history)

---

## 🔄 How It Works

### **Architecture:**

```
User Query
    ↓
Frontend (useChat hook)
    ↓
API Route (/api/chat)
    ↓
OpenAI GPT-4o-mini
    ↓
Tool Decision (navigate? search KB?)
    ↓
Execute Tool (client-side navigation or knowledge lookup)
    ↓
Stream Response
    ↓
Display in Chat UI
```

### **Context Awareness:**

- **On `/dashboard`:** Support mode (navigation, KB search)
- **On `/claims/new`:** Drafting mode (help write descriptions)
- **On `/help`:** Support mode (contact info, FAQs)

---

## 🎯 Example Conversations

### **Example 1: Filing a Claim**

**User:** "I need to file a claim, where do I start?"  
**Bot:** "I'll take you to the claim submission page!" [Navigates to `/claims/new`]

### **Example 2: Claim Status**

**User:** "What does 'Under Review' mean?"  
**Bot:** *[Searches knowledge base]* "Under Review means your claim has been flagged for human review. This typically happens for medium-risk claims..."

### **Example 3: Drafting**

**User:** "My windshield cracked from a rock on the highway"  
**Bot:** "On [date], the insured vehicle's windshield sustained damage from a road debris impact. A rock struck the windshield while traveling on [highway] at approximately [speed]. The crack spans 8 inches and impairs visibility. Immediate replacement is required for safety compliance. Estimated cost: $350."  
[Copy] [Insert]

---

## 🚀 Production Enhancements

### **Phase 2 (Future):**

1. **Real Claim Lookup:**
   ```typescript
   execute: async ({ claimId }) => {
     const { data } = await supabase
       .from('claims')
       .select('status, recommended_amount')
       .eq('id', claimId)
       .single();
     return `Claim ${claimId}: ${data.status}. Approved: $${data.recommended_amount}`;
   }
   ```

2. **Vector Search (RAG):**
   ```typescript
   execute: async ({ query }) => {
     const embedding = await openai.embeddings.create({ input: query });
     const docs = await pinecone.query({ vector: embedding.data[0].embedding });
     return docs.matches[0].metadata.text;
   }
   ```

3. **Multi-Language Support:**
   - Detect user language
   - Respond in Hindi, Tamil, Telugu, etc.

4. **Voice Input:**
   - Add microphone button to chat
   - Transcribe with Whisper API
   - Send transcription to chatbot

---

## 📝 Summary

**What Gemini Recommended:** ✅ IMPLEMENTED

| Feature | Status | Implementation |
|---------|--------|----------------|
| No Streamlit | ✅ | Used Vercel AI SDK |
| Next.js Integration | ✅ | React component in layout |
| Navigation Tool | ✅ | `useRouter().push()` via tool calling |
| Context Awareness | ✅ | Path-based mode switching |
| Drafting Assistant | ✅ | Integrated in same bot |
| Insert to Form | ✅ | `onInsertText` callback |

**Tech Stack:**
- Vercel AI SDK (`ai` package)
- OpenAI GPT-4o-mini
- Next.js 16 App Router
- Shadcn/ui components
- Zod for validation

**Cost:** ~$0.15 per 1000 messages (GPT-4o-mini pricing)

---

## 🎉 Result

You now have a **single, intelligent assistant** that:
- ✅ Answers support questions
- ✅ Navigates users to pages
- ✅ Helps write professional claims
- ✅ Inserts text directly into forms
- ✅ Works across entire application
- ✅ Feels like a real human assistant!

**No need for 2 separate bots** - one smart bot handles everything! 🚀

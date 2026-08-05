# Bookified 📚🎙️

**Bookified** is a Next.js web application that transforms your static PDF books into interactive, voice-based AI conversations. Upload any book, choose your preferred AI voice persona, and start talking, learning, and discussing your favorite reads in real-time.

---

## 🌟 Key Features

- 📂 **PDF Upload & Extraction**: Fast, client-side PDF text extraction and automatically generated cover designs.
- 🧩 **Smart Text Segmentation**: Book contents are intelligently chunked into overlapping segments and indexed in a MongoDB database for context-aware conversational recall.
- 🎙️ **Real-Time Voice Chat**: Powered by Vapi.ai for low-latency, natural turn-taking voice conversations with your book.
- 🗣️ **Custom Voice Personas**: Powered by ElevenLabs, featuring multiple male and female voices (Dave, Daniel, Chris, Rachel, Sarah) with fine-tuned conversational settings.
- 💬 **Live Transcript**: Visual speech-to-text transcript showing your dialogue in real-time.
- 🔑 **Secure Authentication**: User authentication and session management powered by Clerk.
- 🎨 **Warm Literary Aesthetic**: A beautiful UI styled with custom CSS variables, custom typography, animations, and dark-mode optimization.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Voice AI**: [Vapi.ai Client SDK](https://vapi.ai/) & [ElevenLabs](https://elevenlabs.io/)
- **File Storage**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **Authentication**: [Clerk](https://clerk.com/)
- **Styling**: Vanilla CSS with Tailwind CSS variables and `@tailwindcss/postcss`

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm/pnpm/yarn installed. You will also need active accounts and API keys/URIs for MongoDB, Clerk, Vapi.ai, and Vercel Blob.

### 1. Clone the repository and install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root of the project. You can copy the template from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in the required keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
MONGODB_URI=your-mongodb-connection-string

# Vapi
NEXT_PUBLIC_ASSISTANT_ID=your-vapi-assistant-id
NEXT_PUBLIC_VAPI_API_KEY=your-vapi-public-api-key

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore Bookified.

---

## ⚙️ How It Works

1. **Client-side PDF Extraction**: When you upload a book, the application uses `pdfjs-dist` to extract text client-side, renders the first page as a PNG cover, and uploads it to Vercel Blob.
2. **Text Chunking & Database Storage**: The text is split into segments of up to 500 words with a 50-word overlap to maintain continuity. These segments are stored under `BookSegment` models in MongoDB.
3. **Voice AI Session**: When you initiate a call, the custom hook `useVapi` initializes a voice session. The book's details and custom prompts are sent to Vapi, which uses ElevenLabs to read out responses and listen to user input.
4. **Subscription-Based Limits**: Built-in billing/session limits direct users to a subscriptions page if they exceed their allowed monthly voice-chat duration.

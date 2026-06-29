# RAG-Powered E-commerce Concierge

An intelligent, conversational shopping assistant for boutique e-commerce storefronts. This system replaces traditional search bars with a Natural Language semantic search agent that recommends products and manages the user's cart in real time.

## Project Structure

```
├── backend/
│   ├── seed.js             # Seeding database with boutique products + vector embeddings
│   ├── server.js           # Express.js backend with vector retrieval & OpenAI tool calling
│   ├── package.json
│   └── .env.example
├── ai-concierge/
│   ├── app/                # Next.js App Router (homepage, global layout & styling)
│   ├── components/         # Glassmorphic ChatWidget, animated ProductCard
│   ├── package.json
│   └── globals.css         # CSS transitions & custom scrollbar definitions
└── README.md
```

---

## 🚀 Quick Start Instructions

### 1. Database & AI Key Configuration

1. **MongoDB Atlas Cluster**: Set up a free cluster on MongoDB Atlas. Get your connection string (URI).
2. **API Key (OpenAI or Gemini)**: Get an API key from either OpenAI or Google AI Studio (Gemini).
3. Configure the environment files:
   - Create a `.env` file in the `backend/` folder based on `.env.example`:
     ```env
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     OPENAI_API_KEY=your_openai_or_gemini_api_key
     ```
   *(Note: The backend automatically detects the type of key you provide. If it's a Gemini key, it routes requests through the Gemini OpenAI compatibility layer using `gemini-1.5-flash` and `text-embedding-004`.)*

---

### 2. Seeding Skincare Products

Populate the database with sample products and generate vector embeddings:

```bash
cd backend
npm run seed
```

This will connect to your MongoDB database, create the `ecommerce_ai.products` collection, and fill it with boutique items.

---

### 3. Create MongoDB Atlas Vector Search Index

To enable natural language search, define a Vector Search Index in MongoDB Atlas:
1. Log into your MongoDB Atlas Console.
2. Navigate to **Atlas Search** inside your cluster.
3. Click **Create Search Index** and choose **JSON Editor** under **Atlas Vector Search**.
4. Select the `ecommerce_ai` database and `products` collection.
5. Name the index **`vector_index`**.
6. Paste the configuration definition below depending on your provider:

**For Gemini Keys (768 dimensions):**
```json
{
  "fields": [
    {
      "numDimensions": 768,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

**For OpenAI Keys (1536 dimensions):**
```json
{
  "fields": [
    {
      "numDimensions": 1536,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

7. Click **Next** and then **Save Changes**.

> 💡 **Vector Index Fallback**: We've implemented a robust keyword/regex fallback on the backend. If your Vector Index is still building (or not yet created), the concierge will fall back to keyword-based searching automatically.

---

### 4. Running the Backend Server

Start the Node/Express backend on port `5000`:

```bash
cd backend
npm run dev
```

---

### 5. Running the Frontend Website

Run the Next.js storefront (includes the floating chat widget):

```bash
cd ai-concierge
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🎨 Premium UI/UX Details

- **Minimalist Luxury Typography**: Incorporates *Playfair Display* for classic serif headings and *Outfit* for modern sans-serif readability.
- **Glassmorphic Widget**: Floating chat panel utilizes Tailwind's `backdrop-blur-md` and custom CSS transparency effects.
- **Framer Motion Animations**: Features smooth slide-up message reveals and spring-loaded open/close chat panel transitions.
- **Dynamic Product Rendering**: Generates landscape product cards directly in the chat panel with one-click "Add to Cart" capability, statefully syncing with the store header.

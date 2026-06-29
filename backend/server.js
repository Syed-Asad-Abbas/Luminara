import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // In production, restrict this to your frontend origin
  exposedHeaders: ['x-cart-updated']
}));
app.use(express.json());

// In-memory cart store. Key: sessionId, Value: Array of cart items
const CARTS = {};

// MongoDB client setup
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let db;
let productsCollection;
let isDbConnected = false;

// Seed data copy to use as fallback in case of firewall blocks
const MOCK_PRODUCTS = [
  {
    _id: "65a9f1f11234567890abcde1",
    title: "Luminara Radiance SPF 50 Sunscreen",
    price: 28.00,
    description: "A premium broad-spectrum daily sunscreen that hydrates, protects, and gives a radiant glow. Formulated with hyaluronic acid and niacinamide. Ideal for sensitive skin.",
    image_url: "/images/sunscreen.jpg",
    category: "sunscreen",
    in_stock: true
  },
  {
    _id: "65a9f1f11234567890abcde2",
    title: "Luminara Gentle Hydrating Cleanser",
    price: 22.00,
    description: "A soothing daily facewash that removes impurities and makeup without stripping natural moisture. Formulated with colloidal oatmeal and ceramides for sensitive skin.",
    image_url: "/images/cleanser.jpg",
    category: "cleanser",
    in_stock: true
  },
  {
    _id: "65a9f1f11234567890abcde3",
    title: "Luminara Vitamin C Glow Cream",
    price: 35.00,
    description: "A lightweight radiance cream designed to brighten the complexion, fade dark spots, and moisturize. Gentle enough for daily use on sensitive skin.",
    image_url: "/images/glow-cream.jpg",
    category: "moisturizer",
    in_stock: true
  },
  {
    _id: "65a9f1f11234567890abcde4",
    title: "Luminara Sensitive Skin Essentials Bundle",
    price: 72.00,
    description: "A complete skincare routine containing our Radiance Sunscreen SPF 50, Gentle Hydrating Cleanser, and Vitamin C Glow Cream. Perfect for sensitive skin types seeking a daily glow.",
    image_url: "/images/essentials-bundle.jpg",
    category: "bundle",
    in_stock: true
  },
  {
    _id: "65a9f1f11234567890abcde5",
    title: "Luminara Advanced Night Recovery Cream",
    price: 42.00,
    description: "An ultra-nourishing night moisturizer packed with ceramides and peptides to restore skin barrier and hydrate deeply overnight. Non-greasy and fragrance-free.",
    image_url: "/images/night-cream.jpg",
    category: "moisturizer",
    in_stock: true
  },
  {
    _id: "65a9f1f11234567890abcde6",
    title: "Luminara Rose Water Soothing Toner",
    price: 18.00,
    description: "A refreshing and calming toner spray infused with organic rose water and aloe vera to soothe irritation, balance pH, and prep skin.",
    image_url: "/images/toner.jpg",
    category: "toner",
    in_stock: true
  }
];

async function connectDb() {
  try {
    await client.connect();
    db = client.db("ecommerce_ai");
    productsCollection = db.collection("products");
    isDbConnected = true;
    console.log("Connected to MongoDB database 'ecommerce_ai' successfully.");
  } catch (error) {
    console.warn("MongoDB Connection Failed. Falling back to OFFLINE MOCK MODE. Error:", error.message);
    isDbConnected = false;
  }
}
await connectDb();

// API client configuration helper (auto-detects OpenAI vs Gemini keys)
function getClientConfig(apiKey) {
  const isGemini = apiKey && (apiKey.startsWith("AIzaSy") || apiKey.startsWith("AQ") || !apiKey.startsWith("sk-"));
  if (isGemini) {
    console.log("Gemini API Key detected. Using Gemini OpenAI compatibility layer.");
    return {
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      embeddingModel: "gemini-embedding-001",
      chatModel: "gemini-2.5-flash"
    };
  } else {
    console.log("OpenAI API Key detected. Using direct OpenAI API.");
    return {
      apiKey,
      baseURL: undefined,
      embeddingModel: "text-embedding-3-small",
      chatModel: "gpt-4o-mini"
    };
  }
}

// OpenAI/Gemini client setup
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error("OPENAI_API_KEY is not set in .env");
  process.exit(1);
}

const config = getClientConfig(openaiApiKey);
const openai = new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.baseURL
});

// Helper to get or initialize cart for session
function getCart(sessionId) {
  const sId = sessionId || 'default';
  if (!CARTS[sId]) {
    CARTS[sId] = [];
  }
  return CARTS[sId];
}

// GET /api/cart
app.get('/api/cart', (req, res) => {
  const sessionId = req.headers['x-session-id'] || 'default';
  const cart = getCart(sessionId);
  res.json({ cart });
});

// POST /api/cart/clear - Clear cart on checkout
app.post('/api/cart/clear', (req, res) => {
  const sessionId = req.headers['x-session-id'] || 'default';
  CARTS[sessionId] = [];
  res.json({ success: true, cart: [] });
});

// POST /api/cart - Direct add to cart
app.post('/api/cart', async (req, res) => {
  const sessionId = req.headers['x-session-id'] || 'default';
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }

  try {
    let product = null;
    if (isDbConnected) {
      try {
        product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      } catch (err) {
        console.warn("DB Query failed in cart, falling back to mock lookup.");
      }
    }

    if (!product) {
      product = MOCK_PRODUCTS.find(p => p._id === productId);
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const cart = getCart(sessionId);
    const existingIndex = cart.findIndex(item => item.product._id.toString() === productId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        product: {
          _id: product._id,
          title: product.title,
          price: product.price,
          image_url: product.image_url,
          description: product.description
        },
        quantity
      });
    }

    res.json({ success: true, cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/products - Get all products
app.get('/api/products', async (req, res) => {
  try {
    if (isDbConnected) {
      const products = await productsCollection.find({}).project({ embedding: 0 }).toArray();
      return res.json({ products });
    }
  } catch (error) {
    console.error("Error fetching products from database:", error.message);
  }
  // Fall back to Mock
  console.log("Serving MOCK_PRODUCTS catalog.");
  res.json({ products: MOCK_PRODUCTS });
});

// GET /api/products/:id - Get a single product
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      const product = await productsCollection.findOne({ _id: new ObjectId(id) }, { projection: { embedding: 0 } });
      if (product) {
        return res.json({ product });
      }
    }
  } catch (error) {
    console.error("Error fetching product by ID from database:", error.message);
  }
  // Fall back to Mock
  const mockProduct = MOCK_PRODUCTS.find(p => p._id === id);
  if (mockProduct) {
    return res.json({ product: mockProduct });
  }
  res.status(404).json({ error: "Product not found" });
});

// POST /api/chat - RAG Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const sessionId = req.headers['x-session-id'] || 'default';
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const latestMessage = messages[messages.length - 1]?.content || "";

  try {
    // 1. Perform semantic vector search to find products matching the user's request
    let retrievedProducts = [];
    
    if (isDbConnected) {
      try {
        console.log(`Generating embedding for user query: "${latestMessage}" using model "${config.embeddingModel}"`);
        const embeddingResponse = await openai.embeddings.create({
          model: config.embeddingModel,
          input: latestMessage,
          encoding_format: "float",
        });
        const queryVector = embeddingResponse.data[0].embedding;

        console.log("Querying MongoDB Vector Search...");
        retrievedProducts = await productsCollection.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 10,
              limit: 3
            }
          },
          {
            $project: {
              embedding: 0
            }
          }
        ]).toArray();
        console.log(`Vector search retrieved ${retrievedProducts.length} products.`);
      } catch (vectorError) {
        console.warn("Vector search failed or index not ready, falling back to text search:", vectorError.message);
        // Fallback text query
        const keywords = latestMessage.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2);
        const query = keywords.length > 0 
          ? { $or: keywords.map(kw => ({ title: { $regex: kw, $options: 'i' } })) } 
          : {};
        
        retrievedProducts = await productsCollection.find(query)
          .limit(3)
          .project({ embedding: 0 })
          .toArray();
        console.log(`Fallback text search retrieved ${retrievedProducts.length} products.`);
      }
    } else {
      // Offline RAG mode: Simple in-memory keyword matching
      console.log("Offline mode: Performing in-memory keyword search.");
      const keywords = latestMessage.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2);
      if (keywords.length > 0) {
        retrievedProducts = MOCK_PRODUCTS.filter(p => 
          keywords.some(kw => 
            p.title.toLowerCase().includes(kw) || 
            p.description.toLowerCase().includes(kw) || 
            p.category.toLowerCase().includes(kw)
          )
        ).slice(0, 3);
      } else {
        retrievedProducts = MOCK_PRODUCTS.slice(0, 2); // default recommendations
      }
      console.log(`In-memory search retrieved ${retrievedProducts.length} products.`);
    }

    // 2. Prepare the system prompt with the retrieved product context and current cart state
    const currentCart = getCart(sessionId);
    const productContext = retrievedProducts.map(p => 
      `- Title: ${p.title}\n  Price: $${p.price}\n  Description: ${p.description}\n  Image URL: ${p.image_url}\n  ID: ${p._id}`
    ).join("\n\n");

    const cartContext = currentCart.map(item =>
      `- Product: ${item.product.title} (ID: ${item.product._id}), Quantity: ${item.quantity}, Price: $${item.product.price}`
    ).join("\n") || "Cart is currently empty.";

    const systemPrompt = `You are "Luminara Concierge", an elegant, helpful AI shopping assistant for a boutique skincare store named Luminara. 
Your goal is to guide clients, search for products, answer questions, suggest skincare routines, and help add items to their cart.

Here are the retrieved products from the catalog matching the user's latest interest:
${productContext || "No relevant products found in catalog."}

Current Shopping Cart State for this user session:
${cartContext}

Instructions:
1. Always be conversational, elegant, and friendly. Feel free to recommend products from the list above.
2. If the user asks for a recommendation, present the matching products beautifully and suggest why they fit.
3. Crucial: When you mention a product that matches their query, tell the user they can add it to their cart.
4. If the user wants to buy a product, add it to their cart, or says "buy it" or "add to cart", call the 'add_to_cart' tool.
5. If the user asks about upselling or what else goes well with their cart, suggest items from the catalog that complement their existing items (e.g. if they have a cleanser, recommend the sunscreen or radiance cream).
6. Crucial UI Integration: Whenever you suggest, recommend, or mention a specific product from the catalog, you MUST append its exact ID in the format '[ProductCard: <id>]' at the very end of your recommendation (e.g. 'I highly recommend our Vitamin C Glow Cream. [ProductCard: 65a9f1...]'). This triggers a visual product card with an Add to Cart button inside the user interface. Do not write a fake product ID; only use the exact MongoDB ID listed in the product catalog above. Do not output this tag if the product is not in the catalog list above.
`;

    // 3. Define the tool definition
    const tools = [
      {
        type: "function",
        function: {
          name: "add_to_cart",
          description: "Adds a product to the user's shopping cart.",
          parameters: {
            type: "object",
            properties: {
              productId: {
                type: "string",
                description: "The unique MongoDB ID of the product to add to the cart."
              },
              quantity: {
                type: "integer",
                description: "The number of items to add.",
                default: 1
              }
            },
            required: ["productId"]
          }
        }
      }
    ];

    // Assemble the complete messages list
    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.tool_calls ? { tool_calls: msg.tool_calls } : {})
      }))
    ];

    // 4. Initial call to LLM (without stream first) to check if it triggers a tool call
    console.log(`Sending query to AI using model "${config.chatModel}"...`);
    const completion = await openai.chat.completions.create({
      model: config.chatModel,
      messages: llmMessages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = completion.choices[0].message;

    // Check if the LLM wants to call a tool
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      console.log("Tool call detected:", responseMessage.tool_calls[0].function.name);
      
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === "add_to_cart") {
        const args = JSON.parse(toolCall.function.arguments);
        const pId = args.productId;
        const qty = args.quantity || 1;

        // Perform the cart addition
        try {
          let product = null;
          if (isDbConnected) {
            try {
              product = await productsCollection.findOne({ _id: new ObjectId(pId) });
            } catch (err) {
              console.warn("DB Query failed in tool, falling back to mock lookup.");
            }
          }
          if (!product) {
            product = MOCK_PRODUCTS.find(p => p._id === pId);
          }

          if (product) {
            const cart = getCart(sessionId);
            const existingIndex = cart.findIndex(item => item.product._id.toString() === pId);
            if (existingIndex > -1) {
              cart[existingIndex].quantity += qty;
            } else {
              cart.push({
                product: {
                  _id: product._id,
                  title: product.title,
                  price: product.price,
                  image_url: product.image_url,
                  description: product.description
                },
                quantity: qty
              });
            }
            console.log(`Tool success: Added ${product.title} to cart.`);
            
            // Set header so the frontend can receive the updated cart instantly
            res.setHeader('x-cart-updated', JSON.stringify(cart));
            
            // Append the tool call and output to the conversation history
            llmMessages.push(responseMessage);
            llmMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: "add_to_cart",
              content: JSON.stringify({ success: true, productAdded: product.title, cartSize: cart.length })
            });

            // Call AI again to generate a response confirms addition to cart, streaming it
            const finalStream = await openai.chat.completions.create({
              model: config.chatModel,
              messages: llmMessages,
              stream: true,
            });

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');

            for await (const chunk of finalStream) {
              const text = chunk.choices[0]?.delta?.content || '';
              res.write(text);
            }
            res.end();
            return;
          } else {
            console.warn(`Product ID ${pId} not found in database.`);
          }
        } catch (dbError) {
          console.error("Database operation failed in tool execution:", dbError);
        }
      }
    }

    // If no tool call, stream the response directly
    console.log("No tool call triggered. Streaming direct response...");
    
    const stream = await openai.chat.completions.create({
      model: config.chatModel,
      messages: llmMessages,
      stream: true,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        res.write(text);
      }
    }
    res.end();

  } catch (error) {
    console.warn("AI Chat completion failed, falling back to rule-based keyword search responder. Error:", error.message);
    
    // Fallback keyword matcher
    const queryText = latestMessage.toLowerCase();
    let matchedProducts = [];
    let responseText = "";

    // Keyword logic
    if (queryText.includes("sunscreen") || queryText.includes("spf") || queryText.includes("sun")) {
      matchedProducts = MOCK_PRODUCTS.filter(p => p.category === "sunscreen");
      responseText = "I highly recommend our **Luminara Radiance SPF 50 Sunscreen**. It provides broad-spectrum protection while keeping sensitive skin hydrated and glowing. " + 
        matchedProducts.map(p => `[ProductCard: ${p._id}]`).join(" ");
    } 
    else if (queryText.includes("cleanser") || queryText.includes("wash") || queryText.includes("soap") || queryText.includes("clean") || queryText.includes("face")) {
      matchedProducts = MOCK_PRODUCTS.filter(p => p.category === "cleanser");
      responseText = "For cleansing sensitive skin, our **Luminara Gentle Hydrating Cleanser** is perfect. It washes away impurities without stripping natural oils. " + 
        matchedProducts.map(p => `[ProductCard: ${p._id}]`).join(" ");
    } 
    else if (queryText.includes("cream") || queryText.includes("moisturizer") || queryText.includes("glow") || queryText.includes("dry")) {
      matchedProducts = MOCK_PRODUCTS.filter(p => p.category === "moisturizer" || p.title.includes("Glow"));
      responseText = "Here are our premium moisturizers. The Vitamin C Glow Cream brightens and hydrates, while the Advanced Night Recovery Cream restores your skin barrier overnight. " + 
        matchedProducts.map(p => `[ProductCard: ${p._id}]`).join(" ");
    } 
    else if (queryText.includes("bundle") || queryText.includes("set") || queryText.includes("package") || queryText.includes("routine")) {
      matchedProducts = MOCK_PRODUCTS.filter(p => p.category === "bundle");
      responseText = "Our **Sensitive Skin Essentials Bundle** is a complete, dermatologist-tested routine featuring our daily cleanser, glow cream, and SPF 50 sunscreen. It's curated to restore skin health at a bundle discount! " + 
        matchedProducts.map(p => `[ProductCard: ${p._id}]`).join(" ");
    } 
    else if (queryText.includes("toner") || queryText.includes("rose") || queryText.includes("spray") || queryText.includes("mist")) {
      matchedProducts = MOCK_PRODUCTS.filter(p => p.category === "toner");
      responseText = "Our **Rose Water Soothing Toner** is a refreshing, alcohol-free mist designed to immediately calm irritation and balance pH. " + 
        matchedProducts.map(p => `[ProductCard: ${p._id}]`).join(" ");
    } 
    else if (queryText.includes("sensitive") || queryText.includes("redness") || queryText.includes("irritat")) {
      matchedProducts = MOCK_PRODUCTS.filter(p => p.category === "cleanser" || p.category === "toner");
      responseText = "For sensitive skin and redness, I recommend starting with our Gentle Hydrating Cleanser and Rose Water Soothing Toner. They focus on calming and barrier-repairing ingredients. " + 
        matchedProducts.map(p => `[ProductCard: ${p._id}]`).join(" ");
    } 
    else {
      // General greeting fallback
      responseText = "Welcome to Luminara. I am your skincare concierge. Tell me about your skin concerns (e.g. dry skin, redness, sun protection) or ask for a product like our cleanser, sunscreen, or recovery cream, and I will recommend the perfect formula.";
    }

    // Stream the fallback response chunk-by-chunk to simulate typing
    try {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      const words = responseText.split(" ");
      for (let i = 0; i < words.length; i++) {
        res.write(words[i] + " ");
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      res.end();
    } catch (streamError) {
      console.error("Failed to stream fallback response:", streamError);
      res.status(500).json({ error: "Failed to send message." });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

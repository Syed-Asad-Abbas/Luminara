import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const products = [
  {
    title: "Luminara Radiance SPF 50 Sunscreen",
    price: 28.00,
    description: "A premium broad-spectrum daily sunscreen that hydrates, protects, and gives a radiant glow. Formulated with hyaluronic acid and niacinamide. Ideal for sensitive skin.",
    image_url: "/images/sunscreen.jpg",
    category: "sunscreen",
    in_stock: true
  },
  {
    title: "Luminara Gentle Hydrating Cleanser",
    price: 22.00,
    description: "A soothing daily facewash that removes impurities and makeup without stripping natural moisture. Formulated with colloidal oatmeal and ceramides for sensitive skin.",
    image_url: "/images/cleanser.jpg",
    category: "cleanser",
    in_stock: true
  },
  {
    title: "Luminara Vitamin C Glow Cream",
    price: 35.00,
    description: "A lightweight radiance cream designed to brighten the complexion, fade dark spots, and moisturize. Gentle enough for daily use on sensitive skin.",
    image_url: "/images/glow-cream.jpg",
    category: "moisturizer",
    in_stock: true
  },
  {
    title: "Luminara Sensitive Skin Essentials Bundle",
    price: 72.00,
    description: "A complete skincare routine containing our Radiance Sunscreen SPF 50, Gentle Hydrating Cleanser, and Vitamin C Glow Cream. Perfect for sensitive skin types seeking a daily glow.",
    image_url: "/images/essentials-bundle.jpg",
    category: "bundle",
    in_stock: true
  },
  {
    title: "Luminara Advanced Night Recovery Cream",
    price: 42.00,
    description: "An ultra-nourishing night moisturizer packed with ceramides and peptides to restore skin barrier and hydrate deeply overnight. Non-greasy and fragrance-free.",
    image_url: "/images/night-cream.jpg",
    category: "moisturizer",
    in_stock: true
  },
  {
    title: "Luminara Rose Water Soothing Toner",
    price: 18.00,
    description: "A refreshing and calming toner spray infused with organic rose water and aloe vera to soothe irritation, balance pH, and prep skin.",
    image_url: "/images/toner.jpg",
    category: "toner",
    in_stock: true
  }
];

function getClientConfig(apiKey) {
  const isGemini = apiKey && (apiKey.startsWith("AIzaSy") || apiKey.startsWith("AQ") || !apiKey.startsWith("sk-"));
  if (isGemini) {
    console.log("Gemini API Key detected. Using Gemini OpenAI compatibility layer.");
    return {
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      embeddingModel: "gemini-embedding-001"
    };
  } else {
    console.log("OpenAI API Key detected. Using direct OpenAI API.");
    return {
      apiKey,
      baseURL: undefined,
      embeddingModel: "text-embedding-3-small"
    };
  }
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!uri) {
    console.error("Error: MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  if (!openaiApiKey) {
    console.error("Error: OPENAI_API_KEY is not set in backend/.env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB.");

    const db = client.db("ecommerce_ai");
    const collection = db.collection("products");

    const config = getClientConfig(openaiApiKey);
    console.log(`Initializing client (Base URL: ${config.baseURL || "default OpenAI"})...`);
    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    });

    console.log("Clearing existing products in collection...");
    await collection.deleteMany({});

    console.log("Generating embeddings and preparing products database...");
    const preparedProducts = [];

    for (const product of products) {
      console.log(`Generating embedding for: "${product.title}" using model "${config.embeddingModel}"`);
      
      // We combine title and description for a rich context embedding
      const textToEmbed = `${product.title}: ${product.description}`;
      
      const response = await openai.embeddings.create({
        model: config.embeddingModel,
        input: textToEmbed,
        encoding_format: "float",
      });

      const embedding = response.data[0].embedding;
      preparedProducts.push({
        ...product,
        embedding
      });
    }

    console.log("Inserting seeded products into MongoDB...");
    const result = await collection.insertMany(preparedProducts);
    console.log(`Successfully seeded ${result.insertedCount} products into database 'ecommerce_ai.products'.`);

  } catch (error) {
    console.error("Seeding failed with error:", error);
  } finally {
    await client.close();
    console.log("Database connection closed.");
  }
}

seed();

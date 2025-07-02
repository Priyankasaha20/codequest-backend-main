import mongoose from "mongoose";
import dotenv from "dotenv";
import InterviewType from "../src/models/InterviewType.js";

dotenv.config();

const sampleInterviewTypes = [
  {
    name: "Technical Interview",
    slug: "technical-interview",
    description:
      "Software engineering technical interview focusing on problem-solving and coding skills",
    questions: [
      "Tell me about your technical background and experience.",
      "Describe a challenging technical problem you solved recently.",
      "How do you approach debugging complex issues?",
      "Explain a time when you had to learn a new technology quickly.",
      "What's your experience with version control and collaboration?",
    ],
  },
  {
    name: "Behavioral Interview",
    slug: "behavioral-interview",
    description:
      "Behavioral interview focusing on soft skills and past experiences",
    questions: [
      "Tell me about yourself.",
      "Describe a time when you faced a difficult challenge at work.",
      "How do you handle working under pressure?",
      "Tell me about a time you had to work with a difficult team member.",
      "Where do you see yourself in 5 years?",
    ],
  },
  {
    name: "System Design Interview",
    slug: "system-design-interview",
    description: "System design interview for senior engineering positions",
    questions: [
      "Design a URL shortening service like bit.ly",
      "How would you design a chat application like WhatsApp?",
      "Design a social media feed system",
      "How would you design a ride-sharing service like Uber?",
      "Design a distributed cache system",
    ],
  },
];

async function seedInterviewTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing interview types
    await InterviewType.deleteMany({});
    console.log("🗑️ Cleared existing interview types");

    // Insert sample data
    const createdTypes = await InterviewType.insertMany(sampleInterviewTypes);
    console.log(`✅ Created ${createdTypes.length} interview types:`);

    createdTypes.forEach((type) => {
      console.log(`  - ${type.name} (slug: ${type.slug})`);
    });

    await mongoose.disconnect();
    console.log("✅ Database seeding completed");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedInterviewTypes();

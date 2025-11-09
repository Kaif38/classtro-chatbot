import express from 'express';
import auth from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import axios from 'axios';
import OpenAI from "openai";


const router = express.Router();
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Get all chats for user
router.get('/chats', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific chat
router.get('/chats/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user._id
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message to chatbot
router.post("/chats/:chatId/message", auth, async (req, res) => {
  try {
    const { message } = req.body;

    // Find or create chat
    let chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user._id,
    });

    if (!chat) {
      chat = new Chat({
        userId: req.user._id,
        title: message.substring(0, 50) + "...",
        messages: [],
      });
    }

    // Push user message
    chat.messages.push({ role: "user", content: message });

    // Prepare conversation history
    const conversationHistory = [
      {
        role: "system",
        content:
          "You are Classtro, a smart, helpful, and friendly AI learning assistant. You guide students with concepts, assignments, and study-related questions in an easy-to-understand manner.",
      },
      ...chat.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call Groq API
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: conversationHistory,
      max_tokens: 1000,
    });

    const botResponse = response.choices[0].message.content;

    // Save AI reply
    chat.messages.push({
      role: "assistant",
      content: botResponse,
    });

    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      message: botResponse,
      chatId: chat._id,
    });
  } catch (error) {
    console.error("Groq Chat Error:", error);

    res.json({
      message:
        "I'm Classtro, your study buddy! Looks like I'm having trouble connecting right now, but I can still help you with general study tips.",
      chatId: req.params.chatId,
    });
  }
});
// Create new chat
router.post('/chats', auth, async (req, res) => {
  try {
    const chat = new Chat({
      userId: req.user._id,
      title: 'New Chat',
      messages: []
    });
    
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

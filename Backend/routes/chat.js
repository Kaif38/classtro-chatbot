import express from 'express';
import auth from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import axios from 'axios';

const router = express.Router();

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
router.post('/chats/:chatId/message', auth, async (req, res) => {
  try {
    const { message } = req.body;
    let chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user._id
    });

    if (!chat) {
      // Create new chat if doesn't exist
      chat = new Chat({
        userId: req.user._id,
        title: message.substring(0, 50) + '...',
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message
    });

    // Call OpenRouter API
    const API_KEY = "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";
    
    const conversationHistory = [
      {
        role: "system",
        content: "You are Classtro, a friendly and helpful AI learning assistant. You specialize in helping students with their studies, homework, and educational questions. Always introduce yourself as Classtro and maintain a supportive, educational tone."
      },
      ...chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const apiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "deepseek/deepseek-chat",
      messages: conversationHistory,
      max_tokens: 1000
    }, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": req.headers.origin || 'http://localhost:3000',
        "X-Title": "Classtro AI",
        "Content-Type": "application/json"
      }
    });

    const botResponse = apiResponse.data.choices[0].message.content;

    // Add bot message
    chat.messages.push({
      role: 'assistant',
      content: botResponse
    });

    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      message: botResponse,
      chatId: chat._id
    });
  } catch (error) {
    console.error('Chat error:', error);
    
    // Fallback response
    const fallbackResponse = "I'm Classtro, your learning assistant. I'm currently experiencing connection issues, but I can still help with general study questions!";
    
    res.json({
      message: fallbackResponse,
      chatId: req.params.chatId
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
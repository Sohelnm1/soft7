# FAQ Bot & Chatbot Integration Guide

## Overview

The FAQ Bot system is now fully integrated with your inbox messaging system. When you message a contact, you can automatically trigger an **automated FAQ flow** - a chain of questions that helps gather information before an agent takes over.

---

## What is an FAQ Bot Flow?

An **FAQ Bot Flow** is an automated conversation that:
- ✅ Asks pre-configured questions to customers
- ✅ Collects information automatically
- ✅ Provides a better customer experience
- ✅ Prepares context for your team before connecting

**Real-world example:**
```
Bot: "Hello! I'm the Support Assistant. Let me ask you a few questions."
Customer: "Ok"
Bot: "What is your main concern today?"
Customer: "My order hasn't arrived"
Bot: "Can you provide your order number?"
Customer: "ORDER-12345"
Bot: "Thank you! A representative will contact you shortly."
```

---

## How to Test It

### Step 1: Create a FAQ Bot

1. Go to **Chatbot FAQ Manager** in the navigation menu
2. Click **"Create New FAQ Bot"** button
3. Fill in the form:
   - **Bot Name**: e.g., "Support Assistant", "Sales FAQ", "Billing Help"
   - **Phone Number**: The phone number associated with this bot
4. Click **Create**
5. You'll see your new bot in the list with an ID like `bot_xyz123`

**Example Bot Names:**
- "Customer Support Bot"
- "Sales Inquiry Assistant"
- "Billing & Invoice FAQ"
- "Order Status Bot"

### Step 2: Use FAQ Bot in Inbox

1. Open **Inbox** section
2. Select any **contact** to start messaging
3. Look at the **chat header** (top of the message area)
4. You'll see action icons:
   - 📞 Phone (audio call)
   - 📹 Video (video call)
   - 💬 **FAQ Bot** (NEW!) ← Click here
   - ⋮ More options

### Step 3: Start FAQ Flow

1. Click the **FAQ Bot icon** (💬) in the chat header
2. A popup will appear with your available bots
3. Select a bot from the list
4. The **FAQ Flow** will start automatically!

### Step 4: Test the Conversation

1. The bot will greet the customer with its introduction
2. Bot will ask questions one by one
3. **You (as the customer)** type responses in the text box at the bottom
4. After several exchanges, the bot will say: **"We will contact you shortly. Please keep your phone available."**
5. Click the **X** button to close the FAQ flow

---

## FAQ Bot Features

### 📍 Location of FAQ Bot Manager
- **URL**: `/chatbot-faq`
- **Path**: Main Navigation → Chatbot FAQ Manager

### 🎯 What You Can Do

| Feature | Description |
|---------|-------------|
| **Create** | New FAQ bots with custom names and phone numbers |
| **Edit** | Bot configurations and flow |
| **Delete** | Remove bots you no longer need |
| **View Status** | See which bots are LIVE and active |
| **Bot ID** | Unique identifier for each bot (bot_xxx) |

### 💬 FAQ Flow in Messaging

When the FAQ Bot is active in a conversation:

- **Minimized**: The bot appears as a floating button (bottom right)
- **Active**: Shows conversation history with timestamps
- **Auto-responses**: Simulates customer support scenarios
- **Final Message**: Always ends with "We will contact you shortly"

---

## Testing Workflow

### Quick Test (2 minutes)

1. Create a bot named "Quick Test"
2. Go to Inbox → Select a contact
3. Click FAQ Bot icon → Select "Quick Test"
4. Type some responses (e.g., "I need help", "Order issue", "Thanks")
5. Bot will respond and eventually say it will contact you
6. Close the popup

### Advanced Test (5 minutes)

1. Create multiple bots:
   - "Sales Support"
   - "Billing Help"
   - "Technical Issues"
2. Test switching between different bots in the same chat
3. Verify each bot has its own conversation thread
4. Edit a bot and see changes reflected

---

## API Endpoints (For Reference)

### Get All FAQ Bots
```
GET /api/chatbot-faq
```
Returns list of all FAQ bots

### Create New FAQ Bot
```
POST /api/chatbot-faq/create
Body: { name, phone, countryCode }
```

### Delete FAQ Bot
```
POST /api/chatbot-faq/delete
Body: { id }
```

### Update FAQ Bot
```
POST /api/chatbot-faq/update
Body: { id, ...updates }
```

---

## Troubleshooting

### "No FAQ Bots Available"
**Solution**: Create a bot first in Chatbot FAQ Manager

### FAQ Bot Button Not Showing
**Solution**: 
- Select a contact first (don't have an active chat)
- Refresh the page

### FAQ Flow Not Starting
**Solution**:
- Ensure you have at least one bot created
- Check browser console for errors
- Try a different contact

### Can't See Bots in Dropdown
**Solution**:
- Make sure bots were created successfully
- Refresh the inbox page
- Check if you're logged in

---

## Next Steps

### For Your Team:
1. ✅ Create FAQ bots for different departments
2. ✅ Test the flow with various contacts
3. ✅ Customize bot responses (future feature)
4. ✅ Track FAQ completion rates (future feature)

### Future Enhancements:
- 🔄 Save FAQ responses to contact profile
- 📊 Analytics on bot usage
- 🎨 Customize bot messages
- 🔗 Branch logic (different paths based on answers)
- 📧 Email summary of FAQ responses

---

## Quick Commands

| Action | Path |
|--------|------|
| View FAQ Bots | `/chatbot-faq` |
| Create New Bot | `/chatbot-faq/create` |
| View Chatbots | `/chatbot` |
| Go to Inbox | `/inbox` |
| Messaging | `/inbox` → Select Contact |

---

## Need Help?

If you encounter any issues:
1. Check the browser console (F12) for errors
2. Verify all FAQ bots are created
3. Try logging out and back in
4. Clear browser cache and refresh

---

**Happy Testing! 🎉**

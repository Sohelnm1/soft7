# 📸 Visual Step-by-Step Guide to FAQ Bot

## Step 1: Create Your First FAQ Bot

### Screen 1: Open Chatbot FAQ Manager
```
Navigation Menu
    ↓
Click: Chatbot FAQ Manager (or go to /chatbot-faq)
    ↓
See: "Chatbot FAQ Manager" page with "Create New FAQ Bot" button
```

**What You'll See:**
```
┌─────────────────────────────────────┐
│ Chatbot FAQ Manager                 │
│                                     │
│ [🤖] Create New FAQ Bot [→]        │
│                                     │
│ ┌────────────────────────────────┐  │
│ │ No FAQ Bots Yet                │  │
│ │                                │  │
│ │ Create your first FAQ bot...   │  │
│ │ Create one now [→]             │  │
│ └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

### Screen 2: Click "Create New FAQ Bot"
```
You will see a Modal/Popup with a form:

┌─────────────────────────────────────┐
│ Create New FAQ Bot                  │
│ (Modal with backdrop blur)          │
│                                     │
│ 🤖 [Icon in center]                │
│                                     │
│ Bot Name:                           │
│ [____________________________]       │
│  (e.g., "Support Assistant")        │
│                                     │
│ Phone Number:                       │
│ [+91] [______________]              │
│  Country Code | Phone Number        │
│                                     │
│ [Cancel]  [Create Bot]              │
└─────────────────────────────────────┘
```

### Screen 3: Fill the Form

**Bot Name field:**
- Type: `Customer Support Bot`
- Or: `Sales Inquiry`
- Or: `Billing Help`
- Any descriptive name works!

**Phone Number:**
- Country code dropdown: Select `+91` (India) or your country
- Phone field: Enter `9876543210` (or any number)

**Example Filled Form:**
```
┌─────────────────────────────────────┐
│ Create New FAQ Bot                  │
│                                     │
│ Bot Name:                           │
│ [Customer Support Bot ____]         │
│                                     │
│ Phone Number:                       │
│ [+91] [9876543210]                  │
│                                     │
│ [Cancel]  [Create Bot] ← Click     │
└─────────────────────────────────────┘
```

### Screen 4: Bot Created!
```
You'll see success message and bot appears in list:

┌─────────────────────────────────────┐
│ Chatbot FAQ Manager                 │
│ ✓ Bot created successfully!         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 Customer Support Bot          │ │
│ │ ID: bot_xyz123                   │ │
│ │ Phone: +919876543210             │ │
│ │ Status: ✓ LIVE                   │ │
│ │                                  │ │
│ │ [Edit] [Delete]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 [Create more bots...]         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Step 2: Go to Inbox

### Screen 1: Open Inbox
```
Navigation Menu
    ↓
Click: Inbox (or go to /inbox)
    ↓
See: Inbox page with contacts list
```

**What You'll See:**
```
┌──────────────────────────────────────────────┐
│ [Icons] │ Inbox               [→ Contacts]   │
│ 👥      │ [Search contacts]                  │
│ 📅      │                                    │
│ 🏘️      │ ┌────────────────────────────────┐│
│ 🏷️      │ │ John Doe         14:30  [3]    ││
│ 🔔      │ │ 9876543210                      ││
│         │ ├────────────────────────────────┤│
│ [FAQ]   │ │ Sarah Smith      13:45  [1]    ││
│         │ │ 9123456789                      ││
│         │ ├────────────────────────────────┤│
│         │ │ Mike Johnson     12:20          ││
│         │ │ 9988776655                      ││
│         │ └────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

---

### Screen 2: Select a Contact
```
Click on any contact name (e.g., "John Doe")
    ↓
Chat window opens on right side
```

**What You'll See:**
```
┌─────────────────────────────────────────────┐
│ [Icons] │ Inbox │ Chat Area (Right side)    │
│         │       │                           │
│ 👥      │       │ ┌────────────────────────┐│
│ 📅      │       │ │ 📞 John Doe     📹 ⋮   ││
│ 🏘️      │       │ │ Connected              ││
│ 🏷️      │       │ ├────────────────────────┤│
│ 🔔      │       │ │ You: Hi John!          ││
│         │       │ │ John: Hello!           ││
│         │       │ │ You: How are you?      ││
│         │       │ ├────────────────────────┤│
│         │       │ │ [Message input box]    ││
│         │       │ │ [Send ➜]               ││
│         │       │ └────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

### Screen 3: Find FAQ Button
```
In the chat header, look for these icons from left to right:
📞 Phone  |  📹 Video  |  💬 FAQ  |  ⋮ More

Click the 💬 (FAQ icon)
```

**Highlight:**
```
┌────────────────────────────────────┐
│ John Doe                           │
│ Connected                          │
│                                    │
│ [📞] [📹] [💬] [⋮]  ← Click 💬   │
│  ph   vid  faq  more               │
└────────────────────────────────────┘
```

---

## Step 3: Start FAQ Flow

### Screen 1: FAQ Bot Popup Opens
```
After clicking 💬, you'll see:

┌─────────────────────────────────┐
│ FAQ Assistant      [_] [X]       │
│ (Floating on bottom-right)       │
│                                  │
│ Select FAQ Bot:                  │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🤖 Customer Support Bot      │ │
│ │ ID: bot_xyz123               │ │
│ ├──────────────────────────────┤ │
│ │ 🤖 Sales Bot (if you create) │ │
│ │ ID: bot_abc456               │ │
│ └──────────────────────────────┘ │
│                                  │
│ (Waiting for bot selection...)   │
└─────────────────────────────────┘
```

**Action:** Click on "Customer Support Bot" (or whichever bot you created)

---

### Screen 2: Bot Greeting
```
After selecting bot, FAQ flow starts:

┌────────────────────────────────────┐
│ FAQ Assistant      [_] [X]         │
├────────────────────────────────────┤
│                                    │
│ 12:00 PM                           │
│ 🤖                                 │
│ Hello! I'm Customer Support Bot.   │
│ I'm here to help you. Let me ask   │
│ you a few questions to better      │
│ assist you.                        │
│                                    │
│ 12:01 PM                           │
│ 🤖                                 │
│ What is your main concern today?   │
│                                    │
├────────────────────────────────────┤
│ [Type your response...]  [Send →]  │
└────────────────────────────────────┘
```

---

### Screen 3: You Type Your Response
```
Click the input box and type your message:

┌────────────────────────────────────┐
│ FAQ Assistant      [_] [X]         │
├────────────────────────────────────┤
│                                    │
│ 12:00 PM                           │
│ 🤖 Hello! I'm Customer Support...  │
│ ...let me ask you a few questions. │
│                                    │
│ 12:01 PM                           │
│ 🤖 What is your main concern?      │
│                                    │
│ 12:01 PM                           │
│ 👤 I need help with my order       │
│                                    │
├────────────────────────────────────┤
│ [I need help with my order ✓]      │ ← Already typed!
│                                   [Send →]
└────────────────────────────────────┘
```

**Action:** Click Send or press Enter

---

### Screen 4: Bot Responds
```
After you send message, bot responds:

┌────────────────────────────────────┐
│ FAQ Assistant      [_] [X]         │
├────────────────────────────────────┤
│                                    │
│ 12:00 PM 🤖 Hello! I'm...          │
│ 12:01 PM 🤖 What is your concern?  │
│ 12:01 PM 👤 I need help...         │
│                                    │
│ 12:02 PM                           │
│ 🤖 [Loading...] ⟳                  │ ← Bot thinking
│                                    │
│ 12:02 PM                           │
│ 🤖 Thank you for that information. │
│ Can you provide your order number? │
│                                    │
├────────────────────────────────────┤
│ [Type your response...]  [Send →]  │
└────────────────────────────────────┘
```

---

### Screen 5: Conversation Loop
```
Pattern repeats:

1. Bot asks question
2. You type response
3. You click Send
4. Bot responds (after 1-2 sec delay)
5. Loop back to step 1
6. After 3-4 exchanges...

┌────────────────────────────────────┐
│ FAQ Assistant      [_] [X]         │
├────────────────────────────────────┤
│                                    │
│ 12:03 PM 👤 ORDER-12345            │
│ 12:04 PM 🤖 Do you have other...?  │
│ 12:04 PM 👤 No, that's all         │
│ 12:05 PM 🤖 Perfect!               │
│ 12:05 PM 🤖 📞 We will contact you  │
│ 12:05 PM 🤖 shortly. Please keep   │
│ 12:05 PM 🤖 your phone available!  │
│                                    │
│ ✓ FAQ CONVERSATION COMPLETE!       │
│                                    │
├────────────────────────────────────┤
│ [Type your response...]  [Send →]  │
└────────────────────────────────────┘
```

---

### Screen 6: Close FAQ (Optional)
```
Click the [X] button to close FAQ panel:

Before:
┌────────────────────────────────────┐
│ FAQ Assistant      [_] [X] ← Click │
│ (Chat visible on left)             │
└────────────────────────────────────┘

After:
FAQ panel disappears, you can see:
- Main chat messages (John & You)
- Message input box
- Send button
- Type new message to John
```

**OR Click [_] to minimize:**
```
Minimized state:
┌─────────────────────┐
│ 💬 FAQ Assistant ▶  │ ← Click to restore
└─────────────────────┘
(Appears as small button)

After clicking again:
┌────────────────────────────────────┐
│ FAQ Assistant      [_] [X]         │
│ (Chat history still there!)        │
└────────────────────────────────────┘
```

---

## Full Journey Visualization

```
START
  ↓
[Create Bot]
  ├─ Go to /chatbot-faq
  ├─ Click "Create New FAQ Bot"
  ├─ Fill: Name, Phone
  ├─ Click "Create"
  └─ ✓ Bot created!
  ↓
[Use in Inbox]
  ├─ Go to /inbox
  ├─ Select a contact
  ├─ Click 💬 FAQ icon
  ├─ Select your bot
  └─ ✓ FAQ starts!
  ↓
[Conversation Loop]
  ├─ Bot sends greeting
  ├─ Bot asks question
  ├─ You type response
  ├─ Bot responds
  ├─ Repeat 3-4 times
  └─ Bot: "We will contact you"
  ↓
[End]
  ├─ Click [X] to close
  ├─ OR Click [_] to minimize
  ├─ Main chat still active
  └─ You can re-open FAQ anytime!
```

---

## Quick Reference: Click This When...

| When... | Click... | Location... |
|---------|----------|------------|
| Creating first bot | "Create New FAQ Bot" | /chatbot-faq (main page) |
| In messaging | 💬 icon | Chat header (top right) |
| Selecting bot | Bot name | Popup that appeared |
| Finished with FAQ | [X] | Top right of FAQ panel |
| Want to hide FAQ | [_] | Top right of FAQ panel |
| Restore hidden FAQ | "💬 FAQ Assistant" | Bottom right corner |

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Send message in FAQ | Press Enter |
| Close FAQ | ESC key |
| Focus input box | Click or Tab |

---

## Error Messages & Fixes

| Error | Fix |
|-------|-----|
| "No FAQ Bots Available" | Create a bot first in /chatbot-faq |
| FAQ icon not visible | Make sure contact is selected first |
| Bot not responding | Check browser console (F12) for errors |
| Can't see send button | Try refreshing the page |

---

## Troubleshooting Checklist

- [ ] Created at least one bot in /chatbot-faq
- [ ] Logged in to your account
- [ ] Selected a contact in inbox
- [ ] Chat window is visible on right side
- [ ] Can see 💬 icon in chat header
- [ ] Clicked FAQ icon (not Phone or Video)
- [ ] Selected a bot from dropdown
- [ ] See bot greeting message
- [ ] Can type in input box at bottom
- [ ] Pressing Enter sends message

**If all checked but still not working:**
1. Refresh the page (F5)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try logging out and back in
4. Check browser console for errors (F12)

---

**🎉 You're all set! Start testing your FAQ Bot now!**

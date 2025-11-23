# 🤖 Clara Multi-Agent CRM - Team Edition

<div align="center">

**An AI-powered CRM system with voice agents for Sales, Marketing, and Support**

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Team](https://img.shields.io/badge/Team-3%20Members-blue)
![FYP](https://img.shields.io/badge/Project-FYP%202025-green)

[📚 Documentation](#-documentation) • [👥 Team](#-team) • [🚀 Quick Start](#-quick-start) • [🎯 Features](#-features)

</div>

---

## 🎯 Project Overview

Clara is a **voice-first CRM system** powered by AI agents that can:
- 📞 Qualify leads through natural voice conversations
- 🎯 Score and route leads automatically
- 📊 Track campaigns and analytics
- 🤝 Manage meetings and follow-ups
- 👥 Handle support tickets

---

## 👥 Team

<table>
<tr>
<td align="center" width="33%">
<img src="https://via.placeholder.com/150/FF6B6B/FFFFFF?text=F" width="100" style="border-radius: 50%;"><br>
<b>Faheem</b><br>
<sub>Project Lead</sub><br>
<sub>🎯 Sales Agent</sub><br>
<code>[SALES]</code>
</td>
<td align="center" width="33%">
<img src="https://via.placeholder.com/150/4ECDC4/FFFFFF?text=S" width="100" style="border-radius: 50%;"><br>
<b>Sheryar</b><br>
<sub>Team Member</sub><br>
<sub>📢 Marketing Agent</sub><br>
<code>[MARKETING]</code>
</td>
<td align="center" width="33%">
<img src="https://via.placeholder.com/150/95E1D3/FFFFFF?text=H" width="100" style="border-radius: 50%;"><br>
<b>Husnain</b><br>
<sub>Team Member</sub><br>
<sub>🛠️ Support Agent</sub><br>
<code>[SUPPORT]</code>
</td>
</tr>
</table>

---

## 📋 Responsibilities

### 🎯 Faheem (Sales)
```
Backend:  clara-backend/agents/sales_agent/
Frontend: src/pages/LeadsPage.tsx
          src/components/leads/
Focus:    Lead Management, BANT Qualification, CRM Integration
```

### 📢 Sheryar (Marketing)
```
Backend:  clara-backend/agents/marketing_agent/
Frontend: src/pages/DashboardPage.tsx
          src/components/notifications/
Focus:    Campaigns, Notifications, Analytics
```

### 🛠️ Husnain (Support)
```
Backend:  clara-backend/agents/support_agent/
Frontend: src/pages/admin/
          src/components/admin/
Focus:    Admin Panel, Meetings, User Management
```

---

## 🚀 Quick Start

### **For New Team Members:**

```bash
# 1. Clone repository
git clone https://github.com/sheryarkayani/trendtialcrm.git
cd trendtialcrm

# 2. Install dependencies
pnpm install

# 3. Create your branch
git checkout -b feature/[your-agent]/initial-setup

# 4. Start development
pnpm dev

# Visit: http://localhost:5173
```

### **First Time Setup:**
```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Make first commit
git add .
git commit -m "[YOUR-PREFIX] Initial setup"
git push -u origin feature/[your-agent]/initial-setup
```

---

## 🎯 Features

### ✅ Implemented
- [x] Sales Agent with BANT qualification
- [x] Lead scoring algorithm
- [x] Voice interaction (STT/TTS)
- [x] Orchestrator for agent routing
- [x] Basic CRM integration
- [x] Lead management UI

### 🔄 In Progress
- [ ] Marketing Agent
- [ ] Support Agent
- [ ] Notification system
- [ ] Admin panel
- [ ] Meeting scheduler
- [ ] Dashboard analytics

### 📅 Planned
- [ ] Email campaigns
- [ ] SMS notifications
- [ ] Google Calendar sync
- [ ] Advanced analytics
- [ ] Mobile app

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│          Clara Multi-Agent System            │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Sales   │  │Marketing │  │ Support  │ │
│  │  Agent   │  │  Agent   │  │  Agent   │ │
│  │ (Faheem) │  │(Sheryar) │  │(Husnain) │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       └─────────────┼─────────────┘        │
│                     │                       │
│              ┌──────▼──────┐               │
│              │Orchestrator │               │
│              │(Classifier) │               │
│              └──────┬──────┘               │
└──────────────────────┼──────────────────────┘
                       │
              ┌────────▼────────┐
              │   TrendtialCRM  │
              │   (Frontend)    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │    Supabase     │
              │   (Database)    │
              └─────────────────┘
```

---

## 📚 Documentation

### **📖 Read These in Order:**
1. **[TEAM_ONBOARDING.md](TEAM_ONBOARDING.md)** - Start here!
2. **[TEAM_WORKFLOW_3MEMBERS.md](TEAM_WORKFLOW_3MEMBERS.md)** - Complete guide
3. **[TASK_DISTRIBUTION.md](TASK_DISTRIBUTION.md)** - What to work on
4. **[GIT_CHEAT_SHEET.md](GIT_CHEAT_SHEET.md)** - Quick reference
5. **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Database setup

### **📁 Additional Docs:**
- **[TRENDTIALCRM_ALIGNMENT.md](../clara-backend/TRENDTIALCRM_ALIGNMENT.md)** - Schema alignment
- **[INTEGRATION_SUMMARY.md](../clara-backend/INTEGRATION_SUMMARY.md)** - Integration guide

---

## 🔄 Git Workflow

### **Branch Naming:**
```
feature/[agent]/[feature-name]
bugfix/[agent]/[bug-name]
```

### **Commit Messages:**
```
[PREFIX] Brief description

- What changed
- Why it changed
```

### **Prefixes:**
- `[SALES]` - Faheem's commits
- `[MARKETING]` - Sheryar's commits
- `[SUPPORT]` - Husnain's commits
- `[FIX]` - Bug fixes (any member)
- `[DOCS]` - Documentation (any member)

### **Example:**
```bash
git checkout -b feature/sales/lead-scoring
git add .
git commit -m "[SALES] Implement lead scoring algorithm

- Added BANT-based scoring
- Score range: 0-100
- Grade: A-F classification"
git push origin feature/sales/lead-scoring
```

---

## 📅 Timeline

### **Week 1: Foundation** (Nov 23-30)
- ✅ Faheem: Sales Agent complete
- 🔄 Sheryar: Marketing Agent setup
- 🔄 Husnain: Support Agent setup

### **Week 2: Integration** (Dec 1-7)
- 🔄 All: Agent integration
- 🔄 All: UI development
- 🔄 All: Testing

### **Week 3: Polish** (Dec 8-14)
- 🔄 All: Bug fixes
- 🔄 All: Documentation
- 🔄 All: Demo preparation

---

## 🛠️ Tech Stack

### **Backend:**
- Python 3.10+
- FastAPI
- Groq LLM (Llama 3.3 70B)
- Deepgram (STT/TTS)
- Supabase Python Client

### **Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- Supabase JS Client
- TanStack Query

### **Database:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)

### **DevOps:**
- Git & GitHub
- pnpm
- ESLint & Prettier

---

## 📊 Project Stats

```
Total Files:       ~150
Lines of Code:     ~15,000
Team Members:      3
Agents:            3 (Sales, Marketing, Support)
Duration:          3-4 weeks
Project Type:      Final Year Project (FYP)
```

---

## 🤝 Contributing

### **Daily Workflow:**
1. Pull latest: `git pull origin main`
2. Work on feature branch
3. Commit frequently
4. Push daily
5. Create PR when done

### **Code Review:**
- At least 1 approval required
- Faheem gives final approval
- Address feedback promptly

### **Communication:**
- Daily standup in group chat
- Sunday planning call
- Ask questions anytime!

---

## 📞 Contact

**Project Repository**: [github.com/sheryarkayani/trendtialcrm](https://github.com/sheryarkayani/trendtialcrm)

**Team Chat**: WhatsApp/Telegram group

**Questions?**: Ask in the group!

---

## ✅ Quick Checklist

### **Setup:**
- [ ] Git installed & configured
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Can run `pnpm dev`
- [ ] Read documentation

### **Daily:**
- [ ] Pull latest changes
- [ ] Work on feature branch
- [ ] Commit with good messages
- [ ] Push before end of day
- [ ] Update team in chat

### **Before PR:**
- [ ] Code tested locally
- [ ] No console errors
- [ ] Good commit messages
- [ ] Documentation updated
- [ ] Team notified

---

## 🎓 FYP Success

**For A+ Grade:**
- ✅ Regular commits (show consistent work)
- ✅ Good documentation (easier report writing)
- ✅ Working demo (impressive presentation)
- ✅ Teamwork (help each other)
- ✅ Clean code (professional quality)

**Remember:**
- 💬 Communicate often
- 🐛 Test thoroughly
- 📚 Document everything
- 🤝 Help teammates
- 🚀 Build something amazing!

---

## 📜 License

This project is for educational purposes (FYP).

---

<div align="center">

**Made with ❤️ by Team Clara**

Faheem • Sheryar • Husnain

🎓 Final Year Project 2025

[⬆ Back to Top](#-clara-multi-agent-crm---team-edition)

</div>


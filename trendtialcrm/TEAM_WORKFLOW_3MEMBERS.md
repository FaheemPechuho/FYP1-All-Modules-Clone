# 🚀 TrendtialCRM + Clara Backend - 3-Person Team Workflow

## 👥 Team Structure

**Project**: Clara Multi-Agent CRM System  
**Team Size**: 3 Members  
**Timeline**: FYP (Final Year Project)

---

## 👨‍💼 Team Members & Responsibilities

### **1. Faheem (Sales Agent Lead)** 🎯
**Primary Role**: Project Lead + Sales Agent Development

**Clara Backend:**
```
clara-backend/
├── agents/sales_agent/          ← YOUR PRIMARY FOCUS
│   ├── agent.py
│   ├── lead_qualifier.py
│   ├── lead_scorer.py
│   ├── crm_connector.py
│   └── prompts.py
├── orchestrator/                ← SHARED RESPONSIBILITY
├── crm_integration/            ← YOUR FOCUS
└── main.py                     ← INTEGRATION
```

**TrendtialCRM Frontend:**
```
trendtialcrm/
├── src/pages/
│   ├── LeadsPage.tsx           ← YOUR PRIMARY FOCUS
│   ├── DashboardPage.tsx       ← SHARED
│   └── FollowUpsPage.tsx       ← YOUR FOCUS
├── src/components/leads/       ← YOUR FOCUS
│   ├── LeadTable.tsx
│   ├── LeadDrawer.tsx
│   ├── LeadScoring.tsx
│   ├── PipelineManagement.tsx
│   └── AddLeadModal.tsx
├── src/hooks/queries/
│   └── useLeadsQuery.ts        ← YOUR FOCUS
└── supabase/migrations/        ← SHARED (YOU LEAD)
```

**Commit Prefix**: `[SALES]` or `[LEADS]` or `[BACKEND-SALES]`

**Key Tasks:**
- ✅ Sales Agent implementation (BANT qualification)
- ✅ Lead scoring & qualification UI
- ✅ CRM integration (Supabase)
- ✅ Voice → Lead conversion
- ✅ Pipeline management UI

---

### **2. Sheryar (Marketing Agent Lead)** 📢
**Primary Role**: Marketing Agent + Campaign Management

**Clara Backend:**
```
clara-backend/
├── agents/marketing_agent/      ← YOUR PRIMARY FOCUS (TO BUILD)
│   ├── agent.py
│   ├── campaign_manager.py
│   ├── content_generator.py
│   └── prompts.py
├── orchestrator/                ← SHARED RESPONSIBILITY
└── test_pipeline.py            ← ADD MARKETING TESTS
```

**TrendtialCRM Frontend:**
```
trendtialcrm/
├── src/pages/
│   ├── DashboardPage.tsx       ← SHARED (Analytics)
│   └── NotificationSettingsPage.tsx  ← YOUR FOCUS
├── src/components/
│   ├── notifications/          ← YOUR FOCUS
│   │   ├── NotificationBell.tsx
│   │   └── NotificationCenter.tsx
│   ├── leads/
│   │   ├── LeadNurturing.tsx   ← YOUR PRIMARY FOCUS
│   │   └── LeadsStats.tsx      ← YOUR FOCUS
│   └── dashboard/
│       └── StatCard.tsx        ← YOUR FOCUS
├── src/hooks/queries/
│   └── useNotificationsQuery.ts ← YOUR FOCUS
└── src/services/
    └── notificationScheduler.ts ← YOUR FOCUS
```

**Commit Prefix**: `[MARKETING]` or `[CAMPAIGNS]` or `[BACKEND-MARKETING]`

**Key Tasks:**
- ✅ Marketing Agent implementation
- ✅ Lead nurturing sequences
- ✅ Campaign tracking UI
- ✅ Notification system
- ✅ Analytics dashboard
- ✅ Email/SMS integration (future)

---

### **3. Husnain (Support Agent Lead)** 🛠️
**Primary Role**: Support Agent + Admin Features

**Clara Backend:**
```
clara-backend/
├── agents/support_agent/        ← YOUR PRIMARY FOCUS (TO BUILD)
│   ├── agent.py
│   ├── ticket_manager.py
│   ├── issue_resolver.py
│   └── prompts.py
├── orchestrator/                ← SHARED RESPONSIBILITY
├── utils/                       ← YOUR FOCUS
│   ├── validators.py
│   └── formatters.py
└── test_pipeline.py            ← ADD SUPPORT TESTS
```

**TrendtialCRM Frontend:**
```
trendtialcrm/
├── src/pages/
│   ├── MeetingsPage.tsx        ← YOUR PRIMARY FOCUS
│   ├── TodosPage.tsx           ← YOUR FOCUS
│   ├── TeamTodosPage.tsx       ← YOUR FOCUS
│   └── admin/                  ← YOUR FOCUS
│       ├── AdminUsersPage.tsx
│       ├── AdminSettingsPage.tsx
│       └── TeamProgressPage.tsx
├── src/components/
│   ├── admin/                  ← YOUR FOCUS
│   │   ├── UserTable.tsx
│   │   ├── UserFormModal.tsx
│   │   └── AssignAgentModal.tsx
│   ├── todos/                  ← YOUR FOCUS
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   └── TodoForm.tsx
│   ├── meeting/                ← YOUR FOCUS
│   │   └── MeetingList.tsx
│   └── modals/                 ← YOUR FOCUS
│       ├── CreateMeetingModal.tsx
│       └── EditMeetingModal.tsx
└── src/hooks/mutations/
    ├── useCreateUserMutation.ts ← YOUR FOCUS
    └── useCreateMeetingMutation.ts ← YOUR FOCUS
```

**Commit Prefix**: `[SUPPORT]` or `[ADMIN]` or `[BACKEND-SUPPORT]`

**Key Tasks:**
- ✅ Support Agent implementation
- ✅ Meeting scheduling system
- ✅ Admin panel (user management)
- ✅ Todo/task management
- ✅ Team collaboration features
- ✅ Issue tracking (future)

---

## 🔄 Shared Responsibilities

### **All Team Members:**

**Orchestrator (Backend):**
```
clara-backend/orchestrator/
├── core.py           ← ALL: Update when adding new agents
├── classifier.py     ← ALL: Add intent classification
├── router.py         ← ALL: Add routing rules
└── message_parser.py ← SHARED
```

**Database Schema:**
```
clara-backend/
├── supabase_schema_trendtial_compatible.sql ← FAHEEM LEADS
└── config.py                                ← SHARED
```

**Testing:**
```
clara-backend/test_pipeline.py  ← ALL: Add your agent tests
```

---

## 🌿 Git Branch Strategy

### **Branch Naming:**
```
feature/[agent]/[feature-name]
bugfix/[agent]/[bug-name]
integration/[feature-name]
```

### **Examples:**
```bash
# Faheem (Sales)
feature/sales/bant-qualification
feature/sales/lead-scoring-ui
bugfix/sales/crm-connection

# Sheryar (Marketing)
feature/marketing/campaign-manager
feature/marketing/notification-system
feature/marketing/lead-nurturing

# Husnain (Support)
feature/support/meeting-scheduler
feature/support/admin-panel
feature/support/todo-system

# Shared/Integration
integration/orchestrator-update
integration/supabase-schema
```

---

## 📝 Commit Message Format

### **Structure:**
```
[AGENT] Brief description

Detailed explanation (optional)
- What changed
- Why it changed
```

### **Prefixes by Team Member:**

**Faheem:**
- `[SALES]` - Sales agent features
- `[LEADS]` - Leads UI/management
- `[BACKEND-SALES]` - Sales backend logic
- `[CRM]` - CRM integration
- `[INTEGRATION]` - System integration

**Sheryar:**
- `[MARKETING]` - Marketing agent features
- `[CAMPAIGNS]` - Campaign management
- `[BACKEND-MARKETING]` - Marketing backend
- `[NOTIFICATIONS]` - Notification system
- `[ANALYTICS]` - Dashboard analytics

**Husnain:**
- `[SUPPORT]` - Support agent features
- `[ADMIN]` - Admin panel
- `[BACKEND-SUPPORT]` - Support backend
- `[MEETINGS]` - Meeting management
- `[TODOS]` - Task management

**Shared:**
- `[ORCHESTRATOR]` - Orchestrator changes
- `[DATABASE]` - Schema changes
- `[TEST]` - Testing
- `[DOCS]` - Documentation
- `[FIX]` - Bug fixes

### **Good Commit Examples:**

```bash
# Faheem
✅ [SALES] Implement BANT lead qualification

- Added budget, authority, need, timeline extraction
- Integrated with Groq LLM for parsing
- Returns qualification status and score

✅ [LEADS] Add lead scoring visualization UI

- Progress bar with color coding
- Grade display (A-F)
- Integration with lead_score field

# Sheryar
✅ [MARKETING] Create campaign tracking system

- Added campaign_id to leads table
- Built campaign analytics component
- UTM parameter tracking

✅ [NOTIFICATIONS] Implement real-time notifications

- Supabase realtime channel setup
- Toast notifications for updates
- Browser push notification support

# Husnain
✅ [SUPPORT] Build meeting scheduler component

- Calendar view with drag-and-drop
- Meeting modal with validation
- Google Calendar sync (future)

✅ [ADMIN] Implement user role management

- RBAC policies in Supabase
- User table with role assignment
- Agent assignment to leads
```

---

## 🔄 Daily Workflow

### **Morning Routine (All Members):**
```bash
# 1. Start your day
cd trendtialcrm
git checkout main
git pull origin main

# 2. Check what you're working on
git checkout feature/[your-agent]/[your-feature]

# If new feature:
git checkout -b feature/[your-agent]/[new-feature]

# 3. Install any new dependencies
pnpm install
```

### **During Development:**
```bash
# Check status frequently
git status

# Add your changes
git add src/components/your-component.tsx

# Commit with good message
git commit -m "[YOUR-PREFIX] Description"

# Push regularly (every few hours)
git push origin feature/[your-agent]/[your-feature]
```

### **End of Day:**
```bash
# Always push before leaving!
git add .
git commit -m "[YOUR-PREFIX] End of day commit - [what you worked on]"
git push origin feature/[your-agent]/[your-feature]
```

---

## 🚀 Weekly Sprint Structure

### **Week 1: Setup & Core Agents**
**Faheem:**
- ✅ Set up clara-backend environment
- ✅ Implement Sales Agent with BANT
- ✅ Connect to Supabase
- ✅ Test voice → lead flow

**Sheryar:**
- ✅ Set up TrendtialCRM frontend
- ✅ Create Marketing Agent skeleton
- ✅ Build notification system
- ✅ Dashboard analytics

**Husnain:**
- ✅ Set up development environment
- ✅ Create Support Agent skeleton
- ✅ Build admin user panel
- ✅ Meeting scheduler UI

### **Week 2: Integration & Features**
**Faheem:**
- ✅ Lead scoring improvements
- ✅ Pipeline management
- ✅ CRM connector enhancements
- ✅ Test full sales flow

**Sheryar:**
- ✅ Lead nurturing sequences
- ✅ Campaign tracking
- ✅ Email integration setup
- ✅ Analytics dashboard

**Husnain:**
- ✅ Todo system
- ✅ Meeting calendar view
- ✅ Team collaboration features
- ✅ Admin settings panel

### **Week 3: Testing & Polish**
**All Members:**
- ✅ Cross-agent testing
- ✅ UI/UX polish
- ✅ Bug fixes
- ✅ Documentation
- ✅ Demo preparation

---

## 🤝 Collaboration Guidelines

### **Before Starting New Feature:**
1. **Announce in team group**: "Starting work on [feature]"
2. **Check for conflicts**: Ask if anyone is working on related files
3. **Pull latest**: Always `git pull` before starting

### **During Development:**
1. **Daily standup** (even if async via chat):
   - What did you do yesterday?
   - What will you do today?
   - Any blockers?

2. **Commit frequently**: Every 1-2 hours
3. **Push daily**: Before end of day
4. **Ask for help**: Don't struggle alone for hours!

### **Code Review Process:**
1. **Create PR** when feature is done
2. **Tag both teammates** for review
3. **Address feedback** promptly
4. **Faheem** gives final approval (as project lead)
5. **Merge** after approval

---

## 📋 Pull Request Template

```markdown
## 🎯 What does this PR do?
[Brief description of the feature/fix]

## 🔧 Changes Made:
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## 🎨 Screenshots (if UI changes):
[Add screenshots or GIFs]

## ✅ Testing Checklist:
- [ ] Tested locally (works on my machine)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Tested with other agents' features
- [ ] Works on Chrome
- [ ] Works on mobile view

## 🔗 Related:
- Related to #[issue number] (if applicable)
- Depends on PR #[number] (if applicable)

## 👥 Reviewers:
@faheem @sheryar @husnain

## 📝 Notes:
[Any additional context or notes]
```

---

## 🆘 Common Scenarios

### **Scenario 1: Merge Conflict**
```bash
# If you get merge conflict when pulling:

# 1. Check which files have conflicts
git status

# 2. Open conflicted files in VS Code
# Look for conflict markers:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> main

# 3. Choose which code to keep (or combine both)

# 4. Remove conflict markers

# 5. Stage resolved files
git add [resolved-file]

# 6. Complete the merge
git commit -m "[FIX] Resolve merge conflict in [file]"

# 7. Push
git push
```

### **Scenario 2: Need to Switch Task Urgently**
```bash
# Save current work (even if not done)
git add .
git commit -m "[WIP] Work in progress on [feature]"
git push

# Switch to urgent task
git checkout -b feature/[agent]/urgent-fix

# Do the urgent fix
# ...

# Return to original task
git checkout feature/[agent]/original-feature
```

### **Scenario 3: Made Commits on Wrong Branch**
```bash
# If you committed to main by mistake:

# 1. Create a new branch from current state
git branch feature/[agent]/your-feature

# 2. Switch to main and reset
git checkout main
git reset --hard origin/main

# 3. Switch to your feature branch
git checkout feature/[agent]/your-feature

# 4. Push your feature branch
git push origin feature/[agent]/your-feature
```

---

## 🎯 Task Checklist (Each Member)

### **Faheem (Sales):**
- [ ] Sales Agent fully implemented
- [ ] BANT qualification working
- [ ] Lead scoring accurate
- [ ] CRM integration complete
- [ ] Leads page UI polished
- [ ] Pipeline management functional
- [ ] Voice → Lead flow tested
- [ ] Documentation complete

### **Sheryar (Marketing):**
- [ ] Marketing Agent implemented
- [ ] Campaign tracking working
- [ ] Lead nurturing sequences built
- [ ] Notification system complete
- [ ] Analytics dashboard functional
- [ ] Email/SMS integration (if time)
- [ ] Documentation complete

### **Husnain (Support):**
- [ ] Support Agent implemented
- [ ] Meeting scheduler working
- [ ] Admin panel complete
- [ ] Todo system functional
- [ ] User management tested
- [ ] Team collaboration features
- [ ] Documentation complete

---

## 🔧 Git Setup (First Time)

```bash
# Configure Git (once per computer)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Clone repository
git clone https://github.com/sheryarkayani/trendtialcrm.git
cd trendtialcrm

# Install dependencies
pnpm install

# Create your first branch
git checkout -b feature/[your-agent]/setup

# Make a test commit
echo "# My Setup" >> test.md
git add test.md
git commit -m "[[YOUR-PREFIX]] Initial setup"
git push -u origin feature/[your-agent]/setup
```

---

## 📞 Communication Channels

**Daily Updates**: Team WhatsApp/Telegram group  
**Code Reviews**: GitHub Pull Requests  
**Blockers**: Tag everyone immediately  
**Weekly Sync**: Sunday evening (plan next week)

---

## ✅ Golden Rules

1. ✅ **NEVER commit to `main`** directly - Always use feature branches
2. ✅ **ALWAYS pull before push** - Avoid conflicts
3. ✅ **COMMIT frequently** - Small commits are better
4. ✅ **TEST before PR** - Don't break others' work
5. ✅ **HELP each other** - You're a team!
6. ✅ **COMMUNICATE** - Keep everyone updated
7. ✅ **REVIEW code** - Learn from each other

---

## 🎓 FYP Success Tips

1. **Document everything** - You'll need it for your report
2. **Take screenshots** - Progress tracking for presentation
3. **Write tests** - Shows professionalism
4. **Keep it simple** - Feature-complete > feature-overloaded
5. **Regular commits** - Shows consistent work
6. **Good README** - First impression matters

---

## 📚 Quick Reference

### **Git Commands:**
```bash
git status              # What changed?
git add .              # Stage all changes
git commit -m "msg"    # Commit changes
git push              # Upload to GitHub
git pull              # Download from GitHub
git checkout -b name  # New branch
git merge main        # Get latest main
```

### **Project Commands:**
```bash
pnpm install          # Install dependencies
pnpm dev             # Start dev server
pnpm build           # Build for production
pnpm lint            # Check code quality
```

---

**Questions?** Ask in the team group! 💬  
**Good luck with your FYP!** 🎓🚀

---

**Last Updated**: November 2025  
**Project Lead**: Faheem  
**Team**: Faheem (Sales), Sheryar (Marketing), Husnain (Support)


# 🎯 HUSNAIN'S IMPLEMENTATION GUIDE - PART 3: ADMIN PANEL & MEETINGS

## **PHASE 3: ESCALATION & ADMIN PANEL (WEEK 4)**

### **Day 1-2: Escalation System**

```python
# File: clara-backend/agents/support_agent/escalation.py

from typing import Dict, List, Optional
from uuid import UUID
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class EscalationManager:
    """
    Intelligent ticket escalation system.
    
    Escalation Triggers:
    1. Low RAG confidence (< 0.7)
    2. Multiple failed auto-resolve attempts
    3. SLA breach imminent
    4. Customer is VIP
    5. Urgent priority + technical category
    6. Manual escalation by CSR
    """
    
    def __init__(self):
        self.escalation_rules = self._load_rules()
    
    def _load_rules(self) -> List[Dict]:
        """
        Define escalation rules.
        
        Rules are evaluated in order. First match wins.
        """
        return [
            {
                "name": "VIP Customer Urgent",
                "condition": lambda ticket: ticket.get("customer_vip") and ticket.get("priority") == "urgent",
                "target_queue": "senior_support",
                "sla_multiplier": 0.5,  # Half the response time
                "priority_boost": "urgent",
            },
            {
                "name": "SLA Breach Imminent",
                "condition": lambda ticket: self._is_sla_at_risk(ticket),
                "target_queue": "escalations",
                "sla_multiplier": 0.75,
                "priority_boost": None,  # Keep current priority
            },
            {
                "name": "Low Confidence RAG",
                "condition": lambda ticket: ticket.get("rag_confidence", 1.0) < 0.7,
                "target_queue": "support_tier2",
                "sla_multiplier": 1.0,
                "priority_boost": None,
            },
            {
                "name": "Technical Urgent",
                "condition": lambda ticket: ticket.get("category") == "technical" and ticket.get("priority") in ["urgent", "high"],
                "target_queue": "technical_support",
                "sla_multiplier": 0.8,
                "priority_boost": None,
            },
            {
                "name": "Multiple Failed Attempts",
                "condition": lambda ticket: ticket.get("auto_resolve_attempts", 0) >= 3,
                "target_queue": "escalations",
                "sla_multiplier": 0.9,
                "priority_boost": "high",
            },
        ]
    
    def should_escalate(self, ticket: Dict) -> bool:
        """
        Check if ticket should be escalated.
        
        Returns True if any escalation rule matches.
        """
        for rule in self.escalation_rules:
            try:
                if rule["condition"](ticket):
                    logger.info(f"Ticket {ticket['id']} matched escalation rule: {rule['name']}")
                    return True
            except Exception as e:
                logger.error(f"Error evaluating rule {rule['name']}: {e}")
        
        return False
    
    def escalate(self, ticket_id: str, reason: str = "auto", escalated_by: Optional[str] = None) -> Dict:
        """
        Escalate a ticket.
        
        Args:
            ticket_id: Ticket to escalate
            reason: Escalation reason (auto, manual, sla_breach, etc.)
            escalated_by: User ID if manual escalation
        
        Returns:
            Updated ticket
        """
        from supabase import create_client
        import os
        
        supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
        
        # 1. Get current ticket
        response = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
        
        if not response.data:
            raise ValueError(f"Ticket {ticket_id} not found")
        
        ticket = response.data[0]
        
        # 2. Find matching escalation rule
        target_queue = "escalations"  # Default
        priority_boost = None
        sla_multiplier = 0.9
        
        for rule in self.escalation_rules:
            try:
                if rule["condition"](ticket):
                    target_queue = rule["target_queue"]
                    priority_boost = rule["priority_boost"]
                    sla_multiplier = rule["sla_multiplier"]
                    break
            except:
                continue
        
        # 3. Get target queue ID
        queue_response = supabase.table("queues").select("id").eq("team", target_queue).execute()
        
        if not queue_response.data:
            logger.warning(f"Queue {target_queue} not found, using default")
            queue_response = supabase.table("queues").select("id").eq("name", "Escalations").execute()
        
        new_queue_id = queue_response.data[0]["id"] if queue_response.data else None
        
        # 4. Package context for human agent
        context = self._package_context(ticket)
        
        # 5. Update ticket
        update_data = {
            "status": "escalated",
            "queue_id": new_queue_id,
            "priority": priority_boost if priority_boost else ticket["priority"],
            "metadata": {
                **ticket.get("metadata", {}),
                "escalated_at": datetime.utcnow().isoformat(),
                "escalation_reason": reason,
                "escalated_by": escalated_by,
                "context": context,
            }
        }
        
        response = supabase.table("tickets").update(update_data).eq("id", ticket_id).execute()
        
        # 6. Log to history
        history_data = {
            "ticket_id": ticket_id,
            "action": "escalated",
            "comment": f"Escalated to {target_queue}: {reason}",
            "old_values": {"status": ticket["status"], "queue_id": ticket.get("queue_id")},
            "new_values": update_data,
            "changed_by": escalated_by,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        supabase.table("ticket_history").insert(history_data).execute()
        
        # 7. Notify assignee (if any) or on-call team
        self._notify_escalation(ticket_id, target_queue, reason)
        
        logger.info(f"✅ Ticket {ticket_id} escalated to {target_queue}")
        
        return response.data[0]
    
    def _package_context(self, ticket: Dict) -> Dict:
        """
        Package complete context for human agent.
        
        ZERO CONTEXT LOSS - this is critical!
        """
        from supabase import create_client
        import os
        
        supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
        
        context = {
            "ticket_info": {
                "id": ticket["id"],
                "subject": ticket["subject"],
                "description": ticket["description"],
                "created_at": ticket["created_at"],
                "channel": ticket["channel"],
            },
            "classification": {
                "intent": ticket.get("intent"),
                "category": ticket.get("category"),
                "priority": ticket.get("priority"),
            },
            "customer_info": {},
            "conversation_history": [],
            "rag_attempts": [],
            "actions_taken": [],
        }
        
        # Get customer info
        if ticket.get("customer_id"):
            customer_response = supabase.table("customers").select("*").eq("id", ticket["customer_id"]).execute()
            if customer_response.data:
                context["customer_info"] = customer_response.data[0]
        
        # Get ticket history
        history_response = (
            supabase.table("ticket_history")
            .select("*")
            .eq("ticket_id", ticket["id"])
            .order("created_at")
            .execute()
        )
        context["conversation_history"] = history_response.data
        
        # Get RAG attempts (from citations)
        citations_response = (
            supabase.table("citations")
            .select("*, kb_articles(title), kb_chunks(content)")
            .eq("ticket_id", ticket["id"])
            .execute()
        )
        context["rag_attempts"] = citations_response.data
        
        # Extract actions taken
        for entry in history_response.data:
            if entry["action"] in ["created", "updated", "auto_resolve_attempt"]:
                context["actions_taken"].append({
                    "action": entry["action"],
                    "timestamp": entry["created_at"],
                    "details": entry.get("comment"),
                })
        
        return context
    
    def _is_sla_at_risk(self, ticket: Dict) -> bool:
        """Check if ticket is approaching SLA breach."""
        
        # Get SLA for this ticket
        from supabase import create_client
        import os
        
        supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
        
        if not ticket.get("sla_id"):
            return False
        
        sla_response = supabase.table("slas").select("*").eq("id", ticket["sla_id"]).execute()
        
        if not sla_response.data:
            return False
        
        sla = sla_response.data[0]
        
        # Parse intervals (PostgreSQL INTERVAL format)
        # For simplicity, assume respond_within is in format like "2 hours" or "30 minutes"
        respond_within = self._parse_interval(sla["respond_within"])
        
        # Calculate time since ticket creation
        created_at = datetime.fromisoformat(ticket["created_at"].replace("Z", "+00:00"))
        time_elapsed = datetime.utcnow() - created_at.replace(tzinfo=None)
        
        # At risk if 80% of SLA time has passed
        threshold = respond_within * 0.8
        
        return time_elapsed > threshold
    
    def _parse_interval(self, interval_str: str) -> timedelta:
        """Parse PostgreSQL INTERVAL string to timedelta."""
        
        # Simple parser (extend as needed)
        import re
        
        # Match patterns like "2 hours", "30 minutes", "1 day"
        match = re.match(r"(\d+)\s+(hour|minute|day|week)s?", interval_str)
        
        if not match:
            return timedelta(hours=24)  # Default to 24 hours
        
        value = int(match.group(1))
        unit = match.group(2)
        
        if unit == "minute":
            return timedelta(minutes=value)
        elif unit == "hour":
            return timedelta(hours=value)
        elif unit == "day":
            return timedelta(days=value)
        elif unit == "week":
            return timedelta(weeks=value)
        else:
            return timedelta(hours=value)
    
    def _notify_escalation(self, ticket_id: str, queue: str, reason: str):
        """Send notification about escalation."""
        
        # TODO: Implement notification system
        # Options:
        # - Email to on-call team
        # - Slack/Discord webhook
        # - In-app notification
        # - SMS for urgent cases
        
        logger.info(f"📢 Notification: Ticket {ticket_id} escalated to {queue} ({reason})")


# ─────────────────────────────────────────────────────────────
# API ENDPOINT
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter

router = APIRouter(prefix="/api/escalations", tags=["Escalations"])


@router.post("/tickets/{ticket_id}/escalate")
async def escalate_ticket(ticket_id: str, reason: str = "manual"):
    """
    Manually escalate a ticket.
    
    Called by CSR when they need help.
    """
    manager = EscalationManager()
    updated_ticket = manager.escalate(ticket_id, reason=reason)
    
    return {
        "success": True,
        "ticket": updated_ticket,
        "message": "Ticket escalated successfully"
    }
```

---

### **Day 3-4: Admin Panel Database Schema**

```sql
-- File: clara-backend/database/admin_schema.sql

-- 1. Extended User Table (with RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    
    -- Role & Status
    role TEXT CHECK (role IN ('admin', 'manager', 'csr', 'sales', 'marketing')) NOT NULL DEFAULT 'csr',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Team assignment
    team TEXT,  -- 'support_tier1', 'support_tier2', 'sales', 'marketing'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Sample users
INSERT INTO users (email, password_hash, display_name, role, team) VALUES
    ('admin@clara.ai', '$2b$12$...', 'Admin User', 'admin', 'admin'),
    ('husnain@clara.ai', '$2b$12$...', 'Husnain (Support)', 'manager', 'support_tier1'),
    ('faheem@clara.ai', '$2b$12$...', 'Faheem (Sales)', 'manager', 'sales'),
    ('sheryar@clara.ai', '$2b$12$...', 'Sheryar (Marketing)', 'manager', 'marketing');


-- 2. Permissions Table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL  -- 'tickets', 'users', 'kb', 'reports', 'system'
);

-- Define permissions
INSERT INTO permissions (code, description, category) VALUES
    ('tickets.view', 'View tickets', 'tickets'),
    ('tickets.create', 'Create tickets', 'tickets'),
    ('tickets.update', 'Update tickets', 'tickets'),
    ('tickets.delete', 'Delete tickets', 'tickets'),
    ('tickets.assign', 'Assign tickets to others', 'tickets'),
    
    ('users.view', 'View users', 'users'),
    ('users.create', 'Create users', 'users'),
    ('users.update', 'Update users', 'users'),
    ('users.delete', 'Delete users', 'users'),
    
    ('kb.view', 'View KB articles', 'kb'),
    ('kb.create', 'Create KB articles', 'kb'),
    ('kb.update', 'Update KB articles', 'kb'),
    ('kb.publish', 'Publish KB articles', 'kb'),
    ('kb.delete', 'Delete KB articles', 'kb'),
    
    ('reports.view', 'View reports', 'reports'),
    ('reports.export', 'Export reports', 'reports'),
    
    ('system.settings', 'Manage system settings', 'system'),
    ('system.logs', 'View system logs', 'system');


-- 3. Role-Permission Mapping
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    
    UNIQUE (role, permission_id)
);

-- Admin gets all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- Manager gets most permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions
WHERE code NOT IN ('users.delete', 'system.settings');

-- CSR gets limited permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'csr', id FROM permissions
WHERE code IN (
    'tickets.view', 'tickets.create', 'tickets.update',
    'kb.view', 'reports.view'
);


-- 4. Meetings Table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Meeting details
    title TEXT NOT NULL,
    description TEXT,
    
    -- Scheduling
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,  -- 'Zoom', 'Office', 'Google Meet', etc.
    meeting_url TEXT,  -- For virtual meetings
    
    -- Participants
    organizer_id UUID REFERENCES users(id),
    attendees UUID[],  -- Array of user IDs
    
    -- Status
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    
    -- Metadata
    meeting_type TEXT,  -- 'standup', 'review', 'planning', 'demo'
    notes TEXT,  -- Meeting notes/minutes
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_start ON meetings(start_time);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);


-- 5. Tasks/Todos Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    
    -- Priority & Status
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')) DEFAULT 'todo',
    
    -- Scheduling
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Related entities
    related_ticket_id UUID REFERENCES tickets(id),
    related_meeting_id UUID REFERENCES meetings(id),
    
    -- Tags for filtering
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_date);


-- 6. Team Progress Tracking
CREATE TABLE team_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Team & Time period
    team TEXT NOT NULL,
    date DATE NOT NULL,
    
    -- Metrics
    tickets_created INT DEFAULT 0,
    tickets_resolved INT DEFAULT 0,
    tickets_escalated INT DEFAULT 0,
    avg_resolution_time INTERVAL,
    
    tasks_completed INT DEFAULT 0,
    meetings_held INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (team, date)
);

CREATE INDEX idx_team_metrics_date ON team_metrics(date DESC);


-- 7. System Logs (for admin monitoring)
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Log details
    level TEXT CHECK (level IN ('info', 'warning', 'error', 'critical')) NOT NULL,
    message TEXT NOT NULL,
    
    -- Context
    user_id UUID REFERENCES users(id),
    module TEXT,  -- 'support_agent', 'sales_agent', 'orchestrator', etc.
    action TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_module ON system_logs(module);
```

---

### **Day 5-7: Admin Panel Frontend (React)**

```tsx
// File: clara-frontend/src/pages/AdminDashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'manager' | 'csr' | 'sales' | 'marketing';
  team: string;
  is_active: boolean;
  last_login: string;
}

interface TeamMetrics {
  team: string;
  tickets_created: number;
  tickets_resolved: number;
  tickets_escalated: number;
  tasks_completed: number;
  meetings_held: number;
}


const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<TeamMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Fetch team metrics
      const metricsResponse = await fetch('/api/admin/metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(selectedUser)
      });

      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'error',
      manager: 'warning',
      csr: 'info',
      sales: 'success',
      marketing: 'secondary',
    };
    return colors[role] || 'default';
  };

  if (loading) {
    return <Box p={3}>Loading...</Box>;
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadData}
        >
          Refresh
        </Button>
      </Box>

      {/* Team Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        {metrics.map((metric) => (
          <Grid item xs={12} md={6} lg={4} key={metric.team}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {metric.team.replace('_', ' ').toUpperCase()}
                </Typography>
                
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tickets Created
                    </Typography>
                    <Typography variant="h5">
                      {metric.tickets_created}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tickets Resolved
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {metric.tickets_resolved}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Escalated
                    </Typography>
                    <Typography variant="h5" color="warning.main">
                      {metric.tickets_escalated}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tasks Done
                    </Typography>
                    <Typography variant="h5">
                      {metric.tasks_completed}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* User Management */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              User Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedUser({
                  id: '',
                  email: '',
                  display_name: '',
                  role: 'csr',
                  team: 'support_tier1',
                  is_active: true,
                  last_login: '',
                });
                setIsDialogOpen(true);
              }}
            >
              Add User
            </Button>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.display_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.toUpperCase()}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.team}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <CheckIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser?.id ? 'Edit User' : 'Add User'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Display Name"
              value={selectedUser?.display_name || ''}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser!, display_name: e.target.value })
              }
              fullWidth
            />
            
            <TextField
              label="Email"
              type="email"
              value={selectedUser?.email || ''}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser!, email: e.target.value })
              }
              fullWidth
            />
            
            <Select
              label="Role"
              value={selectedUser?.role || 'csr'}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser!, role: e.target.value as any })
              }
              fullWidth
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="csr">CSR</MenuItem>
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
            </Select>
            
            <TextField
              label="Team"
              value={selectedUser?.team || ''}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser!, team: e.target.value })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveUser}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
```

```tsx
// File: clara-frontend/src/pages/MeetingScheduler.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface Meeting {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location: string;
  meeting_url?: string;
  organizer_id: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_type: string;
}

const MeetingScheduler: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const response = await fetch('/api/meetings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      // Convert dates
      const formattedMeetings = data.map((m: any) => ({
        ...m,
        start: new Date(m.start_time),
        end: new Date(m.end_time),
      }));
      
      setMeetings(formattedMeetings);
    } catch (error) {
      console.error('Error loading meetings:', error);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedMeeting({
      id: '',
      title: '',
      description: '',
      start,
      end,
      location: 'Zoom',
      attendees: [],
      status: 'scheduled',
      meeting_type: 'standup',
      organizer_id: '',
    });
    setIsDialogOpen(true);
  };

  const handleSaveMeeting = async () => {
    if (!selectedMeeting) return;

    try {
      const method = selectedMeeting.id ? 'PUT' : 'POST';
      const url = selectedMeeting.id
        ? `/api/meetings/${selectedMeeting.id}`
        : '/api/meetings';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...selectedMeeting,
          start_time: selectedMeeting.start.toISOString(),
          end_time: selectedMeeting.end.toISOString(),
        })
      });

      setIsDialogOpen(false);
      loadMeetings();
    } catch (error) {
      console.error('Error saving meeting:', error);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Meeting Scheduler
      </Typography>

      <Card>
        <CardContent>
          <Calendar
            localizer={localizer}
            events={meetings}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(meeting) => {
              setSelectedMeeting(meeting);
              setIsDialogOpen(true);
            }}
            selectable
          />
        </CardContent>
      </Card>

      {/* Meeting Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMeeting?.id ? 'Edit Meeting' : 'New Meeting'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Title"
              value={selectedMeeting?.title || ''}
              onChange={(e) =>
                setSelectedMeeting({ ...selectedMeeting!, title: e.target.value })
              }
              fullWidth
            />
            
            <TextField
              label="Description"
              value={selectedMeeting?.description || ''}
              onChange={(e) =>
                setSelectedMeeting({ ...selectedMeeting!, description: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Time"
                  type="datetime-local"
                  value={moment(selectedMeeting?.start).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) =>
                    setSelectedMeeting({
                      ...selectedMeeting!,
                      start: new Date(e.target.value),
                    })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="End Time"
                  type="datetime-local"
                  value={moment(selectedMeeting?.end).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) =>
                    setSelectedMeeting({
                      ...selectedMeeting!,
                      end: new Date(e.target.value),
                    })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Location / Meeting URL"
              value={selectedMeeting?.location || ''}
              onChange={(e) =>
                setSelectedMeeting({ ...selectedMeeting!, location: e.target.value })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveMeeting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingScheduler;
```

---

## **COMPLETE INTEGRATION & TESTING**

### **Final Integration Checklist**

```bash
# 1. Database Setup
psql -U postgres -d clara_crm < clara-backend/database/support_schema.sql
psql -U postgres -d clara_crm < clara-backend/database/kb_schema.sql
psql -U postgres -d clara_crm < clara-backend/database/admin_schema.sql

# 2. Install Python dependencies
cd clara-backend
pip install -r requirements.txt

# Additional packages for YOUR work:
pip install sentence-transformers  # Embeddings
pip install ollama  # Local LLM
pip install scikit-learn  # Classification
pip install joblib  # Model saving
pip install faster-whisper  # STT (optional)
pip install imaplib-imap  # Email
pip install bcrypt  # Password hashing

# 3. Install Ollama (for RAG LLM)
# Download from https://ollama.ai
ollama pull llama3.1:8b

# 4. Train classifier
cd agents/support_agent
python classifier.py  # Generates model file

# 5. Ingest sample KB articles
python -c "from embeddings import ingest_article; ingest_article('article_id_here')"

# 6. Test RAG system
python faq_handler.py

# 7. Start backend
cd ../..
uvicorn main:app --reload --port 8001

# 8. Start frontend (separate terminal)
cd ../../clara-frontend
npm install
npm run dev

# 9. Test email integration (optional)
python -c "from agents.support_agent.email_handler import process_incoming_emails; process_incoming_emails()"
```

---

### **Testing Strategy**

```python
# File: clara-backend/tests/test_support_agent.py

import pytest
from agents.support_agent.ticket_manager import create_ticket
from agents.support_agent.classifier import classify_ticket
from agents.support_agent.faq_handler import RAGSystem
from agents.support_agent.escalation import EscalationManager


def test_ticket_creation():
    """Test basic ticket creation."""
    ticket = create_ticket(
        customer_id="test-customer-id",
        subject="Can't login",
        description="I've been locked out of my account",
        channel="email"
    )
    
    assert ticket is not None
    assert ticket['status'] == 'open'
    assert ticket['category'] in ['technical', 'billing', 'general']


def test_classification():
    """Test NLP classification."""
    result = classify_ticket(
        "Password reset",
        "I forgot my password and need to reset it"
    )
    
    assert result['category'] == 'technical'
    assert result['intent'] in ['password_reset', 'login_issue']
    assert result['confidence']['category'] > 0.7


def test_rag_answer():
    """Test RAG system."""
    rag = RAGSystem()
    
    result = rag.answer_question("How do I reset my password?")
    
    assert result['confidence'] > 0.5
    assert len(result['citations']) > 0
    assert 'password' in result['answer'].lower()


def test_escalation():
    """Test escalation logic."""
    manager = EscalationManager()
    
    # High priority technical ticket should escalate
    ticket = {
        'id': 'test-id',
        'category': 'technical',
        'priority': 'urgent',
        'rag_confidence': 0.5,
    }
    
    should_escalate = manager.should_escalate(ticket)
    
    assert should_escalate is True


# Run tests
# pytest tests/test_support_agent.py -v
```

---

## **📊 IMPLEMENTATION TIMELINE SUMMARY**

```
Week 1: Ticket System + Classification
├── Days 1-2: Database setup, ticket CRUD API
├── Days 3-4: NLP classification model
├── Days 5-7: Testing and refinement
└── Deliverable: Tickets can be created, classified, routed

Week 2: RAG Knowledge Base
├── Days 1-2: KB schema, article management
├── Days 3-4: Embedding generation, vector search
├── Days 5-6: RAG answer synthesis with Ollama
├── Day 7: Ollama setup and testing
└── Deliverable: FAQ system working end-to-end

Week 3: Email & Escalation
├── Days 1-2: Email integration (IMAP/SMTP)
├── Days 3-4: Escalation logic and rules
├── Days 5-7: End-to-end ticket workflow
└── Deliverable: Email → Ticket → RAG → Response pipeline

Week 4: Admin Panel & Polish
├── Days 1-2: Escalation system completion
├── Days 3-4: Admin database schema
├── Days 5-7: Admin panel UI (React)
└── Deliverable: Complete admin dashboard

Week 5: Meetings & Tasks
├── Days 1-3: Meeting scheduler
├── Days 4-5: Task management
├── Days 6-7: Team progress view
└── Deliverable: Meeting and task systems

Week 6: Integration & Demo
├── Days 1-2: Full system integration testing
├── Days 3-4: Bug fixes and polish
├── Days 5-6: Documentation and demo prep
├── Day 7: Record demo video
└── Deliverable: Complete, tested, documented system
```

---

## **🎯 YOUR DELIVERABLES CHECKLIST**

```
Support Agent Core:
☐ Ticket CRUD API (create, update, close, list)
☐ NLP classification (F1 ≥ 0.80)
☐ Automatic routing to queues
☐ RAG FAQ system with citations
☐ Confidence scoring (≥ 0.85 for auto-resolve)
☐ Email integration (IMAP fetch + SMTP send)
☐ Escalation workflow with context packaging
☐ Ticket history tracking

Admin Panel:
☐ User management (CRUD)
☐ Role-based access control (RBAC)
☐ Team progress dashboard
☐ System metrics display
☐ Admin permissions testing

Meeting System:
☐ Meeting calendar component
☐ Meeting CRUD operations
☐ Meeting scheduling interface
☐ Team coordination features

Documentation:
☐ Support Agent architecture doc
☐ Admin panel features doc
☐ Meeting scheduler design doc
☐ RBAC implementation doc
☐ System security measures doc
☐ API documentation (Swagger/OpenAPI)

Testing:
☐ Unit tests for all components
☐ Integration tests for workflows
☐ Performance testing (meet NFRs)
☐ Security testing (auth, permissions)
☐ Demo video preparation
```

---

## **💡 KEY SUCCESS FACTORS**

**1. RAG Quality (Most Critical)**
- Use good training data for embeddings
- Tune chunk size (200-500 tokens optimal)
- Set confidence threshold appropriately (0.7-0.85)
- Always include citations
- Test with real customer questions

**2. Classification Accuracy**
- Collect 1000+ labeled tickets
- Balance classes (equal samples per category)
- Regularly retrain model with new data
- Monitor drift

**3. Email Integration**
- Use Gmail App Passwords (not real password!)
- Handle edge cases (attachments, HTML, etc.)
- Implement retry logic for SMTP failures
- Rate limit to avoid being blocked

**4. Performance**
- Index all foreign keys
- Use connection pooling for database
- Cache frequently accessed data (KB chunks, permissions)
- Batch embed operations

**5. Security**
- Hash passwords with bcrypt
- Validate all inputs
- Implement RBAC correctly
- Log all sensitive actions
- Never expose API keys in code

---

**YOU'RE READY TO BUILD! Start with Week 1, Day 1 and follow the plan step by step. Good luck! 🚀**

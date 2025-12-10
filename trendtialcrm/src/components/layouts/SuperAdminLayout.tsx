// src/components/layouts/SuperAdminLayout.tsx
import React, { useState, Fragment } from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavLink from '../common/NavLink';
import { useAuth } from '../../contexts/AuthContext';
import { Transition } from '@headlessui/react';
import NotificationBell from '../notifications/NotificationBell';
import AIAssistantButton from '../ai/AIAssistantButton';

// Re-using Icons (consider a shared file for these)
const MenuIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const XIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
);

const ChevronDownIcon = ({ className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);



// Marketing Hub Icon
const MarketingIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
  </svg>
);

// Support Hub Icon
const SupportIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);

// Sales Hub Icon
const SalesIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

// Admin Hub Icon
const AdminIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 1.255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.333.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 010-1.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Workspace Hub Icon
const WorkspaceIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const SuperAdminLayout: React.FC = () => {
  const { logout, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Workspace Hub States
  const [workspaceHubOpen, setWorkspaceHubOpen] = useState(false);
  
  // Admin Hub States
  const [adminHubOpen, setAdminHubOpen] = useState(false);
  
  // Sales Hub States
  const [salesHubOpen, setSalesHubOpen] = useState(false);
  
  // Marketing Hub States
  const [marketingHubOpen, setMarketingHubOpen] = useState(false);
  const [emailMarketingOpen, setEmailMarketingOpen] = useState(false);
  const [socialMediaOpen, setSocialMediaOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  
  // Support Hub States
  const [supportHubOpen, setSupportHubOpen] = useState(false);
  const [ticketsQueueOpen, setTicketsQueueOpen] = useState(false);
  const [supportChannelsOpen, setSupportChannelsOpen] = useState(false);

  const commonNavLinkClasses = 'flex items-center space-x-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out';
  const activeNavLinkClasses = 'bg-primary/10 text-primary rounded-lg font-semibold';
  const inactiveNavLinkClasses = 'text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg';
  const submenuLinkClasses = 'flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out pl-8';
  const nestedSubmenuLinkClasses = 'flex items-center px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out pl-12';

  // Workspace Hub Links
  const workspaceHubLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/daily-report', label: 'Daily Reports' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/todos', label: 'To-Do List' },
  ];

  // Admin Hub Links
  const adminHubLinks = [
    { to: '/admin/users', label: 'User Management' },
    { to: '/admin/settings', label: 'System Settings' },
    { to: '/admin/team-progress', label: 'Team Progress' },
  ];

  // Sales Hub Links
  const salesHubLinks = [
    { to: '/sales', label: 'AI Call Center' },
    { to: '/leads', label: 'Leads Overview' },
    { to: '/follow-ups', label: 'Follow-Ups' },
    { to: '/meetings', label: 'Meetings' },
  ];

  // Marketing Hub - Main Links (shown directly under Marketing Hub)
  const marketingMainLinks = [
    { to: '/marketing', label: 'Dashboard' },
    { to: '/marketing/content-studio', label: 'Content Studio (AI)' },
    { to: '/marketing/campaigns', label: 'Campaigns' },
  ];

  // Marketing Hub - Email Marketing Submenu
  const emailMarketingLinks = [
    { to: '/marketing/email/campaigns', label: 'Email Campaigns' },
    { to: '/marketing/email/templates', label: 'Templates' },
    { to: '/marketing/email/sequences', label: 'Sequences' },
  ];

  // Marketing Hub - Social Media Submenu
  const socialMediaLinks = [
    { to: '/marketing/social/scheduler', label: 'Post Scheduler' },
    { to: '/marketing/social/calendar', label: 'Content Calendar' },
    { to: '/marketing/social/analytics', label: 'Social Analytics' },
  ];

  // Marketing Hub - Automation & Strategy Submenu (NEW)
  const automationLinks = [
    { to: '/marketing/automation', label: 'Automation Workflows' },
    { to: '/marketing/analytics', label: 'Analytics' },
    { to: '/marketing/ab-testing', label: 'A/B Testing' },
    { to: '/marketing/templates', label: 'Templates Library' },
  ];

  // Support Hub - Main Links (shown directly under Support Hub)
  const supportMainLinks = [
    { to: '/support', label: 'Dashboard' },
    { to: '/support/knowledge-base', label: 'Knowledge Base' },
  ];
  
  // Support Hub - Tickets & Queue Submenu
  const ticketsQueueLinks = [
    { to: '/support/tickets', label: 'All Tickets' },
    { to: '/support/agent-queue', label: 'Agent Queue' },
  ];

  // Support Hub - Channels Submenu
  const supportChannelLinks = [
    { to: '/support/email', label: 'Email Ingest' },
    { to: '/support/chat', label: 'Live Chat' },
    { to: '/support/voice', label: 'Voice Support' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <div className="relative z-40 lg:hidden">
          {/* ... (Transition.Child for overlay, same as Agent/ManagerLayout) ... */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <aside className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4 w-full">
                  <div className="flex h-16 shrink-0 items-center mt-4">
                    <Link to="/dashboard" className="font-display text-2xl font-semibold text-primary">
                      Admin Panel
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-4">
                      {/* Mobile Workspace Hub - Collapsible */}
                      <li>
                        <button
                          onClick={() => setWorkspaceHubOpen(!workspaceHubOpen)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            workspaceHubOpen 
                              ? 'bg-gradient-to-r from-slate-500/10 to-gray-500/10 text-primary' 
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg ${workspaceHubOpen ? 'bg-gradient-to-r from-slate-600 to-gray-600 text-white' : 'bg-muted'}`}>
                              <WorkspaceIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">Workspace</span>
                          </div>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${workspaceHubOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${workspaceHubOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <ul role="list" className="mt-2 ml-2 border-l-2 border-slate-200 space-y-0.5">
                            {workspaceHubLinks.map(link => (
                              <li key={link.to}>
                                <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                  {link.label}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                      
                      {/* Mobile Admin Hub - Collapsible */}
                      <li>
                        <button
                          onClick={() => setAdminHubOpen(!adminHubOpen)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            adminHubOpen 
                              ? 'bg-gradient-to-r from-rose-500/10 to-pink-500/10 text-primary' 
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg ${adminHubOpen ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white' : 'bg-muted'}`}>
                              <AdminIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">Admin</span>
                          </div>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${adminHubOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${adminHubOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <ul role="list" className="mt-2 ml-2 border-l-2 border-rose-200 space-y-0.5">
                            {adminHubLinks.map(link => (
                              <li key={link.to}>
                                <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                  {link.label}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                      
                      {/* Mobile Sales Hub - Collapsible */}
                      <li>
                        <button
                          onClick={() => setSalesHubOpen(!salesHubOpen)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            salesHubOpen 
                              ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-primary' 
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg ${salesHubOpen ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-muted'}`}>
                              <SalesIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">Sales Hub</span>
                          </div>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${salesHubOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${salesHubOpen ? 'max-h-[150px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <ul role="list" className="mt-2 ml-2 border-l-2 border-blue-200 space-y-0.5">
                            {salesHubLinks.map(link => (
                              <li key={link.to}>
                                <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                  {link.label}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                      
                      {/* Mobile Marketing Hub - Collapsible */}
                      <li>
                        <button
                          onClick={() => setMarketingHubOpen(!marketingHubOpen)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            marketingHubOpen 
                              ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-primary' 
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg ${marketingHubOpen ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-muted'}`}>
                              <MarketingIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">Marketing Hub</span>
                          </div>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${marketingHubOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${marketingHubOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <ul role="list" className="mt-2 ml-2 border-l-2 border-indigo-200 space-y-0.5">
                            {marketingMainLinks.map(link => (
                              <li key={link.to}>
                                <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                  {link.label}
                                </NavLink>
                              </li>
                            ))}
                            
                            {/* Email Marketing */}
                            <li>
                              <button
                                onClick={() => setEmailMarketingOpen(!emailMarketingOpen)}
                                className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                              >
                                <span>Email Marketing</span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${emailMarketingOpen ? 'rotate-180' : ''}`} />
                              </button>
                              <ul className={`overflow-hidden transition-all duration-200 ${emailMarketingOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                {emailMarketingLinks.map(link => (
                                  <li key={link.to}>
                                    <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                      {link.label}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </li>
                            
                            {/* Social Media */}
                            <li>
                              <button
                                onClick={() => setSocialMediaOpen(!socialMediaOpen)}
                                className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                              >
                                <span>Social Media</span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${socialMediaOpen ? 'rotate-180' : ''}`} />
                              </button>
                              <ul className={`overflow-hidden transition-all duration-200 ${socialMediaOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                {socialMediaLinks.map(link => (
                                  <li key={link.to}>
                                    <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                      {link.label}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </li>
                            
                            {/* Automation & Strategy */}
                            <li>
                              <button
                                onClick={() => setAutomationOpen(!automationOpen)}
                                className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                              >
                                <span>Automation & Strategy</span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${automationOpen ? 'rotate-180' : ''}`} />
                              </button>
                              <ul className={`overflow-hidden transition-all duration-200 ${automationOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                                {automationLinks.map(link => (
                                  <li key={link.to}>
                                    <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                      {link.label}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </li>
                      
                      {/* Mobile Support Hub - Collapsible */}
                      <li>
                        <button
                          onClick={() => setSupportHubOpen(!supportHubOpen)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            supportHubOpen 
                              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-primary' 
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg ${supportHubOpen ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'bg-muted'}`}>
                              <SupportIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">Support Hub</span>
                          </div>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${supportHubOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${supportHubOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <ul role="list" className="mt-2 ml-2 border-l-2 border-emerald-200 space-y-0.5">
                            {supportMainLinks.map(link => (
                              <li key={link.to}>
                                <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                  {link.label}
                                </NavLink>
                              </li>
                            ))}
                            
                            {/* Tickets & Queue */}
                            <li>
                              <button
                                onClick={() => setTicketsQueueOpen(!ticketsQueueOpen)}
                                className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                              >
                                <span>Tickets & Queue</span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${ticketsQueueOpen ? 'rotate-180' : ''}`} />
                              </button>
                              <ul className={`overflow-hidden transition-all duration-200 ${ticketsQueueOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                {ticketsQueueLinks.map(link => (
                                  <li key={link.to}>
                                    <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                      {link.label}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </li>
                            
                            {/* Support Channels */}
                            <li>
                              <button
                                onClick={() => setSupportChannelsOpen(!supportChannelsOpen)}
                                className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                              >
                                <span>Support Channels</span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${supportChannelsOpen ? 'rotate-180' : ''}`} />
                              </button>
                              <ul className={`overflow-hidden transition-all duration-200 ${supportChannelsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                {supportChannelLinks.map(link => (
                                  <li key={link.to}>
                                    <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                      {link.label}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </li>
                      
                      <li className="mt-auto">
                        {profile && (
                          <div className="mb-3 px-1 py-2 text-sm text-muted-foreground">
                            Welcome, <span className="font-medium text-foreground">{profile.full_name}</span>
                          </div>
                        )}
                        <button
                          onClick={logout}
                          className={`${commonNavLinkClasses} w-full bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg group`}
                        >
                          <LogoutIcon className="mr-2 group-hover:scale-105 transition-transform" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </nav>
                </aside>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Transition.Root>

      {/* Static Sidebar for Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center mt-4">
            <Link to="/dashboard" className="font-display text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
              CRM Admin
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-4">
              {/* Workspace Hub Section - Collapsible */}
              <li>
                <button
                  onClick={() => setWorkspaceHubOpen(!workspaceHubOpen)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    workspaceHubOpen 
                      ? 'bg-gradient-to-r from-slate-500/10 to-gray-500/10 text-primary' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${workspaceHubOpen ? 'bg-gradient-to-r from-slate-600 to-gray-600 text-white' : 'bg-muted'}`}>
                      <WorkspaceIcon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Workspace</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${workspaceHubOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${workspaceHubOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul role="list" className="mt-2 ml-2 border-l-2 border-slate-200 space-y-0.5">
                    {workspaceHubLinks.map(link => (
                      <li key={link.to}>
                        <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                          {link.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
              
              {/* Admin Hub Section - Collapsible */}
              <li>
                <button
                  onClick={() => setAdminHubOpen(!adminHubOpen)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    adminHubOpen 
                      ? 'bg-gradient-to-r from-rose-500/10 to-pink-500/10 text-primary' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${adminHubOpen ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white' : 'bg-muted'}`}>
                      <AdminIcon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Admin</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${adminHubOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${adminHubOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul role="list" className="mt-2 ml-2 border-l-2 border-rose-200 space-y-0.5">
                    {adminHubLinks.map(link => (
                      <li key={link.to}>
                        <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                          {link.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
              
              {/* Sales Hub Section - Collapsible */}
              <li>
                <button
                  onClick={() => setSalesHubOpen(!salesHubOpen)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    salesHubOpen 
                      ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-primary' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${salesHubOpen ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-muted'}`}>
                      <SalesIcon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Sales Hub</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${salesHubOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Sales Hub Content - Collapsible */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${salesHubOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul role="list" className="mt-2 ml-2 border-l-2 border-blue-200 space-y-0.5">
                    {salesHubLinks.map(link => (
                      <li key={link.to}>
                        <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                          {link.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
              
              {/* Marketing Hub Section - Collapsible */}
              <li>
                <button
                  onClick={() => setMarketingHubOpen(!marketingHubOpen)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    marketingHubOpen 
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-primary' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${marketingHubOpen ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-muted'}`}>
                      <MarketingIcon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Marketing Hub</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${marketingHubOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Marketing Hub Content - Collapsible */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${marketingHubOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul role="list" className="mt-2 ml-2 border-l-2 border-indigo-200 space-y-0.5">
                    {/* Main Marketing Links */}
                    {marketingMainLinks.map(link => (
                      <li key={link.to}>
                        <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                          {link.label}
                        </NavLink>
                      </li>
                    ))}
                    
                    {/* Email Marketing Dropdown */}
                    <li>
                      <button
                        onClick={() => setEmailMarketingOpen(!emailMarketingOpen)}
                        className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                      >
                        <span>Email Marketing</span>
                        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${emailMarketingOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <ul className={`overflow-hidden transition-all duration-200 ${emailMarketingOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {emailMarketingLinks.map(link => (
                          <li key={link.to}>
                            <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                              {link.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                    
                    {/* Social Media Dropdown */}
                    <li>
                      <button
                        onClick={() => setSocialMediaOpen(!socialMediaOpen)}
                        className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                      >
                        <span>Social Media</span>
                        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${socialMediaOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <ul className={`overflow-hidden transition-all duration-200 ${socialMediaOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {socialMediaLinks.map(link => (
                          <li key={link.to}>
                            <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                              {link.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                    
                    {/* Automation & Strategy Dropdown */}
                    <li>
                      <button
                        onClick={() => setAutomationOpen(!automationOpen)}
                        className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                      >
                        <span>Automation & Strategy</span>
                        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${automationOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <ul className={`overflow-hidden transition-all duration-200 ${automationOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {automationLinks.map(link => (
                          <li key={link.to}>
                            <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                              {link.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </div>
              </li>
              
              {/* Support Hub Section - Collapsible */}
              <li>
                <button
                  onClick={() => setSupportHubOpen(!supportHubOpen)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    supportHubOpen 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-primary' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${supportHubOpen ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'bg-muted'}`}>
                      <SupportIcon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Support Hub</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${supportHubOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Support Hub Content - Collapsible */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${supportHubOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul role="list" className="mt-2 ml-2 border-l-2 border-emerald-200 space-y-0.5">
                    {/* Main Support Links */}
                    {supportMainLinks.map(link => (
                      <li key={link.to}>
                        <NavLink to={link.to} className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                          {link.label}
                        </NavLink>
                      </li>
                    ))}
                    
                    {/* Tickets & Queue Dropdown */}
                    <li>
                      <button
                        onClick={() => setTicketsQueueOpen(!ticketsQueueOpen)}
                        className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                      >
                        <span>Tickets & Queue</span>
                        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${ticketsQueueOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <ul className={`overflow-hidden transition-all duration-200 ${ticketsQueueOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {ticketsQueueLinks.map(link => (
                          <li key={link.to}>
                            <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                              {link.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                    
                    {/* Support Channels Dropdown */}
                    <li>
                      <button
                        onClick={() => setSupportChannelsOpen(!supportChannelsOpen)}
                        className={`${submenuLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                      >
                        <span>Support Channels</span>
                        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${supportChannelsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <ul className={`overflow-hidden transition-all duration-200 ${supportChannelsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {supportChannelLinks.map(link => (
                          <li key={link.to}>
                            <NavLink to={link.to} className={nestedSubmenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                              {link.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="mt-auto">
                {profile && (
                  <div className="mb-3 px-1 py-2 text-sm text-muted-foreground">
                    Welcome, <span className="font-medium text-foreground">{profile.full_name}</span>
                  </div>
                )}
                <button
                  onClick={logout}
                  className={`${commonNavLinkClasses} w-full bg-destructive/10 text-destructive hover:bg-destructive/20 group`}
                >
                  <LogoutIcon className="mr-2 h-5 w-5 transition-transform group-hover:scale-105" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-x-6 border-b border-border bg-card px-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-foreground lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-lg font-semibold leading-6 text-foreground">
            Admin Panel
          </div>
          {/* Notification Bell */}
          <NotificationBell />
        </header>

        {/* Desktop header for notifications */}
        <header className="hidden lg:block sticky top-0 z-30 h-16 border-b border-border bg-card shadow-sm">
          <div className="flex h-full items-center justify-end px-6">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-background overflow-y-auto">
          <Outlet />
          {/* AI Assistant Button - Available everywhere */}
          <AIAssistantButton />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout; 
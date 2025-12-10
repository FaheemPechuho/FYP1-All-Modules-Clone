// src/components/layouts/AgentLayout.tsx
import React, { useState, Fragment } from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavLink from '../common/NavLink';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react'; // For potential dropdowns
import NotificationBell from '../notifications/NotificationBell';
import AIAssistantButton from '../ai/AIAssistantButton';

// Placeholder Icons - Consider using a library like Lucide React or Heroicons
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

const AgentLayout: React.FC = () => {
  const { logout, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportCenterOpen, setSupportCenterOpen] = useState(false);
  const [supportChannelsOpen, setSupportChannelsOpen] = useState(false);

  const commonNavLinkClasses = 'flex items-center space-x-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-in-out';
  const activeNavLinkClasses = 'bg-primary/10 text-primary rounded-lg';
  const inactiveNavLinkClasses = 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg';
  const submenuLinkClasses = 'flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out pl-6';

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Sidebar (Off-canvas) */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <div className="relative z-40 lg:hidden">
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
                {/* Sidebar component, swap this element with another sidebar if you like */} 
                <aside className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4 w-full">
                  <div className="flex h-16 shrink-0 items-center mt-4">
                    {/* Replace with your logo or app name styling */}
                    <Link to="/dashboard" className="font-display text-2xl font-semibold text-primary">
                      Agent CRM
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          <li><NavLink to="/dashboard" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Dashboard</NavLink></li>
                          <li><NavLink to="/leads" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Leads</NavLink></li>
                          <li><NavLink to="/follow-ups" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Follow-Ups</NavLink></li>
                          <li><NavLink to="/meetings" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Meetings</NavLink></li>
                          <li><NavLink to="/sales" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Sales Hub (AI)</NavLink></li>
                          <li><NavLink to="/marketing" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Marketing Hub</NavLink></li>
                          <li><NavLink to="/todos" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>To-Do List</NavLink></li>
                          <li><NavLink to="/daily-report" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Daily Reports</NavLink></li>
                          <li><NavLink to="/attendance" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Attendance</NavLink></li>
                        </ul>
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
            {/* Replace with your logo or app name styling */}
            <Link to="/dashboard" className="font-display text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
              CRM
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1.5">
                  <li><NavLink to="/dashboard" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Dashboard</NavLink></li>
                  <li><NavLink to="/leads" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Leads</NavLink></li>
                  <li><NavLink to="/follow-ups" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Follow-Ups</NavLink></li>
                  <li><NavLink to="/meetings" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Meetings</NavLink></li>
                  <li><NavLink to="/sales" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Sales Hub (AI)</NavLink></li>
                  <li><NavLink to="/marketing" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Marketing Hub</NavLink></li>
                  <li><NavLink to="/todos" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>To-Do List</NavLink></li>
                  <li><NavLink to="/daily-report" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Daily Reports</NavLink></li>
                  <li><NavLink to="/attendance" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>Attendance</NavLink></li>
                </ul>
              </li>
              {/* Support Center Section */}
              <li>
                <div className="text-xs font-semibold leading-6 text-muted-foreground uppercase tracking-wider px-3 mb-2">Support Center</div>
                <ul role="list" className="-mx-2 space-y-1">
                  {/* Dashboard Link */}
                  <li><NavLink to="/support" className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>
                    Dashboard
                  </NavLink></li>
                  {/* Collapsible Submenu */}
                  <li>
                    <button
                      onClick={() => setSupportCenterOpen(!supportCenterOpen)}
                      className={`${commonNavLinkClasses} w-full justify-between ${inactiveNavLinkClasses}`}
                    >
                      <span className="flex items-center">
                        <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>
                        Tickets & Queue
                      </span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${supportCenterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <ul className={`overflow-hidden transition-all duration-200 ${supportCenterOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <li><NavLink to="/support/tickets" className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                        All Tickets
                      </NavLink></li>
                      <li><NavLink to="/support/agent-queue" className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                        Agent Queue
                      </NavLink></li>
                      <li><NavLink to="/support/knowledge-base" className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                        Knowledge Base
                      </NavLink></li>
                    </ul>
                  </li>
                </ul>
              </li>
              {/* Support Channels Section */}
              <li>
                <button
                  onClick={() => setSupportChannelsOpen(!supportChannelsOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold leading-6 text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors"
                >
                  <span>Support Channels</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${supportChannelsOpen ? 'rotate-180' : ''}`} />
                </button>
                <ul className={`-mx-2 space-y-1 overflow-hidden transition-all duration-200 ${supportChannelsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <li><NavLink to="/support/email" className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    Email Ingest
                  </NavLink></li>
                  <li><NavLink to="/support/chat" className={submenuLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Create Ticket
                  </NavLink></li>
                </ul>
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
        {/* Sticky Header for Mobile, includes Hamburger Menu */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-x-6 border-b border-border bg-card px-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-foreground lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-lg font-semibold leading-6 text-foreground">
            {/* Dynamic Page Title Can Go Here - For now, a placeholder or app name */}
            Agent Portal
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
          {/* Your page content starts here */}
          <Outlet />
          {/* AI Assistant Button - Available everywhere */}
          <AIAssistantButton />
        </main>
      </div>
    </div>
  );
};

export default AgentLayout; 
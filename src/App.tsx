import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { TransactionModal } from './components/TransactionModal';
import { GoalModal } from './components/GoalModal';
import { ContributionModal } from './components/ContributionModal';
import { BudgetModal } from './components/BudgetModal';
import { NotificationsModal } from './components/NotificationsModal';

import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { GoalsPage } from './pages/GoalsPage';
import { CoachPage } from './pages/CoachPage';
import { InsightsPage } from './pages/InsightsPage';
import { LearningPage } from './pages/LearningPage';
import { SettingsPage } from './pages/SettingsPage';

import {
  User,
  Transaction,
  Category,
  Budget,
  Goal,
  DashboardData,
  InsightsData,
  NotificationItem,
} from './types';
import { api, getActiveUserId, setActiveUserId } from './services/api';
import { Sparkles, X, Info } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Selected period
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  // Core Data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(
    localStorage.getItem('pocketwise_welcome_dismissed') !== 'true'
  );

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Fetch all initial data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, catRes, dashRes, txRes, bRes, gRes, nRes, inRes] = await Promise.all([
        api.getUser(),
        api.getCategories(),
        api.getDashboard(selectedMonth),
        api.getTransactions(),
        api.getBudgets(selectedMonth),
        api.getGoals(),
        api.getNotifications(),
        api.getInsights(),
      ]);

      setUser(uRes.user);
      setAllUsers(uRes.allUsers);
      setCategories(catRes.categories);
      setDashboardData(dashRes);
      setTransactions(txRes.transactions);
      setBudgets(bRes.budgets);
      setGoals(gRes.goals);
      setNotifications(nRes.notifications);
      setInsights(inRes);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSwitchUser = (userId: number) => {
    setActiveUserId(userId);
    loadAllData();
  };

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('pocketwise_welcome_dismissed', 'true');
  };

  // Quick Open Modal Handlers
  const handleOpenAddTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setIsGoalModalOpen(true);
  };

  const handleOpenContribute = (g: Goal) => {
    setContributingGoal(g);
    setIsContributionModalOpen(true);
  };

  const handleOpenBudgetModal = (b?: Budget) => {
    setEditingBudget(b || null);
    setIsBudgetModalOpen(true);
  };

  // Page title mapping
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: `Welcome back, ${user?.name?.split(' ')[0] || 'Student'}! 👋`,
          subtitle: `Here is your college financial health for ${selectedMonth}`,
        };
      case 'transactions':
        return {
          title: 'Transaction History',
          subtitle: 'Search, filter, and review all recorded expenses & income',
        };
      case 'budgets':
        return {
          title: 'Monthly Budget Envelopes',
          subtitle: 'Category spending caps with automated 80% & 100% threshold warnings',
        };
      case 'goals':
        return {
          title: 'Savings Milestones',
          subtitle: 'Plan ahead for tech upgrades, trips, or emergency buffers',
        };
      case 'coach':
        return {
          title: 'AI Student Finance Coach',
          subtitle: 'Interactive advice tailored strictly to your real database records',
        };
      case 'insights':
        return {
          title: 'Spending Insights & Forecast',
          subtitle: 'Month-over-month comparisons, trends, and projected end-of-month spend',
        };
      case 'learning':
        return {
          title: 'Financial Literacy Hub',
          subtitle: 'Bite-sized college modules with interactive multiple-choice quizzes',
        };
      case 'settings':
        return {
          title: 'Settings & Data Controls',
          subtitle: 'Switch profiles, export CSV, or reset demo database state',
        };
    }
  };

  const { title: pageTitle, subtitle: pageSubtitle } = getTabTitle(currentTab);

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 flex flex-col">
      {/* Sidebar for Desktop & Mobile drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        availableRemainder={dashboardData?.availableRemainder || 0}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          user={user}
          allUsers={allUsers}
          notifications={notifications}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenAddTransaction={handleOpenAddTransaction}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onSwitchUser={handleSwitchUser}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Welcome Onboarding Banner for first-time visitors */}
          {showWelcome && (
            <div className="relative p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-md border border-emerald-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Welcome to PocketWise AI — Built for College Hackathon!
                  </h2>
                  <p className="text-xs text-emerald-100/90 mt-0.5 max-w-2xl leading-relaxed">
                    Track daily canteen & transit expenses, set 80% warning budgets, calculate savings
                    needed for laptops or trips, and chat with a real Gemini AI Coach that references
                    your actual SQLite database.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setCurrentTab('coach')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs shadow-xs transition-colors"
                >
                  Ask AI Coach
                </button>
                <button
                  onClick={handleDismissWelcome}
                  className="p-1.5 text-emerald-300 hover:text-white rounded-lg transition-colors"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Active Tab Pages */}
          {currentTab === 'dashboard' && (
            <DashboardPage
              data={dashboardData}
              loading={loading}
              selectedMonth={selectedMonth}
              onSelectMonth={(m) => setSelectedMonth(m)}
              onOpenAddTransaction={handleOpenAddTransaction}
              onOpenContribute={handleOpenContribute}
              onNavigateToTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              transactions={transactions}
              categories={categories}
              loading={loading}
              onRefresh={loadAllData}
              onOpenAddTransaction={handleOpenAddTransaction}
              onEditTransaction={handleOpenEditTransaction}
            />
          )}

          {currentTab === 'budgets' && (
            <BudgetsPage
              budgets={budgets}
              currentMonth={selectedMonth}
              onRefresh={loadAllData}
              onOpenBudgetModal={handleOpenBudgetModal}
            />
          )}

          {currentTab === 'goals' && (
            <GoalsPage
              goals={goals}
              onRefresh={loadAllData}
              onOpenCreateGoal={handleOpenCreateGoal}
              onOpenEditGoal={handleOpenEditGoal}
              onOpenContribute={handleOpenContribute}
            />
          )}

          {currentTab === 'coach' && <CoachPage user={user} />}

          {currentTab === 'insights' && (
            <InsightsPage
              insights={insights}
              loading={loading}
              onRefresh={loadAllData}
              onBudgetAdopted={loadAllData}
            />
          )}

          {currentTab === 'learning' && <LearningPage />}

          {currentTab === 'settings' && (
            <SettingsPage
              user={user}
              allUsers={allUsers}
              onRefreshAll={loadAllData}
              onSwitchUser={handleSwitchUser}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={loadAllData}
        initialTransaction={editingTransaction}
        categories={categories}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSuccess={loadAllData}
        initialGoal={editingGoal}
      />

      <ContributionModal
        isOpen={isContributionModalOpen}
        onClose={() => {
          setIsContributionModalOpen(false);
          setContributingGoal(null);
        }}
        onSuccess={loadAllData}
        goal={contributingGoal}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setEditingBudget(null);
        }}
        onSuccess={loadAllData}
        initialBudget={editingBudget}
        categories={categories}
        currentMonth={selectedMonth}
      />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onRefresh={loadAllData}
      />
    </div>
  );
}

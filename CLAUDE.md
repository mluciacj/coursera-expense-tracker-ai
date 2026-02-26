# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Coursera Expense Tracker AI** — A modern, production-ready personal finance expense tracking web application built with Next.js 14 and the App Router.

## Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Architecture

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts (bar chart, pie chart)
- **Date utilities**: date-fns
- **Data persistence**: Browser localStorage (no backend required)
- **State management**: React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)

## Project Structure

```
app/
  layout.tsx          # Root layout with sidebar + mobile nav
  page.tsx            # Dashboard page (charts, summary cards, recent expenses)
  globals.css         # Global styles + Tailwind directives
  expenses/
    page.tsx          # Expenses list page (CRUD, search, filter, export)

components/
  layout/
    Sidebar.tsx       # Desktop sidebar navigation
    MobileNav.tsx     # Mobile bottom tab bar
  ui/
    SummaryCard.tsx   # Metric card for dashboard
    Badge.tsx         # Category badge with color coding
    Modal.tsx         # Reusable modal dialog
    ConfirmDialog.tsx # Delete confirmation dialog
    ExpenseCard.tsx   # Individual expense row with edit/delete
  forms/
    ExpenseForm.tsx   # Add/edit expense form with validation
    FilterBar.tsx     # Search + filter controls
  charts/
    SpendingBarChart.tsx  # Monthly spending bar chart
    CategoryPieChart.tsx  # Category breakdown donut chart

lib/
  types.ts        # TypeScript types, constants (categories, colors, icons)
  storage.ts      # localStorage CRUD operations
  analytics.ts    # Spending summary computation, CSV export, currency formatting
  hooks.ts        # useExpenses custom hook (state + CRUD + filtering)
```

## Key Features

- Add, edit, delete expenses with form validation
- Filter by search text, category, and date range
- Dashboard with summary cards (total, this month, last month, top category)
- Monthly spending bar chart (last 6 months)
- Category breakdown donut chart
- CSV export of (filtered) expenses
- Responsive design: sidebar on desktop, bottom nav on mobile
- Toast notifications for user actions
- localStorage persistence (no backend required)

## Categories

Food, Transportation, Entertainment, Shopping, Bills, Other

## Environment Variables

None required — this is a fully client-side application.

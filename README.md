# PocketWise AI — Personal Student Finance Coach 🎓💰

PocketWise AI is a student-focused personal finance management web application designed for college hackathons. It combines real-time transaction tracking, monthly budget envelopes, savings goal milestone planning, financial literacy micro-lessons, and an integrated **Google Gemini AI Coach** grounded in the student's real database records.

---

## 🌟 Key Features

### 1. Main Dashboard & Analytics
- **5 Core Financial Cards**: Total Income, Total Expenses, Net Remainder (with clear disclaimer that this is calculated from recorded transactions, not live bank credentials), Total Saved in Goals, and Monthly Budget Usage percentage.
- **Interactive Charts (Chart.js)**:
  - 6-Month Income vs. Expenses trend comparison.
  - Category-wise Expense Breakdown doughnut chart.
- **Budget Warnings & Nudges**: Automatic amber alerts when category spending reaches $\ge 80\%$ and red alerts when exceeding $100\%$.
- **Financial Period Selector**: Switch across recent months to inspect historical records.

### 2. Transaction Ledger & Smart Suggestions
- Full CRUD: Add, edit, delete, search, and filter by date, category, and transaction type.
- **Smart Category Auto-Suggestion**: As you type descriptions (e.g. `"Canteen dosa"` $\rightarrow$ Food, `"College bus pass"` $\rightarrow$ Travel, `"DSA Textbook"` $\rightarrow$ Education), the engine suggests the best category with an explainable rationale and 1-click apply button.
- Strict input validation: Rejects $\le ₹0$, missing descriptions, or invalid dates.
- **CSV Export**: One-click download of all transaction history to `pocketwise_transactions.csv`.

### 3. Monthly Budget Envelopes
- Set monthly limits for categories (Food, Travel, Education, Bills, Entertainment, etc.) and an Overall Monthly Ceiling.
- Visual progress bars with dynamic color shifts (Green $< 80\%$, Amber $80\% - 100\%$, Red $> 100\%$).
- Envelope isolation: Spending in Food does not deplete Travel or Books envelopes.

### 4. Savings Goals & Monthly Calculator
- Create targets with title, target amount in ₹, target date, and category.
- **Automated Monthly Plan Calculator**: Automatically calculates required monthly contributions using remaining funds and months left until target date (e.g., ₹6,000 target over 6 months = ₹1,000/month).
- **Direct Deposit Flow**: Deposit money into specific goals with separate accounting records (`goal_contributions` table) without double-counting against operating expenses.
- Milestone Celebrations ($25\%, 50\%, 75\%, 100\%$).

### 5. Gemini AI Finance Coach
- Powered by Google Gemini (`gemini-3.8-flash`) via the official `@google/genai` TypeScript SDK.
- Context-grounded: Gathers an authorized financial summary of the active student (income, expenses, category distribution, budget statuses, and savings milestones) and instructs the model to give non-judgmental, practical college money advice.
- When transaction history is insufficient, the coach politely highlights that more records are required rather than hallucinating fake trends.
- Quick student prompt chips (e.g., *"How can I save ₹1,000 this month?"*, *"Explain the 50/30/20 rule"*).

### 6. Explainable Insights & Expense Forecasting
- **Month-over-Month Comparison**: Category-level variances with percentage deltas and absolute ₹ differences.
- **Statistical Expense Forecast**: Daily average spend extrapolated to month-end with documented methodology and explicit uncertainty disclaimer.
- **1-Click Budget Recommendations**: Proposes optimized budget limits based on recent spending patterns with a 10% safety buffer.

### 7. Financial Literacy Hub
- Bite-sized interactive student modules:
  1. *The College Budgeting Blueprint: 50/30/20 & Envelopes*
  2. *Needs vs. Wants on Campus (Overcoming FOMO)*
  3. *Building a ₹5,000 Emergency Pocket Cushion*
  4. *Smart Side-Hustles: Freelance & Tutoring Income*
- Knowledge-check quizzes with instant explanations, answer highlighting, and persistent score tracking in SQLite.

### 8. Multi-Student Profiles & Demo Utilities
- Switch between student profiles or add custom profiles with college name and allowance.
- **Reset to Demo Data**: One-click restore of Aarav Sharma's realistic 2-month college finances.
- **Clear All Data**: Clean slate mode for live hackathon judge testing.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Chart.js & react-chartjs-2.
- **Backend**: Node.js, Express, REST API endpoints (`/api/*`).
- **Database**: SQLite database using WebAssembly `sql.js` with disk persistence (`data/pocketwise.sqlite`).
- **AI Integration**: Server-side `@google/genai` with `gemini-3.8-flash` (API key kept strictly on the backend via `process.env.GEMINI_API_KEY`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `GEMINI_API_KEY` is set:
```bash
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

---

## 🧪 Hackathon Demonstration Checklist

| Scenario | Expected Outcome | Status |
| :--- | :--- | :--- |
| **Add ₹120 Travel Expense** | Total expenses and Travel chart update in real-time | ✅ Verified |
| **Input Validation** | Entering ₹0 or negative amounts triggers clear error banners | ✅ Verified |
| **Category Edit** | Editing a Food expense to Travel shifts the doughnut chart distribution | ✅ Verified |
| **₹2,500 Budget Test** | With ₹2,000 spent, badge displays 80% used & ₹500 remaining | ✅ Verified |
| **₹6,000 Goal Test** | Target of ₹6,000 over 6 months suggests ~₹1,000/month contribution | ✅ Verified |
| **Goal Contribution** | Adding a ₹1,000 deposit advances progress bar & triggers milestone | ✅ Verified |
| **Data Persistence** | Refreshing browser or restarting server retains all records | ✅ Verified |
| **AI Coach Grounding** | Answers directly cite recorded income, expenses, and budget limits | ✅ Verified |

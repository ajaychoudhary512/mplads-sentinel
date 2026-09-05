Create a high-fidelity, fully interactive web application prototype based on the attached reference image for the hackathon problem statement:

“AI-Powered System to Detect Anomalies, Fraud & Inefficiencies in MPLAD Scheme Implementation.”

The product should look like a real production-ready Government of India enterprise platform, not a generic AI dashboard.

PRODUCT NAME:
“MP-Guard AI”
Subtitle: “AI-Powered MPLAD Monitoring & Risk Intelligence Platform”

GOAL:
Build a functional clickable prototype that helps government administrators, MPs, implementing agencies and auditors monitor MPLAD projects, detect suspicious transactions/projects, identify fraud patterns, track project progress, and take corrective action.

DESIGN DIRECTION:

- Professional Government of India enterprise dashboard
- Modern, clean and trustworthy
- Navy blue + white as primary colors with subtle green accents
- Use red/orange only for warnings and risk levels
- Minimal glassmorphism; prioritize usability
- Rounded cards, subtle shadows and clean spacing
- Use professional charts, tables, maps and data visualizations
- Desktop-first responsive web application
- Typography should be highly readable
- Include Government-style visual hierarchy without making the UI look outdated
- Add a small “AI Powered” indicator throughout relevant modules
- Use realistic Indian administrative terminology
- Do NOT make the interface look like a cryptocurrency, fintech or consumer startup dashboard

GLOBAL APPLICATION STRUCTURE:

Create a left sidebar navigation:

1. Overview
2. Projects
3. AI Risk Detection
4. Fraud & Anomaly Alerts
5. Geo Monitoring
6. Financial Analysis
7. Beneficiaries & Vendors
8. Reports
9. Audit Trail
10. Notifications
11. Settings

Top navigation:

- Government/MP profile
- Current MP constituency selector
- Search
- Notifications
- Help
- Profile menu

PAGE 1 — LOGIN

Create a professional login page.

Content:

- MP-Guard AI logo
- “MPLAD Monitoring & Risk Intelligence”
- Government of India / MoSPI context
- Email/User ID field
- Password field
- Role selector
- CAPTCHA placeholder
- Login button
- Forgot password
- “Secure Government Application” indicator

After clicking Login → navigate to Dashboard.

PAGE 2 — EXECUTIVE DASHBOARD

Create a powerful overview dashboard.

Top KPI cards:

- Total MPLAD Projects
- Total Allocated Funds
- Funds Utilized
- Projects Completed
- Projects Delayed
- High-Risk Projects

Example values:
Total Projects: 1,284
Allocated Funds: ₹482.6 Cr
Utilized: ₹391.4 Cr
Completed: 924
Delayed: 117
High Risk: 43

Add a prominent AI Risk Summary card:
“AI detected 43 high-risk projects requiring attention.”

Show:

- High Risk: 43
- Medium Risk: 126
- Low Risk: 1,115

Add charts:

1. Fund Allocation vs Utilization
2. Project Status Distribution
3. Monthly Project Progress
4. Risk Trend
5. District-wise risk distribution

Add “Priority Actions” section:

- 12 projects have unusual expenditure patterns
- 7 vendors have duplicate billing indicators
- 9 projects have delayed completion
- 15 transactions require verification

Each action should have:

- Risk level
- Project ID
- District
- Amount
- Reason
- “Investigate” button

PAGE 3 — PROJECTS

Create a project management table.

Columns:

- Project ID
- Project Name
- MP/Constituency
- District
- Category
- Approved Amount
- Utilized Amount
- Completion %
- Status
- AI Risk Score
- Last Updated
- Action

Add filters:

- State
- District
- Constituency
- Project category
- Status
- Risk level
- Financial year
- Date range

Add search.

Use realistic sample projects such as:
“Community Health Centre Upgrade”
“Government School Digital Lab”
“Rural Road Development”
“Drinking Water Infrastructure”
“Community Sports Complex”

Clicking any project should open a detailed Project Intelligence page.

PAGE 4 — PROJECT INTELLIGENCE / DETAIL PAGE

Create a detailed project analysis screen.

Header:
Project ID: MPLAD-2026-00482
Project Name: Rural Community Health Centre Upgrade
Location: Example District, Rajasthan
Status: Under Implementation
AI Risk Score: 82/100 — HIGH RISK

Show tabs:
Overview | Financials | Timeline | Documents | AI Analysis | Audit Trail

Overview:

- Approved amount
- Released amount
- Utilized amount
- Remaining amount
- Contractor/vendor
- Implementing agency
- Start date
- Expected completion
- Actual progress

Timeline:
Approved → Fund Released → Work Started → Inspection → Completion

Financial section:

- Budget vs actual spending graph
- Transaction history
- Cost variance
- Payment timeline

AI Analysis:
Display an explainable AI risk breakdown:

Risk Score: 82

Factors:

- Cost anomaly: +24
- Delayed progress: +18
- Vendor pattern: +16
- Duplicate transaction indicator: +14
- Geographic inconsistency: +10

Add:
“Why was this project flagged?”

AI explanation:
“Expenditure increased by 31% during the final implementation stage while physical progress increased by only 12%. Similar billing patterns were detected in 3 other projects associated with this vendor.”

Buttons:

- Investigate
- Request Verification
- Assign Auditor
- Generate Report

PAGE 5 — AI RISK DETECTION

Create a dedicated AI analytics page.

Title:
“AI Risk Intelligence”

Top controls:

- Analyze selected projects
- Upload dataset
- Run AI Analysis
- Date range
- District filter

Show:
Risk distribution visualization:
Critical / High / Medium / Low

Add anomaly categories:

1. Unusual expenditure
2. Cost overrun
3. Delayed project
4. Duplicate payment
5. Suspicious vendor
6. Duplicate beneficiary
7. Geographic inconsistency
8. Transaction outlier

Create an AI anomaly table:

Project | Anomaly Type | Confidence | Risk Score | Detected On | Action

Example:
MPLAD-2026-00482 | Cost Anomaly | 94% | 82 | 26 Aug 2026 | Investigate

Clicking “Investigate” opens the project analysis page.

PAGE 6 — FRAUD & ANOMALY ALERT CENTER

Create an alert management interface.

Header:
“Fraud & Anomaly Alert Center”

Summary cards:

- Critical: 8
- High: 35
- Medium: 126
- Resolved: 214

Alert cards should contain:

- Alert ID
- Risk level
- Project
- Amount
- Detected anomaly
- AI confidence
- Date
- Status

Example:
“Possible Duplicate Billing”
Project: MPLAD-2026-00482
Amount: ₹18.4 Lakh
AI Confidence: 96%
Status: Pending Verification

Actions:

- View Details
- Assign
- Mark Under Investigation
- Resolve
- Escalate

Include status workflow:
Detected → Under Review → Investigation → Resolved / Escalated

PAGE 7 — GEO MONITORING

Create an interactive India map dashboard.

Title:
“Geo-Spatial Project Monitoring”

Map should display:

- States
- Districts
- Project locations
- Risk markers
- Project clusters

Use marker colors according to risk:
Low / Medium / High / Critical

Right-side panel:
Selected Project
Project ID
Location
Progress
Approved Amount
Utilization
Risk Score
Last Inspection

Add a “Satellite Verification” style section with:

- Project location
- Reported coordinates
- Inspection coordinates
- Geo mismatch indicator

Show:
“Location mismatch detected: 2.7 km”

PAGE 8 — FINANCIAL ANALYTICS

Create a financial intelligence dashboard.

KPIs:

- Total Allocation
- Total Utilization
- Average Project Cost
- Cost Overrun
- Suspicious Transactions

Charts:

- Allocation vs Utilization
- Monthly expenditure
- District expenditure comparison
- Vendor payment distribution
- Cost overrun analysis

Add a transaction anomaly table.

Columns:
Transaction ID
Project ID
Vendor
Amount
Date
Expected Range
Deviation
AI Flag

Example:
Amount: ₹18.4 L
Expected Range: ₹9–12 L
Deviation: +53%
AI Flag: HIGH

PAGE 9 — BENEFICIARY & VENDOR INTELLIGENCE

Create two tabs:
Beneficiaries | Vendors

Vendor page:

- Vendor name
- Registration ID
- Projects handled
- Total payments
- Average project cost
- Risk score
- Number of anomalies

Add “Vendor Network Analysis” visualization showing relationships between:
Vendor → Projects → Agencies → Payments

Highlight suspicious clusters.

Beneficiary section should detect:

- Duplicate beneficiaries
- Duplicate records
- Unusual beneficiary concentration
- Geographic inconsistencies

PAGE 10 — REPORT GENERATION

Create a report builder.

User can select:

- Project
- District
- Constituency
- Date range
- Risk category
- Report type

Report types:

- Project Performance Report
- Financial Utilization Report
- AI Risk Report
- Fraud Investigation Report
- District Risk Report
- Audit Report

Show live report preview.

Buttons:
“Generate Report”
“Download PDF”
“Export Excel”
“Share with Auditor”

PAGE 11 — AUDIT TRAIL

Create a complete immutable-looking audit timeline.

Show:
Timestamp
User
Action
Module
Project
Old Value
New Value
IP/Session placeholder

Example:
26 Aug 2026, 11:42 AM
Admin Officer
Updated Project Status
MPLAD-2026-00482
Under Implementation → Verification Required

Add search and filters.

PAGE 12 — NOTIFICATIONS

Create notification center.

Categories:

- Critical AI Alert
- Project Delay
- Financial Anomaly
- Inspection Required
- Report Generated
- System Notification

Allow:
Mark as read
View alert
Filter by severity

PAGE 13 — ADMIN / SETTINGS

Create settings pages for:

- User management
- Roles & permissions
- AI thresholds
- Alert configuration
- Data source configuration
- API integrations
- Security
- Audit settings

ROLE-BASED EXPERIENCE:

Create role selector/login behavior for:

1. Administrator
2. MP / Authorized Representative
3. Implementing Agency
4. Auditor
5. Monitoring Officer

Different roles should see different dashboard permissions.

INTERACTION REQUIREMENTS:

Make the prototype genuinely clickable.

Implement these flows:

Flow 1:
Login → Dashboard → High Risk Projects → Project Detail → AI Analysis → Assign Auditor

Flow 2:
Dashboard → Fraud Alerts → Select Alert → Investigation → Mark Under Investigation

Flow 3:
Dashboard → Geo Monitoring → Select High Risk Location → Project Detail

Flow 4:
Projects → Filter High Risk → Select Project → Financial Analysis → Generate Report

Flow 5:
Dashboard → AI Risk Detection → Run Analysis → New Alerts → Investigate

Flow 6:
Project Detail → Audit Trail → Generate Report → Report Preview

INTERACTION DETAILS:

- Sidebar navigation must work
- Buttons must navigate to relevant screens
- Filters should visually respond
- Search should have an interactive state
- Dropdowns should open
- Tabs should switch content
- Risk cards should open filtered views
- Project rows should open project detail
- Alert buttons should change alert status
- “Assign Auditor” should open a modal
- “Generate Report” should show report generation state and then report preview
- Notifications should open notification panel
- Profile menu should open
- Include loading states, empty states and success states where appropriate
- Add confirmation modal for critical actions

AI EXPLAINABILITY:

Do not present AI as a black box.

Every AI risk score should show:
Risk Score
Confidence
Detected Factors
Evidence
Historical Comparison
Recommended Action

Add an “AI Decision Explanation” panel.

Example:

AI Finding:
“Potential cost inflation detected.”

Evidence:

- Current project cost is 28% above similar projects
- Vendor has handled 7 similar projects
- 3 projects show similar expenditure patterns
- Physical progress is lower than financial utilization

Recommendation:
“Request financial verification and field inspection.”

IMPORTANT:
The AI should recommend investigation, NOT automatically declare someone guilty of fraud.

DATA VISUALIZATION:

Use realistic charts:

- Line charts
- Bar charts
- Donut charts
- Heatmaps
- Risk matrices
- Geographic map
- Trend indicators
- KPI cards
- Transaction tables
- Timeline components

DESIGN SYSTEM:

Create reusable Figma components:

- Sidebar
- Top navigation
- KPI card
- Risk badge
- Status badge
- Data table
- Filter dropdown
- Search field
- Chart card
- Alert card
- Modal
- Notification item
- Project card
- AI insight card
- Button variants
- Tabs
- Pagination
- Toast notification

Create variants for:
Risk: Low / Medium / High / Critical
Status: Active / Pending / Under Review / Resolved / Escalated
Buttons: Primary / Secondary / Danger / Disabled

PROTOTYPE QUALITY:

The final result should look like a real deployable government monitoring product suitable for a Smart India Hackathon presentation.

Avoid:

- Generic template dashboard
- Excessive gradients
- Random AI robot graphics
- Cryptocurrency-style UI
- Fake futuristic holograms
- Overly colorful interface
- Unnecessary animations

Focus on:
Transparency
Accountability
Explainable AI
Fraud detection
Financial monitoring
Geo-spatial verification
Auditability
Decision support

Add subtle professional micro-interactions and transitions between screens.

Use realistic sample Indian MPLAD data throughout the prototype.

Make the dashboard visually impressive enough for a hackathon jury while keeping it practical and believable.

The attached reference image should be treated as the product requirements/source of truth for the core features, workflow, AI capabilities, architecture and technology direction, but redesign everything as a polished interactive web application rather than copying the poster layout.
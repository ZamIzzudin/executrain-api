/**
 * Seed data dev (executrain_dev ONLY) untuk modul:
 *  - CaseStudy     (CASE_* master data)
 *  - AppDevelopment (APP_TECH_STACK / APP_METHODOLOGY master data)
 *  - ITProduct      (TECH_STACK master data)
 *
 * Idempotent: hanya mengisi jika tabel kosong / kurang dari target.
 */

const prisma = require("../config/prisma");

const BANNER =
  "https://storagewebsitetoj.blob.core.windows.net/image/1787026502253_098c5bb23fbee280.jpg";

async function guard() {
  const db = await prisma.$queryRaw`SELECT current_database() AS db`;
  if (db[0].db !== "executrain_dev") {
    console.error(`BLOCKED: current database is ${db[0].db}, bukan executrain_dev`);
    process.exit(1);
  }
}

const caseStudies = [
  {
    title: "Retail ERP Implementation",
    category: "DIGITAL_TRANSFORMATION",
    description:
      "Full ERP rollout for a national retail chain, unifying inventory, finance, and sales operations across 120+ store locations. The system replaced legacy spreadsheets with a single source of truth, giving leadership real-time visibility into stock levels, margins, and store performance.",
    industries: ["RETAIL", "LOGISTICS"],
    solutions: ["ERP", "DASHBOARD"],
    deployment_type: "ON_CLOUD",
    timeline: 16,
    compliance: "ISO 27001 · Role-based access · Audit trail",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 3, type: "Developer" },
      { quantity: 1, type: "Project Manager" },
      { quantity: 1, type: "Business Analyst" },
    ],
    testimonial: {
      testimoni:
        "Implementasi ERP sangat membantu operasional kami. Semua proses jadi satu pintu, dari stok sampai laporan keuangan, dan manajemen bisa memantau real-time.",
      name: "Budi Santoso",
      company: "PT Retail Maju",
    },
    link: "https://example.com/erp",
  },
  {
    title: "Healthcare Booking Platform",
    category: "CUSTOM_APPLICATION",
    description:
      "Custom booking platform for a hospital group to manage patient appointments, reduce wait times, and send automated reminders. Integrated with the existing SIMRS so schedules stay in sync across departments and clinics.",
    industries: ["HEALTHCARE"],
    solutions: ["CUSTOM_APP", "MOBILE_APP"],
    deployment_type: "ON_CLOUD",
    timeline: 12,
    compliance: "SOC 2 · Data encryption · Consent management",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "UI/UX Designer" },
    ],
    testimonial: {
      testimoni:
        "Booking platform mempermudah pasien dan mengurangi beban admin. No-show rate turun signifikan sejak reminder otomatis aktif.",
      name: "Dr. Sari Wulandari",
      company: "RS Sehat Selalu",
    },
    link: "https://example.com/booking",
  },
  {
    title: "Manufacturing IoT Dashboard",
    category: "DATA_ANALYTICS",
    description:
      "Real-time IoT dashboard for a manufacturing plant to monitor machine health, production KPIs, and energy consumption. Sensor data is streamed into a central analytics platform with alerting for anomaly detection.",
    industries: ["MANUFACTURING"],
    solutions: ["DASHBOARD", "SYSTEM_INTEGRATION"],
    deployment_type: "ON_PREMISE",
    timeline: 20,
    compliance: "ISO 9001 · On-premise data residency",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 4, type: "Developer" },
      { quantity: 1, type: "Data Engineer" },
    ],
    testimonial: {
      testimoni:
        "Dashboard IoT membantu kami memantau mesin secara real-time. Downtime bisa dideteksi lebih awal sebelum berdampak ke produksi.",
      name: "Andi Wijaya",
      company: "PT Fabrik Nusantara",
    },
    link: "https://example.com/iot",
  },
  {
    title: "Banking Mobile App",
    category: "MOBILE_APPLICATION",
    description:
      "Mobile banking application with secure transactions, biometric authentication, and push notifications for a digital bank. Built with a modular architecture to support rapid feature releases and regulatory compliance.",
    industries: ["FINANCE"],
    solutions: ["MOBILE_APP"],
    deployment_type: "ON_CLOUD",
    timeline: 24,
    compliance: "ISO 27001 · Biometric auth · Fraud monitoring",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 5, type: "Developer" },
      { quantity: 2, type: "QA Engineer" },
    ],
    testimonial: {
      testimoni:
        "Aplikasi mobile banking kami kini lebih aman dan mudah digunakan. Fitur biometrik disambut baik oleh nasabah.",
      name: "Rina Kartika",
      company: "Bank Digital Indonesia",
    },
    link: "https://example.com/mobile",
  },
  {
    title: "Government Service Portal",
    category: "SYSTEM_INTEGRATION",
    description:
      "Integrated public service portal connecting multiple government departments, enabling citizens to submit applications and track progress online. Consolidated data exchange layer between agencies with strict access control.",
    industries: ["GOVERNMENT", "EDUCATION"],
    solutions: ["SYSTEM_INTEGRATION", "CUSTOM_APP"],
    deployment_type: "ON_PREMISE",
    timeline: 30,
    compliance: "ISO 27001 · Data residency · Audit trail",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 6, type: "Developer" },
      { quantity: 2, type: "Project Manager" },
    ],
    testimonial: {
      testimoni:
        "Portal layanan publik mempermudah masyarakat mengakses layanan pemerintah tanpa harus datang ke kantor.",
      name: "Dedi Permana",
      company: "Kementerian Dalam Negeri",
    },
    link: "https://example.com/gov",
  },
  {
    title: "E-Commerce Supply Chain",
    category: "DIGITAL_TRANSFORMATION",
    description:
      "Supply chain digitization for an e-commerce company with real-time inventory tracking, automated reordering, and route optimization for last-mile delivery. Cut stock-out incidents by half within the first quarter.",
    industries: ["RETAIL", "LOGISTICS"],
    solutions: ["ERP", "DASHBOARD"],
    deployment_type: "ON_CLOUD",
    timeline: 14,
    compliance: "SOC 2 · Encryption at rest & in transit",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 3, type: "Developer" },
      { quantity: 1, type: "Data Analyst" },
    ],
    testimonial: {
      testimoni:
        "Supply chain kami kini terpantau real-time dari hulu ke hilir. Pengambilan keputusan jadi lebih cepat dan berbasis data.",
      name: "Maya Sari",
      company: "PT Belanja Cepat",
    },
    link: "https://example.com/supply",
  },
  {
    title: "School Management System",
    category: "CUSTOM_APPLICATION",
    description:
      "Complete school management system covering attendance, grades, billing, and parent communication. Parents receive real-time notifications and can monitor academic progress through a dedicated mobile app.",
    industries: ["EDUCATION"],
    solutions: ["CUSTOM_APP", "DASHBOARD"],
    deployment_type: "ON_CLOUD",
    timeline: 10,
    compliance: "ISO 9001 · Data protection for minors",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "UI/UX Designer" },
    ],
    testimonial: {
      testimoni:
        "Orang tua kini bisa memantau nilai dan kehadiran anak secara langsung. Komunikasi sekolah dengan orang tua jauh lebih lancar.",
      name: "Joko Prasetyo",
      company: "SMA Nusantara",
    },
    link: "https://example.com/school",
  },
  {
    title: "Logistics Fleet Tracker",
    category: "SYSTEM_INTEGRATION",
    description:
      "Fleet tracking system integrating GPS devices, dispatch scheduling, and route optimization for a logistics company. Live map view and driver performance analytics reduced fuel costs by 20%.",
    industries: ["LOGISTICS"],
    solutions: ["SYSTEM_INTEGRATION", "DASHBOARD"],
    deployment_type: "ON_CLOUD",
    timeline: 18,
    compliance: "ISO 9001 · Geofencing · Data encryption",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 3, type: "Developer" },
      { quantity: 1, type: "QA Engineer" },
    ],
    testimonial: {
      testimoni:
        "Optimasi rute mengurangi biaya bahan bakar hingga 20% dan pengiriman tepat waktu meningkat drastis.",
      name: "Hendra Gunawan",
      company: "PT Kirim Kilat",
    },
    link: "https://example.com/fleet",
  },
  {
    title: "Retail Loyalty Program",
    category: "CUSTOM_APPLICATION",
    description:
      "Loyalty program application with points, rewards, and personalized offers for retail customers. Integrated with POS and e-commerce so members earn and redeem points seamlessly across channels.",
    industries: ["RETAIL"],
    solutions: ["CUSTOM_APP", "MOBILE_APP"],
    deployment_type: "ON_CLOUD",
    timeline: 8,
    compliance: "SOC 2 · Consent-based personalization",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "UI/UX Designer" },
    ],
    testimonial: {
      testimoni:
        "Program loyalitas meningkatkan retensi pelanggan secara signifikan, terutama lewat penawaran yang personal.",
      name: "Linda Kusuma",
      company: "PT Toko Modern",
    },
    link: "https://example.com/loyalty",
  },
  {
    title: "Healthcare Analytics Platform",
    category: "DATA_ANALYTICS",
    description:
      "Analytics platform for hospitals to track patient outcomes, bed occupancy, and resource allocation. Executive dashboards and predictive models support better planning across departments.",
    industries: ["HEALTHCARE"],
    solutions: ["DASHBOARD", "CUSTOM_APP"],
    deployment_type: "ON_PREMISE",
    timeline: 22,
    compliance: "SOC 2 · Patient data privacy",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 3, type: "Developer" },
      { quantity: 1, type: "Data Scientist" },
    ],
    testimonial: {
      testimoni:
        "Analitik membantu kami mengalokasikan sumber daya dengan lebih baik dan merencanakan kapasitas rumah sakit.",
      name: "Dr. Bambang Hermawan",
      company: "RS Pusat Harapan",
    },
    link: "https://example.com/analytics",
  },
  {
    title: "Manufacturing ERP Upgrade",
    category: "DIGITAL_TRANSFORMATION",
    description:
      "ERP upgrade and zero-downtime data migration for a manufacturing company expanding to new regions. Standardized production planning, procurement, and financial reporting across all plants.",
    industries: ["MANUFACTURING"],
    solutions: ["ERP", "SYSTEM_INTEGRATION"],
    deployment_type: "ON_PREMISE",
    timeline: 26,
    compliance: "ISO 9001 · Migrasi terjadwal tanpa downtime",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 4, type: "Developer" },
      { quantity: 1, type: "Project Manager" },
    ],
    testimonial: {
      testimoni:
        "Migrasi data berjalan mulus tanpa mengganggu operasional pabrik. Laporan antar-cabang kini konsisten.",
      name: "Agus Salim",
      company: "PT Industri Maju",
    },
    link: "https://example.com/erp-upgrade",
  },
  {
    title: "Finance Fraud Detection",
    category: "DATA_ANALYTICS",
    description:
      "Fraud detection system using machine learning for a financial services company. Real-time scoring of transactions with automated alerting reduced fraud losses by 40%.",
    industries: ["FINANCE"],
    solutions: ["DASHBOARD", "SYSTEM_INTEGRATION"],
    deployment_type: "ON_CLOUD",
    timeline: 16,
    compliance: "ISO 27001 · Model governance · Audit trail",
    methodology: "AGILE_DEVELOPMENT",
    team_size: [
      { quantity: 3, type: "Developer" },
      { quantity: 2, type: "Data Scientist" },
    ],
    testimonial: {
      testimoni:
        "Sistem deteksi fraud mengurangi kerugian hingga 40% dan tim risiko kini punya visibilitas penuh.",
      name: "Sinta Dewi",
      company: "PT Finansial Cerdas",
    },
    link: "https://example.com/fraud",
  },
];

const appDevelopments = [
  {
    title: "Internal HR Self-Service App",
    tech_stack: ["POWER_APPS", "SHAREPOINT"],
    description:
      "Self-service HR app for leave requests, payslip access, and employee data updates. Built on Power Platform with SharePoint as the data source, replacing manual forms and email workflows.",
    challenge:
      "HR received hundreds of manual requests per month, most of them repetitive forms that had to be re-keyed into the payroll system.",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "Business Analyst" },
    ],
    timeline: 6,
    methodology: "AGILE_DEVELOPMENT",
    compliance: "Role-based access · Audit trail · Data residency",
    highlights: [
      {
        image: BANNER,
        title: "One-Click Leave Request",
        description:
          "Employees submit and track leave directly from their phone, with automatic approval routing to managers.",
      },
      {
        image: BANNER,
        title: "Live Payslip Access",
        description:
          "Payslips are available instantly in the app, cutting HR email load by more than 60%.",
      },
      {
        image: BANNER,
        title: "Integrated with SharePoint",
        description:
          "All records are stored and governed in SharePoint, keeping data policy-compliant and searchable.",
      },
    ],
  },
  {
    title: "Procurement Approval Automation",
    tech_stack: ["POWER_AUTOMATE", "POWER_APPS"],
    description:
      "Automated procurement workflow covering purchase requests, multi-level approvals, and vendor onboarding. Approvals route via Power Automate with full status visibility.",
    challenge:
      "Procurement approvals were stuck in email chains that took an average of 5 days to complete, delaying project timelines.",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "Process Analyst" },
    ],
    timeline: 8,
    methodology: "AGILE_DEVELOPMENT",
    compliance: "Approval audit trail · Segregation of duties",
    highlights: [
      {
        image: BANNER,
        title: "Multi-Level Approval Flow",
        description:
          "Configurable approval chains adapt to amount thresholds and department policies automatically.",
      },
      {
        image: BANNER,
        title: "Vendor Onboarding",
        description:
          "Vendor registration and document verification digitized, with status tracking for every submission.",
      },
      {
        image: BANNER,
        title: "Real-Time Status Board",
        description:
          "Every request is visible on a live dashboard, so bottlenecks surface before they cause delays.",
      },
    ],
  },
  {
    title: "Executive Sales Dashboard",
    tech_stack: ["POWER_BI", "SHAREPOINT"],
    description:
      "Executive dashboard consolidating sales, inventory, and finance data into a single Power BI view. Refreshed automatically from source systems on a daily schedule.",
    challenge:
      "Leadership relied on weekly Excel reports assembled manually from five different departments, always at least a week out of date.",
    team_size: [
      { quantity: 1, type: "Data Analyst" },
      { quantity: 1, type: "Developer" },
    ],
    timeline: 5,
    methodology: "AGILE_DEVELOPMENT",
    compliance: "Row-level security · Data encryption",
    highlights: [
      {
        image: BANNER,
        title: "Unified KPI View",
        description:
          "Sales, stock, and cash-flow KPIs in one screen, drillable down to branch and product level.",
      },
      {
        image: BANNER,
        title: "Automated Refresh",
        description:
          "Data pipelines refresh nightly, so the board always reviews the latest numbers.",
      },
      {
        image: BANNER,
        title: "Secure by Design",
        description:
          "Row-level security ensures each manager only sees the data for their own region.",
      },
    ],
  },
  {
    title: "Field Service Inspection App",
    tech_stack: ["POWER_APPS", "POWER_AUTOMATE"],
    description:
      "Mobile inspection app for field technicians to complete checklists, capture photos, and submit reports offline-first. Results sync automatically when back online.",
    challenge:
      "Paper inspection forms were frequently lost or illegible, and report digitization took technicians up to two extra hours daily.",
    team_size: [
      { quantity: 3, type: "Developer" },
      { quantity: 1, type: "Field Operations Lead" },
    ],
    timeline: 9,
    methodology: "AGILE_DEVELOPMENT",
    compliance: "Photo evidence trail · Tamper-proof timestamps",
    highlights: [
      {
        image: BANNER,
        title: "Offline-First Checklist",
        description:
          "Inspections run fully offline and sync automatically, so coverage never depends on signal.",
      },
      {
        image: BANNER,
        title: "Photo Evidence Capture",
        description:
          "Technicians attach photos to every finding, creating a reliable evidence trail for clients.",
      },
      {
        image: BANNER,
        title: "Auto-Generated Report",
        description:
          "Inspection reports are generated instantly and emailed to clients on submission.",
      },
    ],
  },
  {
    title: "Asset Tracking Solution",
    tech_stack: ["POWER_BI", "POWER_APPS"],
    description:
      "Asset tracking application with QR-code tagging, maintenance scheduling, and depreciation tracking. Each asset has a complete lifecycle history accessible in the app.",
    challenge:
      "The company could not locate 15% of its IT assets during annual audit due to fragmented Excel records.",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "Asset Manager" },
    ],
    timeline: 7,
    methodology: "AGILE_DEVELOPMENT",
    compliance: "Complete audit trail · Access control",
    highlights: [
      {
        image: BANNER,
        title: "QR-Code Scanning",
        description:
          "Locate and update any asset in seconds by scanning its QR label from the mobile app.",
      },
      {
        image: BANNER,
        title: "Maintenance Reminders",
        description:
          "Scheduled maintenance is tracked automatically, preventing costly equipment failures.",
      },
      {
        image: BANNER,
        title: "Depreciation Dashboard",
        description:
          "Finance sees asset value and depreciation live, replacing the annual spreadsheet exercise.",
      },
    ],
  },
  {
    title: "Centralized Document Management",
    tech_stack: ["SHAREPOINT", "POWER_AUTOMATE"],
    description:
      "Centralized document management system migrating file shares into SharePoint with automated retention, versioning, and approval workflows.",
    challenge:
      "Documents were scattered across network drives and personal computers, making version control and compliance review nearly impossible.",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "Content Analyst" },
    ],
    timeline: 10,
    methodology: "AGILE_DEVELOPMENT",
    compliance: "Retention policy · Version history · Access control",
    highlights: [
      {
        image: BANNER,
        title: "Governed Migration",
        description:
          "150k+ documents migrated with metadata preserved and retention policies applied.",
      },
      {
        image: BANNER,
        title: "Automated Approval Flows",
        description:
          "Document review and sign-off flow through Power Automate with full audit trail.",
      },
      {
        image: BANNER,
        title: "Advanced Search",
        description:
          "Users find any document in seconds with full-text and metadata search.",
      },
    ],
  },
  {
    title: "Customer Complaint Tracker",
    tech_stack: ["POWER_APPS", "POWER_BI"],
    description:
      "Customer complaint management app with SLA tracking, escalation rules, and weekly quality dashboards for the support team.",
    challenge:
      "Complaints were logged in multiple channels with no SLA enforcement, causing inconsistent response times and lost cases.",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "Customer Care Lead" },
    ],
    timeline: 6,
    methodology: "AGILE_DEVELOPMENT",
    compliance: "SLA enforcement · Full audit trail",
    highlights: [
      {
        image: BANNER,
        title: "SLA Countdown",
        description:
          "Every ticket shows a live SLA countdown, with automatic escalation when time runs low.",
      },
      {
        image: BANNER,
        title: "Unified Intake",
        description:
          "Complaints from email, phone, and chat land in one queue with deduplication logic.",
      },
      {
        image: BANNER,
        title: "Quality Dashboard",
        description:
          "Managers track response quality and resolution trends with Power BI visuals.",
      },
    ],
  },
  {
    title: "Onboarding Buddy Portal",
    tech_stack: ["SHAREPOINT", "POWER_APPS"],
    description:
      "Digital onboarding portal for new employees with checklists, e-signature for policy acknowledgment, and a 30-60-90 day progress tracker.",
    challenge:
      "New hires spent their first week chasing forms and passwords instead of learning their role, with no structured onboarding path.",
    team_size: [
      { quantity: 2, type: "Developer" },
      { quantity: 1, type: "HR Lead" },
    ],
    timeline: 5,
    methodology: "AGILE_DEVELOPMENT",
    compliance: "E-signature consent · Policy acknowledgment records",
    highlights: [
      {
        image: BANNER,
        title: "Structured Checklist",
        description:
          "Every onboarding step is tracked, from equipment provisioning to first-day training.",
      },
      {
        image: BANNER,
        title: "Digital Policy Sign-Off",
        description:
          "Policies are acknowledged electronically, with records stored permanently in SharePoint.",
      },
      {
        image: BANNER,
        title: "30-60-90 Tracker",
        description:
          "Managers and HR follow the employee's progress through the critical first three months.",
      },
    ],
  },
];

const itProducts = [
  {
    title: "Letter Correspondence Application",
    description:
      "A mail or correspondence management system used to record, manage, and monitor the flow of incoming or outgoing mail within an organization. Users can assign a person in charge and monitor the mail status in real-time.",
    tech_stack: ["POWER_APPS", "POWER_BI", "POWER_AUTOMATE", "SHAREPOINT"],
    problem:
      "Organizations struggle to efficiently track correspondence, assign accountability, and monitor mail status without a centralized real-time system.",
    feature: [
      "Monitor all incoming and outgoing mail in real-time.",
      "Easily designate the person in charge for every document.",
      "Keep all mail records organized and safely documented in one place.",
    ],
    compliance:
      "Secures sensitive correspondence and ensures accountability through strict role-based access controls and detailed document audit trails.",
    highlight: [
      {
        image: BANNER,
        title: "Dedicated App Management",
        description:
          "Centralized tracking to easily organize all income and outgoing letter correspondence.",
      },
      {
        image: BANNER,
        title: "Multilayer Letter Approval",
        description:
          "Multi-step authorization workflows for secure document routing.",
      },
      {
        image: BANNER,
        title: "Power BI Dashboard",
        description:
          "Interactive visual analytics for real-time management oversight and reporting.",
      },
    ],
    link: "https://example.com/letter",
  },
  {
    title: "Attendance & Leave Management App",
    description:
      "A digital attendance and leave management application that captures employee check-in, overtime, and leave requests with automated approval workflows and a live dashboard for HR.",
    tech_stack: ["POWER_APPS", "POWER_AUTOMATE"],
    problem:
      "Manual attendance tracking through spreadsheets is prone to errors, late consolidation, and leaves little visibility for HR to manage leave balances accurately.",
    feature: [
      "Clock in/out with GPS and selfie verification.",
      "Automated leave approval flow with balance tracking.",
      "Real-time attendance dashboard for HR.",
    ],
    compliance:
      "Employee data is protected with role-based access and complete modification audit trails.",
    highlight: [
      {
        image: BANNER,
        title: "GPS Attendance",
        description:
          "Check-in is verified with location and photo, eliminating proxy attendance.",
      },
      {
        image: BANNER,
        title: "Leave Balance Engine",
        description:
          "Leave balances are computed automatically against policy, including carry-over rules.",
      },
      {
        image: BANNER,
        title: "HR Live Dashboard",
        description:
          "HR sees today's attendance, overtime, and pending requests in real time.",
      },
    ],
    link: "https://example.com/attendance",
  },
  {
    title: "Company Budget Planning Tool",
    description:
      "A collaborative budgeting application that lets department heads build, submit, and revise annual budgets with consolidated views for finance leadership.",
    tech_stack: ["POWER_APPS", "POWER_BI", "SHAREPOINT"],
    problem:
      "Budget cycles relied on emailed Excel templates, making consolidation slow, error-prone, and impossible to compare across departments.",
    feature: [
      "Template-driven budget entry per department.",
      "Multi-level approval and revision history.",
      "Consolidated budget vs actual dashboard.",
    ],
    compliance:
      "Financial data is encrypted and access is restricted by role with full version history.",
    highlight: [
      {
        image: BANNER,
        title: "Guided Budget Entry",
        description:
          "Department heads fill structured templates with validation, reducing submission errors.",
      },
      {
        image: BANNER,
        title: "Approval & Revision Flow",
        description:
          "Budgets move through approvals with every revision preserved in history.",
      },
      {
        image: BANNER,
        title: "Budget vs Actual",
        description:
          "Finance leadership compares plan to actuals live during the fiscal year.",
      },
    ],
    link: "https://example.com/budget",
  },
  {
    title: "Vendor & Contract Management",
    description:
      "A vendor and contract management application that centralizes vendor profiles, contract renewals, and compliance documents with automated renewal reminders.",
    tech_stack: ["SHAREPOINT", "POWER_AUTOMATE", "POWER_BI"],
    problem:
      "Contract renewals were missed because agreements lived in inboxes and local drives, exposing the company to lapses in coverage and pricing.",
    feature: [
      "Centralized vendor profile and contract repository.",
      "Automated renewal and expiry reminders.",
      "Contract value and risk dashboard.",
    ],
    compliance:
      "Contract documents are stored with retention policies and access restricted by procurement role.",
    highlight: [
      {
        image: BANNER,
        title: "Renewal Watchlist",
        description:
          "Upcoming renewals surface automatically with 90/60/30-day alerts to procurement.",
      },
      {
        image: BANNER,
        title: "Unified Repository",
        description:
          "All contracts and vendor documents live in one governed, searchable location.",
      },
      {
        image: BANNER,
        title: "Spend Overview",
        description:
          "Leadership sees contract value and risk concentration across vendors at a glance.",
      },
    ],
    link: "https://example.com/vendor",
  },
  {
    title: "Helpdesk Ticketing System",
    description:
      "A lightweight helpdesk ticketing application for internal IT support with SLA tracking, knowledge base integration, and satisfaction surveys.",
    tech_stack: ["POWER_APPS", "POWER_AUTOMATE", "POWER_BI"],
    problem:
      "Support requests arrived via chat and email with no queue or SLA, leading to slow resolutions and no measurable service quality.",
    feature: [
      "Ticket intake with priority and category routing.",
      "SLA tracking with automatic escalation.",
      "Resolution trend and satisfaction dashboard.",
    ],
    compliance:
      "Ticket data is access-controlled and retained according to internal security policy.",
    highlight: [
      {
        image: BANNER,
        title: "Smart Ticket Routing",
        description:
          "Tickets route to the right team automatically based on category and priority.",
      },
      {
        image: BANNER,
        title: "SLA Escalation",
        description:
          "At-risk tickets escalate to supervisors before deadlines are missed.",
      },
      {
        image: BANNER,
        title: "Service Health View",
        description:
          "IT leadership monitors resolution time, backlog, and CSAT trends.",
      },
    ],
    link: "https://example.com/helpdesk",
  },
  {
    title: "Inventory Stock Monitoring",
    description:
      "An inventory monitoring application with stock level alerts, barcode scanning, and multi-warehouse views for operations teams.",
    tech_stack: ["POWER_APPS", "POWER_AUTOMATE", "POWER_BI"],
    problem:
      "Stock levels were reconciled manually each week, causing stock-outs and over-ordering that were invisible until it was too late.",
    feature: [
      "Barcode-based stock check and adjustment.",
      "Automatic low-stock and reorder alerts.",
      "Multi-warehouse stock dashboard.",
    ],
    compliance:
      "Inventory records include full change history with role-based write access.",
    highlight: [
      {
        image: BANNER,
        title: "Barcode Stock Check",
        description:
          "Warehouse staff verify stock in seconds with barcode scanning from the app.",
      },
      {
        image: BANNER,
        title: "Low-Stock Alerts",
        description:
          "Automated alerts trigger reorder workflows before items run out.",
      },
      {
        image: BANNER,
        title: "Multi-Warehouse View",
        description:
          "Operations sees stock levels and transfers across all warehouses at once.",
      },
    ],
    link: "https://example.com/inventory",
  },
];

async function main() {
  await guard();

  const csCount = await prisma.caseStudy.count();
  if (csCount < caseStudies.length) {
    await prisma.caseStudy.createMany({ data: caseStudies });
    console.log(`CaseStudy: seeded ${caseStudies.length} (sebelumnya ${csCount})`);
  } else {
    console.log(`CaseStudy: sudah ${csCount}, skip`);
  }

  const adCount = await prisma.appDevelopment.count();
  if (adCount < appDevelopments.length) {
    await prisma.appDevelopment.createMany({ data: appDevelopments });
    console.log(`AppDevelopment: seeded ${appDevelopments.length} (sebelumnya ${adCount})`);
  } else {
    console.log(`AppDevelopment: sudah ${adCount}, skip`);
  }

  const itCount = await prisma.iTProduct.count();
  const itToAdd = itProducts.filter(
    (p) => p.title !== "Letter Correspondence Application",
  );
  if (itCount < itToAdd.length + 1) {
    const existing = await prisma.iTProduct.findMany({ select: { title: true } });
    const existingTitles = new Set(existing.map((e) => e.title));
    const missing = itToAdd.filter((p) => !existingTitles.has(p.title));
    if (missing.length > 0) {
      await prisma.iTProduct.createMany({ data: missing });
      console.log(`ITProduct: seeded ${missing.length} (total sekarang ${itCount + missing.length})`);
    } else {
      console.log(`ITProduct: semua title sudah ada, skip`);
    }
  } else {
    console.log(`ITProduct: sudah ${itCount}, skip`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

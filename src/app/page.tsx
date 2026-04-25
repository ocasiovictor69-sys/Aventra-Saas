import Link from "next/link";

export default function AVENTRALanding() {
  const features = [
    {
      title: "Portfolio Health",
      description: "Real-time visibility into occupancy rates, rent collection, and unit profitability across your entire portfolio.",
      stat: "360°",
    },
    {
      title: "Compliance Automation",
      description: "Automated tracking of lease expirations, safety inspections, and legal documents with deadline alerts.",
      stat: "Auto",
    },
    {
      title: "AI Maintenance Triage",
      description: "AI-categorizes requests by urgency, routes to vendors, and tracks completion without manual intervention.",
      stat: "AI",
    },
    {
      title: "Tenant Lifecycle",
      description: "Streamlined onboarding, renewals, and offboarding with automated workflows and documentation.",
      stat: "Flow",
    },
  ];

  const kpis = [
    { label: "Occupancy Rate", value: "94%", trend: "+2.3%" },
    { label: "Rent Collection", value: "98%", trend: "+1.5%" },
    { label: "Maintenance Response", value: "4hrs", trend: "-60%" },
    { label: "Compliance Score", value: "99%", trend: "+5%" },
  ];

  const maintenanceCategories = [
    { category: "Emergency", color: "bg-red-500", examples: "Water leaks, HVAC failure, electrical" },
    { category: "Urgent", color: "bg-orange-500", examples: "Appliance repair, plumbing issues" },
    { category: "Standard", color: "bg-yellow-500", examples: "Cosmetic repairs, routine maintenance" },
    { category: "Low Priority", color: "bg-green-500", examples: "Non-essential upgrades, requests" },
  ];

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <p className="text-sm font-bold text-brand-purple uppercase tracking-[0.3em] mb-4">
          AVENTRA Management Machine
        </p>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 text-black">
          The Portfolio{" "}
          <span className="text-brand-purple">Protector</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12">
          AVENTRA automates real estate operations, compliance, and maintenance 
          without linear headcount growth. Scale your portfolio, not your team.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/signup" 
            className="px-8 py-4 rounded-full bg-brand-purple text-white font-semibold transition-all hover:scale-105 shadow-lg"
          >
            Start Free Trial
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-4 rounded-full border border-slate-200 hover:bg-slate-50 transition-all text-black font-semibold"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="w-full bg-slate-50 py-24 border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Portfolio Health at a Glance
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real-time metrics across your entire portfolio, updated continuously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="glass-card text-center">
                <div className="text-4xl font-bold text-brand-purple mb-1">{kpi.value}</div>
                <div className="text-sm text-slate-600 mb-2">{kpi.label}</div>
                <div className={`text-xs font-semibold ${kpi.trend.startsWith('+') ? 'text-green-600' : 'text-green-600'}`}>
                  {kpi.trend} vs last month
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            Automate Without Adding Headcount
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            AVENTRA handles the 80% of repetitive tasks, so your team focuses on the 20% that matters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-brand-purple/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-purple">{feature.stat}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-black">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Maintenance Triage */}
      <section className="w-full bg-slate-50 py-24 border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              AI-Powered Maintenance Triage
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              AVENTRA automatically categorizes requests by urgency, routes to the right vendors, 
              and tracks completion without manual intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {maintenanceCategories.map((cat) => (
              <div key={cat.category} className="glass-card">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                  <h3 className="text-lg font-bold text-black">{cat.category}</h3>
                </div>
                <p className="text-sm text-slate-600">{cat.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Timeline */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">
              Never Miss a Deadline
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              AVENTRA tracks every compliance requirement across your portfolio: 
              lease expirations, safety inspections, insurance renewals, and legal filings.
            </p>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-purple" />
                Automated deadline alerts 30, 14, and 7 days out
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-purple" />
                Document repository with version control
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-purple" />
                Compliance score per property and portfolio-wide
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-purple" />
                One-click report generation for audits
              </li>
            </ul>
          </div>
          <div className="glass-card p-8">
            <h3 className="text-xl font-semibold mb-4 text-black">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {[
                { property: "123 Main St, Apt 4B", task: "Lease Expiration", days: 5 },
                { property: "456 Oak Dr, Unit 2", task: "Safety Inspection", days: 12 },
                { property: "789 Pine Ave, Apt 1", task: "Insurance Renewal", days: 28 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-semibold text-black">{item.property}</div>
                    <div className="text-sm text-slate-500">{item.task}</div>
                  </div>
                  <div className={`text-sm font-semibold ${item.days <= 7 ? 'text-red-600' : 'text-brand-purple'}`}>
                    {item.days} days
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full bg-slate-50 py-24 border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-4xl mx-auto">
            <div>
              <div className="text-5xl font-bold mb-2 text-black">50%</div>
              <div className="text-slate-500 uppercase tracking-widest text-sm font-semibold">Less Admin Time</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2 text-black">0</div>
              <div className="text-slate-500 uppercase tracking-widest text-sm font-semibold">Missed Deadlines</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2 text-black">24/7</div>
              <div className="text-slate-500 uppercase tracking-widest text-sm font-semibold">Portfolio Visibility</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-white py-24 border-t border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
            Scale Your Portfolio, Not Your Team
          </h2>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            AVENTRA automates the repetitive work of property management, 
            so you can grow without adding headcount.
          </p>
          <Link 
            href="/signup" 
            className="px-8 py-4 rounded-full bg-brand-purple text-white font-semibold transition-all hover:scale-105 shadow-lg inline-block"
          >
            Start Free Trial
          </Link>
          <p className="text-sm text-slate-500 mt-6">
            14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold text-black">
            TOMORROW<span className="text-brand-purple">NOW</span> AI
          </span>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="https://tomorrownowai.com" className="hover:text-black transition-colors">Website</Link>
            <Link href="/login" className="hover:text-black transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-black transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

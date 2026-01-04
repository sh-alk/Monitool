/**
 * About Page Component
 * Explains the Monitools system, architecture, and features
 */

export default function About() {
  return (
    <div className="layout-container max-w-[1200px] mx-auto p-6 md:p-10 flex flex-col gap-12">
      {/* Hero Section */}
      <header className="text-center py-8">
        <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-6">
          <span className="material-symbols-outlined text-4xl text-black">precision_manufacturing</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
          Monitool
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          A comprehensive IoT-enabled toolbox monitoring system that combines NFC authentication,
          sensor arrays, and real-time dashboards to eliminate tool loss and ensure accountability.
        </p>
      </header>

      {/* The Problem & Solution */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-3xl text-red-600">report_problem</span>
            <h2 className="text-2xl font-bold text-slate-900">The Problem</h2>
          </div>
          <ul className="space-y-3 text-slate-700">
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5">close</span>
              <span>Tools worth thousands of dollars go missing every year</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5">close</span>
              <span>No accountability for who took which tools</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5">close</span>
              <span>Manual inventory checks are time-consuming and error-prone</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5">close</span>
              <span>Delayed discovery of missing equipment</span>
            </li>
          </ul>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-3xl text-green-600">verified</span>
            <h2 className="text-2xl font-bold text-slate-900">Our Solution</h2>
          </div>
          <ul className="space-y-3 text-slate-700">
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
              <span>Automated tool tracking with sensor arrays</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
              <span>NFC card authentication for complete audit trail</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
              <span>Real-time alerts when items go missing</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
              <span>Before/after photos for visual verification</span>
            </li>
          </ul>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 md:p-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">How It Works</h2>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-center size-12 rounded-full bg-blue-100 text-blue-600 font-bold text-lg mb-4">
                1
              </div>
              <div className="flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-slate-700">contactless</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">NFC Scan</h3>
              <p className="text-sm text-slate-600">
                Technician scans their NFC card at the toolbox to identify themselves
              </p>
            </div>
            {/* Connector Arrow */}
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <span className="material-symbols-outlined text-4xl">arrow_forward</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-center size-12 rounded-full bg-purple-100 text-purple-600 font-bold text-lg mb-4">
                2
              </div>
              <div className="flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-slate-700">developer_board</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Authentication</h3>
              <p className="text-sm text-slate-600">
                Raspberry Pi validates credentials via secure API and unlocks toolbox
              </p>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <span className="material-symbols-outlined text-4xl">arrow_forward</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-center size-12 rounded-full bg-orange-100 text-orange-600 font-bold text-lg mb-4">
                3
              </div>
              <div className="flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-slate-700">sensors</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Sensor Check</h3>
              <p className="text-sm text-slate-600">
                Arduino sensors detect which tools are present/missing in real-time
              </p>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <span className="material-symbols-outlined text-4xl">arrow_forward</span>
            </div>
          </div>

          {/* Step 4 */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-center size-12 rounded-full bg-green-100 text-green-600 font-bold text-lg mb-4">
                4
              </div>
              <div className="flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-slate-700">cloud_sync</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Cloud Sync</h3>
              <p className="text-sm text-slate-600">
                Access log syncs to cloud database for real-time dashboard updates
              </p>
            </div>
          </div>
        </div>

        {/* System Flow Diagram */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4 text-center">System Architecture</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="size-20 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-blue-600">badge</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Technician<br/>(NFC Card)</span>
            </div>

            <span className="material-symbols-outlined text-slate-300 rotate-90 md:rotate-0">arrow_forward</span>

            <div className="flex flex-col items-center">
              <div className="size-20 rounded-xl bg-purple-50 border-2 border-purple-200 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-purple-600">developer_board</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Raspberry Pi<br/>(Edge Device)</span>
            </div>

            <span className="material-symbols-outlined text-slate-300 rotate-90 md:rotate-0">arrow_forward</span>

            <div className="flex flex-col items-center">
              <div className="size-20 rounded-xl bg-orange-50 border-2 border-orange-200 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-orange-600">memory</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Arduino/ESP32<br/>(Sensors)</span>
            </div>

            <span className="material-symbols-outlined text-slate-300 rotate-90 md:rotate-0">arrow_forward</span>

            <div className="flex flex-col items-center">
              <div className="size-20 rounded-xl bg-green-50 border-2 border-green-200 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-green-600">cloud</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Cloud API<br/>(This Dashboard)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Integration */}
      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Hardware Integration</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Raspberry Pi */}
          <div className="bg-surface-light border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-purple-600">developer_board</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Raspberry Pi</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Acts as the edge computing brain at each toolbox location, handling:
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>NFC card reading & validation</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>Camera capture (before/after photos)</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>Communication with Arduino sensors</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>API communication to cloud</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>Offline mode with sync queue</span>
              </li>
            </ul>
          </div>

          {/* Arduino/ESP32 */}
          <div className="bg-surface-light border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-orange-600">memory</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Arduino/ESP32</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Microcontroller that manages the sensor array to detect tool presence:
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">sensors</span>
                <span>Weight sensors (load cells)</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">sensors</span>
                <span>Proximity sensors (ultrasonic/IR)</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">sensors</span>
                <span>Light break sensors</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">sensors</span>
                <span>Hall effect sensors (magnetic tools)</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">sensors</span>
                <span>Serial/I2C communication with Pi</span>
              </li>
            </ul>
          </div>

          {/* NFC Readers */}
          <div className="bg-surface-light border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-blue-600">contactless</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">NFC Readers</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Contactless identification system for secure technician authentication:
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>RC522 or PN532 modules</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>Read unique NFC card IDs</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>Fast, contactless scanning</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>Works with employee badges</span>
              </li>
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-primary text-base">check</span>
                <span>Complete access audit trail</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="inventory"
            title="Real-Time Inventory"
            description="Know exactly which tools are in each toolbox at any moment with automated sensor detection."
          />
          <FeatureCard
            icon="history"
            title="Complete Audit Trail"
            description="Every toolbox access is logged with technician ID, timestamp, and inventory status."
          />
          <FeatureCard
            icon="photo_camera"
            title="Visual Verification"
            description="Before/after photos provide visual proof of toolbox condition at access time."
          />
          <FeatureCard
            icon="notifications_active"
            title="Missing Item Alerts"
            description="Instant notifications when tools go missing so you can act immediately."
          />
          <FeatureCard
            icon="cloud_done"
            title="Offline Mode"
            description="Raspberry Pi operates autonomously when offline, syncing when connection is restored."
          />
          <FeatureCard
            icon="analytics"
            title="Usage Analytics"
            description="Track which tools are used most, by whom, and identify usage patterns."
          />
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 md:p-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Who Benefits?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <UseCaseCard
            title="Construction Companies"
            icon="construction"
            problem="Tools worth $50,000+ distributed across 20 job sites"
            solution="One toolbox per site with Pi + NFC + camera"
            result="90% reduction in tool loss, complete accountability"
          />
          <UseCaseCard
            title="Manufacturing Facilities"
            icon="factory"
            problem="Shared tool cribs, unclear who has what tools"
            solution="Central toolbox with weight sensors per slot"
            result="Real-time inventory, faster tool retrieval"
          />
          <UseCaseCard
            title="Maintenance Teams"
            icon="engineering"
            problem="Mobile technicians, tools left at various locations"
            solution="Portable toolboxes with ESP32 + GPS + NFC"
            result="Track both technician and toolbox location"
          />
          <UseCaseCard
            title="Educational Workshops"
            icon="school"
            problem="Students borrow tools, forget to return them"
            solution="Student ID cards (NFC) track borrowing"
            result="Automatic return reminders, usage statistics"
          />
        </div>
      </section>

      {/* Technology Stack */}
      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Technology Stack</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-surface-light border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">cloud</span>
              Backend (Cloud)
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• FastAPI (Python)</li>
              <li>• SQLAlchemy 2.0 ORM</li>
              <li>• SQLite Database</li>
              <li>• JWT Authentication</li>
              <li>• RESTful API Design</li>
            </ul>
          </div>

          <div className="bg-surface-light border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">web</span>
              Frontend (Dashboard)
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• React 19 + TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• React Query (data fetching)</li>
              <li>• Zustand (state management)</li>
              <li>• Vite + Nginx</li>
            </ul>
          </div>

          <div className="bg-surface-light border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">developer_board</span>
              Hardware (Edge)
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Raspberry Pi 4/5</li>
              <li>• Arduino Uno/Nano</li>
              <li>• ESP32 (WiFi alternative)</li>
              <li>• RC522/PN532 NFC readers</li>
              <li>• Various sensor types</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cost Breakdown */}
      <section className="bg-slate-50 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Hardware Cost</h2>
        <p className="text-center text-slate-600 mb-8">Approximate cost per toolbox deployment</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Basic Setup
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">$113</div>
            <div className="text-xs text-slate-600 mb-4">- $160</div>
            <ul className="text-left text-sm text-slate-600 space-y-1">
              <li>• Raspberry Pi + accessories</li>
              <li>• RC522 NFC reader</li>
              <li>• Manual inventory count</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-primary shadow-lg relative text-center">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              With Sensors
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">$153</div>
            <div className="text-xs text-slate-600 mb-4">- $275</div>
            <ul className="text-left text-sm text-slate-600 space-y-1">
              <li>• Everything in Basic</li>
              <li>• Arduino + sensors</li>
              <li>• Automated tool detection</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              ESP32 Only
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">$38</div>
            <div className="text-xs text-slate-600 mb-4">- $80</div>
            <ul className="text-left text-sm text-slate-600 space-y-1">
              <li>• ESP32 + NFC reader</li>
              <li>• WiFi connectivity</li>
              <li>• Lower cost option</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-10 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Eliminate Tool Loss?</h2>
        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
          Monitool combines affordable hardware with powerful cloud software to give you complete
          visibility and control over your tool inventory.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="px-6 py-3 bg-primary text-black rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
            <span className="material-symbols-outlined">description</span>
            View Documentation
          </button>
          <button className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-full font-semibold hover:bg-white/20 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined">code</span>
            View on GitHub
          </button>
        </div>
      </section>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-surface-light border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow group">
      <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <span className="material-symbols-outlined text-2xl text-slate-700">{icon}</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}

// Use Case Card Component
function UseCaseCard({
  title,
  icon,
  problem,
  solution,
  result,
}: {
  title: string;
  icon: string;
  problem: string;
  solution: string;
  result: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-xl text-slate-700">{icon}</span>
        </div>
        <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Problem</div>
          <p className="text-slate-600">{problem}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Solution</div>
          <p className="text-slate-600">{solution}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Result</div>
          <p className="text-slate-600">{result}</p>
        </div>
      </div>
    </div>
  );
}

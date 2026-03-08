import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for The Prediction Paddock – how we collect and use your data",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">
          Last updated: March 2025
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Introduction</h2>
            <p>
              <strong className="text-white">The Prediction Paddock</strong> (“we”, “our”, or “the Service”) respects your privacy. This Privacy Policy explains what data we collect, how we use it, and your rights when you use our website and services (predictions, pools, leaderboards, profiles, and related features).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Who is responsible</h2>
            <p>
              The Service is operated by the developer (KasperOfzeau). For privacy-related questions you can contact via the project repository linked in the footer or on the Terms of Service page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Data we collect</h2>
            <p>We collect data necessary to provide and improve the Service:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong className="text-white">Account data:</strong> When you register, we collect email address, password (stored in hashed form), and optionally full name and username. Username and profile details (e.g. avatar, display name) are used for your public profile and leaderboards.
              </li>
              <li>
                <strong className="text-white">Predictions and pool data:</strong> Your race and season predictions, pool memberships, and pool-related actions (e.g. invites, role) are stored so we can run the game, calculate scores, and show leaderboards.
              </li>
              <li>
                <strong className="text-white">Notifications:</strong> We store in-app notifications (e.g. pool invites, results) and whether you have read them.
              </li>
              <li>
                <strong className="text-white">Usage and technical data:</strong> We may receive technical information such as IP address, browser type, and device information through our hosting and authentication provider (e.g. Supabase) for security and operation. We do not track you across other websites for advertising.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. How we use your data</h2>
            <p>We use the data we collect to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Create and manage your account and authenticate you.</li>
              <li>Provide predictions, pools, leaderboards, and notifications.</li>
              <li>Calculate and display scores and rankings.</li>
              <li>Display your profile (username, avatar, stats) to other users where the Service design requires it.</li>
              <li>Send you transactional emails (e.g. password reset, email confirmation) via our auth provider.</li>
              <li>Improve, debug, and secure the Service and comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data. We do not use your data for third-party advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Legal basis (EEA/UK)</h2>
            <p>
              If you are in the European Economic Area or the UK, we process your data on the basis of: (1) performance of a contract (providing the Service you signed up for), (2) your consent where we ask for it (e.g. optional profile features), and (3) our legitimate interests (security, improving the Service, legal compliance) where appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Third-party services</h2>
            <p>
              We use <strong className="text-white">Supabase</strong> for authentication, database, and hosting. Supabase processes your account and app data on our behalf. Their privacy and data processing terms apply to that processing. We may use other providers for hosting (e.g. Vercel) that process technical data (e.g. IP, logs) necessary to serve the site. We choose providers that respect privacy and, where required, offer appropriate safeguards for international transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Cookies and similar technologies</h2>
            <p>
              The Service uses cookies and similar technologies where necessary for: (1) keeping you logged in (session/auth cookies), (2) security (e.g. CSRF), and (3) site operation. We do not use cookies for advertising or cross-site tracking. You can control or delete cookies via your browser settings; some features may not work if you disable essential cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Data retention</h2>
            <p>
              We retain your account and related data (predictions, pools, notifications) for as long as your account is active or as needed to provide the Service and comply with law. If you delete your account, we will delete or anonymise your personal data in line with our procedures and legal obligations. Some data (e.g. in backups or for legal claims) may be kept longer where required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Data security</h2>
            <p>
              We take reasonable steps to protect your data (e.g. HTTPS, secure authentication, access controls). No system is completely secure; you are responsible for keeping your password safe and logging out on shared devices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Your rights</h2>
            <p>Depending on where you live, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data (subject to legal exceptions).</li>
              <li>Object to or restrict certain processing.</li>
              <li>Data portability (e.g. a copy of your data in a common format).</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Lodge a complaint with a supervisory authority (e.g. in your country).</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us (e.g. via the GitHub link in the footer). You can also update or delete your account and profile from the Service where we provide those options.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">11. Children</h2>
            <p>
              The Service is not directed at children under 13 (or the applicable age of digital consent). We do not knowingly collect personal data from such users. If you believe we have collected data from a child, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">12. International transfers</h2>
            <p>
              Your data may be processed in countries outside your residence (e.g. where our or Supabase’s servers are located). We ensure appropriate safeguards (e.g. standard contractual clauses or adequacy decisions) where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">13. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated version on this page and update the “Last updated” date. We encourage you to review it periodically. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">14. Contact</h2>
            <p>
              For privacy questions or requests, you can reach out via the project repository:{" "}
              <a
                href="https://github.com/KasperOfzeau"
                target="_blank"
                rel="noopener noreferrer"
                className="text-f1-red hover:text-f1-red-hover underline"
              >
                KasperOfzeau on GitHub
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-10 pt-6 border-t border-white/10">
          <Link href="/" className="text-f1-red hover:text-f1-red-hover text-sm font-medium">
            ← Back to home
          </Link>
        </p>
      </article>
    </div>
  );
}

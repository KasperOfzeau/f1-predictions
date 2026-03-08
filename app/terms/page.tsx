import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for The Prediction Paddock – F1 race prediction game and pools",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-8">
          Last updated: March 2025
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Agreement to terms</h2>
            <p>
              Welcome to <strong className="text-white">The Prediction Paddock</strong> (“we”, “our”, or “the Service”). By accessing or using our website and services, you agree to be bound by these Terms of Service (“Terms”). If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Description of the service</h2>
            <p>
              The Prediction Paddock is an online platform where users can make predictions on Formula 1 race results and season outcomes, create or join prediction pools, compete on leaderboards, and interact with other users. The Service is provided for entertainment and non-commercial use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Account and eligibility</h2>
            <p>
              To use certain features (predictions, pools, leaderboards, profile), you must register an account. You must:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Be at least 13 years of age (or the age of digital consent in your jurisdiction).</li>
              <li>Provide accurate registration information (e.g. email, username) and keep it up to date.</li>
              <li>Keep your password secure and be responsible for all activity under your account.</li>
              <li>Not create more than one account for the same person, unless we allow it.</li>
            </ul>
            <p className="mt-3">
              We may suspend or terminate your account if you breach these Terms or for other reasons at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Use of the service</h2>
            <p>You agree to use the Service only for lawful purposes and in line with these Terms. You must not:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Use the Service in any way that violates applicable laws or regulations.</li>
              <li>Impersonate others or misrepresent your identity or affiliation.</li>
              <li>Harass, abuse, defame, or threaten other users.</li>
              <li>Attempt to gain unauthorized access to the Service, other accounts, or our systems.</li>
              <li>Use bots, scripts, or automated means to access or use the Service unless we explicitly allow it.</li>
              <li>Scrape, copy, or redistribute content or data from the Service for commercial use without permission.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
            </ul>
            <p className="mt-3">
              Usernames and profile content must not be offensive, misleading, or infringe others’ rights. We may require changes or removal of content that we consider inappropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Predictions and pools</h2>
            <p>
              Predictions and pool memberships are part of the game and have no cash or real-world value. Deadlines for submitting predictions are set by the Service (e.g. before a race weekend). We are not responsible for results or scoring errors due to official F1 data, timing, or technical issues; we may correct or adjust scoring as we see fit.
            </p>
            <p className="mt-3">
              Pool admins may invite or remove members and manage pool settings within the tools we provide. You are responsible for your conduct as a pool admin or member. We do not guarantee availability of any specific race, season, or feature.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Intellectual property</h2>
            <p>
              The Service (including design, text, graphics, logos, and software) is owned by us or our licensors. Formula 1 and related marks are the property of their respective owners. We do not grant you any right to use our or third-party trademarks except as needed to use the Service normally. You retain ownership of content you submit (e.g. profile data); you grant us a license to use, store, and display it to operate the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <Link href="/privacy" className="text-f1-red hover:text-f1-red-hover underline">
                Privacy Policy
              </Link>
              , which describes how we collect, use, and protect your data. By using the Service, you consent to that processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Disclaimers</h2>
            <p>
              The Service is provided “as is” and “as available”. We disclaim all warranties (express or implied), including merchantability and fitness for a particular purpose. We do not guarantee that the Service will be uninterrupted, error-free, or secure. The Service may be in development; we may change or discontinue features without notice. Use of the Service is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, we (and our affiliates, directors, and employees) shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising from your use or inability to use the Service. Our total liability for any claims related to the Service shall not exceed the amount you paid us in the twelve months before the claim (or zero if you have not paid anything).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Changes to the terms</h2>
            <p>
              We may update these Terms from time to time. We will post the updated Terms on this page and update the “Last updated” date. Continued use of the Service after changes constitutes acceptance. If you do not agree, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">11. General</h2>
            <p>
              These Terms form the entire agreement between you and us regarding the Service. If any part is held invalid, the rest remains in effect. Our failure to enforce a right does not waive it. You may not assign your rights under these Terms without our consent; we may assign our rights without restriction. Governing law and place of jurisdiction are determined by the operator of the Service (e.g. the jurisdiction of the developer).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-3">12. Contact</h2>
            <p>
              For questions about these Terms, you can reach out via the project repository:{" "}
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

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-6 py-20 max-w-3xl">
      {/* Breadcrumb */}
      <div className="text-sm text-[#9CA3AF] mb-4">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        {' > '}
        <span className="text-white">Privacy Policy</span>
      </div>

      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

      <div className="glass rounded-2xl p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            We collect the following types of information:
          </p>
          <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5] mb-4">
            <li>Name and email address (via Google OAuth)</li>
            <li>Subscription plan and billing information</li>
            <li>Credits balance and transaction history</li>
          </ul>
          <h3 className="text-lg font-semibold text-white mb-2">Content Data</h3>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>Generation prompts and parameters</li>
            <li>Generated media files (stored securely)</li>
            <li>Usage statistics and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            We use your information to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>Provide and improve our Service</li>
            <li>Process subscriptions and credit transactions</li>
            <li>Generate and store your content</li>
            <li>Communicate about your account</li>
            <li>Analyze usage patterns to enhance features</li>
            <li>Detect fraud and abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">3. Data Storage and Security</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            We implement industry-standard security measures:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>Encryption in transit and at rest</li>
            <li>Secure authentication via Supabase Auth</li>
            <li>Cloudflare R2 for encrypted media storage</li>
            <li>Regular security audits and updates</li>
          </ul>
          <p className="text-[#E5E5E5] leading-relaxed mt-4">
            However, no method of transmission is 100% secure. While we strive to protect your data,
            we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">4. Content Retention</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            Your generated content is retained according to your subscription:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li><strong>Free users:</strong> Content deleted after 7 days</li>
            <li><strong>Paid subscribers:</strong> Content retained while subscription is active</li>
            <li><strong>Cancelled subscriptions:</strong> Content deleted 30 days after cancellation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Services</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            We use the following third-party services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li><strong>Google:</strong> OAuth authentication</li>
            <li><strong>Supabase:</strong> Database and authentication</li>
            <li><strong>Cloudflare R2:</strong> Media storage</li>
            <li><strong>Creem.io:</strong> Payment processing</li>
            <li><strong>AI Providers:</strong> Generation services (PiAPI, GRS AI, etc.)</li>
          </ul>
          <p className="text-[#E5E5E5] leading-relaxed mt-4">
            These services have their own privacy policies. We are not responsible for their practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">6. Data Sharing</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            We do not sell your personal data. We may share data with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5] mt-4">
            <li>AI providers for generation purposes only</li>
            <li>Payment processors for subscription management</li>
            <li>Service providers who assist our operations (under confidentiality agreements)</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data</li>
            <li>Object to processing of your data</li>
          </ul>
          <p className="text-[#E5E5E5] leading-relaxed mt-4">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@tryvirlo.com" className="text-[#FF4081] hover:underline">
              privacy@tryvirlo.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies and Tracking</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>Maintain your session</li>
            <li>Analyze usage patterns (via PostHog)</li>
            <li>Improve user experience</li>
          </ul>
          <p className="text-[#E5E5E5] leading-relaxed mt-4">
            You can disable cookies in your browser settings, but this may affect Service functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            Our Service is not intended for children under 18. We do not knowingly collect information
            from children under 18. If we become aware of such collection, we will delete it immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            Your data may be transferred to and processed in countries other than your own. We take
            appropriate safeguards to protect your data in accordance with this Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">11. Policy Changes</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify users of significant
            changes via email or in-app notification.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">12. Contact</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:privacy@tryvirlo.com" className="text-[#FF4081] hover:underline">
              privacy@tryvirlo.com
            </a>
          </p>
        </section>

        <p className="text-sm text-[#9CA3AF] pt-4 border-t border-white/10">
          Last updated: April 27, 2025
        </p>
      </div>
    </div>
  );
}

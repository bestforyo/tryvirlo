import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-6 py-20 max-w-3xl">
      {/* Breadcrumb */}
      <div className="text-sm text-[#9CA3AF] mb-4">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        {' > '}
        <span className="text-white">Terms of Service</span>
      </div>

      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

      <div className="glass rounded-2xl p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            By accessing or using tryvirlo (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;).
            If you do not agree to these Terms, please do not use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            tryvirlo is an AI-powered video and image generation platform that aggregates multiple AI models
            through a credit-based subscription system. Our Service allows you to generate creative content using
            state-of-the-art AI technologies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>You must be at least 18 years old to use this Service</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must not generate content that is illegal, harmful, or violates third-party rights</li>
            <li>You retain ownership of content you generate, subject to these Terms</li>
            <li>You must not attempt to circumvent credit limits or exploit the system</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">4. Content Policy</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            You agree not to use the Service to generate content that includes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>Illegal activities or content</li>
            <li>Violence, hate speech, or discrimination</li>
            <li>Sexually explicit material</li>
            <li>Intellectual property infringement</li>
            <li>Harassment or bullying</li>
            <li>False or misleading information</li>
          </ul>
          <p className="text-[#E5E5E5] leading-relaxed mt-4">
            We reserve the right to remove any content that violates these guidelines and to suspend or terminate accounts that do so.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">5. Credits and Billing</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            Our Service operates on a credit-based system:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>Credits are purchased through subscription plans</li>
            <li>Credits expire at the end of each billing cycle</li>
            <li>Failed generations will be refunded</li>
            <li>Prices are subject to change with 30 days notice</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">6. Data and Storage</h2>
          <p className="text-[#E5E5E5] leading-relaxed mb-4">
            Content storage policy:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#E5E5E5]">
            <li>Free tier content is deleted after 7 days</li>
            <li>Paid subscribers retain content while subscription is active</li>
            <li>We reserve the right to delete content that violates our policies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">7. Disclaimer of Warranties</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            The Service is provided &quot;as is&quot; without warranties of any kind, either express or implied.
            We do not guarantee uninterrupted or error-free operation of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            tryvirlo shall not be liable for any indirect, incidental, special, consequential, or punitive damages
            resulting from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            We reserve the right to suspend or terminate your account at any time for violation of these Terms
            or for any other reason at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            We may update these Terms from time to time. Continued use of the Service after changes constitutes
            acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
          <p className="text-[#E5E5E5] leading-relaxed">
            For questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@tryvirlo.com" className="text-[#FF4081] hover:underline">
              legal@tryvirlo.com
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

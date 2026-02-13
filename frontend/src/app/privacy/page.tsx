"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
              <p className="text-slate-300 leading-relaxed">
                Welcome to the Outreach Platform by Metaminds ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our HR Resume Assistant and email outreach platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-white">Account Information:</strong> Name, email address, password, and profile details</li>
                <li><strong className="text-white">Resume Data:</strong> Skills, experience, education, projects, and professional information</li>
                <li><strong className="text-white">Email Content:</strong> Email templates, drafts, and communication history</li>
                <li><strong className="text-white">Recipient Information:</strong> Contact details of recipients you add to your campaigns</li>
                <li><strong className="text-white">Usage Data:</strong> Information about how you interact with our platform</li>
                <li><strong className="text-white">Analytics Data:</strong> Campaign performance metrics and email engagement statistics</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and complete your job application outreach campaigns</li>
                <li>Generate AI-powered email content and company intelligence</li>
                <li>Send you service-related notifications and updates</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            {/* Data Storage and Security */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Storage and Security</h2>
              <p className="text-slate-300 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data is stored securely using industry-standard encryption protocols. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Sharing and Disclosure</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-white">With Your Consent:</strong> When you explicitly authorize us to share information</li>
                <li><strong className="text-white">Service Providers:</strong> With third-party vendors who help us operate our platform (e.g., email delivery services, AI processing)</li>
                <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights and Choices</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-white">Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion of your personal information</li>
                <li><strong className="text-white">Data Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong className="text-white">Withdraw Consent:</strong> Withdraw your consent to data processing where applicable</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                To exercise these rights, please contact us at the email address provided below.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-slate-300 leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and remember your preferences. You can control cookie settings through your browser, but disabling cookies may affect platform functionality.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
              <p className="text-slate-300 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. When you delete your account, we will delete or anonymize your personal information within 90 days, except where we are required to retain it for legal purposes.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <p className="text-slate-300 leading-relaxed">
                Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
              </p>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">International Data Transfers</h2>
              <p className="text-slate-300 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure that appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Privacy Policy</h2>
              <p className="text-slate-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the platform after changes become effective constitutes your acceptance of the revised policy.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-2">
                <p className="text-white font-semibold">Metaminds</p>
                <p className="text-slate-400">Email: privacy@metaminds.firm.in</p>
                <p className="text-slate-400">Website: <a href="https://metaminds.firm.in" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">https://metaminds.firm.in</a></p>
              </div>
            </section>

            {/* GDPR Compliance */}
            <section className="mt-12 p-6 bg-blue-950/20 border border-blue-900/30 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-400 mb-3">GDPR Compliance</h3>
              <p className="text-slate-300 leading-relaxed">
                For users in the European Economic Area (EEA), we comply with the General Data Protection Regulation (GDPR). You have additional rights under GDPR, including the right to lodge a complaint with your local data protection authority.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <p className="text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} Metaminds. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

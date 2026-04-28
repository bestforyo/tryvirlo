"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-20 max-w-3xl">
      {/* Breadcrumb */}
      <div className="text-sm text-[#9CA3AF] mb-4">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        {' > '}
        <span className="text-white">Contact</span>
      </div>

      <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
      <p className="text-xl text-[#9CA3AF] mb-12">
        We'd love to hear from you. Send us a message and we'll respond as soon as possible.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-xl p-6">
            <div className="text-2xl mb-2">📧</div>
            <h3 className="text-white font-semibold mb-1">Email</h3>
            <a href="mailto:support@tryvirlo.com" className="text-[#FF4081] hover:underline text-sm">
              support@tryvirlo.com
            </a>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="text-2xl mb-2">💼</div>
            <h3 className="text-white font-semibold mb-1">Business</h3>
            <a href="mailto:business@tryvirlo.com" className="text-[#FF4081] hover:underline text-sm">
              business@tryvirlo.com
            </a>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="text-2xl mb-2">⚖️</div>
            <h3 className="text-white font-semibold mb-1">Legal</h3>
            <a href="mailto:legal@tryvirlo.com" className="text-[#FF4081] hover:underline text-sm">
              legal@tryvirlo.com
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          {submitted ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-semibold text-white mb-2">Message Sent!</h2>
              <p className="text-[#9CA3AF] mb-6">
                Thank you for reaching out. We'll get back to you within 24-48 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF4081] transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF4081] transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF4081] transition-colors"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF4081] transition-colors resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white font-semibold hover:translate-y-[-2px] hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* FAQ Links */}
      <div className="mt-16 glass rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Link href="/pricing" className="block text-[#E5E5E5] hover:text-[#FF4081] transition-colors">
            → How do credits work?
          </Link>
          <Link href="/pricing" className="block text-[#E5E5E5] hover:text-[#FF4081] transition-colors">
            → What are the pricing plans?
          </Link>
          <Link href="/terms" className="block text-[#E5E5E5] hover:text-[#FF4081] transition-colors">
            → What can I generate with the service?
          </Link>
          <Link href="/privacy" className="block text-[#E5E5E5] hover:text-[#FF4081] transition-colors">
            → How is my data stored and protected?
          </Link>
        </div>
      </div>
    </div>
  );
}

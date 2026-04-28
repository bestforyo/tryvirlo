/**
 * Contact Form Submission
 * POST /api/contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // In production, integrate with email service (Resend)
    // For now, just log the contact
    console.log('Contact form submission:', {
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      timestamp: new Date().toISOString()
    });

    // TODO: Send email via Resend
    // await resend.emails.send({
    //   from: 'tryvirlo <noreply@tryvirlo.com>',
    //   to: 'support@tryvirlo.com',
    //   subject: `Contact: ${validatedData.subject}`,
    //   html: `...`
    // });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error: any) {
    console.error('Contact form error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

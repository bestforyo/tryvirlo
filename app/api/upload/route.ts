import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { r2Storage } from '@/lib/storage/r2';

export async function POST(request: NextRequest) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/mov', 'video/avi'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop() || 'bin';
        const storageKey = `uploads/${user.id}/${timestamp}-${randomId}.${extension}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await r2Storage.uploadBuffer(storageKey, buffer, file.type || 'application/octet-stream');

        if (!uploadResult.success || !uploadResult.url) {
            return NextResponse.json({ error: 'Upload failed', details: uploadResult.error }, { status: 500 });
        }

        return NextResponse.json({
            url: uploadResult.url,
            filename: storageKey,
            size: uploadResult.size ?? buffer.length,
            type: file.type
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed', details: error.message },
            { status: 500 }
        );
    }
}
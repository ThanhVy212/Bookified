'use server';

import { del } from '@vercel/blob';

export async function deleteUploadedBlobs(urls: string[]) {
    const toDelete = urls.filter(Boolean);

    if (toDelete.length === 0) {
        return { success: true };
    }

    try {
        await del(toDelete);
        return { success: true };
    } catch (e) {
        console.error('Error deleting uploaded blobs', e);
        return {
            success: false,
            error: e,
        };
    }
}

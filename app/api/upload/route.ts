import {NextResponse} from "next/server";
import {handleUpload, HandleUploadBody} from "@vercel/blob/client";
import {auth} from "@clerk/nextjs/server";
import {MAX_FILE_SIZE} from "@/lib/constants";

class UnauthorizedUploadError extends Error {}

export async function POST(req: Request):Promise<NextResponse> {
    const body = (await req.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            token: process.env.BLOB_READ_WRITE_TOKEN,
            body,
            request: req,
            onBeforeGenerateToken: async () => {
                const {userId} = await auth();

                if(!userId){
                    throw new UnauthorizedUploadError('Unauthorized: User not authenticated');
                }

                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
                    addRandomSuffix: true,
                    maximumSizeInBytes: MAX_FILE_SIZE,
                    tokenPayload: JSON.stringify({ userId })
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('File uploaded to blob', blob.url);

                const payload = tokenPayload ? JSON.parse(tokenPayload) : null;
                const userId = payload?.userId;

                // Todo: PostHog
            }
        });

        return NextResponse.json(jsonResponse);
    } catch (e) {
        if (e instanceof UnauthorizedUploadError) {
            return NextResponse.json({ error: e.message }, { status: 401 });
        }
        const message = e instanceof Error ? e.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
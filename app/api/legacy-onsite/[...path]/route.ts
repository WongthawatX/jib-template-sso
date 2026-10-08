import { forwardLegacyOnsiteRequest } from "@/services/legacyOnsiteProxy"

type Context = {
    params: Promise<{ path: string[] }>;
}

async function handleRequest(request: Request, context: Context): Promise<Response> {
    const { path } = await context.params
    return forwardLegacyOnsiteRequest(request, path)
}

export const GET = handleRequest
export const HEAD = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest

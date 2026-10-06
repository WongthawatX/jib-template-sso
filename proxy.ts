import { NextResponse } from "next/server"
import { APP_BASE_PATH } from "@/config/env"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
    if ( request.nextUrl.basePath || request.nextUrl.pathname !== "/" ) return NextResponse.next()

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = APP_BASE_PATH

    return NextResponse.redirect(redirectUrl)
}

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getUserFromRequest } from './auth'

import type { AuthUser } from './user'

type Handler<T> = (req: Request, user: AuthUser) => Promise<T> | T

export function withAuth<T>(handler: Handler<T>) {
  return async (req: NextRequest): Promise<any> => {
    try {
      const user = getUserFromRequest(req)

      return await handler(req, user)
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
  }
}

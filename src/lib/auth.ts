import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { getWebRequest } from '@tanstack/react-start/server'
import { db } from './db'

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(db, {
    provider: 'sqlite',
  }),
  trustedOrigins: ['http://0.0.0.0:3000', 'http://192.168.68.77:3000'],
})

export const getSession = async () => {
  const request = getWebRequest()
  const session = await auth.api.getSession({
    headers: request.headers as unknown as Headers,
  })

  return session
}

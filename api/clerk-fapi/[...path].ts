export const config = {
  runtime: 'edge',
}

const CLERK_FAPI = 'https://frontend-api.clerk.dev'

export default async function handler(request: Request) {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) {
    return new Response('CLERK_SECRET_KEY is not set on Vercel', { status: 500 })
  }

  const inbound = new URL(request.url)
  const prefix = '/api/clerk-fapi/'
  if (!inbound.pathname.startsWith(prefix)) {
    return new Response('Not found', { status: 404 })
  }

  const remainder = inbound.pathname.slice(prefix.length)
  const target = new URL(`${CLERK_FAPI}/${remainder}`)
  target.search = inbound.search

  const proxyUrl =
    process.env.CLERK_PROXY_URL ||
    `${inbound.protocol}//${inbound.host.replace(/^api\./, 'www.')}/__clerk`

  const headers = new Headers(request.headers)
  headers.set('Clerk-Proxy-Url', proxyUrl.endsWith('/') ? proxyUrl : `${proxyUrl}/`)
  headers.set('Clerk-Secret-Key', secret)
  headers.set(
    'X-Forwarded-For',
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
  )

  const response = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'manual',
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

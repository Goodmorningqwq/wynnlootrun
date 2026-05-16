export function getCurrentUser(request: Request): string | null {
  const fromHeader = request.headers.get('x-username')
  if (fromHeader) return fromHeader

  const url = new URL(request.url)
  const fromQuery = url.searchParams.get('username')
  if (fromQuery) return fromQuery

  return null
}

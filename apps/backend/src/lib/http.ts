/**
 * Fetch API Response type for environments where the global Response type is narrow
 * (e.g. tsconfig lib: ["ES2022"] without DOM, Vercel build).
 *
 * IMPORTANT: When using fetch() and accessing res.ok, res.text(), or res.json(),
 * always cast the result: (await fetch(...)) as FetchResponse
 * Otherwise TS2339 errors may occur on Vercel/CI.
 */
export type FetchResponse = {
  ok: boolean
  status: number
  text(): Promise<string>
  json(): Promise<unknown>
}

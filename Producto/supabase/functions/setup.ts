// Shim the Deno global so edge function code can call Deno.env.get()
;(global as any).Deno = {
  env: {
    get: (key: string) => {
      const env: Record<string, string> = {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      }
      return env[key] ?? ''
    },
  },
}

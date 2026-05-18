import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'https://deno.land/std@0.168.0/http/server.ts': path.resolve(__dirname, 'mocks/deno-server.ts'),
      'https://esm.sh/@supabase/supabase-js@2': path.resolve(__dirname, 'mocks/supabase.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'json', 'html'] },
  },
})

'use client';

import { useActionState } from 'react';
import { loginWithHomePassword } from './actions';
import { KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await loginWithHomePassword(formData);
    },
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#303030] rounded-xl shadow-lg overflow-hidden border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <div className="p-8 text-center border-b border-[#E5E6E6] dark:border-[#3D3D3D] bg-[#FAFAFA] dark:bg-[#2A2A2A] transition-colors">
          <div className="mx-auto w-16 h-16 bg-[#E5E6E6] dark:bg-[#3D3D3D] rounded-full flex items-center justify-center mb-4 transition-colors">
            <KeyRound className="w-8 h-8 text-[#1E1E1E] dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Otelo</h1>
          <p className="text-sm text-[#1E1E1E]/70 dark:text-white/70 mt-1">Ingresa la contraseña de la casa</p>
        </div>
        
        <form action={formAction} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-white mb-2">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-[#E5E6E6] dark:border-[#3D3D3D] dark:bg-[#242424] focus:outline-none focus:ring-1 focus:ring-[#3584E4] focus:border-[#3584E4] transition-all text-[#1E1E1E] dark:text-white"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-[#E01B24] dark:text-[#FF7B63] text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#3584E4] hover:bg-[#1C71D8] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

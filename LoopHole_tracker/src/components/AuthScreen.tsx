import React from "react";
import { LayoutGrid } from "lucide-react";

type Props = {
  handleAuth: (e: React.FormEvent) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isLoginView: boolean;
  setIsLoginView: (val: boolean) => void;
  authError: string;
  setAuthError: (val: string) => void;
  loading: boolean;
};

export const AuthScreen = ({
  handleAuth,
  email,
  setEmail,
  password,
  setPassword,
  isLoginView,
  setIsLoginView,
  authError,
  setAuthError,
  loading,
}: Props) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] w-full max-w-sm border border-slate-100">
        <div className="flex justify-center mb-6 text-indigo-600">
          <LayoutGrid size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center tracking-tight">
          {isLoginView ? "Welcome back" : "Create account"}
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            required
            placeholder="name@example.com"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {authError && (
            <p className="text-xs text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg">
              {authError}
            </p>
          )}
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : isLoginView ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setAuthError("");
            }}
            className="text-sm text-slate-500 hover:text-indigo-600 font-medium"
          >
            {isLoginView
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

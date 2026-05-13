'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from './supabase/client';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// useAuth - Supabase authentication
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.full_name,
              created_at: profile.created_at,
            });
          }
        }
      } catch (err) {
        console.error('[Aventra] Session check failed:', err);
      }
      setLoading(false);
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            created_at: profile.created_at,
          });
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (!profile) {
          await supabase.auth.signOut();
          throw new Error('Account setup incomplete. Please contact support.');
        }

        const userData = {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          created_at: profile.created_at,
        };
        
        setUser(userData);
        return { user: userData };
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      
      if (error) throw error;

      if (data.user) {
        for (let i = 0; i < 10; i++) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
          if (profile) break;
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      return { user: data.user };
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return { user, loading, login, signup, logout };
}

// useUser - Get current user
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser({ id: profile.id, email: profile.email, name: profile.full_name, created_at: profile.created_at });
        }
      }
    };
    load();
  }, [supabase]);

  return { user };
}

'use client'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = "BAaIzBNTHgNIiJF6-kX4Lf9nvhOsQqiiohQdJJyFKb1jkT4dVbOLmTyqtA5h1B_QwqVeHaiNYjgohVq_UIe2L2M";

export default function PushRegistrar() {
  useEffect(() => {
    let registrationInFlight = false;

    async function registerPWAAndPush(user) {
      if (registrationInFlight) return;
      registrationInFlight = true;
      try {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const reg = await navigator.serviceWorker.register('/sw.js');
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
          return outputArray;
        };
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }
        const payload = sub.toJSON();
        if (!payload?.endpoint) return;

        // Keep the existing row for this browser/device and refresh its payload.
        // This avoids delete+insert races while preserving the user's other devices.
        const { data: existing, error: lookupError } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .contains('subscription', { endpoint: payload.endpoint })
          .limit(1)
          .maybeSingle();

        if (lookupError) {
          console.log('Push lookup error', lookupError);
          return;
        }

        if (existing?.id) {
          const { error } = await supabase
            .from('push_subscriptions')
            .update({ subscription: payload })
            .eq('id', existing.id)
            .eq('user_id', user.id);
          if (error) console.log('Push save error', error);
          else console.log('Push global refreshed');
          return;
        }

        const { error } = await supabase.from('push_subscriptions').insert({
          user_id: user.id,
          subscription: payload
        });

        // A concurrent auth event may have inserted the same endpoint first.
        // The unique index is then doing its job, so do not surface it as an app error.
        if (error && error.code !== '23505') console.log('Push save error', error);
        else console.log('Push global registered');
      } catch (e) {
        console.log('Push error', e);
      } finally {
        registrationInFlight = false;
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) registerPWAAndPush(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) registerPWAAndPush(session.user);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  return null;
}

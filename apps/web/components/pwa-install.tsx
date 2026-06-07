"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "timeup-pwa-dismissed"; // never show again (explicit dismiss / installed)
const SHOWN_KEY = "timeup-pwa-shown"; // already shown this session

/** Registers the service worker app-wide. Renders nothing, never shows UI. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

/**
 * Shows the install prompt at most ONCE per session (and never again after the user
 * dismisses or installs). Closeable. Meant for the colaborador panel (phone audience).
 */
export function PwaInstallPrompt() {
  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) return;

    let dismissed = false;
    let shownThisSession = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      shownThisSession = sessionStorage.getItem(SHOWN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (dismissed || shownThisSession) return;

    const remember = () => {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    };
    const markShown = () => {
      try {
        sessionStorage.setItem(SHOWN_KEY, "1");
      } catch {
        /* ignore */
      }
    };

    let opened = false;
    function show(deferred: BeforeInstallPromptEvent | null) {
      if (opened) return;
      opened = true;
      markShown();
      toast("📲 Instalar o TimeUp", {
        description: deferred
          ? "Acesse suas metas direto da tela inicial do celular."
          : "Toque em Compartilhar e depois em “Adicionar à Tela de Início”.",
        duration: 12000,
        action: deferred
          ? {
              label: "Instalar",
              onClick: async () => {
                await deferred.prompt();
                const choice = await deferred.userChoice;
                if (choice.outcome === "accepted") toast.success("App instalado! 🎉");
                remember();
              },
            }
          : undefined,
        cancel: { label: "Agora não", onClick: remember },
        onDismiss: remember,
      });
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      show(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS Safari never fires beforeinstallprompt — show manual instructions instead
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|android/i.test(ua);
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS && isSafari) iosTimer = setTimeout(() => show(null), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  return null;
}

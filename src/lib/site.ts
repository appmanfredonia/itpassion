import type { NavItem } from "@/types/app";

export const siteConfig = {
  name: "ItPassion",
  description: "Il social network italiano dedicato alle passioni condivise.",
};

export const appNavigation: NavItem[] = [
  { href: "/feed", label: "Feed", shortLabel: "Feed" },
  { href: "/create", label: "Crea", shortLabel: "Crea" },
  { href: "/explore", label: "Esplora", shortLabel: "Esplora" },
  { href: "/search", label: "Cerca", shortLabel: "Cerca" },
  { href: "/messages", label: "Messaggi", shortLabel: "Chat" },
  { href: "/notifications", label: "Notifiche", shortLabel: "Notif" },
  { href: "/saved", label: "Salvati", shortLabel: "Salvati" },
  { href: "/profile", label: "Profilo", shortLabel: "Profilo" },
  { href: "/settings", label: "Impostazioni", shortLabel: "Set" },
];

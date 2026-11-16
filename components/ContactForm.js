"use client";

import { useState } from "react";
import Link from "next/link";
import { lienWhatsApp, messageContact } from "../lib/whatsapp";

// Formulaire de contact : ouvre WhatsApp avec le message pré-rempli.
// Textes fournis par la page (rendue par le serveur dans la bonne langue).
export default function ContactForm({ c }) {
  const [form, setForm] = useState({ nom: "", email: "", message: "" });
  // null : pas encore envoyé ; "ouvert" : WhatsApp s'est ouvert ;
  // "bloque" : le navigateur a bloqué la fenêtre (window.open → null).
  const [etat, setEtat] = useState(null);
  const [lien, setLien] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setEtat(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Message structuré préparé par lib/whatsapp.js.
    const url = lienWhatsApp(messageContact(c, form));
    setLien(url);
    // Pas de « noopener » dans les options : window.open renverrait
    // toujours null et on ne pourrait plus détecter un blocage. La fenêtre
    // ouverte est wa.me (WhatsApp), on lui retire l'accès à cette page.
    const fenetre = window.open(url, "_blank");
    if (fenetre) {
      fenetre.opener = null;
      setEtat("ouvert");
    } else {
      setEtat("bloque");
    }
  };

  return (
    <>
      {etat === "ouvert" && (
        <div role="status" className="mb-6 p-4 rounded-xl bg-green-100 text-green-800 text-sm">
          {c.successMsg}
        </div>
      )}
      {etat === "bloque" && (
        // Lien classique : un clic direct de l'utilisateur n'est jamais
        // bloqué par le navigateur.
        <div role="alert" className="mb-6 p-4 rounded-xl bg-brand-50 border border-brand-200 text-bocaro-900 text-sm space-y-3">
          <p>{c.blockedMsg}</p>
          <a href={lien} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
            {c.blockedCta}
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="contact-nom" className="block text-sm font-medium text-bocaro-900 mb-2">
            {c.nameLabel}
          </label>
          <input
            id="contact-nom"
            type="text"
            name="nom"
            autoComplete="name"
            required
            value={form.nom}
            onChange={handleChange}
            placeholder={c.namePlaceholder}
            className="w-full px-4 py-3 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500 bg-surface"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-bocaro-900 mb-2">
            {c.emailLabel}
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder={c.emailPlaceholder}
            className="w-full px-4 py-3 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500 bg-surface"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-bocaro-900 mb-2">
            {c.messageLabel}
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            value={form.message}
            onChange={handleChange}
            placeholder={c.messagePlaceholder}
            className="w-full px-4 py-3 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500 bg-surface resize-none"
          />
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto">
          {c.submit}
        </button>
        <p className="text-xs text-bocaro-600 leading-relaxed">
          {c.privacyNote}{" "}
          <Link href="/confidentialite" className="underline underline-offset-2 hover:text-brand-600">
            {c.privacyLink}
          </Link>
        </p>
      </form>
    </>
  );
}

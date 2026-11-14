"use client";

import { useState } from "react";
import Link from "next/link";
import { lienWhatsApp, messageContact } from "../lib/whatsapp";

// Formulaire de contact : ouvre WhatsApp avec le message pré-rempli.
// Textes fournis par la page (rendue par le serveur dans la bonne langue).
export default function ContactForm({ c }) {
  const [form, setForm] = useState({ nom: "", email: "", message: "" });
  const [envoye, setEnvoye] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Message structuré préparé par lib/whatsapp.js.
    window.open(lienWhatsApp(messageContact(c, form)), "_blank");
    setEnvoye(true);
  };

  return (
    <>
      {envoye && (
        <div role="status" className="mb-6 p-4 rounded-xl bg-green-100 text-green-800 text-sm">
          {c.successMsg}
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

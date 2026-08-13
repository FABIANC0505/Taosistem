import React from 'react';
import { Instagram, Mail, Phone, MapPin, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-4 px-4 sm:px-6 text-xs text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Code size={14} className="text-emerald-400" />
            Desarrollador:
          </span>
          <span className="text-slate-100 font-medium">Fabian Jose Carmona Vargas</span>
          <span className="text-slate-500 hidden sm:inline">&bull;</span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <MapPin size={13} className="text-emerald-400" />
            Valledupar
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300">
          <a
            href="tel:3238158690"
            className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            title="Llamar"
          >
            <Phone size={13} className="text-emerald-400" />
            <span>3238158690</span>
          </a>

          <a
            href="https://instagram.com/taofabiian"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-pink-400 transition-colors"
            title="Instagram @taofabiian"
          >
            <Instagram size={13} className="text-pink-400" />
            <span>taofabiian</span>
          </a>

          <a
            href="mailto:fcarmonav6@soy.sena.edu.co"
            className="inline-flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
            title="Enviar correo"
          >
            <Mail size={13} className="text-cyan-400" />
            <span>fcarmonav6@soy.sena.edu.co</span>
          </a>

          <span className="rounded bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-slate-300">
            2026
          </span>
        </div>
      </div>
    </footer>
  );
};

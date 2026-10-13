/* =====================================================================
   NovaCasino — casino de démonstration, crédits fictifs, aucun paiement.
   Configuration injectée à la construction (site.config.json).
   ===================================================================== */
"use strict";
const SITE = {{SITE_JSON}};

/* Le serveur force déjà HTTPS ; ceci couvre les hébergements qui ne le font pas
   (sauf en local et sur le réseau domestique, pour tester depuis un téléphone). */
if (location.protocol === "http:" && !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]|0\.0\.0\.0)|\.local$/.test(location.hostname))
  location.replace("https://" + location.host + location.pathname + location.search + location.hash);

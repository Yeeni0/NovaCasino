# NovaCasino : prêt à mettre en ligne

Le dossier **`dist/`** est le site complet. C'est lui qu'on envoie chez l'hébergeur. Le reste sert à le reconstruire après une modification.

## Mettre en ligne en 3 étapes

1. **Remplis `site.config.json`** : ton domaine (`siteUrl`), ton e-mail de contact, tes informations d'éditeur et celles de ton hébergeur. Tant que ce n'est pas fait, les pages légales affichent des champs surlignés « À compléter ».
2. **Reconstruis le site** (Node.js requis) :
   ```
   npm install
   npm run build
   ```
   La construction signale les liens cassés et les champs encore vides.
3. **Envoie le contenu de `dist/`** :
   - **Netlify** : glisse le dossier `dist` sur app.netlify.com/drop. Le HTTPS et les en-têtes (`_headers`) sont pris en compte automatiquement.
   - **Cloudflare Pages** : crée un projet et envoie le dossier `dist`. Le fichier `_headers` est reconnu.
   - **Vercel** : déploie le dossier `dist`. Le fichier `vercel.json` est reconnu.
   - **OVH, o2switch, Hostinger (Apache)** : envoie le contenu de `dist` par FTP dans `www/`. Le fichier `.htaccess` force le HTTPS, sert la page 404 et compresse les fichiers. Active d'abord le certificat SSL gratuit (Let's Encrypt) dans ton espace client.

Pour tester sur ton ordinateur : `npm run serve`, puis ouvre http://localhost:5178.

## Les 20 points de la checklist

| # | Point | Ce qui est en place |
|---|---|---|
| 1 | Page RGPD | `confidentialite.html` : données stockées, finalités, durées, droits, recours CNIL |
| 2 | Page de CGU | `cgu.html` : crédits fictifs, **règlement du tirage gratuit**, règles du chat, 18+. Plus `mentions-legales.html` (obligatoire en France) |
| 3 | API hors front-end | Aucune clé ni secret dans le code : le site n'appelle aucune API. La seule configuration (domaine Plausible) est publique par nature |
| 4 | Forcer le HTTPS | Redirection 301 dans `.htaccess`, HSTS dans les en-têtes, `upgrade-insecure-requests`, et redirection de secours dans le JavaScript |
| 5 | Bannière cookies | Bandeau conforme CNIL (« Tout refuser » aussi visible que « Tout accepter »), choix gardé 6 mois, « Gérer les cookies » dans le pied de page |
| 6 | Meta title | Titre et description propres à chaque page, y compris chaque jeu (« Mines gratuit en ligne · NovaCasino ») |
| 7 | Image réseaux | `og-image.jpg` (1200×630), balises Open Graph et Twitter complètes, avec texte alternatif |
| 8 | Favicon | `favicon.ico`, `favicon.svg`, icône Apple, icônes d'application 192/512 et manifest (installable sur téléphone) |
| 9 | Sitemap + robots.txt | Générés à chaque construction avec ton domaine |
| 10 | Textes des images | Toutes les icônes et tous les boutons ont un libellé lisible par les lecteurs d'écran ; les illustrations décoratives sont masquées |
| 11 | Compresser les images | Image de partage en JPEG (105 Ko), police hébergée et découpée (55 Ko), CSS et JS minifiés, compression gzip côté serveur |
| 12 | Vitesse des pages | Héros affiché avant le JavaScript, travail secondaire différé, fichiers versionnés et mis en cache un an |
| 13 | Contraste | Toutes les couleurs de texte vérifiées au ratio AA (4,5:1) : gris, boutons, avatars, roulette |
| 14 | Site responsive | Testé en 375 px : barre d'onglets, jeux au-dessus des commandes, fenêtres en panneau bas |
| 15 | Page 404 | Page 404 du serveur et page 404 dans l'application (lien de jeu inexistant) |
| 16 | Liens cassés | Vérification automatique à chaque construction : liens internes, ancres, routes des jeux et liens externes |
| 17 | Formulaires validés | Pseudo vérifié en direct (longueur, caractères, pseudo interdit, doublon), mise vérifiée (montant, solde), erreurs reliées aux champs |
| 18 | Anti-spam | Chat : cadence limitée, pause après une rafale, doublons, liens, numéros et e-mails bloqués, insultes masquées. Inscription : champ piège et délai minimum |
| 19 | Outil d'analytics | Plausible (sans cookie) prêt : mets ton domaine dans `analytics.plausibleDomain`. Il ne se charge qu'après accord |
| 20 | Un seul CTA | Un bouton principal par écran : « Tourner ma roue gratuite » ou « Jouer gratuitement » ; les autres liens sont discrets |

## Scores Lighthouse mesurés en local

| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|
| Accueil, mobile | 93 | 100 | 100 | 100 |
| Accueil, ordinateur | 100 | 100 | 100 | 100 |
| Mentions légales, mobile | 100 | 100 | 100 | 100 |

## Ce qu'il te reste à faire

- Remplir `site.config.json`, puis relancer `npm run build`.
- Relire les pages légales : c'est un modèle sérieux, pas un avis juridique. Pour un site sur le thème des jeux d'argent, une relecture par un juriste est conseillée.
- Déclarer le site dans Google Search Console et y envoyer `sitemap.xml`.
- Optionnel : créer un compte Plausible (payant après la période d'essai) pour activer la mesure d'audience.

## Limites à connaître

- Les jeux sont des pages internes (`#/jeu/dice`) : Google indexe l'accueil et les pages légales, pas chaque jeu séparément.
- Le chat, les paris en direct et les gagnants du tirage sont simulés. L'anti-spam agit dans le navigateur : un vrai chat entre joueurs demandera une modération côté serveur.
- La sauvegarde reste dans le navigateur de chaque appareil. Pour passer du PC au téléphone : « Sauvegarde », puis « Copier le code ».

## Où modifier quoi

| Dossier ou fichier | Rôle |
|---|---|
| `src/index.template.html` | Structure de la page d'accueil |
| `src/pages/` | Pages légales et 404 |
| `src/0*.css` | Styles |
| `src/05*.js` | Cœur, profils, pages, tirage, consentement |
| `src/06-art.js` à `src/09b-slots.js` | Illustrations et jeux |
| `src/static/` | Police, icônes, image de partage |
| `tools/build.mjs` | Construction de `dist/` et contrôles |
| `tools/make-images.mjs` | Régénère l'image de partage et les icônes (Edge requis) |

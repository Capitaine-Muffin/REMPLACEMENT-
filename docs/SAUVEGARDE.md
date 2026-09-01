# Sauvegarder ses données sur un compte

L'application enregistre tout **sur l'appareil**. C'est volontaire : on peut
saisir une visite sans réseau. Mais si le téléphone est perdu ou si le
navigateur est nettoyé, les journées partent avec.

Deux filets existent :

1. **Le fichier de sauvegarde** — Réglages → « Enregistrer une sauvegarde ».
   Rien à installer, ça marche tout de suite. À refaire de temps en temps.
2. **Le compte** — on se connecte, et les journées repartent toutes seules vers
   un serveur. C'est ce que décrit la suite. Le code est déjà écrit ; il reste
   à créer le serveur, une fois pour toutes.

Aucune donnée médicale ni identité de patiente ne circule : uniquement des
cotations, des quantités et des montants.

---

## Ce qu'il faut faire, une seule fois

Compter une vingtaine de minutes. Tout est gratuit.

### 1. Créer le serveur (Supabase)

- Aller sur <https://supabase.com>, créer un compte, puis **New project**.
- **Région : une région européenne** (Frankfurt ou Paris). C'est important pour
  le RGPD.
- Choisir un mot de passe de base de données et le garder de côté.

### 2. Créer les tables

- Dans le projet, ouvrir **SQL Editor**.
- Copier tout le contenu du fichier [`supabase/schema.sql`](../supabase/schema.sql)
  de ce dépôt, le coller, puis **Run**.
- Le script peut être relancé plus tard sans rien casser : il ne recrée que ce
  qui manque.

### 3. Dire au serveur où revenir après la connexion

- **Authentication → URL Configuration**.
- **Site URL** et **Redirect URLs** : l'adresse de l'application,
  `https://capitaine-muffin.github.io/REMPLACEMENT-/`
  (à vérifier dans l'onglet **Settings → Pages** du dépôt GitHub).
- Sans cette étape, le lien reçu par e-mail ramène sur une page d'erreur.

### 4. Récupérer les deux clés

- **Project Settings → API**.
- Noter **Project URL** et la clé **anon public**.
- La clé `anon` est faite pour vivre dans une page web : elle ne donne accès à
  rien toute seule. Le cloisonnement entre utilisatrices est assuré côté
  serveur par les règles RLS du script SQL.

### 5. Donner les clés à GitHub

- Dépôt GitHub → **Settings → Secrets and variables → Actions**.
- **New repository secret**, deux fois :
  - `SUPABASE_URL` = le Project URL
  - `SUPABASE_ANON_KEY` = la clé anon public
- Onglet **Actions** → relancer « Mise en ligne ».

Une fois le site remis en ligne, la carte **Mon compte** apparaît dans les
Réglages.

---

## Se connecter

### Par e-mail (le plus simple)

Rien de plus à régler : le mode e-mail est actif par défaut sur un projet
Supabase. On saisit son adresse, on reçoit un lien, on l'ouvre — c'est tout.

Deux limites à connaître : le service d'envoi fourni par Supabase est bridé à
quelques messages par heure, et le message atterrit parfois dans les
indésirables.

### Par Google (facultatif)

Le bouton « Se connecter avec Google » n'est actif qu'après avoir créé des
identifiants OAuth dans la Google Cloud Console, puis les avoir collés dans
**Authentication → Providers → Google** côté Supabase. C'est la partie la plus
technique de l'installation, et elle n'apporte rien de plus que le lien par
e-mail : on peut la sauter.

---

## Ce qui se passe ensuite

- Tout continue d'être écrit **d'abord sur l'appareil**, puis envoyé au compte.
  Sans réseau, la saisie fonctionne normalement.
- À la première connexion sur un deuxième appareil, si les deux côtés
  contiennent des journées, l'application ne fusionne rien toute seule : elle
  demande laquelle des deux versions garder.
- « Se déconnecter » ne supprime rien, ni sur l'appareil ni sur le compte.

# Remplacement — l'appli des sages-femmes remplaçantes

Remplace la feuille Word journalière : tu notes tes actes, l'appli calcule la
rétrocession et te sort un récapitulatif à la fin du mois.

👉 **L'application est ici : https://capitaine-muffin.github.io/REMPLACEMENT-/**

Elle se met à jour toute seule à chaque modification du code.

---

## À quoi ça sert

Chaque jour, tu ajoutes ce que tu as fait : les actes avec leur cotation, la
majoration si c'était un dimanche ou un jour férié, tes indemnités de
déplacement et tes kilomètres. L'appli affiche tout de suite :

- **le total encaissé** dans la journée ;
- **la rétrocession** à reverser à la titulaire ;
- **ce qu'il te reste**, à toi.

À la fin du mois, l'onglet **Mois** rassemble tout, contrat par contrat, prêt à
être envoyé, imprimé ou exporté vers Excel.

## Les cinq onglets, en une phrase chacun

| Onglet | Ce que tu y fais |
| --- | --- |
| **Jour** | Tu notes tes actes de la journée. C'est l'écran que tu utiliseras 95 % du temps. Le calendrier met en gras les jours déjà saisis. |
| **Mois** | Tu vois le récapitulatif du mois et tu l'exportes. |
| **Contrats** | Tu règles ton pourcentage de rétrocession, pour chaque cabinet que tu remplaces. |
| **Tarifs** | Tu corriges les montants et tu ajoutes tes propres actes. |
| **Réglages** | Ton prénom, ta mise de côté, et la sauvegarde de tes données. |

Dans **Contrats**, la poignée à gauche de chaque contrat permet de les remettre
dans l'ordre voulu, au doigt ou avec les flèches haut et bas. Cet ordre est
celui des pastilles sur ta journée, et le premier contrat est celui proposé
d'office.

## Le point important : ce qui rentre dans les 30 %

Selon le contrat, la rétrocession se calcule sur les actes seuls, ou aussi sur
les majorations, les indemnités de déplacement (ID) et les indemnités
kilométriques (IK).

Dans l'onglet **Contrats**, trois cases à cocher règlent ça une bonne fois pour
toutes. Les actes cotés sont toujours comptés ; le reste, c'est toi qui décides.
Sur la feuille du jour, les lignes qui ne rentrent pas dans le calcul sont
marquées « hors assiette », pour qu'il n'y ait jamais de doute.

## Les dépassements d'honoraires

Deux niveaux, pour ne pas avoir à tout ressaisir :

1. **Onglet Tarifs** : le tarif normal d'un acte, celui que tu utilises partout.
2. **Contrats → Tarifs spécifiques à ce contrat** : le tarif d'un cabinet qui
   pratique des dépassements. Il ne s'applique qu'à ce contrat-là.

Et si un jour un acte est facturé différemment, tu peux aussi changer le tarif
directement sur la ligne, sans rien modifier ailleurs.

## La valeur de la lettre clé : un seul chiffre à tenir à jour

Un acte de sage-femme n'a pas un prix figé : il a une **cotation** (par exemple
SF 7,5) et son tarif vaut *coefficient × valeur de la lettre clé*. C'est comme
ça que l'appli fonctionne.

Concrètement, la rééducation périnéale est cotée SF 7,5 :

| Valeur de SF | Tarif de la séance |
| --- | --- |
| 2,80 € (avant février 2024) | 21,00 € |
| 3,10 € (février 2024) | 23,25 € |
| 3,20 € (1ᵉʳ janvier 2025) | **24,00 €** |

Quand la convention revalorise la lettre clé, tu changes **un seul chiffre**
dans l'onglet Tarifs, et tous tes actes se recalculent. Les journées déjà
saisies, elles, gardent leur montant d'origine : une revalorisation ne réécrit
jamais le passé.

Certains montants ne suivent pas de coefficient (consultation, majorations,
IFD, IK) : ceux-là sont saisis en montant fixe, et se modifient directement.

## D'où viennent les tarifs

Le catalogue livré — 76 actes — provient intégralement de la grille de l'ONSSF
*« Les actes et cotations des sages-femmes en NGAP et CCAM en métropole »*,
avenant 7 applicable au 22/02/2024. Aucun montant n'est déduit, arrondi ni
reconstitué : chaque acte porte sa provenance, consultable en l'ouvrant.

**La seule valeur qui en diffère** est celle des lettres clés SF et SP, à
3,10 € sur cette grille de février 2024 et portées à **3,20 €** au 1ᵉʳ janvier
2025 par la seconde étape du même avenant. C'est aussi le seul chiffre à
reprendre lors d'une revalorisation : les 30 actes cotés au coefficient
suivent d'eux-mêmes.

Corriger un montant, ou appuyer sur « Marquer comme vérifié », le protège des
mises à jour ultérieures du catalogue livré.

### Une règle inscrite dans le catalogue

Le MD ne se cumule ni avec F, ni avec N, ni avec MM : il faut alors prendre
MDD, MDN ou MDI selon l'heure. La note figure sur les quatre lignes
concernées, là où la question se pose.

## Vie privée

L'appli ne contient **aucune donnée de santé** : ni nom de patiente, ni date de
naissance, ni motif de consultation. Uniquement des cotations, des quantités et
des montants. C'est un choix volontaire : cela évite les obligations liées à
l'hébergement de données de santé (HDS).

**Il est interdit d'y inscrire une donnée médicale ou une donnée permettant
d'identifier une patiente**, y compris dans le champ de notes. Toute
information saisie doit être anonymisée par le professionnel de santé qui la
renseigne : c'est la condition qui maintient l'application hors du régime des
données de santé.

Par défaut, tout est enregistré **sur ton téléphone uniquement**, et rien n'est
envoyé sur Internet. L'appli fonctionne donc sans réseau, y compris en visite à
domicile. Pense à faire une sauvegarde de temps en temps (Réglages → Enregistrer
une sauvegarde) : si tu changes de téléphone, les données ne suivent pas toutes
seules.

---

## Pour installer l'appli sur ton téléphone

Ouvre https://capitaine-muffin.github.io/REMPLACEMENT-/ dans le navigateur,
puis :

- **iPhone** (Safari) : bouton Partager → « Sur l'écran d'accueil ».
- **Android** (Chrome) : menu ⋮ → « Ajouter à l'écran d'accueil ».

Elle s'ouvrira ensuite comme une vraie application, en plein écran.

---

## Partie technique

### Démarrer

```bash
npm install
npm run dev        # développement
npm test           # tests des calculs
npm run build      # version de production dans dist/
```

Aucun serveur n'est nécessaire : `dist/` est un site statique. Il est publié sur
GitHub Pages par `.github/workflows/pages.yml`, à chaque poussée sur la branche
de développement — les tests tournent avant, une version aux calculs cassés ne
part pas en ligne.

### Organisation du code

```
src/domain/     Modèle et règles métier (calculs, catalogue, jours fériés)
src/storage/    Persistance interchangeable : local, ou Supabase
src/store/      État de l'application (React Context)
src/pages/      Un fichier par onglet
src/export/     CSV, sauvegarde JSON, résumé à copier
supabase/       Schéma SQL + règles de sécurité (RLS)
```

Le cœur du produit est `src/domain/calcul.ts` : c'est le seul endroit où
l'argent est calculé, et il est couvert par des tests (`npm test`).

### Le compte : connexion Google et synchronisation

L'application est *local-first* : sans compte, elle fonctionne entièrement
hors-ligne et tout reste sur l'appareil. Le compte ne change pas ce
fonctionnement — il ajoute une copie sur le serveur, pour retrouver ses données
en changeant de téléphone.

Tant que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont absents, la carte
« Mon compte » ne s'affiche pas et la librairie Supabase n'est même pas
téléchargée par le navigateur : elle est chargée à la demande, dans un fragment
séparé.

#### Mise en service, une fois

1. **Créer un projet Supabase en région européenne** (Frankfurt ou Paris). La
   région compte : les données restent en Europe, ce qui est la condition RGPD.
2. **Exécuter `supabase/schema.sql`** dans le SQL Editor du projet. Il crée les
   tables, l'isolation par utilisatrice (RLS) et l'horodatage automatique.
3. **Activer Google** dans Authentication → Providers. Supabase demande un
   *Client ID* et un *Client Secret* à créer dans la Google Cloud Console
   (APIs & Services → Credentials → OAuth client ID, type « Web »). L'URL de
   redirection autorisée à donner à Google est celle qu'affiche Supabase, de la
   forme `https://<projet>.supabase.co/auth/v1/callback`.
4. **Déclarer l'adresse du site** dans Authentication → URL Configuration :
   `https://capitaine-muffin.github.io/REMPLACEMENT-/` en *Site URL* et en
   *Redirect URL*. Sans cela, la connexion revient sur la mauvaise page.
5. **Renseigner les clés.** En local : copier `.env.example` en `.env.local`.
   Pour le site publié : dans GitHub, Settings → Secrets and variables →
   Actions, créer `SUPABASE_URL` et `SUPABASE_ANON_KEY`. Le workflow les injecte
   au moment de la construction.

La clé *anon* est publique par nature : elle est incluse dans le code envoyé au
navigateur. Ce sont les règles RLS qui protègent les données, en interdisant à
chaque compte de voir autre chose que ses propres lignes.

#### Ce que fait la synchronisation

À la connexion, l'application compare les deux côtés :

- **compte vide** → les données locales y sont transférées ;
- **rien de saisi en local** → celles du compte sont adoptées sans question ;
- **des journées des deux côtés** → l'utilisatrice choisit laquelle des deux
  versions garder. Rien n'est fusionné automatiquement : deux journées saisies
  séparément pour la même date produiraient des doublons silencieux dans une
  comptabilité, ce qui est pire que de trancher.

Ensuite, chaque modification est renvoyée vers le compte après un court délai.
L'écriture locale, elle, reste immédiate et inconditionnelle : perdre le réseau
n'interrompt jamais la saisie.

**Limite connue :** la résolution se fait au dernier écrivain. Deux appareils
modifiant la même journée hors-ligne, l'un écrasera l'autre. Pour un usage
personnel sur un téléphone et un ordinateur, c'est sans conséquence.

### Abonnement

Rien n'est branché pour l'instant. Deux pistes selon la cible :

- **Web uniquement** : Stripe en direct, le plus simple.
- **Web + apps iOS/Android** (via Capacitor par exemple) : RevenueCat prend tout
  son sens, car il unifie StoreKit, Play Billing et le web.

Dans les deux cas, la vérification d'abonnement se branche au même endroit que
l'authentification, autour du `Depot`.

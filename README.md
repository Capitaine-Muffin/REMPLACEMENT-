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
| **Jour** | Tu notes tes actes de la journée. C'est l'écran que tu utiliseras 95 % du temps. |
| **Mois** | Tu vois le récapitulatif du mois et tu l'exportes. |
| **Contrats** | Tu règles ton pourcentage de rétrocession, pour chaque cabinet que tu remplaces. |
| **Tarifs** | Tu corriges les montants et tu ajoutes tes propres actes. |
| **Réglages** | Ton prénom, ta mise de côté, et la sauvegarde de tes données. |

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

## ⚠️ Les tarifs de départ sont à vérifier

L'appli est livrée avec les cotations sage-femme courantes déjà remplies, pour
t'éviter une longue saisie au démarrage. **Ce sont des valeurs indicatives.**
Les montants conventionnels changent au fil des avenants : vérifie-les avec la
NGAP en vigueur et corrige-les dans l'onglet Tarifs. Tout est modifiable.

## Vie privée

L'appli ne contient **aucune donnée de santé** : ni nom de patiente, ni date de
naissance, ni motif de consultation. Uniquement des cotations, des quantités et
des montants. C'est un choix volontaire : cela évite les obligations liées à
l'hébergement de données de santé (HDS). Évite d'écrire un nom dans les notes.

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

### Synchronisation multi-appareils (facultative)

L'application est *local-first* : elle fonctionne entièrement hors-ligne, sans
compte. Pour ajouter la synchronisation :

1. Créer un projet Supabase **en région européenne** (RGPD).
2. Exécuter `supabase/schema.sql` dans le SQL Editor : tables, isolation par
   utilisatrice (RLS) et horodatage automatique.
3. Copier `.env.example` en `.env.local` et renseigner `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY`.

Tant que ces variables sont absentes, la librairie Supabase n'est même pas
téléchargée par le navigateur (import dynamique). L'écriture de l'écran de
connexion reste à faire : `DepotSupabase` attend un `userId` et sait déjà lire
et écrire toutes les données.

### Abonnement

Rien n'est branché pour l'instant. Deux pistes selon la cible :

- **Web uniquement** : Stripe en direct, le plus simple.
- **Web + apps iOS/Android** (via Capacitor par exemple) : RevenueCat prend tout
  son sens, car il unifie StoreKit, Play Billing et le web.

Dans les deux cas, la vérification d'abonnement se branche au même endroit que
l'authentification, autour du `Depot`.

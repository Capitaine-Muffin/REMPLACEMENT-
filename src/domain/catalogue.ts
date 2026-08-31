import type { ActeCatalogue, LettreCle } from './types'

/**
 * Catalogue livré à la première ouverture.
 *
 * TOUTES les valeurs proviennent de la grille de l'ONSSF « Les actes et
 * cotations des sages-femmes en NGAP et CCAM en métropole », avenant 7
 * applicable au 22/02/2024, fournie par une sage-femme en exercice. Aucun
 * chiffre n'est déduit, arrondi ou reconstitué.
 *
 * Les actes cotés au coefficient suivent la valeur de la lettre clé, réglée
 * dans l'écran Tarifs : une revalorisation se répercute alors sur tout le
 * catalogue en une seule saisie.
 */
export const SOURCE = 'Grille ONSSF, avenant 7 applicable au 22/02/2024'

/** Un acte dont le montant n'a encore été confirmé par personne. */
export const aVerifier = (acte: Pick<ActeCatalogue, 'verifie'>) => !acte.verifie

export const LETTRE_SF = 'lc-sf'
export const LETTRE_SP = 'lc-sp'
export const LETTRE_TFS = 'lc-tfs'

/** Lettres clés livrées par défaut. */
export function lettresClesParDefaut(): LettreCle[] {
  return [
    // 3,10 € sur la grille de février 2024, portées à 3,20 € au 1er janvier
    // 2025 par la seconde étape de l'avenant 7. C'est le seul chiffre à
    // reprendre lors d'une revalorisation : tous les actes cotés suivent.
    { id: LETTRE_SF, code: 'SF', libelle: 'Actes obstétricaux spécifiques des sages-femmes', valeur: 3.2 },
    { id: LETTRE_SP, code: 'SP', libelle: 'Actes postnataux spécifiques des sages-femmes', valeur: 3.2 },
    { id: LETTRE_TFS, code: 'TFS', libelle: 'Actes à distance des sages-femmes', valeur: 2.8 },
  ]
}

interface Defaut {
  id: string
  code: string
  libelle: string
  categorie: ActeCatalogue['categorie']
  /** Cotation au coefficient : [lettre clé, coefficient]. */
  cotation?: [string, number]
  /** Montant fixe, pour ce qui n'est pas coté au coefficient. */
  forfait?: number
  /** Sous-ensemble du catalogue, pour la navigation seulement. */
  famille?: ActeCatalogue['famille']
  unite?: 'acte' | 'km'
  favori?: boolean
  note?: string
}

const DEFAUTS: Defaut[] = [
  // --- Consultations ------------------------------------------------------
  { id: 'consultation', code: 'C+MSF', libelle: 'Consultation ou visite', categorie: 'acte', forfait: 26.5, favori: true },
  { id: 'teleconsultation', code: 'TCG', libelle: 'Téléconsultation', categorie: 'acte', forfait: 25 },
  { id: 'teleexpertise-requerante', code: 'RQD', libelle: 'Téléexpertise, sage-femme requérante', categorie: 'acte', forfait: 10 },
  { id: 'teleexpertise-requise', code: 'TE2', libelle: 'Téléexpertise, sage-femme requise', categorie: 'acte', forfait: 20 },
  { id: 'ccp', code: 'CCP', libelle: 'Première consultation de contraception et de prévention (avant 26 ans)', categorie: 'acte', forfait: 47.5 },
  { id: 'bilan-prevention-ages-cles', code: 'RDV', libelle: 'Bilan de prévention aux âges clés de la vie', categorie: 'acte', forfait: 30 },

  // --- Grossesse ----------------------------------------------------------
  { id: 'bilan-prenatal', code: 'SF', libelle: 'Bilan prénatal de prévention', categorie: 'acte', cotation: [LETTRE_SF, 12.6] },
  { id: 'pnp-premiere', code: 'SF', libelle: 'Première préparation à la naissance, individuel ou couple', categorie: 'acte', cotation: [LETTRE_SF, 15] },
  { id: 'pnp-individuel', code: 'SF', libelle: 'Préparation à la naissance, en individuel', categorie: 'acte', cotation: [LETTRE_SF, 12], favori: true },
  { id: 'pnp-2-3', code: 'SF', libelle: 'Préparation à la naissance, 2 à 3 personnes ou couples', categorie: 'acte', cotation: [LETTRE_SF, 11.6] },
  { id: 'pnp-4-6', code: 'SF', libelle: 'Préparation à la naissance, 4 à 6 personnes ou couples', categorie: 'acte', cotation: [LETTRE_SF, 6] },
  { id: 'surveillance-patho-avant-24sa', code: 'SF', libelle: 'Surveillance de grossesse pathologique, avant 24 SA', categorie: 'acte', cotation: [LETTRE_SF, 9] },
  { id: 'surveillance-patho-apres-24sa', code: 'SF', libelle: 'Surveillance après 24 SA, grossesse unique', categorie: 'acte', cotation: [LETTRE_SF, 15.6] },
  { id: 'surveillance-patho-apres-24sa-multiple', code: 'SF', libelle: 'Surveillance après 24 SA, grossesse multiple', categorie: 'acte', cotation: [LETTRE_SF, 22.6] },
  { id: 'monitoring-simple', code: 'SF', libelle: 'Monitoring, grossesse simple', categorie: 'acte', cotation: [LETTRE_SF, 12.5] },
  { id: 'monitoring-multiple', code: 'SF', libelle: 'Monitoring, grossesse multiple', categorie: 'acte', cotation: [LETTRE_SF, 19.5] },

  // --- Accouchement -------------------------------------------------------
  { id: 'forfait-astreinte', code: 'FA', libelle: "Forfait d'astreinte hebdomadaire, accouchement en plateau technique", categorie: 'acte', forfait: 80 },
  { id: 'surveillance-travail-mdn', code: '2FMN', libelle: 'Surveillance du travail, accouchement en maison de naissance', categorie: 'acte', forfait: 300 },
  { id: 'surveillance-postpartum-mdn', code: '1FMN', libelle: 'Surveillance du post-partum, accouchement en maison de naissance', categorie: 'acte', forfait: 150 },

  // --- Surveillance à domicile (sortie précoce) ---------------------------
  {
    id: 'vad-2-premiers', code: 'SF',
    libelle: 'Surveillance à domicile mère et enfant, 2 premiers forfaits, unique',
    categorie: 'acte', cotation: [LETTRE_SF, 16.5], favori: true,
    note: '4 premiers en cas de sortie entre J0 et J1',
  },
  {
    id: 'vad-2-premiers-multiple', code: 'SF',
    libelle: 'Surveillance à domicile mère et enfant, 2 premiers forfaits, multiple',
    categorie: 'acte', cotation: [LETTRE_SF, 23],
    note: '4 premiers en cas de sortie entre J0 et J1',
  },
  { id: 'vad-suivants', code: 'SF', libelle: 'Surveillance à domicile mère et enfant, forfaits suivants, unique', categorie: 'acte', cotation: [LETTRE_SF, 12], favori: true },
  { id: 'vad-suivants-multiple', code: 'SF', libelle: 'Surveillance à domicile mère et enfant, forfaits suivants, multiple', categorie: 'acte', cotation: [LETTRE_SF, 17] },
  { id: 'visite-postpartum-precoce', code: '+DSP', libelle: 'Première visite post-partum précoce', categorie: 'majoration', forfait: 25 },
  { id: 'visite-postpartum-ultra-precoce', code: '+MS', libelle: 'Première visite post-partum ultra-précoce', categorie: 'majoration', forfait: 30 },

  // --- Suites de couches --------------------------------------------------
  { id: 'epnp-cabinet', code: 'SP', libelle: 'Entretien postnatal précoce, au cabinet', categorie: 'acte', cotation: [LETTRE_SP, 12] },
  { id: 'epnp-domicile', code: 'SP', libelle: 'Entretien postnatal précoce, à domicile', categorie: 'acte', cotation: [LETTRE_SP, 14] },
  { id: 'postnatale-individuel', code: 'SP', libelle: 'Séance postnatale, en individuel', categorie: 'acte', cotation: [LETTRE_SP, 9] },
  { id: 'postnatale-2-3', code: 'SP', libelle: 'Séance postnatale, 2 à 3 personnes ou couples', categorie: 'acte', cotation: [LETTRE_SP, 7] },
  { id: 'postnatale-4-6', code: 'SP', libelle: 'Séance postnatale, 4 à 6 personnes ou couples', categorie: 'acte', cotation: [LETTRE_SP, 6] },
  { id: 'reeducation-perineale', code: 'SF', libelle: 'Rééducation périnéale', categorie: 'acte', cotation: [LETTRE_SF, 7.5], favori: true },

  // --- Cotations libres ---------------------------------------------------
  { id: 'sf-libre', code: 'SF', libelle: 'SF au coefficient libre', categorie: 'acte', cotation: [LETTRE_SF, 1], note: 'Mets le coefficient que tu veux' },
  { id: 'sp-libre', code: 'SP', libelle: 'SP au coefficient libre', categorie: 'acte', cotation: [LETTRE_SP, 1], note: 'Mets le coefficient que tu veux' },

  // --- Majorations d'urgence ----------------------------------------------
  {
    id: 'majoration-dimanche-ferie', code: 'F',
    libelle: "Majoration pour soins d'urgence, dimanche et jour férié",
    categorie: 'majoration', forfait: 21,
    note: 'Étendue au samedi après 12 h pour les actes obstétricaux urgents',
  },
  { id: 'majoration-nuit', code: 'N', libelle: "Majoration pour soins d'urgence, 20 h - 0 h et 6 h - 8 h", categorie: 'majoration', forfait: 35 },
  { id: 'majoration-nuit-profonde', code: 'MM', libelle: "Majoration pour soins d'urgence, 0 h - 6 h", categorie: 'majoration', forfait: 40 },
  { id: 'majoration-sas', code: 'SNP', libelle: 'Majoration pour soins non programmés régulés par le SAS', categorie: 'majoration', forfait: 15 },

  // --- Frais de déplacement ------------------------------------------------
  // Le MD ne se cumule pas avec F, N ou MM : il faut alors prendre MDD, MDN
  // ou MDI selon l'heure. C'est écrit sur chaque ligne concernée.
  { id: 'if-deplacement', code: 'IF', libelle: 'Indemnité forfaitaire de déplacement', categorie: 'id', forfait: 4 },
  {
    id: 'md-deplacement', code: 'MD',
    libelle: 'Majoration pour déplacement médicalement justifié',
    categorie: 'id', forfait: 10, favori: true,
    note: 'Ne se cumule pas avec F, N ou MM : prendre alors MDD, MDN ou MDI',
  },
  { id: 'mdd-deplacement', code: 'MDD', libelle: 'Déplacement le dimanche et jour férié', categorie: 'id', forfait: 22.6, favori: true, note: 'Remplace MD, ne s\'y ajoute pas' },
  { id: 'mdn-deplacement', code: 'MDN', libelle: 'Déplacement de 20 h à 0 h et de 6 h à 8 h', categorie: 'id', forfait: 38.5, note: 'Remplace MD, ne s\'y ajoute pas' },
  { id: 'mdi-deplacement', code: 'MDI', libelle: 'Déplacement de 0 h à 6 h', categorie: 'id', forfait: 43.5, note: 'Remplace MD, ne s\'y ajoute pas' },
  { id: 'ik-plaine', code: 'IK', libelle: 'Indemnité kilométrique en plaine', categorie: 'ik', forfait: 0.61, unite: 'km', favori: true },
  { id: 'ik-montagne', code: 'IKM', libelle: 'Indemnité kilométrique en montagne', categorie: 'ik', forfait: 0.91, unite: 'km' },
  { id: 'ik-pied-ski', code: 'IK', libelle: 'Indemnité kilométrique à pied ou à ski', categorie: 'ik', forfait: 4.57, unite: 'km' },

  // --- Actes CCAM ----------------------------------------------------------
  { id: 'ccam-pose-implant', code: 'QZLA004', libelle: "Pose d'implant", categorie: 'acte', forfait: 17.99, favori: true },
  { id: 'ccam-retrait-implant', code: 'QZGA002', libelle: "Ablation ou changement d'implant", categorie: 'acte', forfait: 41.8, favori: true },
  { id: 'ccam-pose-diu', code: 'JKLD001', libelle: "Pose d'un DIU", categorie: 'acte', forfait: 38.4, favori: true },
  { id: 'ccam-changement-diu', code: 'JKKD001', libelle: "Changement d'un DIU", categorie: 'acte', forfait: 38.4 },
  { id: 'ccam-frottis', code: 'JKHD001', libelle: 'Prélèvement cervico-vaginal', categorie: 'acte', forfait: 12.46, favori: true },

  // --- Échographies --------------------------------------------------------
  { id: 'echo-petit-bassin-ovulation', code: 'ZCQM007', libelle: "Échographie du petit bassin, surveillance de l'ovulation", categorie: 'acte', forfait: 37.8, famille: 'echographie' },
  { id: 'echo-doppler-ovulation', code: 'ZCQM009', libelle: "Échographie-doppler, surveillance de l'ovulation", categorie: 'acte', forfait: 42.25, famille: 'echographie' },
  { id: 'echo-avant-11sa', code: 'JNQM001', libelle: 'Échographie avant 11 SA', categorie: 'acte', forfait: 35.65, famille: 'echographie' },
  { id: 'echo-t1-uni', code: 'JQQM010', libelle: 'Échographie uni-embryonnaire au 1er trimestre', categorie: 'acte', forfait: 61.47, famille: 'echographie' },
  { id: 'echo-t1-multi', code: 'JQQM015', libelle: 'Échographie multi-embryonnaire au 1er trimestre', categorie: 'acte', forfait: 71.57, famille: 'echographie' },
  { id: 'echo-t2-uni', code: 'JQQM018', libelle: 'Échographie unifœtale au 2e trimestre', categorie: 'acte', forfait: 100.2, famille: 'echographie' },
  { id: 'echo-t2-multi', code: 'JQQM019', libelle: 'Échographie multifœtale au 2e trimestre', categorie: 'acte', forfait: 154.09, famille: 'echographie' },
  { id: 'echo-t3-uni', code: 'JQQM016', libelle: 'Échographie unifœtale au 3e trimestre', categorie: 'acte', forfait: 100.2, famille: 'echographie' },
  { id: 'echo-t3-multi', code: 'JQQM017', libelle: 'Échographie multifœtale au 3e trimestre', categorie: 'acte', forfait: 154.09, famille: 'echographie' },
  { id: 'echo-souffrance-uni', code: 'JQQM002', libelle: 'Échographie unifœtale avec doppler pour souffrance fœtale', categorie: 'acte', forfait: 92.19, famille: 'echographie' },
  { id: 'echo-souffrance-multi', code: 'JQQM007', libelle: 'Échographie multifœtale avec doppler pour souffrance fœtale', categorie: 'acte', forfait: 133.81, famille: 'echographie' },
  { id: 'echo-croissance', code: 'JQQM001', libelle: 'Échographie de surveillance de la croissance fœtale', categorie: 'acte', forfait: 46.15, famille: 'echographie' },
  { id: 'echo-croissance-doppler', code: 'JQQM003', libelle: 'Échographie de croissance avec artères utérines et vaisseaux du fœtus', categorie: 'acte', forfait: 75.6, famille: 'echographie' },
  { id: 'echo-col', code: 'JQQJ037', libelle: 'Mesure du col par échographie par voie vaginale', categorie: 'acte', forfait: 33.44, famille: 'echographie' },
  { id: 'echo-doppler-transcut-cavitaire', code: 'ZCQJ001', libelle: 'Échographie-doppler transcutanée et par voie cavitaire du petit bassin', categorie: 'acte', forfait: 69.93, famille: 'echographie' },
  { id: 'echo-doppler-cavitaire', code: 'ZCQJ002', libelle: 'Échographie-doppler du petit bassin par voie cavitaire', categorie: 'acte', forfait: 69.93, famille: 'echographie' },
  { id: 'echo-cavitaire', code: 'ZCQJ003', libelle: 'Échographie du petit bassin par voie cavitaire', categorie: 'acte', forfait: 52.45, famille: 'echographie' },
  { id: 'echo-transcut-cavitaire', code: 'ZCQJ006', libelle: 'Échographie transcutanée et par voie cavitaire du petit bassin', categorie: 'acte', forfait: 56.7, famille: 'echographie' },
  { id: 'echo-transcut', code: 'ZCQM003', libelle: 'Échographie transcutanée du petit bassin', categorie: 'acte', forfait: 52.45, famille: 'echographie' },

  // --- Forfait IVG (applicable au 01/03/2024) ------------------------------
  { id: 'ivg-consentement', code: 'IC', libelle: 'Consultation de recueil de consentement et de contrôle', categorie: 'acte', forfait: 26.5, famille: 'ivg' },
  { id: 'ivg-consentement-teleconsultation', code: 'JC', libelle: 'Consultation de recueil de consentement et de contrôle, en téléconsultation', categorie: 'acte', forfait: 25, famille: 'ivg' },
  { id: 'ivg-echo-pre', code: 'IPE', libelle: 'Vérification échographique pré-IVG', categorie: 'acte', forfait: 35.65, famille: 'ivg' },
  { id: 'ivg-forfait-consultations', code: 'FHV', libelle: 'Forfait consultations de ville', categorie: 'acte', forfait: 74, famille: 'ivg' },
  { id: 'ivg-medicaments-avant-7sa', code: 'FMV', libelle: 'Forfait médicaments de ville, avant 7 SA', categorie: 'acte', forfait: 83.57, famille: 'ivg' },
  { id: 'ivg-medicaments-apres-7sa', code: 'FMV', libelle: 'Forfait médicaments de ville, après 7 SA', categorie: 'acte', forfait: 96.53, famille: 'ivg' },
  { id: 'ivg-controle-echo', code: 'IVE', libelle: 'Consultation de contrôle avec échographie ultérieure', categorie: 'acte', forfait: 30.24, famille: 'ivg' },
]

/** Construit le catalogue livré par défaut à la première ouverture. */
export function catalogueParDefaut(): ActeCatalogue[] {
  return DEFAUTS.map((d) => ({
    id: `def-${d.id}`,
    code: d.code,
    libelle: d.libelle,
    categorie: d.categorie,
    famille: d.famille,
    tarification: d.cotation ? 'coefficient' : 'forfait',
    lettreCleId: d.cotation?.[0],
    coefficient: d.cotation?.[1],
    tarif: d.forfait ?? 0,
    unite: d.unite ?? 'acte',
    favori: d.favori ?? false,
    archive: false,
    personnalise: false,
    verifie: true,
    source: SOURCE,
    note: d.note,
  }))
}

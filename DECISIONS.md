# Décisions & arbitrages

Le brief laisse volontairement trois zones grises à trancher. Voici mes choix et
leur justification.

---

## 1. Quels champs exactement pour une entreprise vs un particulier ?

**Décision — une seule table `Client` avec un champ discriminant `type`**
(`COMPANY` | `INDIVIDUAL`). Les champs spécifiques à un type sont nullables en
base et rendus obligatoires par type dans l'API.

| Communs (les deux)                      | Entreprise uniquement                                         | Particulier uniquement                              |
| --------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `email` (obligatoire), `phone`, `notes` | `companyName` (obligatoire), `registrationNumber`, `industry` | `firstName` (obligatoire), `lastName` (obligatoire) |

- **Champs obligatoires** : tout client doit avoir un `email` (point de contact
  principal — imposé dans le DTO, le formulaire et via une colonne `NOT NULL`).
  Une entreprise exige en plus une raison sociale (`companyName`) ; un
  particulier exige `firstName` + `lastName`. Le reste (téléphone, notes, numéro
  d'immatriculation, secteur) est optionnel — l'équipe commerciale a rarement
  toutes ces informations dès le départ.
- **Application des règles** : la base garde les colonnes spécifiques nullables,
  et l'API impose les obligations par type via `@ValidateIf` (`class-validator`)
  côté backend et un `superRefine` `zod` côté frontend. Un champ calculé
  `displayName` (raison sociale, ou « Prénom Nom ») donne à l'UI un seul champ à
  afficher.

**Pourquoi une seule table plutôt que les alternatives ?**

- _Tables séparées `Company` / `Individual`_ : contraintes plus propres, mais
  `Opportunity` aurait besoin de deux clés étrangères nullables ou d'une relation
  polymorphe — pénibles à requêter et à agréger. Écarté.
- _Table partagée + deux tables de détail_ : la plus normalisée, mais ajoute des
  jointures et de la complexité injustifiées pour une dizaine de champs.
- Une seule table garde la clé étrangère des opportunités simple (un `clientId`),
  rend triviale l'agrégation « tous clients confondus », et le faible nombre de
  colonnes nullables est un compromis acceptable. Le discriminant est indexé.

---

## 2. Qu'est-ce qu'une opportunité « qui pose problème » (stagnante / en retard) — selon quelle règle ?

**Décision — un statut `health` dérivé à trois valeurs**, calculé (et non stocké)
à partir des dates et de l'étape de l'opportunité :

- **`LATE` (en retard)** — la date de signature prévue (`expectedCloseDate`) est
  passée et l'affaire n'est **pas** close (étape ni `WON` ni `LOST`).
- **`STAGNANT`** — l'affaire n'a pas changé d'étape depuis plus d'un seuil
  configurable (`STAGNANT_THRESHOLD_DAYS`, **14 jours par défaut**) et n'est pas
  close.
- **`OK`** — tout le reste (y compris toute affaire déjà close).

Une opportunité est **« à problème »** lorsque `health !== OK`. **`LATE` est
prioritaire sur `STAGNANT`** quand les deux s'appliquent (une date dépassée est
le signal le plus urgent).

**Règles et choix structurants :**

- **Suivi de la stagnation** : j'ai ajouté un horodatage `stageChangedAt`,
  positionné à la création et mis à jour **uniquement quand l'étape change**.
  Utiliser `updatedAt` serait faux — modifier le montant ou les notes ne doit pas
  réinitialiser le compteur de stagnation.
- **Les affaires closes ne sont jamais « à problème »** : `WON`/`LOST` sont
  terminales ; signaler une affaire close ne serait que du bruit.
- **« En retard » compare des jours calendaires**, pas des horodatages : une
  affaire prévue « aujourd'hui » n'est signalée qu'une fois la journée écoulée.
- **Le seuil est une variable d'environnement** (pas une valeur en dur), car
  « stagnant » est un jugement métier variable selon l'équipe / le cycle de vente.
- **Calculé, non persisté** : le `health` dépend de « maintenant » ; le stocker
  le rendrait obsolète. Il est dérivé à la lecture, et pour la liste/l'agrégation
  il est aussi traduit en clause `where` Prisma afin de filtrer en base plutôt
  qu'en mémoire.

---

## 3. Quel indicateur de pipeline est réellement utile à afficher ?

**Décision — un petit ensemble de KPI plutôt qu'un seul chiffre**, exposé sur
`GET /opportunities/pipeline/summary` :

- **Valeur ouverte totale** — somme des montants des opportunités non terminales.
  Le chiffre phare « combien est en jeu ».
- **Valeur pondérée** — montant de chaque affaire ouverte × une probabilité de
  gain par étape. Une prévision plus honnête que la valeur ouverte brute.
- **Valeur gagnée / perdue** — les issues closes, pour le contexte.
- **Nombre et valeur des affaires à problème** — combien d'affaires (et combien
  d'argent) demandent une attention immédiate. Répond directement au besoin :
  « repérer vite les opportunités qui stagnent ou sont en retard ».
- **Répartition par étape** (nombre + valeur, toutes les étapes) — montre où le
  pipeline est concentré et alimente le graphe « valeur par étape ».

**Probabilités de gain** (`STAGE_PROBABILITY`) : NEW 10 %, QUALIFIED 25 %,
PROPOSAL 50 %, NEGOTIATION 75 %, WON 100 %, LOST 0 %. Volontairement des valeurs
de départ simples — dans un vrai produit elles seraient calibrées sur
l'historique de conversion ; elles sont regroupées dans une seule constante,
faciles à ajuster.

**Pourquoi pas un seul indicateur ?** La « valeur totale du pipeline » seule
masque le risque et la répartition par étape. Cet ensemble tient sur un widget,
ne coûte que deux requêtes d'agrégation (un `groupBy` + un `aggregate` filtré),
et correspond aux questions que se pose réellement un responsable commercial.

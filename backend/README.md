### **Databaseontwerp**
#### **1. Users**
Tabel: `users`
| Kolom           | Type          | Opmerkingen |
|----------------|--------------|------------|
| `id`           | UUID (PK)     | Unieke identificatie voor de gebruiker |
| `email`        | String (Uniek) | Gebruikers e-mailadres |
| `password`     | String (hashed) | Versleuteld wachtwoord |
| `username`     | String        | Gebruikersnaam |
| `profile_pic`  | String (opt.) | URL naar profielfoto |
| `created_at`   | Timestamp     | Registratiedatum |
| `updated_at`   | Timestamp     | Laatst bijgewerkt |

---

#### **2. Poules**
Tabel: `poules`
| Kolom         | Type      | Opmerkingen |
|--------------|----------|------------|
| `id`         | UUID (PK) | Unieke poule-ID |
| `name`       | String    | Naam van de poule |
| `owner_id`   | UUID (FK) | Verwijzing naar `users.id` (beheerder van de poule) |
| `prize`      | String   | Optionele prijs voor de winnaar |
| `created_at` | Timestamp | Aangemaakt op |

---

#### **3. Poule gebruikers (Leden van poules)**
Tabel: `poule_users`
| Kolom        | Type      | Opmerkingen |
|-------------|----------|------------|
| `id`        | UUID (PK) | Unieke ID |
| `poule_id`  | UUID (FK) | Verwijzing naar `poules.id` |
| `user_id`   | UUID (FK) | Verwijzing naar `users.id` |
| `joined_at` | Timestamp | Datum van deelname |

---

#### **4. Voorspellingen (Seizoensvoorspellingen)**
Tabel: `predictions`
| Kolom            | Type      | Opmerkingen |
|-----------------|----------|------------|
| `id`            | UUID (PK) | Unieke ID |
| `user_id`       | UUID (FK) | Verwijzing naar `users.id` |
| `season`        | Int       | Seizoen (bijv. 2025) |
| `champion`      | String    | Voorspelling kampioen |
| `team_champion` | String    | Voorspelling teamkampioen |
| `other_preds`   | JSON      | Andere seizoensvoorspellingen |
| `created_at`    | Timestamp | Aangemaakt op |

---

#### **5. Race voorspellingen**
Tabel: `race_predictions`
| Kolom         | Type      | Opmerkingen |
|--------------|----------|------------|
| `id`         | UUID (PK) | Unieke ID |
| `user_id`    | UUID (FK) | Verwijzing naar `users.id` |
| `race_id`    | Int       | ID van de race (van de API) |
| `top_3`      | JSON      | Voorspelde top 3 |
| `fastest_lap` | String    | Snelste ronde voorspelling |
| `created_at` | Timestamp | Aangemaakt op |

---

#### **6. Scores (Scorebord per Poule)**
Tabel: `scores`
| Kolom        | Type      | Opmerkingen |
|-------------|----------|------------|
| `id`        | UUID (PK) | Unieke ID |
| `poule_id`  | UUID (FK) | Verwijzing naar `poules.id` |
| `user_id`   | UUID (FK) | Verwijzing naar `users.id` |
| `score`     | Int       | Actuele score |
| `updated_at` | Timestamp | Laatst bijgewerkt |
---

## **7. Race resultaten (Resultaten race uit API)**
### **Tabel: `race_results`**
| Kolom       | Type      | Opmerkingen |
|------------|----------|------------|
| `id`       | UUID (PK) | Unieke ID |
| `race_id`  | Int       | ID van de race (van de API) |
| `race_date` | Date      | Datum van de race |
| `winner`   | String    | Winnaar van de race |
| `top_3`    | JSON      | JSON array met de top 3 finishers |
| `fastest_lap` | String | Coureur met de snelste ronde |
| `created_at` | Timestamp | Aangemaakt op |

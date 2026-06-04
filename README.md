# Info-Gram 

> Mini réseau social 

---

## Présentation

Info-Gram est une application web interactive inspirée d'un réseau social simplifié. Elle permet à des utilisateurs de créer un compte, publier des messages, interagir avec d'autres utilisateurs et conserver leurs données dans le navigateur.

---

## Fonctionnalités

### Authentification
- Inscription avec nom, prénom, e-mail, mot de passe et photo de profil
- Connexion avec vérification des identifiants
- Déconnexion

### Profil utilisateur
- Affichage des informations personnelles
- Tableau de bord : nombre de publications, likes reçus, commentaires reçus
- Modification du profil (photo, nom, prénom, e-mail, biographie, mot de passe)

### Fil d'actualité
- Publication de messages texte avec ou sans image
- Affichage en temps réel
- Date et heure sur chaque publication
- Possibilité de liker les publications 
- Possibilité de commenter sous les publications
- Possibilité de supprimer ses propres publications 

### Recherche
- Recherche en temps réel
- Filtre par contenu
- Filtre par auteur

### Messagerie privée
- Conversations privées entre utilisateurs
- Envoi et réception de messages

---

## Technologies utilisées

- **HTML5** — structure des pages
- **CSS3** — mise en forme et responsive
- **JavaScript (Vanilla)** — logique applicative
- **localStorage** — persistance des données dans le navigateur
- **JSON** — format de stockage et d'échange des données (`JSON.stringify` / `JSON.parse`)

> Aucune bibliothèque externe n'a été utilisée.

---

## Structure du projet

```
info-gram/
├── index.html          # Page d'accueil
├── inscription.html    # Création de compte
├── connect.html        # Connexion
├── account.html        # Profil & dashboard
├── modi_account.html   # Modification du profil
├── feed.html           # Fil d'actualité
├── messages.html       # Messagerie privée
├── style.css           # Feuille de styles
└── script.js           # Logique JavaScript
```

---

## Données stockées (localStorage)

| Clé | Contenu |
|---|---|
| `ig_users` | Liste des utilisateurs (JSON) |
| `ig_posts` | Liste des publications (JSON) |
| `ig_session` | Utilisateur actuellement connecté (JSON) |
| `ig_messages` | Conversations privées (JSON) |

---

## Lancer le projet en local

Aucune installation requise. Il suffit d'ouvrir `index.html` dans un navigateur moderne (Chrome, Firefox, Edge).

```bash
# Cloner le repos
git clone https://github.com/VOTRE_USERNAME/info-gram.git

# Ouvrir dans le navigateur
cd info-gram
open index.html   # macOS
start index.html  # Windows
```

---

## Parcours utilisateur

1. Accéder à la **page d'accueil**
2. **Créer un compte** avec photo de profil ou se connecter
3. Consulter son **profil** et ses statistiques
4. Accéder au **fil d'actualité**
5. **Publier** un message (texte + image optionnelle)
6. **Rechercher** des publications par contenu ou auteur
7. **Liker** et **commenter** des publications
8. **Supprimer** ses propres publications
9. Envoyer des **messages privés**
10. Se **déconnecter**

---

## Auteurs

Projet réalisé dans le cadre du cours d'IHM.

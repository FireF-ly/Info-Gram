document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. GESTION DU STOCKAGE (LocalStorage)
    // ==========================================

    function getAllUsers() {
        const data = localStorage.getItem('minibook_users');
        return data ? JSON.parse(data) : [];
    }

    function saveUsers(users) {
        localStorage.setItem('minibook_users', JSON.stringify(users));
    }

    function getAllPosts() {
        const data = localStorage.getItem('minibook_posts');
        return data ? JSON.parse(data) : [];
    }

    function savePosts(posts) {
        localStorage.setItem('minibook_posts', JSON.stringify(posts));
    }

    function getCurrentSession() {
        const data = localStorage.getItem('minibook_session');
        return data ? JSON.parse(data) : null;
    }

    // Gestion des abonnements (Follow) propres à chaque utilisateur
    function getFollows(userEmail) {
        const data = localStorage.getItem(`minibook_follows_${userEmail}`);
        return data ? JSON.parse(data) : [];
    }

    function saveFollows(userEmail, followsList) {
        localStorage.setItem(`minibook_follows_${userEmail}`, JSON.stringify(followsList));
    }

    const cleanHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Formatage de la date pour l'affichage des posts
    function formatDate(timestamp) {
        const d = new Date(timestamp);
        const date = d.toLocaleDateString('fr-FR');
        const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return `${date} — ${time}`;
    }

    // Avatar de secours si l'utilisateur ne charge pas de photo
    const getDefaultAvatar = (nom, prenom) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom + '+' + nom)}&background=0F0CCC&color=fff&size=100`;
    };


    // ==========================================
    // 3. CONTROLE DES ACCES ET NAVIGATION
    // ==========================================

    const currentUser = getCurrentSession();

    // Remplissage des infos de la barre de navigation si connecté
    if (currentUser) {
        const navPhoto = document.getElementById('nav-user-photo');
        if (navPhoto) navPhoto.src = currentUser.photo || getDefaultAvatar(currentUser.nom, currentUser.prenom);
        
        const navName = document.getElementById('nav-username');
        if (navName) navName.textContent = `${currentUser.prenom} ${currentUser.nom}`;
    }

    const requiresAuth = document.getElementById('feed-posts') || document.getElementById('profile-container') || document.getElementById('form-edit');
    if (requiresAuth && !currentUser) {
        window.location.href = 'connect.html';
        return;
    }


    // ==========================================
    // 4. LOGIQUE PAR INTERFACE (Détection par élément)
    // ==========================================

    // --- PAGE INSCRIPTION ---
    const formInscription = document.getElementById('form-inscription');
    if (formInscription) {
        const photoInput = document.getElementById('reg-photo');
        
        // Gérer l'aperçu dynamique de la photo de profil
        if (photoInput) {
            photoInput.addEventListener('change', function() {
                const file = this.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('preview-photo').src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        formInscription.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorZone = document.getElementById('msg-inscription');
            if (errorZone) errorZone.style.display = 'none';

            const nom = document.getElementById('reg-nom').value.trim();
            const prenom = document.getElementById('reg-prenom').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;

            if (!nom || !prenom || !email || !password || !confirm) {
                alert('Tous les champs textuels sont obligatoires.');
                return;
            }
            if (password !== confirm) {
                alert('Les mots de passe ne correspondent pas.');
                return;
            }

            const users = getAllUsers();
            if (users.some(u => u.email === email)) {
                alert('Un compte existe déjà avec cet e-mail.');
                return;
            }

            // Encodage base64 de l'image de profil
            let finalPhoto = getDefaultAvatar(nom, prenom);
            if (photoInput && photoInput.files[0]) {
                finalPhoto = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.readAsDataURL(photoInput.files[0]);
                });
            }

            users.push({ nom, prenom, email, password, bio: '', photo: finalPhoto });
            saveUsers(users);

            if (errorZone) {
                errorZone.textContent = "Compte créé avec succès ! Redirection...";
                errorZone.style.display = 'block';
            }
            setTimeout(() => window.location.href = 'connect.html', 1200);
        });
    }

    // --- PAGE CONNEXION ---
    const formConnexion = document.getElementById('form-connexion');
    if (formConnexion) {
        formConnexion.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const errorZone = document.getElementById('msg-connexion');

            const users = getAllUsers();
            const foundUser = users.find(u => u.email === email && u.password === password);

            if (foundUser) {
                localStorage.setItem('minibook_session', JSON.stringify(foundUser));
                window.location.href = 'account.html';
            } else {
                if (errorZone) {
                    errorZone.textContent = 'E-mail ou mot de passe incorrect.';
                    errorZone.style.display = 'block';
                }
            }
        });
    }

    // --- PAGE COMPTE & DASHBOARD (STATISTIQUES) ---
    const profileContainer = document.getElementById('profile-container');
    if (profileContainer && currentUser) {
        const allPosts = getAllPosts();
        const myPosts = allPosts.filter(p => p.email === currentUser.email);
        
        // Calcul des métriques demandées pour le Dashboard
        const totalLikes = myPosts.reduce((sum, p) => sum + (p.likes ? p.likes.length : 0), 0);
        const totalComments = myPosts.reduce((sum, p) => sum + (p.comments ? p.comments.length : 0), 0);

        // Remplissage des données utilisateur
        document.getElementById('display-photo').src = currentUser.photo;
        document.getElementById('display-fullname').textContent = `${currentUser.prenom} ${currentUser.nom}`;
        document.getElementById('display-email').textContent = currentUser.email;
        
        const bioEl = document.getElementById('display-bio');
        if (bioEl) bioEl.textContent = currentUser.bio || "Pas encore de biographie.";

        // Affichage des compteurs du Dashboard
        document.getElementById('stat-posts').textContent = myPosts.length;
        document.getElementById('stat-likes').textContent = totalLikes;
        document.getElementById('stat-comments').textContent = totalComments;

        // Historique personnel des publications de l'utilisateur
        const postsContainer = document.getElementById('display-posts');
        if (postsContainer) {
            postsContainer.innerHTML = myPosts.slice().reverse().map(p => `
                <div class="user-archive-card">
                    <span class="archive-date">${formatDate(p.id)}</span>
                    <p class="archive-text">${cleanHTML(p.text)}</p>
                    ${p.image ? `<img src="${p.image}" class="archive-image">` : ''}
                    <span class="archive-meta">❤️ ${p.likes ? p.likes.length : 0} J'aime</span>
                </div>
            `).join('') || `<p class="no-data-text">Aucune publication pour le moment.</p>`;
        }

        // Action du bouton de Déconnexion
        document.getElementById('btn-logout').onclick = () => {
            localStorage.removeItem('minibook_session');
            window.location.href = 'index.html';
        };
    }

    // --- PAGE EDITEUR DE PROFIL ---
    const formEdit = document.getElementById('form-edit');
    if (formEdit && currentUser) {
        // Pré-remplissage automatique des inputs
        document.getElementById('edit-nom').value = currentUser.nom || '';
        document.getElementById('edit-prenom').value = currentUser.prenom || '';
        document.getElementById('edit-email').value = currentUser.email || '';
        document.getElementById('edit-bio').value = currentUser.bio || '';
        document.getElementById('edit-img-preview').src = currentUser.photo;

        const photoFileInput = document.getElementById('edit-photo-file');
        photoFileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('edit-img-preview').src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });

        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nom = document.getElementById('edit-nom').value.trim();
            const prenom = document.getElementById('edit-prenom').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const bio = document.getElementById('edit-bio').value.trim();
            const oldPwd = document.getElementById('edit-old-password').value;
            const newPwd = document.getElementById('edit-new-password').value;
            const confirmPwd = document.getElementById('edit-confirm-password').value;

            if (!nom || !prenom || !email) {
                alert('Nom, prénom et e-mail requis.');
                return;
            }

            const users = getAllUsers();
            if (users.some(u => u.email === email && u.email !== currentUser.email)) {
                alert('Cet e-mail est déjà attribué à un autre compte.');
                return;
            }

            let updatedPassword = currentUser.password;
            if (oldPwd || newPwd || confirmPwd) {
                if (oldPwd !== currentUser.password) {
                    alert('L\'ancien mot de passe est erroné.');
                    return;
                }
                if (newPwd !== confirmPwd) {
                    alert('Les nouveaux mots de passe ne concordent pas.');
                    return;
                }
                updatedPassword = newPwd;
            }

            let updatedPhoto = currentUser.photo;
            if (photoFileInput.files[0]) {
                updatedPhoto = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.readAsDataURL(photoFileInput.files[0]);
                });
            }

            const idx = users.findIndex(u => u.email === currentUser.email);
            if (idx !== -1) {
                users[idx] = { nom, prenom, email, bio, photo: updatedPhoto, password: updatedPassword };
                saveUsers(users);
                localStorage.setItem('minibook_session', JSON.stringify(users[idx]));
                window.location.href = 'account.html';
            }
        });
    }

    // --- PAGE PRINCIPALE : FIL D'ACTUALITÉ & RECHERCHE ---
    const feedPostsContainer = document.getElementById('feed-posts');
    if (feedPostsContainer && currentUser) {

        const modal = document.getElementById('post-modal');
        const openModalBtn = document.getElementById('open-modal');

        if (openModalBtn && modal) {
            openModalBtn.onclick = () => {
                modal.style.display = 'block';
                document.getElementById('post-text').value = '';
                document.getElementById('post-image').value = '';
                document.getElementById('post-img-preview').style.display = 'none';
            };
            document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
            document.getElementById('btn-cancel-post').onclick = () => modal.style.display = 'none';
        }

        const postImageInput = document.getElementById('post-image');
        if (postImageInput) {
            postImageInput.addEventListener('change', function() {
                const file = this.files[0];
                const preview = document.getElementById('post-img-preview');
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        preview.src = ev.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.style.display = 'none';
                }
            });
        }

        // Moteur de rendu principal du fil d'actualité
        function updateFeedDisplay() {
            const posts = getAllPosts();
            const users = getAllUsers();
            const currentFollows = getFollows(currentUser.email);

            const textSearch = document.getElementById('search-text')?.value.toLowerCase().trim() || '';
            const authorSearch = document.getElementById('search-author')?.value.toLowerCase().trim() || '';

            // Filtrage dynamique selon la saisie utilisateur
            let filteredPosts = posts.filter(p => {
                const matchText = textSearch ? p.text.toLowerCase().includes(textSearch) : true;
                const authorFullName = `${p.prenomAuteur} ${p.nomAuteur}`.toLowerCase();
                const matchAuthor = authorSearch ? authorFullName.includes(authorSearch) : true;
                return matchText && matchAuthor;
            });

            // TRI CRUCIAL (Exigence C du sujet) : Priorité aux personnes suivies (Followed)
            filteredPosts.sort((a, b) => {
                const aIsFollowed = currentFollows.includes(a.email) ? 1 : 0;
                const bIsFollowed = currentFollows.includes(b.email) ? 1 : 0;
                
                if (aIsFollowed !== bIsFollowed) {
                    return bIsFollowed - aIsFollowed; // Les comptes suivis montent en haut
                }
                return b.id - a.id; // Tri chronologique inverse de base
            });

            // Affichage du compteur dynamique de recherche
            const resultCount = document.getElementById('search-count');
            if (resultCount) {
                if (textSearch || authorSearch) {
                    resultCount.textContent = `${filteredPosts.length} publication(s) trouvée(s)`;
                    resultCount.style.display = 'inline';
                } else {
                    resultCount.style.display = 'none';
                }
            }

            // Gestion de l'écran "Aucun résultat" (Exigence 4.8 du sujet)
            if (filteredPosts.length === 0) {
                feedPostsContainer.innerHTML = `
                    <div class="search-no-result">
                        <p class="title-no-result">Aucun résultat trouvé</p>
                        <span>Veuillez modifier vos critères de recherche ou l'orthographe du nom de l'auteur.</span>
                    </div>`;
                return;
            }

            // Injection propre du code HTML sans aucun style en ligne
            feedPostsContainer.innerHTML = filteredPosts.map(p => {
                const authorObj = users.find(u => u.email === p.email);
                const avatarUrl = authorObj?.photo || getDefaultAvatar(p.nomAuteur, p.prenomAuteur);
                const isOwner = p.email === currentUser.email;
                const userHasLiked = p.likes?.includes(currentUser.email) || false;
                const userIsFollowing = currentFollows.includes(p.email);

                // Génération conditionnelle du bouton Follow/Unfollow
                let followBtnHtml = '';
                if (!isOwner) {
                    followBtnHtml = `
                        <button class="btn-follow-toggle ${userIsFollowing ? 'is-following' : ''}" onclick="toggleFollowUser('${p.email}')">
                            ${userIsFollowing ? 'Ne plus suivre' : 'Suivre'}
                        </button>
                    `;
                }

                return `
                <div class="post-card">
                    <div class="post-header">
                        <img src="${avatarUrl}" class="post-author-avatar" alt="">
                        <div class="post-author-info">
                            <span class="post-author-name">${p.prenomAuteur} ${p.nomAuteur}</span>
                            <span class="post-timestamp">${formatDate(p.id)}</span>
                        </div>
                        ${followBtnHtml}
                        ${isOwner ? `<button class="btn-delete-post" onclick="triggerDeletePost(${p.id})">🗑 Supprimer</button>` : ''}
                    </div>
                    <div class="post-content-body">
                        <p>${cleanHTML(p.text)}</p>
                        ${p.image ? `<img src="${p.image}" class="post-attached-media" alt="">` : ''}
                    </div>
                    <div class="post-interactive-actions">
                        <button class="btn-like-action ${userHasLiked ? 'liked' : ''}" onclick="triggerLikePost(${p.id})">
                            ❤️ ${p.likes ? p.likes.length : 0} Like(s)
                        </button>
                    </div>
                    <div class="post-comments-container">
                        <div class="post-comments-list">
                            ${p.comments?.map(c => `<p class="comment-row"><strong>${c.author} :</strong> ${cleanHTML(c.text)}</p>`).join('') || '<em class="empty-comments">Aucun commentaire pour le moment.</em>'}
                        </div>
                        <div class="post-comment-form">
                            <input type="text" class="comment-field" id="input-comment-${p.id}" placeholder="Ajouter un commentaire...">
                            <button class="btn-submit-comment" onclick="triggerAddComment(${p.id})">Publier</button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        // Ecouteurs d'événements pour la recherche temps réel en cours de frappe
        document.getElementById('search-text')?.addEventListener('input', updateFeedDisplay);
        document.getElementById('search-author')?.addEventListener('input', updateFeedDisplay);

        window.triggerLikePost = function(id) {
            const posts = getAllPosts();
            const target = posts.find(p => p.id === id);
            if (!target) return;

            if (!target.likes) target.likes = [];
            const index = target.likes.indexOf(currentUser.email);
            if (index === -1) {
                target.likes.push(currentUser.email);
            } else {
                target.likes.splice(index, 1);
            }
            savePosts(posts);
            updateFeedDisplay();
        };

        window.triggerDeletePost = function(id) {
            if (!confirm('Supprimer définitivement cette publication ?')) return;
            let posts = getAllPosts();
            posts = posts.filter(p => p.id !== id);
            savePosts(posts);
            updateFeedDisplay();
        };

        window.toggleFollowUser = function(targetEmail) {
            let follows = getFollows(currentUser.email);
            const index = follows.indexOf(targetEmail);
            if (index === -1) {
                follows.push(targetEmail);
            } else {
                follows.splice(index, 1);
            }
            saveFollows(currentUser.email, follows);
            updateFeedDisplay();
        };

        window.triggerAddComment = function(id) {
            const field = document.getElementById(`input-comment-${id}`);
            const value = field ? field.value.trim() : '';
            if (!value) return;

            const posts = getAllPosts();
            const target = posts.find(p => p.id === id);
            if (!target) return;

            if (!target.comments) target.comments = [];
            target.comments.push({
                author: `${currentUser.prenom} ${currentUser.nom}`,
                text: value
            });
            savePosts(posts);
            field.value = '';
            updateFeedDisplay();
        };

        // Envoi effectif d'un nouveau Post
        document.getElementById('btn-submit-post').onclick = async function() {
            const text = document.getElementById('post-text').value.trim();
            const errorZone = document.getElementById('msg-post');
            if (errorZone) errorZone.style.display = 'none';

            if (!text) {
                alert('Veuillez écrire un contenu textuel avant de publier.');
                return;
            }

            let base64Media = null;
            if (postImageInput && postImageInput.files[0]) {
                base64Media = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.readAsDataURL(postImageInput.files[0]);
                });
            }

            const posts = getAllPosts();
            posts.push({
                id: Date.now(),
                email: currentUser.email,
                nomAuteur: currentUser.nom,
                prenomAuteur: currentUser.prenom,
                text: text,
                image: base64Media,
                likes: [],
                comments: []
            });
            savePosts(posts);

            modal.style.display = 'none';
            updateFeedDisplay();
        };

        // Lancement initial du fil d'actualité au chargement du script
        updateFeedDisplay();
    }
});

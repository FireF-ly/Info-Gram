document.addEventListener('DOMContentLoaded', () => {
    const pageTitle = document.title;

 //////////////////////////// FONCTIONS LOCAL STORAGE ////////////////////////////

    const getAllUsers = () => {
        const data = localStorage.getItem('ig_users');
        return data ? JSON.parse(data) : [];
    };

    const saveUsers = (users) => localStorage.setItem('ig_users', JSON.stringify(users));

    const getAllPosts = () => {
        const data = localStorage.getItem('ig_posts');
        return data ? JSON.parse(data) : [];
    };

    const savePosts = (posts) => localStorage.setItem('ig_posts', JSON.stringify(posts));

    const getCurrentUser = () => {
        const data = localStorage.getItem('ig_session');
        return data ? JSON.parse(data) : null;
    };

    const saveSession = (user) => localStorage.setItem('ig_session', JSON.stringify(user));

    const clearSession = () => localStorage.removeItem('ig_session');

    const getMessages = () => {
        const m = localStorage.getItem('ig_messages');
        return m ? JSON.parse(m) : {};
    };
    const saveMessages = (data) => localStorage.setItem('ig_messages', JSON.stringify(data));
    const convId = (a, b) => [a, b].sort().join('__');
    const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const formatDate = (ts) => {
        const d = new Date(ts);
        const date = d.toLocaleDateString('fr-FR');
        const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return `${date} — ${time}`;
    };

    const showMsg = (id, text, isError = true) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        el.className = `msg-zone ${isError ? 'msg-error' : 'msg-success'}`;
        el.style.display = 'block';
    };

    const hideMsg = (id) => {
        const el = document.getElementById(id);
        if (el) { el.style.display = 'none'; el.textContent = ''; }
    };

    const defaultAvatar = (nom, prenom) => `https://ui-avatars.com/api/?name=${encodeURIComponent((prenom || '?') + '+' + (nom || ''))}&background=0F0CCC&color=fff&size=100`;

    const currentUser = getCurrentUser();
    if (currentUser) {
        const navPhoto = document.getElementById('nav-user-photo');
        if (navPhoto) navPhoto.src = currentUser.photo || defaultAvatar(currentUser.nom, currentUser.prenom);
        const navName = document.getElementById('nav-username');
        if (navName) navName.textContent = currentUser.prenom + ' ' + currentUser.nom;
    }

    const protectedPages = ["Fil d'actualité", "Mon Compte", "Modifier le compte", "Messages"];
    if (protectedPages.some(p => pageTitle.includes(p)) && !currentUser) {
        window.location.href = 'connect.html';
        return;
    }

 //////////////////////////// GESTION DE LA PAGE INSCRIPTION ////////////////////////////

    if (pageTitle.includes("Inscription")) {

        //Apercu de la photo 
        const photoInput = document.getElementById('reg-photo');
        if (photoInput) {
            photoInput.addEventListener('change', () => {
                const file = photoInput.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    document.getElementById('preview-photo').src = ev.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        //initialisatio des champs du formulaire de connexion 
        const form = document.getElementById('form-inscription');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                hideMsg('msg-inscription');
        
                const nom = document.getElementById('reg-nom').value.trim();
                const prenom = document.getElementById('reg-prenom').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const password = document.getElementById('reg-password').value;
                const confirm = document.getElementById('reg-confirm').value;
                const photoFile = photoInput ? photoInput.files[0] : null;

                // Vérification obligatoires
                if (!nom || !prenom || !email || !password || !confirm) {
                    showMsg('msg-inscription', 'Tous les champs sont obligatoires.');
                    return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    showMsg('msg-inscription', 'L\'adresse e-mail n\'est pas valide.');
                    return;
                }
                if (password !== confirm) {
                    showMsg('msg-inscription', 'Les mots de passe ne correspondent pas.');
                    return;
                }
                if (password.length < 4) {
                    showMsg('msg-inscription', 'Le mot de passe doit contenir au moins 4 caractères.');
                    return;
                }

                const users = getAllUsers();
                if (users.some(u => u.email === email)) {
                    showMsg('msg-inscription', 'Un compte existe déjà avec cet e-mail.');
                    return;
                }

                // Lecture de l'image 
                let photoData = defaultAvatar(nom, prenom);
                if (photoFile) {
                    photoData = await new Promise(res => {
                        const reader = new FileReader();
                        reader.onload = (ev) => res(ev.target.result);
                        reader.readAsDataURL(photoFile);
                    });
                }

                //Creation et sauvegarde d'un nouvel utilisateur 
                const newUser = { nom, prenom, email, password, bio: '', photo: photoData };
                users.push(newUser);
                saveUsers(users);

                showMsg('msg-inscription', 'Compte créé avec succès ! Redirection...', false);
                setTimeout(() => window.location.href = 'connect.html', 1200);
            });
        }
    }

 //////////////////////////// GESTION DE LA PAGE CONNEXION ////////////////////////////

    if (pageTitle.includes("Connexion")) {
        const form = document.getElementById('form-connexion');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                hideMsg('msg-connexion');

                //Récupération des données entrées par l'utilisateur 
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value;

                //Vérification que les données rentrées sont déjà enregistrées  
                const users = getAllUsers();
                const found = users.find(u => u.email === email && u.password === password);

                if (found) {
                    saveSession(found);
                    window.location.href = 'account.html';
                } else {
                    showMsg('msg-connexion', 'E-mail ou mot de passe incorrect.');
                }
            });
        }
    }

 //////////////////////////// GESTION DE LA PAGE DU COMPTE ////////////////////////////

    if (pageTitle.includes("Mon Compte")) {
        if (!currentUser) return;

        //Récupération des posts des utilisateurs
        const allPosts = getAllPosts();
        const myPosts = allPosts.filter(p => p.email === currentUser.email);
        const likesReçus = myPosts.reduce((sum, p) => sum + (p.likes ? p.likes.length : 0), 0);
        const commentsReçus = myPosts.reduce((sum, p) => sum + (p.comments ? p.comments.length : 0), 0);

        
        document.getElementById('display-photo').src = currentUser.photo || defaultAvatar(currentUser.nom, currentUser.prenom);
        document.getElementById('display-fullname').textContent = currentUser.prenom + ' ' + currentUser.nom;
        document.getElementById('display-email').textContent = currentUser.email;
        if (currentUser.bio) document.getElementById('display-bio').textContent = currentUser.bio;

        //Récupérations des données statistiques du compte de l'utilisateur 
        document.getElementById('stat-posts').textContent = myPosts.length;
        document.getElementById('stat-likes').textContent = likesReçus;
        document.getElementById('stat-comments').textContent = commentsReçus;

        //Affichage des post de l'utilisateur 
        const postsContainer = document.getElementById('display-posts');
        postsContainer.innerHTML = myPosts.slice().reverse().map(p => `
            <div style="background:#fafafa; border:1px solid #dbdbdb; border-radius:4px; padding:10px; margin-bottom:8px; text-align:left;">
                <p style="font-size:12px; color:#8e8e8e;">${formatDate(p.id)}</p>
                <p style="font-size:14px; margin-top:5px;">${p.text}</p>
                ${p.image ? `<img src="${p.image}" style="width:100%; border-radius:4px; margin-top:8px; max-height:150px; object-fit:cover;">` : ''}
                <p style="font-size:12px; color:#0F0CCC; margin-top:5px;">❤️ ${p.likes ? p.likes.length : 0} like(s)</p>
            </div>
        `).join('') || `<p style="color:#8e8e8e; font-size:13px;">Aucune publication.</p>`;

        //Initialisation du bouton de déconnexion pour une redirection vers l'acceuil
        document.getElementById('btn-logout').onclick = () => {
            clearSession();
            window.location.href = 'index.html';
        };
    }

 //////////////////////////// GESTION DE LA PAGE DE MODIFICATION DU COMPTE ////////////////////////////

    if (pageTitle.includes("Modifier le compte")) {
        if (!currentUser) return;

        //Récupération des données de l'utilisateur 
        document.getElementById('edit-nom').value = currentUser.nom || '';
        document.getElementById('edit-prenom').value = currentUser.prenom || '';
        document.getElementById('edit-email').value = currentUser.email || '';
        document.getElementById('edit-bio').value = currentUser.bio || '';
        document.getElementById('edit-img-preview').src = currentUser.photo || defaultAvatar(currentUser.nom, currentUser.prenom);

        //Changement de la photo utilisateur 
        const photoFileInput = document.getElementById('edit-photo-file');
        photoFileInput.addEventListener('change', () => {
            const file = photoFileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('edit-img-preview').src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });

        //"Affichage" des données de l'utilisateur 
        document.getElementById('form-edit').addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMsg('msg-edit');

            const nom = document.getElementById('edit-nom').value.trim();
            const prenom = document.getElementById('edit-prenom').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const bio = document.getElementById('edit-bio').value.trim();
            const oldPwd = document.getElementById('edit-old-password').value;
            const newPwd = document.getElementById('edit-new-password').value;
            const confirmPwd = document.getElementById('edit-confirm-password').value;
            const file = photoFileInput.files[0];

            if (!nom || !prenom || !email) {
                showMsg('msg-edit', 'Nom, prénom et e-mail sont obligatoires.');
                return;
            }

            //vérifie que l'email modifié n'est pas déjà utilisé 
            const users = getAllUsers();
            const conflict = users.find(u => u.email === email && u.email !== currentUser.email);
            if (conflict) {
                showMsg('msg-edit', 'Cet e-mail est déjà utilisé par un autre compte.');
                return;
            }

            //Gestion du mot de passe
            let newPassword = currentUser.password;
            if (oldPwd || newPwd || confirmPwd) {
                if (oldPwd !== currentUser.password) {
                    showMsg('msg-edit', 'L\'ancien mot de passe est incorrect.');
                    return;
                }
                if (!newPwd) {
                    showMsg('msg-edit', 'Veuillez saisir un nouveau mot de passe.');
                    return;
                }
                if (newPwd !== confirmPwd) {
                    showMsg('msg-edit', 'Les nouveaux mots de passe ne correspondent pas.');
                    return;
                }
                newPassword = newPwd;
            }

            let newPhoto = currentUser.photo;
            if (file) {
                newPhoto = await new Promise(res => {
                    const reader = new FileReader();
                    reader.onload = (ev) => res(ev.target.result);
                    reader.readAsDataURL(file);
                });
            }

            const idx = users.findIndex(u => u.email === currentUser.email);
            if (idx !== -1) {
                users[idx] = { ...users[idx], nom, prenom, email, bio, photo: newPhoto, password: newPassword };
                saveUsers(users);
                saveSession(users[idx]);
            }

            showMsg('msg-edit', 'Modifications enregistrées !', false);
            setTimeout(() => window.location.href = 'account.html', 1000);
        });
    }

 //////////////////////////// GESTION DE LA PAGE DU FIL D4ACTUALITE ////////////////////////////

    if (pageTitle.includes("Fil d'actualité")) {
        if (!currentUser) return;

        const modal = document.getElementById('post-modal');
        document.getElementById('open-modal').onclick = () => {
            modal.style.display = 'block';
            hideMsg('msg-post');
            document.getElementById('post-text').value = '';
            document.getElementById('post-image').value = '';
            document.getElementById('post-img-preview').style.display = 'none';
        };
        document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        document.getElementById('btn-cancel-post').onclick = () => modal.style.display = 'none';
        document.getElementById('post-author-display').textContent =
            'Publication en tant que ' + currentUser.prenom + ' ' + currentUser.nom;

        //Aperçu image dans la modale
        const postImageInput = document.getElementById('post-image');
        postImageInput.addEventListener('change', () => {
            const file = postImageInput.files[0];
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

        //Rendu du fil avec filtre
        const renderPosts = (filterText = '', filterAuthor = '') => {
            const feed = document.getElementById('feed-posts');
            const posts = getAllPosts();
            const users = getAllUsers();

            const fl = filterText.toLowerCase().trim();
            const fa = filterAuthor.toLowerCase().trim();

            const filtered = posts.filter(p => {
                const matchText = fl ? p.text.toLowerCase().includes(fl) : true;
                const authorName = ((p.prenomAuteur || '') + ' ' + (p.nomAuteur || '')).toLowerCase();
                const matchAuthor = fa ? authorName.includes(fa) : true;
                return matchText && matchAuthor;
            });

            //Compteur de résultats
            const countEl = document.getElementById('search-count');
            if (fl || fa) {
                countEl.textContent = filtered.length + ' publication' + (filtered.length !== 1 ? 's' : '') + ' trouvée' + (filtered.length !== 1 ? 's' : '');
                countEl.style.display = 'inline';
            } else {
                countEl.style.display = 'none';
            }

            if (filtered.length === 0) {
                feed.innerHTML = `<div class="no-result">
                    <p style="font-size:32px;">🔍</p>
                    <p>Aucun résultat trouvé</p>
                    <span>Essayez avec d'autres mots-clés</span>
                </div>`;
                return;
            }

            feed.innerHTML = filtered.slice().reverse().map(p => {
                const u = users.find(user => user.email === p.email);
                const photo = u ? (u.photo || defaultAvatar(u.nom, u.prenom)) : defaultAvatar('', '');
                const likes = p.likes || [];
                const comments = p.comments || [];
                const isOwner = p.email === currentUser.email;

                return `
                <div class="post-card" data-id="${p.id}">
                    <div class="post-header">
                        <img src="${photo}" class="post-user-img" alt="">
                        <div>
                            <span class="post-username">${p.prenomAuteur || ''} ${p.nomAuteur || ''}</span>
                            <span class="post-date">${formatDate(p.id)}</span>
                        </div>
                        ${isOwner ? `<button class="btn-delete-post" onclick="deletePost(${p.id})" title="Supprimer">🗑</button>` : ''}
                    </div>
                    <div class="post-content">${escapeHtml(p.text)}</div>
                    ${p.image ? `<img src="${p.image}" class="post-image-content" alt="">` : ''}
                    <div class="post-actions">
                        <button class="btn-like ${likes.includes(currentUser.email) ? 'liked' : ''}" onclick="likePost(${p.id})">
                            ❤️ ${likes.length} Like${likes.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                    <div class="comments-section">
                        <div class="comment-list">
                            ${comments.map(c => `<p><strong>${c.prenomAuteur || ''} ${c.nomAuteur || ''} :</strong> ${escapeHtml(c.text)}</p>`).join('') || '<em style="color:#8e8e8e; font-size:12px;">Aucun commentaire.</em>'}
                        </div>
                        <div class="comment-form">
                            <input type="text" class="comment-input" id="comment-input-${p.id}" placeholder="Ajouter un commentaire...">
                            <button class="btn-comment" onclick="addComment(${p.id})">Publier</button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        };

        // Expose filterPosts globalement pour les inputs inline
        window.filterPosts = () => {
            const ft = document.getElementById('search-text').value;
            const fa = document.getElementById('search-author').value;
            renderPosts(ft, fa);
        };

        // Like
        window.likePost = (id) => {
            let posts = getAllPosts();
            const p = posts.find(post => post.id === id);
            if (!p) return;
            if (!p.likes) p.likes = [];
            const idx = p.likes.indexOf(currentUser.email);
            idx === -1 ? p.likes.push(currentUser.email) : p.likes.splice(idx, 1);
            savePosts(posts);
            renderPosts(
                document.getElementById('search-text').value,
                document.getElementById('search-author').value
            );
        };

        //Supprimer un post (uniquement ceux de l'utilisateur courant) 
        window.deletePost = (id) => {
            let posts = getAllPosts();
            const p = posts.find(post => post.id === id);
            if (!p || p.email !== currentUser.email) return;
            if (!confirm('Supprimer cette publication ?')) return;
            posts = posts.filter(post => post.id !== id);
            savePosts(posts);
            renderPosts(
                document.getElementById('search-text').value,
                document.getElementById('search-author').value
            );
        };

        //Ajouter un commentaire
        window.addComment = (id) => {
            const inputEl = document.getElementById(`comment-input-${id}`);
            const val = inputEl ? inputEl.value.trim() : '';
            if (!val) return;
            let posts = getAllPosts();
            const p = posts.find(post => post.id === id);
            if (!p) return;
            if (!p.comments) p.comments = [];
            p.comments.push({
                prenomAuteur: currentUser.prenom,
                nomAuteur: currentUser.nom,
                email: currentUser.email,
                text: val
            });
            savePosts(posts);
            renderPosts(
                document.getElementById('search-text').value,
                document.getElementById('search-author').value
            );
        };

        //Publier un post 
        document.getElementById('btn-submit-post').onclick = async () => {
            hideMsg('msg-post');
            const text = document.getElementById('post-text').value.trim();
            const file = postImageInput.files[0];

            if (!text) {
                showMsg('msg-post', 'Veuillez écrire un message avant de publier.');
                return;
            }

            let base64 = null;
            if (file) {
                base64 = await new Promise(res => {
                    const reader = new FileReader();
                    reader.onload = (ev) => res(ev.target.result);
                    reader.readAsDataURL(file);
                });
            }

            let posts = getAllPosts();
            posts.push({
                id: Date.now(),
                email: currentUser.email,
                nomAuteur: currentUser.nom,
                prenomAuteur: currentUser.prenom,
                text,
                image: base64,
                likes: [],
                comments: []
            });
            savePosts(posts);
            modal.style.display = 'none';
            renderPosts();
            showMsg('msg-post', 'Publication ajoutée !', false);
        };

        renderPosts();
    }

 //////////////////////////// GESTION DE LA PAGE DE MESSAGERIE ////////////////////////////

    if (pageTitle.includes("Messages")) {
        if (!currentUser) return;
        let activeConv = null;

        //Récupération des la liste des messages utilisateurs
        const renderConvList = () => {
            const allMsgs = getMessages();
            const users = getAllUsers();
            const list = document.getElementById('conv-list');
            const myConvs = Object.keys(allMsgs).filter(id => id.includes(currentUser.email));

            list.innerHTML = myConvs.map(id => {
                const otherEmail = id.split('__').find(u => u !== currentUser.email);
                const otherUser = users.find(u => u.email === otherEmail);
                return `
                <div class="conv-item ${activeConv === otherEmail ? 'active' : ''}" onclick="openConv('${otherEmail}')">
                    <img class="conv-avatar" src="${otherUser?.photo || defaultAvatar(otherUser?.nom, otherUser?.prenom)}">
                    <div class="conv-info">
                        <div class="conv-name">${otherUser ? otherUser.prenom + ' ' + otherUser.nom : otherEmail}</div>
                        <div class="conv-preview">Cliquer pour discuter</div>
                    </div>
                </div>`;
            }).join('') || `<div style="padding:20px; color:#8e8e8e;">Aucune conversation.</div>`;
        };

        window.openConv = (otherEmail) => {
            activeConv = otherEmail;
            renderConvList();
            renderChat();
        };

        //Affichage de la zone de message avec un utilisateur 
        const renderChat = () => {
            const zone = document.getElementById('chat-zone');
            const users = getAllUsers();
            const otherUser = users.find(u => u.email === activeConv);
            const cid = convId(currentUser.email, activeConv);
            const msgs = getMessages()[cid] || [];

            zone.innerHTML = `
                <div class="chat-header"><strong>${otherUser ? otherUser.prenom + ' ' + otherUser.nom : activeConv}</strong></div>
                <div class="messages-list" id="msg-list-scroll">
                    ${msgs.map(m => `
                        <div class="msg-bubble-wrap ${m.sender === currentUser.email ? 'mine' : 'theirs'}">
                            <div class="bubble">${escapeHtml(m.text)}</div>
                        </div>`).join('')}
                </div>
                <div class="chat-input-bar">
                    <textarea id="msg-input" placeholder="Message..."></textarea>
                    <button class="btn-comment" id="btn-send">Envoyer</button>
                </div>`;

            document.getElementById('btn-send').onclick = () => {
                const input = document.getElementById('msg-input');
                if (!input.value.trim()) return;
                const all = getMessages();
                if (!all[cid]) all[cid] = [];
                all[cid].push({ sender: currentUser.email, text: input.value, ts: Date.now() });
                saveMessages(all);
                input.value = '';
                renderChat();
            };
            const scroll = document.getElementById('msg-list-scroll');
            scroll.scrollTop = scroll.scrollHeight;
        };

        const newConvModal = document.getElementById('new-conv-modal');
        document.getElementById('btn-new-conv').onclick = () => {
            newConvModal.classList.add('open');
            const input = document.getElementById('user-search-input');
            input.value = '';
            renderUserSearch('');
            input.focus();
        };
        document.getElementById('close-new-conv').onclick = () => newConvModal.classList.remove('open');
        newConvModal.addEventListener('click', (e) => {
            if (e.target === newConvModal) newConvModal.classList.remove('open');
        });

        //Affichage de la zone de nouveau message avec un utilisateur 
        const renderUserSearch = (query) => {
            const users = getAllUsers().filter(u =>
                u.email !== currentUser.email &&
                ((u.prenom + ' ' + u.nom).toLowerCase().includes(query.toLowerCase()) ||
                 u.email.toLowerCase().includes(query.toLowerCase()))
            );
            document.getElementById('new-conv-userlist').innerHTML = users.map(u => `
                <div class="new-conv-user-item" onclick="startConv('${u.email}')">
                    <img src="${u.photo || defaultAvatar(u.nom, u.prenom)}" alt="">
                    <div>
                        <div style="font-weight:600; font-size:14px;">${u.prenom} ${u.nom}</div>
                        <div style="font-size:12px; color:#8e8e8e;">${u.email}</div>
                    </div>
                </div>
            `).join('') || `<p style="padding:15px; color:#8e8e8e; font-size:13px;">Aucun utilisateur trouvé.</p>`;
        };

        document.getElementById('user-search-input').addEventListener('input', (e) => renderUserSearch(e.target.value));

        window.startConv = (otherEmail) => {
            const cid = convId(currentUser.email, otherEmail);
            const all = getMessages();
            if (!all[cid]) { all[cid] = []; saveMessages(all); }
            newConvModal.classList.remove('open');
            openConv(otherEmail);
        };

        renderConvList();
    }
});

// --- BANCO DE DADOS MOCKADO ---
const db = {
    currentUser: null,
    // Modalidades agora são dinâmicas (podem ser criadas pelo Admin)
    modalities: ["Futsal", "Volei", "Xadrez", "Handebol"],
    users: [
        { id: 1, name: "Carlos Gestor", email: "gestor@ifsp.edu.br", password: "123", role: "GESTOR", points: 1100, interests: ["Futsal"] },
        { id: 2, name: "Ana Aluna", email: "aluno@aluno.ifsp.edu.br", password: "123", role: "USER", points: 1500, interests: ["Volei"] },
        { id: 3, name: "Admin Sistema", email: "admin@ifsp.edu.br", password: "123", role: "ADMIN", points: 0, interests: [] }
    ],
    events: [
        { id: 1, nome: "Copa IFSP Futsal", descricao: "Torneio tradicional.", dataInicio: "10/12/2024", status: "INSCRICOES_ABERTAS", modalidades: ["Futsal"], amIParticipating: false }
    ],
    matches: [
        { id: 101, eventoId: 1, timeA: "3º Informática", timeB: "2º Mecatrônica", placarA: 2, placarB: 1, status: "ANDAMENTO" }
    ],
    teams: [
        { id: 1, ownerId: 2, nome: "3º Informática", modalidade: "Futsal" }
    ],
    communities: [
        { id: 1, name: "Atlética da Computação", members: 120, description: "Comunidade oficial de TI." }
    ],
    posts: [
        { id: 1, communityId: 1, author: "João Silva", text: "Alguém animado para o Interclasse?", time: "10min atrás", likes: 5, dislikes: 0 }
    ],
    pendingInscriptions: [],
    notifications: [],
    ranking: [ { name: "Ana Aluna", points: 1500 }, { name: "Carlos Gestor", points: 1100 } ],
    players: [ { id: 1, name: "Lucas Silva", team: "3º Info", votes: 12 } ]
};

let currentEventId = null;
let currentCommunityId = null;
const historyStack = [];

// --- INICIALIZAÇÃO ---
function init() {
    populateModalitySelects(); // Preenche os dropdowns com as modalidades
}

// --- NAVEGAÇÃO ---
function navigateTo(screenId, addToStack = true) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        if (addToStack) historyStack.push(screenId);
    }

    const header = document.getElementById('main-header');
    const nav = document.getElementById('bottom-nav');
    const btnBack = document.getElementById('btn-back');
    const fab = document.getElementById('fab-create');

    // Lógica de exibição do Header/Nav
    if (screenId === 'screen-login' || screenId === 'screen-register') {
        header.classList.add('hidden');
        nav.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
        nav.classList.remove('hidden');
        
        const mainScreens = ['screen-feed', 'screen-my-events', 'screen-communities', 'screen-ranking', 'screen-profile', 'screen-admin-panel'];
        btnBack.classList.toggle('hidden', mainScreens.includes(screenId));

        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(screenId === 'screen-feed') document.getElementById('nav-home').classList.add('active');
        if(screenId === 'screen-communities') document.getElementById('nav-communities').classList.add('active');
        if(screenId === 'screen-my-events') document.getElementById('nav-events').classList.add('active');
        if(screenId === 'screen-profile') document.getElementById('nav-profile').classList.add('active');
        if(screenId === 'screen-admin-panel') document.getElementById('nav-admin')?.classList.add('active');

        // FAB apenas para Gestor/Admin na Home
        if (screenId === 'screen-feed' && (db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN')) {
            fab.classList.remove('hidden');
        } else {
            fab.classList.add('hidden');
        }
    }

    // Triggers
    if (screenId === 'screen-feed') renderEvents();
    if (screenId === 'screen-my-events') renderMyTeamsAndEvents();
    if (screenId === 'screen-communities') renderCommunities();
    if (screenId === 'screen-profile') renderProfile();
    if (screenId === 'screen-ranking') renderRanking();
    if (screenId === 'screen-admin-panel') renderAdminPanel();

    window.scrollTo(0, 0);
}

function goBack() {
    if (historyStack.length > 1) {
        historyStack.pop();
        navigateTo(historyStack[historyStack.length - 1], false);
    }
}

function doLogout() {
    if (confirm("Tem certeza que deseja sair?")) {
        db.currentUser = null;
        document.getElementById('login-password').value = "";
        navigateTo('screen-login');
    }
}

// --- AUTH ---
function doLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    if (!email) return alert("Por favor, digite seu e-mail.");
    
    const user = db.users.find(u => u.email === email);

    if (user) {
        if (user.password !== pass) return alert("Senha incorreta.");
        db.currentUser = user;
    } else {
        // Lógica de Fallback para testes rápidos (cria usuário se não existir)
        let role = "USER";
        if (email.includes("aluno")) {
            role = "USER"; // Regra: Aluno é sempre USER
        } else if (email.endsWith("@ifsp.edu.br")) {
            role = "GESTOR"; // Regra: Servidor pode ser Gestor
        }
        
        // Override para admin
        if (email.includes("admin")) role = "ADMIN";

        db.currentUser = { id: Date.now(), name: email.split('@')[0], email: email, role: role, points: 0, interests: [] };
        db.users.push(db.currentUser);
    }

    updateNavBasedOnRole();
    document.getElementById('user-name-display').innerText = db.currentUser.name.split(" ")[0];
    navigateTo('screen-feed');
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (db.users.find(u => u.email === email)) return alert("Email já cadastrado.");

    // Regra de Negócio (Refatorada):
    let role = "USER";
    if (!email.includes("aluno") && email.endsWith("@ifsp.edu.br")) {
        // Se for servidor, começa como USER mas pode ser promovido pelo Admin
        // Para facilitar o teste, vamos deixar como USER e o Admin promove.
        role = "USER"; 
    }

    const newUser = { id: Date.now(), name: name, email: email, password: pass, role: role, points: 0, interests: [] };
    db.users.push(newUser);
    alert("Conta criada! Faça login.");
    navigateTo('screen-login');
}

function forgotPassword() {
    const email = prompt("Digite seu e-mail cadastrado para recuperar a senha:");
    if (email) alert(`Link enviado para ${email}.`);
}

function updateNavBasedOnRole() {
    const adminNav = document.getElementById('nav-admin');
    if (db.currentUser.role === 'ADMIN') adminNav.classList.remove('hidden');
    else adminNav.classList.add('hidden');
}

// --- ADMIN PANEL (HU 14 & GESTÃO MODALIDADES) ---
function renderAdminPanel() {
    renderAdminUsers();
    renderAdminModalities();
}

function renderAdminUsers() {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = "";
    db.users.forEach(u => {
        const div = document.createElement('div');
        div.className = "user-list-item";
        
        // Botão de Promoção: Só aparece para servidores (@ifsp.edu.br) que não são alunos
        let actionBtn = "";
        const isServidor = !u.email.includes("aluno") && u.email.endsWith("@ifsp.edu.br");
        
        if (db.currentUser.role === 'ADMIN' && u.role !== 'ADMIN') {
            if (isServidor) {
                actionBtn = `<button class="btn-small" onclick="toggleRole(${u.id})">
                                ${u.role === 'GESTOR' ? 'Remover Gestor' : 'Tornar Gestor'}
                             </button>`;
            } else {
                actionBtn = `<span class="text-small" style="color:#999">Aluno (Restrito)</span>`;
            }
        }

        div.innerHTML = `
            <div>
                <strong>${u.name}</strong> <span class="role-badge ${u.role}">${u.role}</span><br>
                <span class="text-small">${u.email}</span>
            </div>
            ${actionBtn}
        `;
        list.appendChild(div);
    });
}

function toggleRole(userId) {
    const u = db.users.find(user => user.id === userId);
    if (u) {
        u.role = u.role === 'GESTOR' ? 'USER' : 'GESTOR';
        renderAdminUsers();
    }
}

// Gestão de Modalidades
function renderAdminModalities() {
    const container = document.getElementById('admin-modalities-list');
    container.innerHTML = "";
    db.modalities.forEach(mod => {
        container.innerHTML += `<div class="interest-chip">${mod}</div>`;
    });
}

function createNewModality() {
    const input = document.getElementById('new-modality-input');
    const val = input.value.trim();
    if (val && !db.modalities.includes(val)) {
        db.modalities.push(val);
        input.value = "";
        alert(`Modalidade "${val}" criada!`);
        populateModalitySelects(); // Atualiza dropdowns globalmente
        renderAdminModalities(); // Atualiza lista visual
    } else if (db.modalities.includes(val)) {
        alert("Modalidade já existe.");
    }
}

function populateModalitySelects() {
    // Atualiza filtros do feed
    const feedFilters = document.getElementById('feed-filters');
    feedFilters.innerHTML = `<span class="tag aberto" onclick="filterEvents('all')" style="cursor:pointer;">Todos</span>`;
    db.modalities.forEach(mod => {
        feedFilters.innerHTML += `<span class="tag" onclick="filterEvents('${mod}')" style="background:#eee; color:#555; cursor:pointer;">${mod}</span>`;
    });

    // Atualiza Create Team
    const teamSelect = document.getElementById('team-modality');
    teamSelect.innerHTML = "";
    db.modalities.forEach(mod => {
        const opt = document.createElement('option');
        opt.value = mod;
        opt.innerText = mod;
        teamSelect.appendChild(opt);
    });

    // Atualiza Create Event (Checkboxes)
    const evtCheckContainer = document.getElementById('evt-modalidades-container');
    evtCheckContainer.innerHTML = "";
    db.modalities.forEach(mod => {
        evtCheckContainer.innerHTML += `
            <label class="check-label"><input type="checkbox" name="modalidades" value="${mod}"> ${mod}</label>
        `;
    });
}

// --- EVENTOS ---
function renderEvents(filter = 'all') {
    const container = document.getElementById('events-list');
    container.innerHTML = "";
    db.events.forEach(evt => {
        if (filter !== 'all' && !evt.modalidades.includes(filter)) return;

        const statusClass = evt.status === 'INSCRICOES_ABERTAS' ? 'aberto' : 'andamento';
        
        let adminActions = "";
        if (db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN') {
            adminActions = `
                <div class="admin-card-actions">
                    <button class="btn-icon-small" onclick="event.stopPropagation(); prepareEditEvent(${evt.id})"><span class="material-symbols-outlined" style="font-size:1rem;">edit</span></button>
                    <button class="btn-icon-small btn-delete" onclick="event.stopPropagation(); deleteEvent(${evt.id})"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
                </div>`;
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => showEventDetails(evt.id);
        card.innerHTML = `
            ${adminActions}
            <h3>${evt.nome}</h3>
            <p>${evt.descricao}</p>
            <div style="margin-top:8px;">
                <span class="text-small">📅 ${evt.dataInicio} • ${evt.modalidades.join(', ')}</span>
            </div>
            <div style="margin-top:8px;"><span class="tag ${statusClass}">${evt.status.replace('_', ' ')}</span></div>
        `;
        container.appendChild(card);
    });
}

function prepareCreateEvent() {
    document.getElementById('form-event-title').innerText = "Novo Evento";
    document.getElementById('form-create-event').reset();
    document.getElementById('evt-id').value = "";
    navigateTo('screen-create-event');
}

function prepareEditEvent(id) {
    const evt = db.events.find(e => e.id === id);
    document.getElementById('form-event-title').innerText = "Editar Evento";
    document.getElementById('evt-id').value = evt.id;
    document.getElementById('evt-nome').value = evt.nome;
    document.getElementById('evt-desc').value = evt.descricao;
    // Formatar data
    const parts = evt.dataInicio.split('/');
    document.getElementById('evt-inicio').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    
    // Check checkboxes
    document.querySelectorAll('input[name="modalidades"]').forEach(cb => {
        cb.checked = evt.modalidades.includes(cb.value);
    });
    navigateTo('screen-create-event');
}

function handleSaveEvent(e) {
    e.preventDefault();
    const id = document.getElementById('evt-id').value;
    const checkedMods = Array.from(document.querySelectorAll('input[name="modalidades"]:checked')).map(cb => cb.value);
    
    if (checkedMods.length === 0) return alert("Selecione ao menos uma modalidade.");

    const eventData = {
        nome: document.getElementById('evt-nome').value,
        descricao: document.getElementById('evt-desc').value,
        dataInicio: document.getElementById('evt-inicio').value.split('-').reverse().join('/'),
        status: document.getElementById('evt-status').value,
        modalidades: checkedMods,
        amIParticipating: false
    };

    if (id) {
        const idx = db.events.findIndex(ev => ev.id == id);
        db.events[idx] = { ...db.events[idx], ...eventData };
    } else {
        db.events.unshift({ id: Date.now(), ...eventData });
    }
    alert("Evento salvo!");
    navigateTo('screen-feed');
}

function deleteEvent(id) {
    if(confirm("Excluir evento?")) {
        db.events = db.events.filter(e => e.id !== id);
        renderEvents();
    }
}

function filterEvents(type) { renderEvents(type); }

function showEventDetails(eventId) {
    currentEventId = eventId;
    const evt = db.events.find(e => e.id === eventId);
    if (!evt) return;

    const btnLabel = evt.amIParticipating ? "Inscrição Realizada ✔" : "Inscrever Time";
    const btnDisabled = evt.amIParticipating ? "disabled" : "";
    const btnClass = evt.amIParticipating ? "btn-secondary" : "btn-primary";

    document.getElementById('event-info-container').innerHTML = `
        <h2 style="color: var(--ifsp-green-dark);">${evt.nome}</h2>
        <p style="margin-top: 5px;">${evt.descricao}</p>
        <div style="margin-top: 10px; font-size: 0.9rem; color: #555;">
            <span>📅 ${evt.dataInicio}</span> <br> <span>🏆 ${evt.modalidades.join(', ')}</span>
        </div>
        <button class="btn ${btnClass}" style="margin-top: 15px;" onclick="trySubscribeTeam()" ${btnDisabled}>${btnLabel}</button>
    `;

    const managerArea = document.getElementById('manager-actions-area');
    const approvalArea = document.getElementById('admin-approval-area');
    
    if (db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN') {
        managerArea.classList.remove('hidden');
        managerArea.innerHTML = `
            <button class="btn btn-small" style="background-color:#007bff;" onclick="document.getElementById('modal-generate-brackets').classList.remove('hidden')">
                <span class="material-symbols-outlined" style="font-size:1rem; margin-right:5px;">account_tree</span> Gerar Chaves
            </button>
        `;
        approvalArea.classList.remove('hidden');
        renderPendingInscriptions();
    } else {
        managerArea.classList.add('hidden');
        approvalArea.classList.add('hidden');
    }

    renderMatches(eventId);
    navigateTo('screen-event-details');
}

function confirmGenerateBrackets() {
    db.matches = db.matches.filter(m => m.eventoId !== currentEventId);
    db.matches.push(
        { id: Date.now(), eventoId: currentEventId, timeA: "Time A", timeB: "Time B", placarA: 0, placarB: 0, status: "AGENDADA" }
    );
    document.getElementById('modal-generate-brackets').classList.add('hidden');
    alert("Chaves geradas!");
    renderMatches(currentEventId);
}

function renderMatches(eventId) {
    const container = document.getElementById('matches-list');
    container.innerHTML = "";
    const matches = db.matches.filter(m => m.eventoId === eventId);
    
    if (matches.length === 0) {
        container.innerHTML = "<p class='text-center'>Sem jogos.</p>";
        return;
    }
    matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.borderLeftColor = '#999';
        div.onclick = () => showMatchDetails(match);
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span>${match.timeA}</span>
                <span style="background: #eee; padding: 0 5px;">${match.placarA} x ${match.placarB}</span>
                <span>${match.timeB}</span>
            </div>
            <div class="text-center text-small">${match.status}</div>`;
        container.appendChild(div);
    });
}

// --- COMUNIDADES ---
function renderCommunities() {
    const list = document.getElementById('communities-list');
    list.innerHTML = "";
    db.communities.forEach(c => {
        let deleteBtn = "";
        // ADMIN pode apagar comunidades
        if (db.currentUser.role === 'ADMIN') {
            deleteBtn = `<button class="delete-comm-btn" onclick="event.stopPropagation(); deleteCommunity(${c.id})"><span class="material-symbols-outlined">delete</span></button>`;
        }

        const div = document.createElement('div');
        div.className = 'comm-card';
        div.onclick = () => openCommunity(c.id);
        div.innerHTML = `
            <div style="flex:1"><h4>${c.name}</h4><small>${c.members} membros</small></div>
            ${deleteBtn}
        `;
        list.appendChild(div);
    });
}

function deleteCommunity(id) {
    if(confirm("Admin: Excluir comunidade?")) {
        db.communities = db.communities.filter(c => c.id !== id);
        renderCommunities();
    }
}

function handleCreateCommunity(e) {
    e.preventDefault();
    const name = document.getElementById('comm-name').value;
    const desc = document.getElementById('comm-desc').value;
    db.communities.push({ id: Date.now(), name: name, description: desc, members: 1 });
    alert("Comunidade criada!");
    goBack();
}

function openCommunity(id) {
    currentCommunityId = id;
    const comm = db.communities.find(c => c.id === id);
    document.getElementById('comm-header').innerHTML = `
        <h2 style="color: #007bff;">${comm.name}</h2>
        <p>${comm.description}</p>
    `;
    renderCommunityFeed(id);
    navigateTo('screen-community-details');
}

function renderCommunityFeed(commId) {
    const list = document.getElementById('community-feed-list');
    list.innerHTML = "";
    const posts = db.posts.filter(p => p.communityId === commId);

    posts.forEach(p => {
        // Admin pode apagar posts
        let deletePostBtn = "";
        if (db.currentUser.role === 'ADMIN') {
            deletePostBtn = `<button class="post-delete-btn" onclick="deletePost(${p.id})"><span class="material-symbols-outlined" style="font-size:1.2rem">delete</span></button>`;
        }

        const div = document.createElement('div');
        div.className = 'post-item';
        div.innerHTML = `
            ${deletePostBtn}
            <div class="post-header">
                <div class="avatar-small">${p.author.charAt(0)}</div>
                <div><div class="post-author">${p.author}</div><small class="post-time">${p.time}</small></div>
            </div>
            <div class="post-content">${p.text}</div>
            <div class="post-actions">
                <button class="action-btn" onclick="likePost(${p.id})"><span class="material-symbols-outlined">thumb_up</span> ${p.likes}</button>
                <button class="action-btn"><span class="material-symbols-outlined">comment</span></button>
            </div>
        `;
        list.appendChild(div);
    });
}

function deletePost(id) {
    if(confirm("Admin: Remover postagem?")) {
        db.posts = db.posts.filter(p => p.id !== id);
        renderCommunityFeed(currentCommunityId);
    }
}

function handlePost() {
    const txt = document.getElementById('post-input').value;
    if (txt) {
        db.posts.unshift({ id: Date.now(), communityId: currentCommunityId, author: db.currentUser.name, text: txt, time: "Agora", likes: 0 });
        document.getElementById('post-input').value = "";
        renderCommunityFeed(currentCommunityId);
    }
}

function likePost(id) {
    const p = db.posts.find(post => post.id === id);
    if (p) { p.likes++; renderCommunityFeed(currentCommunityId); }
}

// --- TIMES/INSCRIÇÕES ---
function handleCreateTeam(e) {
    e.preventDefault();
    db.teams.push({ id: Date.now(), ownerId: db.currentUser.id, nome: document.getElementById('team-name').value, modalidade: document.getElementById('team-modality').value });
    alert("Time criado!");
    goBack();
}

function trySubscribeTeam() {
    const evt = db.events.find(e => e.id === currentEventId);
    const validTeams = db.teams.filter(t => t.ownerId === db.currentUser.id && evt.modalidades.includes(t.modalidade));

    if (validTeams.length === 0) {
        if(confirm("Você não tem time para esta modalidade. Criar?")) navigateTo('screen-create-team');
        return;
    }
    const list = document.getElementById('team-select-list');
    list.innerHTML = "";
    validTeams.forEach(t => {
        const btn = document.createElement('button');
        btn.className = "btn btn-secondary";
        btn.innerText = t.nome;
        btn.onclick = () => {
            db.pendingInscriptions.push({ id: Date.now(), teamName: t.nome, eventId: currentEventId });
            closeTeamSelect();
            alert("Solicitação enviada!");
        };
        list.appendChild(btn);
    });
    document.getElementById('modal-team-select').classList.remove('hidden');
}

function closeTeamSelect() { document.getElementById('modal-team-select').classList.add('hidden'); }

function renderPendingInscriptions() {
    const container = document.getElementById('pending-teams-list');
    container.innerHTML = "";
    const pendings = db.pendingInscriptions.filter(p => p.eventId === currentEventId);
    if(pendings.length === 0) container.innerHTML = "<small>Nenhuma.</small>";
    pendings.forEach(p => {
        container.innerHTML += `<div class="approval-item"><span>${p.teamName}</span><div><button class="btn-small" onclick="processInscription(${p.id}, true)">✓</button></div></div>`;
    });
}

function processInscription(id, approved) {
    db.pendingInscriptions = db.pendingInscriptions.filter(p => p.id !== id);
    renderPendingInscriptions();
    alert(approved ? "Aprovado!" : "Rejeitado.");
}

function renderMyTeamsAndEvents() {
    const teamContainer = document.getElementById('my-teams-slider');
    teamContainer.innerHTML = "";
    const myTeams = db.teams.filter(t => t.ownerId === db.currentUser.id);
    if(myTeams.length === 0) teamContainer.innerHTML = "<small>Sem times.</small>";
    myTeams.forEach(t => {
        teamContainer.innerHTML += `<div class="team-chip"><strong>${t.nome}</strong><br><small>${t.modalidade}</small></div>`;
    });

    const evContainer = document.getElementById('my-events-list');
    const empty = document.getElementById('empty-my-events');
    evContainer.innerHTML = "";
    const myEvents = db.events.filter(e => e.amIParticipating);
    if (myEvents.length === 0) empty.classList.remove('hidden');
    else {
        empty.classList.add('hidden');
        myEvents.forEach(e => {
            evContainer.innerHTML += `<div class="card" onclick="showEventDetails(${e.id})"><h3>${e.nome}</h3><p class="tag andamento">INSCRITO</p></div>`;
        });
    }
}

// --- OUTROS ---
function showMatchDetails(match) {
    document.getElementById('team-a-display').innerText = match.timeA;
    document.getElementById('team-b-display').innerText = match.timeB;
    document.getElementById('score-a').value = match.placarA;
    document.getElementById('score-b').value = match.placarB;
    
    const btn = document.getElementById('btn-approve-result');
    if(db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN') btn.classList.remove('hidden');
    else btn.classList.add('hidden');

    renderVoting();
    navigateTo('screen-match-details');
}

function renderVoting() {
    const list = document.getElementById('voting-list');
    list.innerHTML = "";
    db.players.forEach(p => {
        list.innerHTML += `<div class="vote-card"><div><strong>${p.name}</strong> <small>${p.team}</small></div><button class="btn-small" onclick="p = db.players.find(x=>x.id==${p.id}); p.votes++; renderVoting();">Votar (${p.votes})</button></div>`;
    });
}

function saveMatchResult() { alert("Sugerido!"); goBack(); }
function approveResult() { alert("Aprovado!"); goBack(); }
function toggleNotifications() { document.getElementById('modal-notifications').classList.toggle('hidden'); }
function renderProfile() {
    const u = db.currentUser;
    document.getElementById('profile-name').innerText = u.name;
    document.getElementById('profile-email').innerText = u.email;
    document.getElementById('profile-avatar').innerText = u.name.charAt(0);
    document.getElementById('profile-points').innerText = u.points;
    document.getElementById('profile-role-badge').innerText = u.role;
    
    const c = document.getElementById('interests-list');
    c.innerHTML = "";
    db.modalities.forEach(m => {
        const s = u.interests.includes(m) ? 'selected' : '';
        c.innerHTML += `<div class="interest-chip ${s}" onclick="if(db.currentUser.interests.includes('${m}')) db.currentUser.interests = db.currentUser.interests.filter(x=>x!='${m}'); else db.currentUser.interests.push('${m}'); renderProfile();">${m}</div>`;
    });
}
function renderRanking() {
    document.getElementById('ranking-list').innerHTML = db.ranking.map((r, i) => `<div class="ranking-item"><div class="rank-pos">#${i+1}</div><div class="rank-user">${r.name}</div><div class="rank-points">${r.points}</div></div>`).join('');
}

// Init
init();
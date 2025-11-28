// --- BANCO DE DADOS MOCKADO (Populando para Ranking) ---
const db = {
    currentUser: null,
    
    modalities: ["Futsal", "Volei", "Xadrez", "Handebol", "Basquete", "Tenis de Mesa", "E-Sports"],
    
    // ADIÇÃO: Mais usuários para popular o ranking e testar pontuações
    users: [
        { id: 1, name: "Carlos Gestor", email: "gestor@ifsp.edu.br", password: "123", role: "GESTOR", points: 1250, interests: ["Futsal"] },
        { id: 2, name: "Ana Aluna", email: "aluno@aluno.ifsp.edu.br", password: "123", role: "USER", points: 2500, interests: ["Volei", "Handebol"] }, // Diamante
        { id: 3, name: "Admin Sistema", email: "admin@ifsp.edu.br", password: "123", role: "ADMIN", points: 500, interests: [] },
        { id: 4, name: "Lucas Silva", email: "lucas@aluno.ifsp.edu.br", password: "123", role: "USER", points: 950, interests: ["Futsal"] }, // Prata
        { id: 5, name: "Mariana Costa", email: "mariana@aluno.ifsp.edu.br", password: "123", role: "USER", points: 1100, interests: ["Xadrez"] }, // Ouro
        { id: 6, name: "Pedro Santos", email: "pedro@aluno.ifsp.edu.br", password: "123", role: "USER", points: 2100, interests: ["E-Sports", "Basquete"] }, // Diamante
        { id: 7, name: "Juliana Lima", email: "juliana@aluno.ifsp.edu.br", password: "123", role: "USER", points: 150, interests: ["Volei"] }, // Bronze
        { id: 8, name: "Rafael Souza", email: "rafael@aluno.ifsp.edu.br", password: "123", role: "USER", points: 1800, interests: ["Futsal"] }, // Ouro
        { id: 9, name: "Beatriz Oliveira", email: "bia@aluno.ifsp.edu.br", password: "123", role: "USER", points: 3200, interests: ["Handebol"] } // Top 1
    ],

    events: [
        { id: 1, nome: "Copa IFSP Futsal", descricao: "Torneio tradicional.", dataInicio: "10/12/2024", status: "INSCRICOES_ABERTAS", modalidades: ["Futsal"], amIParticipating: false },
        { id: 2, nome: "Jogos de Verão", descricao: "Multiesportes.", dataInicio: "15/12/2024", status: "AGUARDANDO_INICIO", modalidades: ["Futsal", "Volei", "Handebol"], amIParticipating: false },
        { id: 3, nome: "Torneio Xadrez Rápido", descricao: "Valendo troféu.", dataInicio: "18/12/2024", status: "EM_ANDAMENTO", modalidades: ["Xadrez"], amIParticipating: true }
    ],

    matches: [
        { id: 101, eventoId: 1, timeA: "3º Informática", timeB: "2º Mecatrônica", placarA: 0, placarB: 0, status: "AGENDADA" },
        { id: 301, eventoId: 3, timeA: "Ana Aluna", timeB: "Mariana Costa", placarA: 1, placarB: 0, status: "FINALIZADA" }
    ],

    teams: [
        { id: 1, ownerId: 2, nome: "3º Informática", modalidade: "Futsal" },
        { id: 2, ownerId: 1, nome: "Vôlei Stars", modalidade: "Volei" }
    ],

    communities: [
        { id: 1, name: "Atlética da Computação", members: 120, description: "Comunidade oficial de TI." },
        { id: 2, name: "Clube de Xadrez", members: 45, description: "Encontros semanais e torneios." }
    ],

    posts: [
        { id: 1, communityId: 1, author: "João Silva", text: "Alguém animado para o Interclasse?", time: "10min atrás", likes: 5, dislikes: 0 },
        { id: 2, communityId: 1, author: "Maria Souza", text: "Comentário ofensivo (Teste Admin)", time: "1h atrás", likes: 0, dislikes: 10 }
    ],

    pendingInscriptions: [
        { id: 501, teamName: "Técnico em Edificações", eventId: 1 }
    ],

    notifications: [],
    
    // Jogadores da partida (para votação)
    players: [ 
        { id: 1, name: "Lucas Silva", team: "3º Info", votes: 12 },
        { id: 2, name: "Rafael Costa", team: "2º Mec", votes: 8 }
    ]
};

// --- HELPERS DE GAMIFICAÇÃO ---
function calculateLevel(points) {
    if (points >= 2000) return "DIAMANTE";
    if (points >= 1000) return "OURO";
    if (points >= 500) return "PRATA";
    return "BRONZE";
}

function calculateRankPosition(userId) {
    // Ordena todos os usuários por pontos (decrescente)
    const sortedUsers = [...db.users].sort((a, b) => b.points - a.points);
    // Retorna o índice + 1
    return sortedUsers.findIndex(u => u.id === userId) + 1;
}

// Variáveis de Estado
let currentEventId = null;
let currentCommunityId = null;
const historyStack = [];

// --- INICIALIZAÇÃO ---
function init() {
    populateModalitySelects(); 
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

        // Lógica do FAB (Botão Criar)
        if (screenId === 'screen-feed' && db.currentUser && (db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN')) {
            fab.classList.remove('hidden');
        } else {
            fab.classList.add('hidden');
        }
    }

    // Render triggers
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
    
    if (!email) return alert("Digite seu e-mail.");
    
    let user = db.users.find(u => u.email === email);

    // Fallback para teste rápido se usuário não existir
    if (!user) {
        alert("Criando usuário de teste...");
        let role = "USER";
        if (email.endsWith("@ifsp.edu.br") && !email.includes("aluno")) role = "GESTOR";
        if (email.includes("admin")) role = "ADMIN";
        user = { id: Date.now(), name: email.split('@')[0], email: email, role: role, points: 100, interests: [] };
        db.users.push(user);
    }

    if (pass !== "123" && pass !== "123456") return alert("Senha incorreta (Tente 123 ou 123456)");

    db.currentUser = user;
    document.getElementById('user-name-display').innerText = user.name.split(" ")[0];
    
    updateNavBasedOnRole();
    navigateTo('screen-feed');
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (db.users.find(u => u.email === email)) return alert("E-mail já cadastrado.");

    let role = "USER";
    if (!email.includes("@aluno.ifsp.edu.br") && !email.endsWith("@ifsp.edu.br")) {
        return alert("Use e-mail institucional do IFSP.");
    }

    const newUser = { id: Date.now(), name: name, email: email, password: pass, role: role, points: 0, interests: [] };
    db.users.push(newUser);
    alert("Conta criada! Faça login.");
    navigateTo('screen-login');
}

function forgotPassword() {
    const email = prompt("Digite seu e-mail cadastrado:");
    if (email) alert(`Link enviado para ${email}.`);
}

function updateNavBasedOnRole() {
    const adminNav = document.getElementById('nav-admin');
    if (db.currentUser && db.currentUser.role === 'ADMIN') adminNav.classList.remove('hidden');
    else adminNav.classList.add('hidden');
}

// --- PERFIL & GAMIFICAÇÃO (CORRIGIDO) ---
function renderProfile() {
    const u = db.currentUser;
    
    // Cálculos dinâmicos
    const currentLevel = calculateLevel(u.points);
    const currentRank = calculateRankPosition(u.id);

    document.getElementById('profile-name').innerText = u.name;
    document.getElementById('profile-email').innerText = u.email;
    document.getElementById('profile-avatar').innerText = u.name.charAt(0).toUpperCase();
    
    document.getElementById('profile-points').innerText = u.points;
    document.getElementById('profile-level').innerText = currentLevel;
    document.getElementById('profile-rank').innerText = "#" + currentRank;
    
    document.getElementById('profile-role-badge').innerText = u.role;
    document.getElementById('profile-role-badge').className = `role-badge ${u.role}`; // Ajusta cor do badge

    const c = document.getElementById('interests-list');
    c.innerHTML = "";
    db.modalities.forEach(m => {
        const s = u.interests.includes(m) ? 'selected' : '';
        c.innerHTML += `<div class="interest-chip ${s}" onclick="toggleInterest('${m}')">${m}</div>`;
    });
}

function toggleInterest(modality) {
    const u = db.currentUser;
    if (u.interests.includes(modality)) {
        u.interests = u.interests.filter(i => i !== modality);
    } else {
        u.interests.push(modality);
    }
    renderProfile(); // Re-renderiza para mostrar seleção
}

function renderRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = "";
    
    // Ordenar usuários por pontos
    const sortedUsers = [...db.users].sort((a, b) => b.points - a.points);

    sortedUsers.forEach((u, i) => {
        const isMe = db.currentUser && u.id === db.currentUser.id;
        const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i+1}`));
        
        list.innerHTML += `
            <div class="ranking-item ${isMe ? 'me' : ''}">
                <div class="rank-pos">${medal}</div>
                <div class="rank-user">
                    ${u.name} <br>
                    <small style="color:#888; font-weight:normal;">${calculateLevel(u.points)}</small>
                </div>
                <div class="rank-points">${u.points} pts</div>
            </div>`;
    });
}

// --- ADMIN ---
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
        
        let actionBtn = "";
        // Lógica: Admin pode promover Servidores (@ifsp) a Gestor
        const isServidor = u.email.endsWith("@ifsp.edu.br") && !u.email.includes("@aluno");

        if (db.currentUser.role === 'ADMIN' && u.role !== 'ADMIN') {
            if (isServidor) {
                actionBtn = `<button class="btn-small" onclick="toggleRole(${u.id})">
                                ${u.role === 'GESTOR' ? 'Revogar Gestor' : 'Tornar Gestor'}
                             </button>`;
            } else {
                actionBtn = `<span class="text-small" style="color:#999">Aluno (Fixo)</span>`;
            }
        }

        div.innerHTML = `
            <div>
                <strong>${u.name}</strong> <span class="role-badge-mini ${u.role}">${u.role}</span><br>
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
        alert("Adicionado!");
        populateModalitySelects();
        renderAdminModalities();
    }
}

// --- POPULATE SELECTS ---
function populateModalitySelects() {
    // Filtros Home
    const feedFilters = document.getElementById('feed-filters');
    if (feedFilters) {
        feedFilters.innerHTML = `<span class="tag aberto" onclick="filterEvents('all')" style="cursor:pointer;">Todos</span>`;
        db.modalities.forEach(mod => {
            feedFilters.innerHTML += `<span class="tag" onclick="filterEvents('${mod}')" style="background:#eee; color:#555; cursor:pointer;">${mod}</span>`;
        });
    }

    // Criar Time
    const teamSelect = document.getElementById('team-modality');
    if (teamSelect) {
        teamSelect.innerHTML = "";
        db.modalities.forEach(mod => {
            teamSelect.innerHTML += `<option value="${mod}">${mod}</option>`;
        });
    }

    // Criar Evento (Checkbox)
    const evtCheckContainer = document.getElementById('evt-modalidades-container');
    if (evtCheckContainer) {
        evtCheckContainer.innerHTML = "";
        db.modalities.forEach(mod => {
            evtCheckContainer.innerHTML += `<label class="check-label"><input type="checkbox" name="modalidades" value="${mod}"> ${mod}</label>`;
        });
    }
}

// --- EVENTOS ---
function renderEvents(filter = 'all') {
    const container = document.getElementById('events-list');
    container.innerHTML = "";
    
    db.events.forEach(evt => {
        if (filter !== 'all' && !evt.modalidades.includes(filter)) return;
        
        let actions = "";
        if (db.currentUser && (db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN')) {
            actions = `
                <div class="admin-card-actions">
                    <button class="btn-icon-small" onclick="event.stopPropagation(); prepareEditEvent(${evt.id})"><span class="material-symbols-outlined" style="font-size:1rem">edit</span></button>
                    <button class="btn-icon-small btn-delete" onclick="event.stopPropagation(); deleteEvent(${evt.id})"><span class="material-symbols-outlined" style="font-size:1rem">delete</span></button>
                </div>`;
        }

        const statusClass = evt.status === 'INSCRICOES_ABERTAS' ? 'aberto' : (evt.status === 'EM_ANDAMENTO' ? 'andamento' : 'encerrado');
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => showEventDetails(evt.id);
        card.innerHTML = `
            ${actions}
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
    
    const parts = evt.dataInicio.split('/');
    if (parts.length === 3) document.getElementById('evt-inicio').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    document.getElementById('evt-status').value = evt.status;

    document.querySelectorAll('input[name="modalidades"]').forEach(cb => {
        cb.checked = evt.modalidades.includes(cb.value);
    });
    navigateTo('screen-create-event');
}

function handleSaveEvent(e) {
    e.preventDefault();
    const id = document.getElementById('evt-id').value;
    const checkedMods = Array.from(document.querySelectorAll('input[name="modalidades"]:checked')).map(cb => cb.value);
    
    if (checkedMods.length === 0) return alert("Selecione modalidade.");

    const data = {
        nome: document.getElementById('evt-nome').value,
        descricao: document.getElementById('evt-desc').value,
        dataInicio: document.getElementById('evt-inicio').value.split('-').reverse().join('/'),
        status: document.getElementById('evt-status').value,
        modalidades: checkedMods,
        amIParticipating: false
    };

    if (id) {
        const idx = db.events.findIndex(ev => ev.id == id);
        db.events[idx] = { ...db.events[idx], ...data };
    } else {
        db.events.unshift({ id: Date.now(), ...data });
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

// --- DETALHES EVENTO ---
function showEventDetails(eventId) {
    currentEventId = eventId;
    const evt = db.events.find(e => e.id === eventId);
    if (!evt) return;

    // Verifica participação em meus times
    const myTeamInEvent = db.pendingInscriptions.find(p => p.eventId === eventId); // Simplificado
    const btnLabel = evt.amIParticipating ? "Inscrito ✔" : (myTeamInEvent ? "Pendente..." : "Inscrever Time");
    const btnDisabled = evt.amIParticipating || myTeamInEvent ? "disabled" : "";
    const btnClass = (evt.amIParticipating || myTeamInEvent) ? "btn-secondary" : "btn-primary";

    document.getElementById('event-info-container').innerHTML = `
        <h2 style="color: var(--ifsp-green-dark);">${evt.nome}</h2>
        <p style="margin-top: 5px;">${evt.descricao}</p>
        <div style="margin-top: 10px; font-size: 0.9rem; color: #555;">
            <span>📅 Início: ${evt.dataInicio}</span> <br> <span>🏆 ${evt.modalidades.join(', ')}</span>
        </div>
        <button class="btn ${btnClass}" style="margin-top: 15px;" onclick="trySubscribeTeam()" ${btnDisabled}>${btnLabel}</button>
    `;

    const managerArea = document.getElementById('manager-actions-area');
    const approvalArea = document.getElementById('admin-approval-area');
    
    if (db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN') {
        managerArea.classList.remove('hidden');
        managerArea.innerHTML = `<button class="btn btn-small" style="background-color:#007bff;" onclick="document.getElementById('modal-generate-brackets').classList.remove('hidden')">Gerar Chaves</button>`;
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
    // Mock: limpa e cria
    db.matches = db.matches.filter(m => m.eventoId !== currentEventId);
    db.matches.push({ id: Date.now(), eventoId: currentEventId, timeA: "Time A", timeB: "Time B", placarA: 0, placarB: 0, status: "AGENDADA" });
    document.getElementById('modal-generate-brackets').classList.add('hidden');
    alert("Tabela gerada!");
    renderMatches(currentEventId);
}

function renderMatches(eventId) {
    const container = document.getElementById('matches-list');
    container.innerHTML = "";
    const matches = db.matches.filter(m => m.eventoId === eventId);
    
    if (matches.length === 0) return container.innerHTML = "<p class='text-center text-small'>Sem jogos.</p>";

    matches.forEach(m => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.borderLeftColor = '#999';
        div.onclick = () => showMatchDetails(m);
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between;"><span>${m.timeA}</span><span style="background:#eee; padding:0 5px;">${m.placarA} x ${m.placarB}</span><span>${m.timeB}</span></div>
            <div class="text-center text-small">${m.status}</div>
        `;
        container.appendChild(div);
    });
}

// --- COMUNIDADES ---
function renderCommunities() {
    const list = document.getElementById('communities-list');
    list.innerHTML = "";
    db.communities.forEach(c => {
        let delBtn = "";
        if (db.currentUser.role === 'ADMIN') {
            delBtn = `<button class="delete-comm-btn" onclick="event.stopPropagation(); deleteCommunity(${c.id})"><span class="material-symbols-outlined">delete</span></button>`;
        }

        const div = document.createElement('div');
        div.className = 'comm-card';
        div.onclick = () => openCommunity(c.id);
        div.innerHTML = `<div style="flex:1"><h4>${c.name}</h4><small>${c.members} membros</small></div>${delBtn}`;
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
    db.communities.push({ id: Date.now(), name: document.getElementById('comm-name').value, description: document.getElementById('comm-desc').value, members: 1 });
    alert("Criada!");
    goBack();
}

function openCommunity(id) {
    currentCommunityId = id;
    const c = db.communities.find(x => x.id === id);
    document.getElementById('comm-header').innerHTML = `<h2 style="color:#007bff;">${c.name}</h2><p>${c.description}</p>`;
    renderCommunityFeed(id);
    navigateTo('screen-community-details');
}

function renderCommunityFeed(commId) {
    const list = document.getElementById('community-feed-list');
    list.innerHTML = "";
    const posts = db.posts.filter(p => p.communityId === commId);

    if(posts.length === 0) list.innerHTML = "<p class='text-center text-small'>Sem posts.</p>";

    posts.forEach(p => {
        let delBtn = "";
        if (db.currentUser.role === 'ADMIN') {
            delBtn = `<button class="post-delete-btn" onclick="deletePost(${p.id})"><span class="material-symbols-outlined" style="font-size:1.2rem">delete</span></button>`;
        }
        const div = document.createElement('div');
        div.className = 'post-item';
        div.innerHTML = `
            ${delBtn}
            <div class="post-header">
                <div class="avatar-small">${p.author.charAt(0)}</div>
                <div><div class="post-author">${p.author}</div><small class="post-time">${p.time}</small></div>
            </div>
            <div class="post-content">${p.text}</div>
            <div class="post-actions">
                <button class="action-btn" onclick="likePost(${p.id})"><span class="material-symbols-outlined">thumb_up</span> ${p.likes}</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function deletePost(id) {
    if(confirm("Admin: Remover post?")) {
        db.posts = db.posts.filter(p => p.id !== id);
        renderCommunityFeed(currentCommunityId);
    }
}

function handlePost() {
    const txt = document.getElementById('post-input').value;
    if(txt) {
        db.posts.unshift({ id: Date.now(), communityId: currentCommunityId, author: db.currentUser.name, text: txt, time: "Agora", likes: 0 });
        document.getElementById('post-input').value = "";
        renderCommunityFeed(currentCommunityId);
    }
}

function likePost(id) {
    const p = db.posts.find(x => x.id === id);
    if(p) { p.likes++; renderCommunityFeed(currentCommunityId); }
}

// --- TIMES ---
function handleCreateTeam(e) {
    e.preventDefault();
    db.teams.push({ id: Date.now(), ownerId: db.currentUser.id, nome: document.getElementById('team-name').value, modalidade: document.getElementById('team-modality').value });
    alert("Time criado!");
    goBack();
}

function trySubscribeTeam() {
    const evt = db.events.find(e => e.id === currentEventId);
    const validTeams = db.teams.filter(t => t.ownerId === db.currentUser.id && evt.modalidades.includes(t.modalidade));
    
    if(validTeams.length === 0) {
        if(confirm("Você não tem time compatível. Criar agora?")) navigateTo('screen-create-team');
        return;
    }
    
    const list = document.getElementById('team-select-list');
    list.innerHTML = "";
    validTeams.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.innerText = t.nome;
        btn.onclick = () => {
            db.pendingInscriptions.push({ id: Date.now(), teamName: t.nome, eventId: currentEventId });
            closeTeamSelect();
            alert("Solicitação enviada!");
            showEventDetails(currentEventId);
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

function processInscription(id, ok) {
    db.pendingInscriptions = db.pendingInscriptions.filter(p => p.id !== id);
    renderPendingInscriptions();
    alert(ok ? "Aprovado!" : "Rejeitado.");
}

function renderMyTeamsAndEvents() {
    const teamContainer = document.getElementById('my-teams-slider');
    teamContainer.innerHTML = "";
    const myTeams = db.teams.filter(t => t.ownerId === db.currentUser.id);
    if(myTeams.length === 0) teamContainer.innerHTML = "<small>Você não tem times.</small>";
    
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

// --- JOGOS ---
function showMatchDetails(m) {
    document.getElementById('team-a-display').innerText = m.timeA;
    document.getElementById('team-b-display').innerText = m.timeB;
    document.getElementById('score-a').value = m.placarA;
    document.getElementById('score-b').value = m.placarB;
    
    const btn = document.getElementById('btn-approve-result');
    if(db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN') btn.classList.remove('hidden');
    else btn.classList.add('hidden');

    renderVoting();
    navigateTo('screen-match-details');
}

function renderVoting() {
    const list = document.getElementById('voting-list');
    list.innerHTML = "";
    db.players.sort((a,b)=> b.votes - a.votes).forEach(p => {
        list.innerHTML += `<div class="vote-card"><div><strong>${p.name}</strong> <small>${p.team}</small></div><button class="btn-small" onclick="p=db.players.find(x=>x.id==${p.id}); p.votes++; renderVoting();">Votar (${p.votes})</button></div>`;
    });
}

function saveMatchResult() { alert("Enviado!"); goBack(); }
function approveResult() { alert("Aprovado!"); goBack(); }
function toggleNotifications() { document.getElementById('modal-notifications').classList.toggle('hidden'); }

// Init
init();
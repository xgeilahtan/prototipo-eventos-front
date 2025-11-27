// --- BANCO DE DADOS MOCKADO ---
const db = {
    currentUser: null,
    users: [
        { id: 1, name: "Carlos Gestor", email: "gestor@ifsp.edu.br", password: "123", role: "GESTOR", points: 1100, interests: ["Futsal"] },
        { id: 2, name: "Ana Aluna", email: "aluno@aluno.ifsp.edu.br", password: "123", role: "USER", points: 1500, interests: ["Volei"] },
        { id: 3, name: "Admin Sistema", email: "admin@ifsp.edu.br", password: "123", role: "ADMIN", points: 0, interests: [] }
    ],
    // HU 04: array de modalidades
    events: [
        { id: 1, nome: "Copa IFSP Futsal", descricao: "Torneio tradicional.", dataInicio: "10/12/2024", status: "INSCRICOES_ABERTAS", modalidades: ["Futsal"], amIParticipating: false },
        { id: 2, nome: "Jogos de Verão", descricao: "Multiesportes.", dataInicio: "15/12/2024", status: "AGUARDANDO_INICIO", modalidades: ["Futsal", "Volei", "Handebol"], amIParticipating: false }
    ],
    matches: [
        { id: 101, eventoId: 1, timeA: "3º Informática", timeB: "2º Mecatrônica", placarA: 2, placarB: 1, status: "ANDAMENTO" }
    ],
    teams: [
        { id: 1, ownerId: 2, nome: "3º Informática", modalidade: "Futsal" }, // Time da Ana
        { id: 2, ownerId: 1, nome: "Vôlei Stars", modalidade: "Volei" } // Time do Carlos
    ],
    communities: [
        { id: 1, name: "Atlética da Computação", members: 120, description: "Comunidade oficial dos cursos de TI." },
        { id: 2, name: "Clube de Xadrez", members: 45, description: "Encontros semanais e torneios." }
    ],
    posts: [
        { id: 1, communityId: 1, author: "João Silva", text: "Alguém animado para o Interclasse?", time: "10min atrás", likes: 5, dislikes: 0 }
    ],
    pendingInscriptions: [
        { id: 501, teamName: "Técnico em Edificações", eventId: 1 }
    ],
    notifications: [],
    players: [ { id: 1, name: "Lucas Silva", team: "3º Info", votes: 12 } ],
    ranking: [ { name: "Ana Aluna", points: 1500 }, { name: "Carlos Gestor", points: 1100 } ]
};

// Variáveis de Estado
let currentEventId = null;
let currentCommunityId = null;
const historyStack = [];

// --- NAVEGAÇÃO ---
function navigateTo(screenId, addToStack = true) {
    // Remove classe active de todas as views
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    
    // Ativa a tela de destino
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        if (addToStack) historyStack.push(screenId);
    }

    // Gerencia visibilidade do Header e Nav
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
        
        // Botão Voltar
        const mainScreens = ['screen-feed', 'screen-my-events', 'screen-communities', 'screen-ranking', 'screen-profile', 'screen-admin-users'];
        if (mainScreens.includes(screenId)) btnBack.classList.add('hidden');
        else btnBack.classList.remove('hidden');

        // Atualiza Nav Ativa
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(screenId === 'screen-feed') document.getElementById('nav-home').classList.add('active');
        if(screenId === 'screen-communities') document.getElementById('nav-communities').classList.add('active');
        if(screenId === 'screen-my-events') document.getElementById('nav-events').classList.add('active');
        if(screenId === 'screen-profile') document.getElementById('nav-profile').classList.add('active');
        if(screenId === 'screen-admin-users') document.getElementById('nav-admin')?.classList.add('active');

        // Fab visibility (Só na Home e se for Gestor/Admin)
        if (screenId === 'screen-feed' && (db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN')) {
            fab.classList.remove('hidden');
        } else {
            fab.classList.add('hidden');
        }
    }

    // Triggers de Renderização
    if (screenId === 'screen-feed') renderEvents();
    if (screenId === 'screen-my-events') renderMyTeamsAndEvents();
    if (screenId === 'screen-communities') renderCommunities();
    if (screenId === 'screen-profile') renderProfile();
    if (screenId === 'screen-ranking') renderRanking();
    if (screenId === 'screen-admin-users') renderAdminUsers();

    window.scrollTo(0, 0);
}

function goBack() {
    if (historyStack.length > 1) {
        historyStack.pop();
        const prev = historyStack[historyStack.length - 1];
        navigateTo(prev, false);
    }
}

function doLogout() {
    if (confirm("Tem certeza que deseja sair?")) {
        db.currentUser = null;
        document.getElementById('login-password').value = "";
        navigateTo('screen-login');
    }
}

// --- AUTENTICAÇÃO (HU 05, 06, 14) ---

function doLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    if (!email) return alert("Por favor, digite seu e-mail.");
    if (!pass) return alert("Por favor, digite sua senha.");

    // Busca usuário
    const user = db.users.find(u => u.email === email);

    if (user) {
        if (user.password !== pass) return alert("Senha incorreta.");
        db.currentUser = user;
    } else {
        // Fallback para facilitar o teste (cria um temporário se não existir na lista fixa)
        let role = "USER";
        if (email.includes("gestor")) role = "GESTOR";
        if (email.includes("admin")) role = "ADMIN";
        
        db.currentUser = { id: Date.now(), name: email.split('@')[0], email: email, role: role, points: 0, interests: [] };
        db.users.push(db.currentUser); // Adiciona para persistir na sessão
    }

    // Configura UI Baseada em Papel
    const adminNav = document.getElementById('nav-admin');
    if (db.currentUser.role === 'ADMIN') adminNav.classList.remove('hidden');
    else adminNav.classList.add('hidden');

    document.getElementById('user-name-display').innerText = db.currentUser.name.split(" ")[0];
    navigateTo('screen-feed');
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (db.users.find(u => u.email === email)) {
        return alert("Este e-mail já está cadastrado.");
    }

    const newUser = { id: Date.now(), name: name, email: email, password: pass, role: "USER", points: 0, interests: [] };
    db.users.push(newUser);
    
    alert("Conta criada com sucesso! Você será redirecionado.");
    
    // Auto-login
    db.currentUser = newUser;
    document.getElementById('user-name-display').innerText = name.split(" ")[0];
    navigateTo('screen-feed');
}

function forgotPassword() {
    const email = prompt("Digite seu e-mail cadastrado para recuperar a senha:");
    if (email) {
        alert(`Um link de recuperação foi enviado para ${email}. Verifique sua caixa de entrada (Spam).`);
    }
}

// --- GESTÃO DE USUÁRIOS (HU 14 - Admin) ---
function renderAdminUsers() {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = "";
    db.users.forEach(u => {
        const div = document.createElement('div');
        div.className = "user-list-item";
        
        // Botão de ação (não pode alterar o próprio admin ou outro admin)
        let actionBtn = "";
        if (u.role !== 'ADMIN' && u.id !== db.currentUser.id) {
            const isGestor = u.role === 'GESTOR';
            actionBtn = `<button class="btn-small" onclick="toggleRole(${u.id})">
                            ${isGestor ? 'Remover Gestor' : 'Tornar Gestor'}
                         </button>`;
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
        renderAdminUsers(); // Re-renderiza
    }
}

// --- EVENTOS (HU 01, 02, 03, 04) ---

function renderEvents(filter = 'all') {
    const container = document.getElementById('events-list');
    container.innerHTML = "";
    
    if (db.events.length === 0) {
        container.innerHTML = "<p class='text-center text-small'>Nenhum evento disponível.</p>";
        return;
    }

    db.events.forEach(evt => {
        // Filtro de modalidade (verifica se a tag está no array de modalidades do evento)
        if (filter !== 'all' && !evt.modalidades.includes(filter)) return;

        const statusClass = evt.status === 'INSCRICOES_ABERTAS' ? 'aberto' : (evt.status === 'EM_ANDAMENTO' ? 'andamento' : 'encerrado');
        
        // Ações de Gestor/Admin nos cards
        let adminActions = "";
        if (db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN') {
            adminActions = `
                <div class="admin-card-actions">
                    <button class="btn-icon-small" onclick="event.stopPropagation(); prepareEditEvent(${evt.id})">
                        <span class="material-symbols-outlined" style="font-size:1rem;">edit</span>
                    </button>
                    <button class="btn-icon-small btn-delete" onclick="event.stopPropagation(); deleteEvent(${evt.id})">
                        <span class="material-symbols-outlined" style="font-size:1rem;">delete</span>
                    </button>
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
                <span class="text-small">📅 ${evt.dataInicio}</span><br>
                <span class="text-small">🏆 ${evt.modalidades.join(', ')}</span>
            </div>
            <div style="margin-top:8px;">
                <span class="tag ${statusClass}">${evt.status.replace('_', ' ')}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Criar Evento (Prepara)
function prepareCreateEvent() {
    document.getElementById('form-event-title').innerText = "Novo Evento";
    document.getElementById('form-create-event').reset();
    document.getElementById('evt-id').value = "";
    // Desmarcar checkboxes
    document.querySelectorAll('input[name="modalidades"]').forEach(cb => cb.checked = false);
    navigateTo('screen-create-event');
}

// Editar Evento (Popula)
function prepareEditEvent(id) {
    const evt = db.events.find(e => e.id === id);
    if(!evt) return;

    document.getElementById('form-event-title').innerText = "Editar Evento";
    document.getElementById('evt-id').value = evt.id;
    document.getElementById('evt-nome').value = evt.nome;
    document.getElementById('evt-desc').value = evt.descricao;
    // Formato date input: YYYY-MM-DD. Se estiver DD/MM/YYYY, converte.
    const parts = evt.dataInicio.split('/');
    if (parts.length === 3) document.getElementById('evt-inicio').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    
    document.getElementById('evt-status').value = evt.status;

    // Checkboxes
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
        amIParticipating: false // Default
    };

    if (id) {
        // Update
        const idx = db.events.findIndex(ev => ev.id == id);
        if (idx !== -1) db.events[idx] = { ...db.events[idx], ...eventData };
        alert("Evento atualizado com sucesso!");
    } else {
        // Create
        db.events.unshift({ id: Date.now(), ...eventData });
        alert("Evento criado com sucesso!");
    }
    navigateTo('screen-feed');
}

function deleteEvent(id) {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
        db.events = db.events.filter(e => e.id !== id);
        renderEvents(); // Atualiza a lista
    }
}

function filterEvents(type) { renderEvents(type); }


// --- DETALHES DO EVENTO & HU 09 (CHAVES) & HU 12 (APROVAÇÃO) ---

function showEventDetails(eventId) {
    currentEventId = eventId;
    const evt = db.events.find(e => e.id === eventId);
    if (!evt) return;

    // 1. Info Básica
    const btnLabel = evt.amIParticipating ? "Inscrição Realizada ✔" : "Inscrever Time";
    const btnDisabled = evt.amIParticipating ? "disabled" : "";
    const btnClass = evt.amIParticipating ? "btn-secondary" : "btn-primary";

    document.getElementById('event-info-container').innerHTML = `
        <h2 style="color: var(--ifsp-green-dark);">${evt.nome}</h2>
        <p style="margin-top: 5px;">${evt.descricao}</p>
        <div style="margin-top: 10px; font-size: 0.9rem; color: #555;">
            <span>📅 Início: ${evt.dataInicio}</span> <br> 
            <span>🏆 Modalidades: ${evt.modalidades.join(', ')}</span>
        </div>
        <button class="btn ${btnClass}" style="margin-top: 15px;" onclick="trySubscribeTeam()" ${btnDisabled}>${btnLabel}</button>
    `;

    // 2. Área do Gestor (Gerar Chaves e Aprovar)
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

    // 3. Lista de Partidas
    renderMatches(eventId);
    navigateTo('screen-event-details');
}

// HU 09: Gerar Chaves
function confirmGenerateBrackets() {
    const format = document.getElementById('bracket-format').value;
    // Mock: Remove jogos velhos e cria novos
    db.matches = db.matches.filter(m => m.eventoId !== currentEventId);
    
    // Cria jogos mockados baseados na seleção
    db.matches.push(
        { id: Date.now(), eventoId: currentEventId, timeA: "Time A (Gerado)", timeB: "Time B (Gerado)", placarA: 0, placarB: 0, status: "AGENDADA" },
        { id: Date.now()+1, eventoId: currentEventId, timeA: "Time C (Gerado)", timeB: "Time D (Gerado)", placarA: 0, placarB: 0, status: "AGENDADA" }
    );

    document.getElementById('modal-generate-brackets').classList.add('hidden');
    alert(`Chaves geradas com sucesso!\nFormato: ${format}`);
    renderMatches(currentEventId);
}

function renderMatches(eventId) {
    const container = document.getElementById('matches-list');
    container.innerHTML = "";
    const matches = db.matches.filter(m => m.eventoId === eventId);

    if (matches.length === 0) {
        container.innerHTML = "<p class='text-center text-small' style='padding:20px;'>Nenhum jogo definido ainda.</p>";
        return;
    }

    matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.borderLeftColor = '#999';
        div.style.cursor = 'pointer';
        div.onclick = () => showMatchDetails(match);
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">${match.timeA}</span>
                <span style="background: #eee; padding: 2px 8px; border-radius: 4px;">${match.placarA} x ${match.placarB}</span>
                <span style="font-weight: bold;">${match.timeB}</span>
            </div>
            <div class="text-center text-small" style="margin-top: 8px;">${match.status}</div>`;
        container.appendChild(div);
    });
}

// --- INSCRIÇÕES ---

function trySubscribeTeam() {
    const evt = db.events.find(e => e.id === currentEventId);
    // Verifica se usuário tem time de alguma modalidade do evento
    const validTeams = db.teams.filter(t => t.ownerId === db.currentUser.id && evt.modalidades.includes(t.modalidade));

    if (validTeams.length === 0) {
        if(confirm(`Você não possui um time compatível com as modalidades deste evento (${evt.modalidades.join(', ')}).\nDeseja criar um time agora?`)) {
            navigateTo('screen-create-team');
        }
        return;
    }

    // Abre modal de seleção
    const list = document.getElementById('team-select-list');
    list.innerHTML = "";
    validTeams.forEach(t => {
        const btn = document.createElement('button');
        btn.className = "btn btn-secondary";
        btn.style.textAlign = "left";
        btn.innerHTML = `<strong>${t.nome}</strong> <span style="float:right; font-size:0.8rem;">${t.modalidade}</span>`;
        btn.onclick = () => {
            // Envia solicitacao
            db.pendingInscriptions.push({ id: Date.now(), teamName: t.nome, eventId: currentEventId });
            closeTeamSelect();
            alert("Solicitação de inscrição enviada! Aguarde aprovação.");
            showEventDetails(currentEventId); // Refresh
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

    if (pendings.length === 0) {
        container.innerHTML = "<small style='color:#777'>Nenhuma pendência.</small>";
        return;
    }

    pendings.forEach(p => {
        const div = document.createElement('div');
        div.className = 'approval-item';
        div.innerHTML = `
            <span>${p.teamName}</span>
            <div class="approval-actions">
                <button class="btn-small" onclick="processInscription(${p.id}, true)">✓</button>
                <button class="btn-danger-small" onclick="processInscription(${p.id}, false)">✕</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function processInscription(id, approved) {
    db.pendingInscriptions = db.pendingInscriptions.filter(p => p.id !== id);
    if (approved) {
        alert("Time Aprovado!");
        // Na logica real, adicionaria ao evento. Aqui apenas atualiza UI.
    } else {
        alert("Time Rejeitado.");
    }
    renderPendingInscriptions();
}

// --- TIMES (CRUD Simples) ---

function handleCreateTeam(e) {
    e.preventDefault();
    const name = document.getElementById('team-name').value;
    const mod = document.getElementById('team-modality').value;
    
    db.teams.push({ id: Date.now(), ownerId: db.currentUser.id, nome: name, modalidade: mod });
    alert("Time criado com sucesso!");
    goBack(); // Volta para onde estava
}

function renderMyTeamsAndEvents() {
    const teamContainer = document.getElementById('my-teams-slider');
    teamContainer.innerHTML = "";
    const myTeams = db.teams.filter(t => t.ownerId === db.currentUser.id);

    if (myTeams.length === 0) {
        teamContainer.innerHTML = "<small style='padding:10px; color:#777'>Você não tem times.</small>";
    } else {
        myTeams.forEach(t => {
            const div = document.createElement('div');
            div.className = 'team-chip';
            div.innerHTML = `<strong>${t.nome}</strong><br><small>${t.modalidade}</small>`;
            teamContainer.appendChild(div);
        });
    }

    // Meus Eventos (Mockado via flag amIParticipating)
    const myEvents = db.events.filter(e => e.amIParticipating);
    const evContainer = document.getElementById('my-events-list');
    const empty = document.getElementById('empty-my-events');
    
    evContainer.innerHTML = "";
    if (myEvents.length === 0) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        myEvents.forEach(e => {
            const div = document.createElement('div');
            div.className = 'card';
            div.onclick = () => showEventDetails(e.id);
            div.innerHTML = `<h3>${e.nome}</h3><p class="tag andamento">INSCRITO</p>`;
            evContainer.appendChild(div);
        });
    }
}

// --- COMUNIDADES ---

function renderCommunities() {
    const list = document.getElementById('communities-list');
    list.innerHTML = "";
    db.communities.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comm-card';
        div.onclick = () => openCommunity(c.id);
        div.innerHTML = `
            <div><h4>${c.name}</h4><small>${c.members} membros</small></div>
            <span class="material-symbols-outlined">chevron_right</span>
        `;
        list.appendChild(div);
    });
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
    
    if (posts.length === 0) {
        list.innerHTML = "<p class='text-center text-small'>Sem posts.</p>";
        return;
    }

    posts.forEach(p => {
        const div = document.createElement('div');
        div.className = 'post-item';
        div.innerHTML = `
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

function handlePost() {
    const txt = document.getElementById('post-input').value;
    if (!txt) return;
    db.posts.unshift({ 
        id: Date.now(), communityId: currentCommunityId, 
        author: db.currentUser.name, text: txt, time: "Agora", likes: 0 
    });
    document.getElementById('post-input').value = "";
    renderCommunityFeed(currentCommunityId);
}

function likePost(id) {
    const p = db.posts.find(post => post.id === id);
    if (p) { p.likes++; renderCommunityFeed(currentCommunityId); }
}

// --- SÚMULA / JOGO ---
function showMatchDetails(match) {
    document.getElementById('match-title-display').innerText = "Súmula da Partida";
    document.getElementById('team-a-display').innerText = match.timeA;
    document.getElementById('team-b-display').innerText = match.timeB;
    document.getElementById('score-a').value = match.placarA;
    document.getElementById('score-b').value = match.placarB;
    
    // Controle botão aprovar
    const btnApprove = document.getElementById('btn-approve-result');
    if(db.currentUser.role === 'GESTOR' || db.currentUser.role === 'ADMIN') {
        btnApprove.classList.remove('hidden');
    } else {
        btnApprove.classList.add('hidden');
    }

    renderVoting();
    navigateTo('screen-match-details');
}

function saveMatchResult() {
    alert("Resultado sugerido enviado para o gestor!");
    goBack();
}

function approveResult() {
    alert("Resultado oficializado e tabela atualizada!");
    goBack();
}

function renderVoting() {
    const list = document.getElementById('voting-list');
    list.innerHTML = "";
    // Ordena jogadores por voto
    const sortedPlayers = [...db.players].sort((a,b) => b.votes - a.votes);
    
    sortedPlayers.forEach(p => {
        const div = document.createElement('div');
        div.className = 'vote-card';
        div.innerHTML = `
            <div><strong>${p.name}</strong> <small>(${p.team})</small></div>
            <button class="btn-small" onclick="votePlayer(${p.id})">Votar (${p.votes})</button>
        `;
        list.appendChild(div);
    });
}

function votePlayer(id) {
    const p = db.players.find(pl => pl.id === id);
    if(p) { 
        p.votes++; 
        alert(`Voto confirmado em ${p.name}!`);
        renderVoting(); 
    }
}

// --- NOTIFICAÇÕES ---
function toggleNotifications() {
    const modal = document.getElementById('modal-notifications');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        const list = document.getElementById('notifications-list');
        list.innerHTML = db.notifications.length ? '' : '<p class="text-small">Nenhuma notificação.</p>';
        db.notifications.forEach(n => {
            list.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee;">${n.text}</div>`;
        });
    }
}

// --- PERFIL & RANKING ---
function renderProfile() {
    const u = db.currentUser;
    document.getElementById('profile-name').innerText = u.name;
    document.getElementById('profile-email').innerText = u.email;
    document.getElementById('profile-avatar').innerText = u.name.charAt(0).toUpperCase();
    document.getElementById('profile-points').innerText = u.points;
    
    const chipContainer = document.getElementById('interests-list');
    chipContainer.innerHTML = "";
    const allSports = ["Futsal", "Volei", "Xadrez", "Handebol", "Basquete"];
    
    allSports.forEach(sport => {
        const isSel = u.interests.includes(sport);
        const chip = document.createElement('div');
        chip.className = `interest-chip ${isSel ? 'selected' : ''}`;
        chip.innerText = sport;
        chip.onclick = () => {
            if(isSel) u.interests = u.interests.filter(i => i !== sport);
            else u.interests.push(sport);
            renderProfile();
        };
        chipContainer.appendChild(chip);
    });
}

function renderRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = "";
    const sorted = [...db.ranking].sort((a, b) => b.points - a.points);
    sorted.forEach((r, i) => {
        const div = document.createElement('div');
        div.className = 'ranking-item';
        if(r.name === db.currentUser.name) div.classList.add('me');
        div.innerHTML = `
            <div class="rank-pos">#${i+1}</div>
            <div class="rank-user">${r.name}</div>
            <div class="rank-points">${r.points} pts</div>
        `;
        list.appendChild(div);
    });
}
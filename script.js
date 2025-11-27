// --- DADOS MOCKADOS ---
const db = {
    user: { 
        name: "Visitante", email: "", role: "GUEST", points: 0, level: "NENHUM", rank: "-", interests: [] 
    },
    events: [
        { id: 1, nome: "Copa IFSP Futsal", descricao: "Torneio tradicional.", dataInicio: "10/12/2024", status: "INSCRICOES_ABERTAS", modalidade: "Futsal", amIParticipating: true },
        { id: 2, nome: "Torneio de Xadrez", descricao: "Valendo vaga para o JIF.", dataInicio: "15/12/2024", status: "AGUARDANDO_INICIO", modalidade: "Xadrez", amIParticipating: false },
        { id: 3, nome: "Vôlei de Areia Misto", descricao: "Quartetos mistos.", dataInicio: "20/12/2024", status: "EM_ANDAMENTO", modalidade: "Volei", amIParticipating: true }
    ],
    matches: [
        { id: 101, eventoId: 1, timeA: "3º Informática", timeB: "2º Mecatrônica", placarA: 2, placarB: 1, status: "ANDAMENTO" },
        { id: 102, eventoId: 1, timeA: "1º Lic. Mat", timeB: "Eng. Automação", placarA: 0, placarB: 0, status: "AGENDADA" }
    ],
    teams: [
        { id: 1, nome: "3º Informática", modalidade: "Futsal" },
        { id: 2, nome: "Vôlei Stars", modalidade: "Volei" }
    ],
    communities: [
        { id: 1, name: "Atlética da Computação", members: 120, description: "Comunidade oficial dos cursos de TI." },
        { id: 2, name: "Clube de Xadrez", members: 45, description: "Encontros semanais e torneios." },
        { id: 3, name: "Vôlei dos Servidores", members: 15, description: "Racha de vôlei toda quinta." }
    ],
    // Posts agora vinculados a CommunityId
    posts: [
        { id: 1, communityId: 1, author: "João Silva", text: "Alguém animado para o Interclasse?", time: "10min atrás", likes: 5, dislikes: 0 },
        { id: 2, communityId: 1, author: "Maria Souza", text: "Precisamos de mais treinos antes da copa!", time: "1h atrás", likes: 12, dislikes: 1 },
        { id: 3, communityId: 2, author: "Pedro H.", text: "Nova abertura que aprendi, muito boa!", time: "2 dias atrás", likes: 3, dislikes: 0 }
    ],
    pendingInscriptions: [
        { id: 501, teamName: "Técnico em Edificações", eventId: 1 },
        { id: 502, teamName: "Licenciatura Física", eventId: 1 }
    ],
    notifications: [
        { id: 1, text: "Você foi convidado para o time 'Feras do Basquete'", read: false },
        { id: 2, text: "Resultado do jogo 3º Info x 2º Mec foi aprovado", read: true }
    ],
    ranking: [
        { name: "Ana (Aluna)", points: 1500 },
        { name: "João Silva", points: 1420 },
        { name: "Pedro H.", points: 1300 },
        { name: "Carlos (Gestor)", points: 1100 },
        { name: "Maria Souza", points: 950 }
    ],
    players: [
        { id: 1, name: "Lucas Silva", team: "3º Info", votes: 12 },
        { id: 2, name: "Rafael Costa", team: "2º Mec", votes: 8 }
    ],
    modalities: ["Futsal", "Volei", "Xadrez", "Handebol", "Basquete"]
};

let currentEventId = null;
let currentCommunityId = null;

const historyStack = [];

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

    if (screenId === 'screen-login') {
        header.classList.add('hidden');
        nav.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
        nav.classList.remove('hidden');
        
        const mainScreens = ['screen-feed', 'screen-my-events', 'screen-communities', 'screen-ranking', 'screen-profile'];
        if (mainScreens.includes(screenId)) {
            btnBack.classList.add('hidden');
        } else {
            btnBack.classList.remove('hidden');
        }

        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(screenId === 'screen-feed') document.getElementById('nav-home').classList.add('active');
        if(screenId === 'screen-communities') document.getElementById('nav-communities').classList.add('active');
        if(screenId === 'screen-my-events') document.getElementById('nav-events').classList.add('active');
        if(screenId === 'screen-profile') document.getElementById('nav-profile').classList.add('active');
    }

    if (screenId === 'screen-feed') renderEvents();
    if (screenId === 'screen-my-events') renderMyTeamsAndEvents();
    if (screenId === 'screen-communities') renderCommunities();
    if (screenId === 'screen-profile') renderProfile();
    if (screenId === 'screen-ranking') renderRanking();

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
        db.user = { name: "Visitante", role: "GUEST", points: 0 };
        document.getElementById('login-password').value = "";
        navigateTo('screen-login');
    }
}

// --- AUTH & NOTIFICAÇÕES ---

function doLogin() {
    const email = document.getElementById('login-email').value;
    if (!email) { alert("Digite um email"); return; }

    if (email.includes("gestor")) {
        db.user = { name: "Carlos (Gestor)", email: email, role: "GESTOR", points: 1100, level: "OURO", rank: "4º", interests: ["Futsal"] };
        document.getElementById('fab-create').classList.remove('hidden');
    } else {
        db.user = { name: "Ana (Aluna)", email: email, role: "USER", points: 1500, level: "DIAMANTE", rank: "1º", interests: ["Volei"] };
        document.getElementById('fab-create').classList.add('hidden');
    }

    document.getElementById('user-name-display').innerText = db.user.name.split(" ")[0];
    document.getElementById('user-avatar-post').innerText = db.user.name.charAt(0);
    updateNotificationBadge();
    navigateTo('screen-feed');
}

function updateNotificationBadge() {
    const unread = db.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (unread > 0) {
        badge.innerText = unread;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function toggleNotifications() {
    const modal = document.getElementById('modal-notifications');
    if (modal.classList.contains('hidden')) {
        renderNotifications();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function renderNotifications() {
    const list = document.getElementById('notifications-list');
    list.innerHTML = "";
    db.notifications.forEach(notif => {
        const item = document.createElement('div');
        item.style.padding = "10px";
        item.style.borderBottom = "1px solid #eee";
        item.style.background = notif.read ? "white" : "#f0f7ff";
        item.innerHTML = `<p>${notif.text}</p>`;
        if (!notif.read) {
            const btn = document.createElement('button');
            btn.className = "btn-small";
            btn.style.fontSize = "0.7rem";
            btn.innerText = "Marcar como lida";
            btn.onclick = () => { notif.read = true; updateNotificationBadge(); toggleNotifications(); };
            item.appendChild(btn);
        }
        list.appendChild(item);
    });
}

// --- EVENTOS ---

function renderEvents(filter = 'all') {
    const container = document.getElementById('events-list');
    container.innerHTML = "";
    db.events.forEach(evt => {
        if (filter !== 'all' && evt.modalidade !== filter) return;
        const statusClass = evt.status === 'INSCRICOES_ABERTAS' ? 'aberto' : (evt.status === 'EM_ANDAMENTO' ? 'andamento' : 'encerrado');
        const statusLabel = evt.status.replace('_', ' ');
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => showEventDetails(evt.id);
        card.innerHTML = `
            <h3>${evt.nome}</h3>
            <p>${evt.descricao}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                <span style="font-size:0.85rem; color:#555">📅 ${evt.dataInicio} • 🏅 ${evt.modalidade}</span>
                <span class="tag ${statusClass}">● ${statusLabel}</span>
            </div>`;
        container.appendChild(card);
    });
}

function filterEvents(type) { 
    renderEvents(type); 
    // Visual update
    document.querySelectorAll('#screen-feed .tag').forEach(t => {
        if(t.innerText === type || (type === 'all' && t.innerText === 'Todos')) {
            t.style.backgroundColor = '#e8f5e9'; t.style.color = 'var(--ifsp-green)';
        } else {
            t.style.backgroundColor = '#eee'; t.style.color = '#555';
        }
    });
}

// --- COMUNIDADES & SOCIAL ---

function renderCommunities() {
    const container = document.getElementById('communities-list');
    container.innerHTML = "";
    db.communities.forEach(comm => {
        const card = document.createElement('div');
        card.className = "comm-card";
        card.onclick = () => showCommunityDetails(comm.id);
        card.innerHTML = `
            <div>
                <h4 style="margin-bottom:4px;">${comm.name}</h4>
                <small style="color:#777;">${comm.members} membros</small>
                <p style="font-size:0.9rem; margin-top:5px;">${comm.description}</p>
            </div>
            <span class="material-symbols-outlined" style="color:#ccc;">chevron_right</span>
        `;
        container.appendChild(card);
    });
}

function handleCreateCommunity(e) {
    e.preventDefault();
    const name = document.getElementById('comm-name').value;
    const desc = document.getElementById('comm-desc').value;
    db.communities.push({ id: Date.now(), name: name, members: 1, description: desc });
    alert(`Comunidade "${name}" criada!`);
    goBack();
}

function showCommunityDetails(commId) {
    currentCommunityId = commId;
    const comm = db.communities.find(c => c.id === commId);
    if(!comm) return;

    document.getElementById('comm-header').innerHTML = `
        <h2 style="color: #007bff;">${comm.name}</h2>
        <p style="color:#666;">${comm.description} • ${comm.members} membros</p>
    `;

    renderCommunityFeed(commId);
    navigateTo('screen-community-details');
}

function renderCommunityFeed(commId) {
    const container = document.getElementById('community-feed-list');
    container.innerHTML = "";
    const posts = db.posts.filter(p => p.communityId === commId);

    if(posts.length === 0) {
        container.innerHTML = "<p class='text-center text-small'>Nenhum post ainda. Seja o primeiro!</p>";
        return;
    }

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = "post-item";
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="avatar-small">${post.author.charAt(0)}</div>
                <div>
                    <div class="post-author">${post.author}</div>
                    <div class="post-time">${post.time}</div>
                </div>
            </div>
            <div class="post-content">${post.text}</div>
            <div class="post-actions">
                <button class="action-btn" onclick="handleLike(${post.id})">
                    <span class="material-symbols-outlined">thumb_up</span> ${post.likes}
                </button>
                <button class="action-btn" onclick="handleDownvote(${post.id})">
                    <span class="material-symbols-outlined">thumb_down</span> ${post.dislikes}
                </button>
                <button class="action-btn" onclick="alert('Comentários em breve!')">
                    <span class="material-symbols-outlined">comment</span> Comentar
                </button>
            </div>
        `;
        container.appendChild(postDiv);
    });
}

function handlePost() {
    const input = document.getElementById('post-input');
    if(!input.value) return;
    
    db.posts.unshift({ 
        id: Date.now(), 
        communityId: currentCommunityId, 
        author: db.user.name, 
        text: input.value, 
        time: "Agora mesmo",
        likes: 0, 
        dislikes: 0 
    });
    
    input.value = "";
    renderCommunityFeed(currentCommunityId);
}

function handleLike(postId) {
    const post = db.posts.find(p => p.id === postId);
    if(post) {
        post.likes++;
        renderCommunityFeed(currentCommunityId);
    }
}

function handleDownvote(postId) {
    const post = db.posts.find(p => p.id === postId);
    if(post) {
        post.dislikes++;
        renderCommunityFeed(currentCommunityId);
    }
}


// --- GESTÃO & OUTROS ---

function handleCreateTeam(e) {
    e.preventDefault();
    const name = document.getElementById('team-name').value;
    const mod = document.getElementById('team-modality').value;
    db.teams.push({ id: Date.now(), nome: name, modalidade: mod });
    alert(`Time "${name}" criado com sucesso!`);
    goBack();
}

function handleCreateEvent(e) {
    e.preventDefault();
    const newEvent = {
        id: db.events.length + 1,
        nome: document.getElementById('evt-nome').value,
        descricao: document.getElementById('evt-desc').value,
        dataInicio: document.getElementById('evt-inicio').value.split('-').reverse().join('/'),
        status: document.getElementById('evt-status').value,
        modalidade: document.getElementById('evt-modalidade').value,
        amIParticipating: true 
    };
    db.events.unshift(newEvent);
    alert("Evento cadastrado com sucesso!");
    document.getElementById('form-create-event').reset();
    navigateTo('screen-feed');
}

function showEventDetails(eventId) {
    currentEventId = eventId;
    const evt = db.events.find(e => e.id === eventId);
    if (!evt) return;

    document.getElementById('event-info-container').innerHTML = `
        <h2 style="color: var(--ifsp-green-dark);">${evt.nome}</h2>
        <p style="margin-top: 5px;">${evt.descricao}</p>
        <div style="margin-top: 10px; font-size: 0.9rem; color: #555;">
            <span>📅 Início: ${evt.dataInicio}</span> | <span>🏆 ${evt.modalidade}</span>
        </div>
        <button class="btn btn-secondary" style="margin-top: 10px;">${evt.amIParticipating ? "Gerenciar Inscrição" : "Inscrever Time"}</button>
    `;

    const approvalArea = document.getElementById('admin-approval-area');
    if (db.user.role === 'GESTOR') {
        approvalArea.classList.remove('hidden');
        renderPendingInscriptions();
    } else {
        approvalArea.classList.add('hidden');
    }

    const matchesContainer = document.getElementById('matches-list');
    matchesContainer.innerHTML = "";
    const eventMatches = db.matches; 
    eventMatches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'card';
        matchCard.style.borderLeftColor = '#999';
        matchCard.onclick = () => showMatchDetails(match);
        matchCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">${match.timeA}</span>
                <span style="background: #eee; padding: 2px 8px; border-radius: 4px;">${match.placarA} x ${match.placarB}</span>
                <span style="font-weight: bold;">${match.timeB}</span>
            </div>
            <div class="text-center text-small" style="margin-top: 8px;">${match.status}</div>`;
        matchesContainer.appendChild(matchCard);
    });

    navigateTo('screen-event-details');
}

function renderPendingInscriptions() {
    const container = document.getElementById('pending-teams-list');
    container.innerHTML = "";
    const pendings = db.pendingInscriptions.filter(p => p.eventId === 1);
    
    if(pendings.length === 0) {
        container.innerHTML = "<small style='color:#777'>Nenhuma solicitação pendente.</small>";
        return;
    }

    pendings.forEach(item => {
        const div = document.createElement('div');
        div.className = "approval-item";
        div.innerHTML = `
            <span>${item.teamName}</span>
            <div class="approval-actions">
                <button class="btn-small" onclick="approveTeam(this)">✓</button>
                <button class="btn-danger-small" onclick="rejectTeam(this)">✕</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function approveTeam(btn) {
    const item = btn.parentElement.parentElement;
    item.innerHTML = "<span style='color:green; font-weight:bold;'>Aprovado!</span>";
    setTimeout(() => item.remove(), 1000);
}

function rejectTeam(btn) {
    const item = btn.parentElement.parentElement;
    item.innerHTML = "<span style='color:red; font-weight:bold;'>Rejeitado.</span>";
    setTimeout(() => item.remove(), 1000);
}

function renderMyTeamsAndEvents() {
    const teamContainer = document.getElementById('my-teams-slider');
    teamContainer.innerHTML = "";
    db.teams.forEach(team => {
        const chip = document.createElement('div');
        chip.className = "team-chip";
        chip.innerHTML = `<strong>${team.nome}</strong><br><small>${team.modalidade}</small>`;
        teamContainer.appendChild(chip);
    });

    const eventContainer = document.getElementById('my-events-list');
    const emptyState = document.getElementById('empty-my-events');
    eventContainer.innerHTML = "";
    const myEvents = db.events.filter(e => e.amIParticipating);
    
    if (myEvents.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        myEvents.forEach(evt => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => showEventDetails(evt.id);
            card.innerHTML = `
                <div style="position:absolute; top:10px; right:10px; font-size:1.2rem;">⭐</div>
                <h3>${evt.nome}</h3>
                <p>Você participa deste evento.</p>
                <span class="tag" style="background:#e3f2fd; color:#1565c0;">VER DETALHES</span>
            `;
            eventContainer.appendChild(card);
        });
    }
}

function renderRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = "";
    const sorted = [...db.ranking].sort((a, b) => b.points - a.points);
    sorted.forEach((u, index) => {
        const isMe = u.name === db.user.name;
        const item = document.createElement('div');
        item.className = `ranking-item ${isMe ? 'me' : ''}`;
        item.innerHTML = `
            <div class="rank-pos">#${index + 1}</div>
            <div class="rank-user">${u.name} ${isMe ? '(Você)' : ''}</div>
            <div class="rank-points">${u.points} pts</div>
        `;
        list.appendChild(item);
    });
}

function renderProfile() {
    document.getElementById('profile-name').innerText = db.user.name;
    document.getElementById('profile-email').innerText = db.user.email;
    document.getElementById('profile-avatar').innerText = db.user.name.charAt(0).toUpperCase();
    document.getElementById('profile-points').innerText = db.user.points;
    document.getElementById('profile-level').innerText = db.user.level;
    document.getElementById('profile-rank').innerText = db.user.rank;

    const interestsContainer = document.getElementById('interests-list');
    interestsContainer.innerHTML = "";
    db.modalities.forEach(mod => {
        const isSelected = db.user.interests.includes(mod);
        const chip = document.createElement('div');
        chip.className = `interest-chip ${isSelected ? 'selected' : ''}`;
        chip.innerText = mod;
        chip.onclick = () => {
            if (db.user.interests.includes(mod)) db.user.interests = db.user.interests.filter(i => i !== mod);
            else db.user.interests.push(mod);
            renderProfile();
        };
        interestsContainer.appendChild(chip);
    });
}

function showMatchDetails(match) {
    document.getElementById('match-title-display').innerText = "Detalhes da Partida";
    document.getElementById('team-a-display').innerText = match.timeA;
    document.getElementById('team-b-display').innerText = match.timeB;
    document.getElementById('score-a').value = match.placarA;
    document.getElementById('score-b').value = match.placarB;

    renderVoting();
    navigateTo('screen-match-details');
}

function renderVoting() {
    const list = document.getElementById('voting-list');
    list.innerHTML = "";
    db.players.forEach(player => {
        const div = document.createElement('div');
        div.className = "vote-card";
        div.innerHTML = `
            <div class="vote-info">
                <h4>${player.name}</h4>
                <small>${player.team}</small>
            </div>
            <button class="btn-small" onclick="handleVote(this, ${player.id})">Votar (${player.votes})</button>
        `;
        list.appendChild(div);
    });
}

function handleVote(btn, playerId) {
    const player = db.players.find(p => p.id === playerId);
    if(player) {
        player.votes++;
        btn.innerText = `Votar (${player.votes})`;
        alert(`Voto registrado para ${player.name}!`);
    }
}

function saveMatchResult() {
    alert("Resultado enviado para aprovação!");
    goBack();
}

function approveResult() {
    if (db.user.role !== 'GESTOR') {
        alert("ERRO: Apenas gestores podem aprovar.");
        return;
    }
    alert("Resultado Aprovado!");
    goBack();
}
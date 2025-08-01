document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '';
    const LOGIN_URL = `${API_URL}/api/login`;
    const DOCS_URL = `${API_URL}/api/documentos`;

    // --- GERENCIAMENTO DE TELAS ---
    const telaLogin = document.getElementById('tela-login');
    const telaPrincipal = document.getElementById('tela-principal');
    const formLogin = document.getElementById('form-login');
    const btnLogout = document.getElementById('btn-logout');
    const loginErrorMessage = document.getElementById('login-error-message');

    // --- GERENCIAMENTO DE TOKEN ---
    const salvarToken = (token) => localStorage.setItem('authToken', token);
    const obterToken = () => localStorage.getItem('authToken');
    const limparToken = () => localStorage.removeItem('authToken');
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obterToken()}`
    });

    // --- LÓGICA DE EXIBIÇÃO ---
    const verificarLogin = () => {
        const token = obterToken();
        if (token) {
            telaLogin.classList.remove('visible');
            telaLogin.classList.add('hidden');
            telaPrincipal.classList.remove('hidden');
            telaPrincipal.classList.add('visible');
            fetchDocumentos(); // Carrega os documentos se o usuário estiver logado
        } else {
            telaLogin.classList.remove('hidden');
            telaLogin.classList.add('visible');
            telaPrincipal.classList.remove('visible');
            telaPrincipal.classList.add('hidden');
        }
    };

    // --- LÓGICA DE LOGIN/LOGOUT ---
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorMessage.style.display = 'none';
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        try {
            const response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            if (response.ok) {
                const { token } = await response.json();
                salvarToken(token);
                verificarLogin(); // Troca para a tela principal
            } else {
                loginErrorMessage.textContent = 'Email ou senha inválidos.';
                loginErrorMessage.style.display = 'block';
            }
        } catch (error) {
            loginErrorMessage.textContent = 'Erro de conexão com o servidor.';
            loginErrorMessage.style.display = 'block';
        }
    });

    btnLogout.addEventListener('click', () => {
        limparToken();
        verificarLogin(); // Volta para a tela de login
    });

    // --- FUNÇÕES DA APLICAÇÃO PRINCIPAL ---
    // (As funções de CRUD de documentos agora usam 'getAuthHeaders')
    const fetchDocumentos = async () => {
        try {
            const response = await fetch(DOCS_URL, { headers: getAuthHeaders() });
            if (response.status === 401 || response.status === 403) {
                limparToken();
                verificarLogin();
                return;
            }
            // ... (resto da função fetchDocumentos)
        } catch (error) { /* ... */ }
    };
    
    // ... (O restante do seu script.js, agora com as chamadas de API usando getAuthHeaders)
    // #region CÓDIGO RESTANTE (com headers de autenticação)
    const formPrincipal = document.getElementById('form-documento');
    const tbody = document.getElementById('tbody-documentos');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const inputBusca = document.getElementById('input-busca');
    const modal = document.getElementById('modal-edicao');
    const formEdicao = document.getElementById('form-edicao');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
    const hiddenEditId = document.getElementById('edit-id');
    const editNome = document.getElementById('edit-nome');
    const editCategoria = document.getElementById('edit-categoria');
    const editVencimento = document.getElementById('edit-vencimento');
    const editAlerta = document.getElementById('edit-alerta');
    let todosOsDocumentos = [];
    let filtroCategoriaAtual = 'todos';
    let termoDeBusca = '';

    const formatarDataParaInput = (d) => (d ? d.split('T')[0] : '');
    const formatarDataParaExibicao = (d) => {
        if (!d) return 'N/A';
        const [a, m, dia] = d.split('T')[0].split('-');
        return `${dia}/${m}/${a}`;
    };
    const tdHelper = (tr, c) => { const cell = document.createElement('td'); cell.textContent = c; tr.appendChild(cell); return cell; };
    const renderizarTabela = (docs) => {
        tbody.innerHTML = '';
        if (docs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum documento encontrado.</td></tr>`;
            return;
        }
        docs.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
        docs.forEach(doc => {
            const tr = document.createElement('tr');
            const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
            const dataVencimento = new Date(doc.dataVencimento);
            const diffTime = dataVencimento.getTime() - hoje.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let statusTexto, statusClasse;
            if (doc.status === 'Renovado' || doc.status === 'Em_renovacao') {
                statusTexto = doc.status.replace('_', ' '); statusClasse = doc.status.toLowerCase();
            } else {
                if (diffDays < 0) { statusTexto = 'Atrasado'; statusClasse = 'atrasado'; }
                else if (diffDays <= 30) { statusTexto = 'Vence em Breve'; statusClasse = 'vence-breve'; }
                else { statusTexto = 'Em Dia'; statusClasse = 'em-dia'; }
            }
            tdHelper(tr, doc.nome);
            tdHelper(tr, doc.categoria || 'N/A');
            tdHelper(tr, formatarDataParaExibicao(doc.dataVencimento));
            const tdDias = tdHelper(tr, '');
            tdDias.classList.add('dias-restantes');
            if (doc.status === 'Renovado') { tdDias.textContent = '-'; }
            else if (diffDays >= 0) { tdDias.textContent = `Faltam ${diffDays} dia(s)`; }
            else { tdDias.textContent = `Vencido há ${Math.abs(diffDays)} dia(s)`; }
            const tdStatus = tdHelper(tr, '');
            const spanStatus = document.createElement('span');
            spanStatus.className = `status-span status-${statusClasse}`;
            spanStatus.textContent = statusTexto;
            tdStatus.appendChild(spanStatus);
            const tdAcoes = tdHelper(tr, '');
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'btn-editar';
            btnEditar.onclick = () => abrirModalEdicao(doc);
            tdAcoes.appendChild(btnEditar);
            tbody.appendChild(tr);
        });
    };
    const aplicarFiltrosEBusca = () => {
        let docs = [...todosOsDocumentos];
        if (filtroCategoriaAtual !== 'todos') docs = docs.filter(d => d.categoria === filtroCategoriaAtual);
        if (termoDeBusca.length > 0) docs = docs.filter(d => d.nome.toLowerCase().includes(termoDeBusca.toLowerCase()));
        renderizarTabela(docs);
    };
    const abrirModalEdicao = (doc) => {
        hiddenEditId.value = doc.id;
        editNome.value = doc.nome;
        editCategoria.value = doc.categoria || '';
        editVencimento.value = formatarDataParaInput(doc.dataVencimento);
        editAlerta.value = doc.diasAlerta;
        modal.classList.add('visible');
    };
    const fecharModalEdicao = () => { modal.classList.remove('visible'); formEdicao.reset(); };
    fetchDocumentos = async () => {
        try {
            const response = await fetch(DOCS_URL, { headers: { 'Authorization': `Bearer ${obterToken()}` }});
            if (response.status === 401 || response.status === 403) {
                limparToken();
                verificarLogin();
                return;
            }
            if (!response.ok) throw new Error('Falha na resposta da rede');
            todosOsDocumentos = await response.json();
            aplicarFiltrosEBusca();
        } catch (error) {
            console.error('Erro ao buscar documentos:', error);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar dados.</td></tr>`;
        }
    };
    const cadastrarDocumento = async (doc) => {
        try {
            const response = await fetch(DOCS_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(doc),
            });
            if (response.ok) { formPrincipal.reset(); fetchDocumentos(); }
            else { alert('Erro ao cadastrar documento.'); }
        } catch (error) { console.error('Erro ao cadastrar documento:', error); }
    };
    const atualizarDocumento = async (id, doc) => {
        try {
            const response = await fetch(`${DOCS_URL}/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(doc),
            });
            if (response.ok) { fecharModalEdicao(); fetchDocumentos(); }
            else { alert('Erro ao atualizar documento.'); }
        } catch (error) { console.error('Erro ao atualizar documento:', error); }
    };
    formPrincipal.addEventListener('submit', (e) => {
        e.preventDefault();
        const doc = {
            nome: document.getElementById('nome').value,
            categoria: document.getElementById('categoria').value,
            dataVencimento: document.getElementById('vencimento').value,
            diasAlerta: document.getElementById('alerta').value,
        };
        cadastrarDocumento(doc);
    });
    formEdicao.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = hiddenEditId.value;
        const doc = {
            nome: editNome.value,
            categoria: editCategoria.value,
            dataVencimento: editVencimento.value,
            diasAlerta: editAlerta.value,
        };
        atualizarDocumento(id, doc);
    });
    filtrosContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelector('.filtro-btn.active').classList.remove('active');
            e.target.classList.add('active');
            filtroCategoriaAtual = e.target.dataset.categoria;
            aplicarFiltrosEBusca();
        }
    });
    inputBusca.addEventListener('input', (e) => {
        termoDeBusca = e.target.value;
        aplicarFiltrosEBusca();
    });
    btnFecharModal.addEventListener('click', fecharModalEdicao);
    btnCancelarEdicao.addEventListener('click', fecharModalEdicao);
    modal.addEventListener('click', (e) => { if (e.target === modal) fecharModalEdicao(); });
    // #endregion

    // --- INICIA O SISTEMA ---
    verificarLogin();
});
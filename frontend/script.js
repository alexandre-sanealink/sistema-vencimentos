document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÃO ---
    const API_URL = '';
    // IMPORTANTE: ALTERE A LINHA ABAIXO PARA O SEU EMAIL DE ADMINISTRADOR
    const ADMIN_EMAIL = 'seu-email@suaempresa.com';

    // --- ELEMENTOS DO DOM ---
    const telaLogin = document.getElementById('tela-login');
    const telaPrincipal = document.getElementById('tela-principal');
    const formLogin = document.getElementById('form-login');
    const btnLogout = document.getElementById('btn-logout');
    const loginErrorMessage = document.getElementById('login-error-message');
    const welcomeMessage = document.getElementById('welcome-message');
    
    const formPrincipal = document.getElementById('form-documento');
    const tbody = document.getElementById('tbody-documentos');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const inputBusca = document.getElementById('input-busca');
    const btnToggleForm = document.getElementById('btn-toggle-form');
    const formulariosWrapper = document.getElementById('formularios-wrapper');
    const adminPanel = document.getElementById('admin-panel');
    const formRegister = document.getElementById('form-register');

    const modal = document.getElementById('modal-edicao');
    const formEdicao = document.getElementById('form-edicao');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
    const hiddenEditId = document.getElementById('edit-id');
    const editNome = document.getElementById('edit-nome');
    const editCategoria = document.getElementById('edit-categoria');
    const editVencimento = document.getElementById('edit-vencimento');
    const editAlerta = document.getElementById('edit-alerta');
    
    // --- VARIÁVEIS DE ESTADO ---
    let todosOsDocumentos = [];
    let filtroCategoriaAtual = 'todos';
    let termoDeBusca = '';

    // --- FUNÇÕES DE TOKEN E AUTENTICAÇÃO ---
    const salvarToken = (token) => localStorage.setItem('authToken', token);
    const obterToken = () => localStorage.getItem('authToken');
    const limparToken = () => localStorage.removeItem('authToken');
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obterToken()}`
    });

    // --- FUNÇÕES DE CONTROLE DE TELA ---
    const verificarLogin = () => {
        const token = obterToken();
        const usuario = token ? parseJwt(token) : null;
        
        if (usuario) {
            telaLogin.classList.add('hidden');
            telaPrincipal.classList.remove('hidden');
            
            welcomeMessage.textContent = `Bem-vindo, ${usuario.email}`;
            if (usuario.email === ADMIN_EMAIL) {
                adminPanel.classList.remove('hidden');
            } else {
                adminPanel.classList.add('hidden');
            }
            fetchDocumentos();
        } else {
            telaLogin.classList.remove('hidden');
            telaPrincipal.classList.add('hidden');
        }
    };

    // --- FUNÇÕES DE API ---
    const fetchDocumentos = async () => {
        try {
            const response = await fetch(DOCS_URL, { headers: { 'Authorization': `Bearer ${obterToken()}` }});
            if (response.status === 401 || response.status === 403) { limparToken(); verificarLogin(); return; }
            if (!response.ok) throw new Error('Falha na resposta da rede');
            todosOsDocumentos = await response.json();
            aplicarFiltrosEBusca();
        } catch (error) { console.error('Erro ao buscar documentos:', error); tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar dados.</td></tr>`; }
    };
    
    const cadastrarDocumento = async (doc) => {
        try {
            const response = await fetch(DOCS_URL, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(doc) });
            if (response.ok) { formPrincipal.reset(); fetchDocumentos(); } else { alert('Erro ao cadastrar documento.'); }
        } catch (error) { console.error('Erro ao cadastrar documento:', error); }
    };
    
    const atualizarDocumento = async (id, doc) => {
        try {
            const response = await fetch(`${DOCS_URL}/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(doc) });
            if (response.ok) { fecharModalEdicao(); fetchDocumentos(); } else { alert('Erro ao atualizar documento.'); }
        } catch (error) { console.error('Erro ao atualizar documento:', error); }
    };

    const cadastrarUsuario = async (email, senha) => {
        try {
            const response = await fetch(`${API_URL}/api/register`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ email, senha }) });
            const result = await response.json();
            if (response.ok) { alert(`Usuário "${result.usuario.email}" criado com sucesso!`); formRegister.reset(); }
            else { alert(`Erro: ${result.message}`); }
        } catch (error) { console.error('Erro ao cadastrar usuário:', error); alert('Erro de conexão ao tentar cadastrar usuário.'); }
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---
    const formatarDataParaInput = (d) => (d ? d.split('T')[0] : '');
    const formatarDataParaExibicao = (d) => { if (!d) return 'N/A'; const [a, m, dia] = d.split('T')[0].split('-'); return `${dia}/${m}/${a}`; };
    const tdHelper = (tr, c) => { const cell = document.createElement('td'); cell.textContent = c; tr.appendChild(cell); return cell; };
    
    const renderizarTabela = (docs) => {
        tbody.innerHTML = '';
        if (docs.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum documento encontrado.</td></tr>`; return; }
        docs.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
        docs.forEach(doc => {
            const tr = document.createElement('tr');
            const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
            const dataVencimento = new Date(doc.dataVencimento);
            const diffTime = dataVencimento.getTime() - hoje.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let statusTexto, statusClasse;
            if (doc.status === 'Renovado' || doc.status === 'Em_renovacao') { statusTexto = doc.status.replace('_', ' '); statusClasse = doc.status.toLowerCase(); }
            else {
                if (diffDays < 0) { statusTexto = 'Atrasado'; statusClasse = 'atrasado'; }
                else if (diffDays <= 30) { statusTexto = 'Vence em Breve'; statusClasse = 'vence-breve'; }
                else { statusTexto = 'Em Dia'; statusClasse = 'em-dia'; }
            }
            tdHelper(tr, doc.nome);
            tdHelper(tr, doc.categoria || 'N/A');
            tdHelper(tr, formatarDataParaExibicao(doc.dataVencimento));
            const tdDias = tdHelper(tr, ''); tdDias.classList.add('dias-restantes');
            if (doc.status === 'Renovado') { tdDias.textContent = '-'; }
            else if (diffDays >= 0) { tdDias.textContent = `Faltam ${diffDays} dia(s)`; }
            else { tdDias.textContent = `Vencido há ${Math.abs(diffDays)} dia(s)`; }
            const tdStatus = tdHelper(tr, ''); const spanStatus = document.createElement('span'); spanStatus.className = `status-span status-${statusClasse}`; spanStatus.textContent = statusTexto; tdStatus.appendChild(spanStatus);
            const tdAcoes = tdHelper(tr, ''); const btnEditar = document.createElement('button'); btnEditar.textContent = 'Editar'; btnEditar.className = 'btn-editar'; btnEditar.onclick = () => abrirModalEdicao(doc); tdAcoes.appendChild(btnEditar);
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

    // --- EVENT LISTENERS ---
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorMessage.style.display = 'none';
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        try {
            const response = await fetch(LOGIN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
            if (response.ok) {
                const { token } = await response.json();
                salvarToken(token);
                verificarLogin();
            } else { loginErrorMessage.textContent = 'Email ou senha inválidos.'; loginErrorMessage.style.display = 'block'; }
        } catch (error) { loginErrorMessage.textContent = 'Erro de conexão com o servidor.'; loginErrorMessage.style.display = 'block'; }
    });
    btnLogout.addEventListener('click', () => { limparToken(); verificarLogin(); });
    btnToggleForm.addEventListener('click', () => {
        const isHidden = formulariosWrapper.classList.toggle('hidden');
        btnToggleForm.textContent = isHidden ? 'Cadastrar Novo Documento' : 'Fechar Cadastros';
    });
    formPrincipal.addEventListener('submit', (e) => { e.preventDefault(); const doc = { nome: document.getElementById('nome').value, categoria: document.getElementById('categoria').value, dataVencimento: document.getElementById('vencimento').value, diasAlerta: document.getElementById('alerta').value, }; cadastrarDocumento(doc); });
    formRegister.addEventListener('submit', (e) => { e.preventDefault(); const email = document.getElementById('register-email').value; const senha = document.getElementById('register-senha').value; cadastrarUsuario(email, senha); });
    formEdicao.addEventListener('submit', (e) => { e.preventDefault(); const id = hiddenEditId.value; const doc = { nome: editNome.value, categoria: editCategoria.value, dataVencimento: editVencimento.value, diasAlerta: editAlerta.value, }; atualizarDocumento(id, doc); });
    filtrosContainer.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { document.querySelector('.filtro-btn.active').classList.remove('active'); e.target.classList.add('active'); filtroCategoriaAtual = e.target.dataset.categoria; aplicarFiltrosEBusca(); } });
    inputBusca.addEventListener('input', (e) => { termoDeBusca = e.target.value; aplicarFiltrosEBusca(); });
    btnFecharModal.addEventListener('click', fecharModalEdicao);
    btnCancelarEdicao.addEventListener('click', fecharModalEdicao);
    modal.addEventListener('click', (e) => { if (e.target === modal) fecharModalEdicao(); });

    // --- INICIA O SISTEMA ---
    verificarLogin();
});
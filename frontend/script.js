document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '';
    const LOGIN_URL = `${API_URL}/api/login`;
    const DOCS_URL = `${API_URL}/api/documentos`;
    const REGISTER_URL = `${API_URL}/api/register`;
    const ADMIN_EMAIL = 'alexandre.bwsweb@gmail.com'; // <-- MUITO IMPORTANTE: COLOQUE SEU EMAIL AQUI

    // --- ELEMENTOS DO DOM ---
    const telaLogin = document.getElementById('tela-login');
    const telaPrincipal = document.getElementById('tela-principal');
    const formLogin = document.getElementById('form-login');
    const btnLogout = document.getElementById('btn-logout');
    const loginErrorMessage = document.getElementById('login-error-message');
    const welcomeMessage = document.getElementById('welcome-message');
    
    const tbody = document.getElementById('tbody-documentos');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const inputBusca = document.getElementById('input-busca');
    
    const btnAbrirModalCadastro = document.getElementById('btn-abrir-modal-cadastro');
    const btnAdminPanel = document.getElementById('btn-admin-panel');

    const modalDocumento = document.getElementById('modal-documento');
    const formDocumento = document.getElementById('form-documento');
    const modalTitulo = document.getElementById('modal-titulo');
    const docId = document.getElementById('documento-id');
    const docNome = document.getElementById('documento-nome');
    const docCategoria = document.getElementById('documento-categoria');
    const docVencimento = document.getElementById('documento-vencimento');
    const docAlerta = document.getElementById('documento-alerta');
    
    const modalAdmin = document.getElementById('modal-admin');
    const formRegister = document.getElementById('form-register');
    
    // --- VARIÁVEIS DE ESTADO ---
    let todosOsDocumentos = [];
    let filtroCategoriaAtual = 'todos';
    let termoDeBusca = '';

    // --- FUNÇÕES DE TOKEN E AUTENTICAÇÃO ---
    const salvarToken = (token) => localStorage.setItem('authToken', token);
    const obterToken = () => localStorage.getItem('authToken');
    const limparToken = () => localStorage.removeItem('authToken');
    const parseJwt = (token) => JSON.parse(atob(token.split('.')[1]));
    const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${obterToken()}` });

    // --- FUNÇÕES DE CONTROLE DE TELA ---
    const verificarLogin = () => {
        const token = obterToken();
        if (token) {
            telaLogin.classList.add('hidden');
            telaPrincipal.classList.remove('hidden');
            const usuario = parseJwt(token);
            welcomeMessage.textContent = `Bem-vindo, ${usuario.email}`;
            if (usuario.email === ADMIN_EMAIL) {
                btnAdminPanel.classList.remove('hidden');
            } else {
                btnAdminPanel.classList.add('hidden');
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
            const response = await fetch(DOCS_URL, { headers: { 'Authorization': `Bearer ${obterToken()}` } });
            if (response.status === 401 || response.status === 403) { limparToken(); verificarLogin(); return; }
            todosOsDocumentos = await response.json();
            aplicarFiltrosEBusca();
        } catch (error) { console.error('Erro ao buscar docs:', error); }
    };
    
    // --- LÓGICA DOS MODAIS ---
    const abrirModal = (modalElement) => modalElement.classList.add('visible');
    const fecharModal = (modalElement) => modalElement.classList.remove('visible');

    btnAbrirModalCadastro.addEventListener('click', () => {
        formDocumento.reset();
        docId.value = '';
        modalTitulo.textContent = 'Cadastrar Novo Documento';
        abrirModal(modalDocumento);
    });

    btnAdminPanel.addEventListener('click', () => abrirModal(modalAdmin));
    
    // Adiciona evento para fechar modais
    [modalDocumento, modalAdmin].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-button')) {
                fecharModal(modal);
            }
        });
    });

    // --- LÓGICA DA APLICAÇÃO ---
    const aplicarFiltrosEBusca = () => {
        let docs = [...todosOsDocumentos];
        if (filtroCategoriaAtual !== 'todos') docs = docs.filter(d => d.categoria === filtroCategoriaAtual);
        if (termoDeBusca.length > 0) docs = docs.filter(d => d.nome.toLowerCase().includes(termoDeBusca.toLowerCase()));
        renderizarTabela(docs);
    };

    const renderizarTabela = (docs) => {
        tbody.innerHTML = '';
        if (docs.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum documento encontrado.</td></tr>`; return; }
        docs.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
        docs.forEach(doc => {
            const tr = document.createElement('tr');
            // ... (lógica de criar células da tabela)
            const tdAcoes = document.createElement('td');
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'btn-editar';
            btnEditar.onclick = () => {
                formDocumento.reset();
                docId.value = doc.id;
                modalTitulo.textContent = 'Editar Documento';
                docNome.value = doc.nome;
                docCategoria.value = doc.categoria;
                docVencimento.value = doc.dataVencimento ? doc.dataVencimento.split('T')[0] : '';
                docAlerta.value = doc.diasAlerta;
                abrirModal(modalDocumento);
            };
            tdAcoes.appendChild(btnEditar);
            tr.appendChild(tdAcoes);
            tbody.appendChild(tr);
        });
    };
    
    // --- EVENT LISTENERS ---
    formLogin.addEventListener('submit', async (e) => { /* ... (lógica de login) ... */ });
    btnLogout.addEventListener('click', () => { limparToken(); verificarLogin(); });
    formDocumento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = docId.value;
        const doc = {
            nome: docNome.value,
            categoria: docCategoria.value,
            dataVencimento: docVencimento.value,
            diasAlerta: docAlerta.value,
        };
        if (id) { // Se tem ID, atualiza
            await fetch(`${DOCS_URL}/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(doc) });
        } else { // Senão, cadastra
            await fetch(DOCS_URL, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(doc) });
        }
        fecharModal(modalDocumento);
        fetchDocumentos();
    });
    formRegister.addEventListener('submit', async (e) => { /* ... (lógica de cadastro de usuário) ... */ });
    filtrosContainer.addEventListener('click', (e) => { /* ... (lógica de filtro) ... */ });
    inputBusca.addEventListener('input', (e) => { /* ... (lógica de busca) ... */ });

    // --- INICIA O SISTEMA ---
    verificarLogin();
});
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '';
    const LOGIN_URL = `${API_URL}/api/login`;
    const DOCS_URL = `${API_URL}/api/documentos`;
    const REGISTER_URL = `${API_URL}/api/register`;
    const PERFIL_URL = `${API_URL}/api/perfil`;
    // IMPORTANTE: ALTERE A LINHA ABAIXO PARA O SEU EMAIL DE ADMINISTRADOR
    const ADMIN_EMAIL = 'alexandre@solucoesfoco.com.br';

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
    const btnAbrirPerfil = document.getElementById('btn-abrir-perfil');
    const modalPerfil = document.getElementById('modal-perfil');
    const formPerfil = document.getElementById('form-perfil');
    const perfilNome = document.getElementById('perfil-nome');
    
    let todosOsDocumentos = [];
    let filtroCategoriaAtual = 'todos';
    let termoDeBusca = '';

    const salvarToken = (token) => localStorage.setItem('authToken', token);
    const obterToken = () => localStorage.getItem('authToken');
    const limparToken = () => { localStorage.removeItem('authToken'); localStorage.removeItem('userInfo'); };
    const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${obterToken()}` });

    const verificarLogin = () => {
        const token = obterToken();
        const userInfo = localStorage.getItem('userInfo');
        if (token && userInfo) {
            const { usuario } = JSON.parse(userInfo);
            telaLogin.classList.add('hidden');
            telaPrincipal.classList.remove('hidden');
            btnAbrirPerfil.textContent = `Bem-vindo, ${usuario.nome || usuario.email}`;
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

    const fetchDocumentos = async () => {
        try {
            const response = await fetch(DOCS_URL, { headers: { 'Authorization': `Bearer ${obterToken()}` } });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    limparToken();
                    verificarLogin();
                }
                throw new Error('Falha na busca de documentos');
            }
            todosOsDocumentos = await response.json();
            aplicarFiltrosEBusca();
        } catch (error) {
            console.error('Erro ao buscar docs:', error);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Erro ao carregar dados.</td></tr>`;
        }
    };

    const abrirModal = (modalElement) => modalElement.classList.add('visible');
    const fecharModal = (modalElement) => modalElement.classList.remove('visible');
    
    const aplicarFiltrosEBusca = () => {
        let docs = [...todosOsDocumentos];
        if (filtroCategoriaAtual !== 'todos') docs = docs.filter(d => d.categoria === filtroCategoriaAtual);
        if (termoDeBusca.length > 0) docs = docs.filter(d => d.nome.toLowerCase().includes(termoDeBusca.toLowerCase()));
        renderizarTabela(docs);
    };

    const renderizarTabela = (docs) => {
        const formatarDataParaExibicao = (d) => { if (!d) return 'N/A'; const [a, m, dia] = d.split('T')[0].split('-'); return `${dia}/${m}/${a}`; };
        const tdHelper = (tr, c) => { const cell = document.createElement('td'); cell.textContent = c; tr.appendChild(cell); return cell; };
        tbody.innerHTML = '';
        if (docs.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum documento encontrado.</td></tr>`; return; }
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
            tdHelper(tr, doc.categoria || '-');
            tdHelper(tr, doc.criado_por_nome || doc.criado_por_email || '-');
            tdHelper(tr, formatarDataParaExibicao(doc.dataVencimento));
            const tdDias = tdHelper(tr, ''); tdDias.classList.add('dias-restantes');
            if (doc.status === 'Renovado') { tdDias.textContent = '-'; }
            else if (diffDays >= 0) { tdDias.textContent = `Faltam ${diffDays} dia(s)`; }
            else { tdDias.textContent = `Vencido há ${Math.abs(diffDays)} dia(s)`; }
            const tdStatus = tdHelper(tr, ''); const spanStatus = document.createElement('span'); spanStatus.className = `status-span status-${statusClasse}`; spanStatus.textContent = statusTexto; tdStatus.appendChild(spanStatus);
            const tdAcoes = tdHelper(tr, '');
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
    
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorMessage.style.display = 'none';
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        try {
            const response = await fetch(LOGIN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
            if (response.ok) {
                const { token, usuario } = await response.json();
                salvarToken(token);
                localStorage.setItem('userInfo', JSON.stringify({ usuario }));
                verificarLogin();
            } else { loginErrorMessage.textContent = 'Email ou senha inválidos.'; loginErrorMessage.style.display = 'block'; }
        } catch (error) { loginErrorMessage.textContent = 'Erro de conexão com o servidor.'; loginErrorMessage.style.display = 'block'; }
    });

    btnLogout.addEventListener('click', () => { limparToken(); verificarLogin(); });

    btnAbrirModalCadastro.addEventListener('click', () => {
        formDocumento.reset();
        docId.value = '';
        modalTitulo.textContent = 'Cadastrar Novo Documento';
        abrirModal(modalDocumento);
    });

    btnAdminPanel.addEventListener('click', () => { formRegister.reset(); abrirModal(modalAdmin); });
    
    btnAbrirPerfil.addEventListener('click', () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        perfilNome.value = userInfo.usuario.nome;
        abrirModal(modalPerfil);
    });

    [modalDocumento, modalAdmin, modalPerfil].forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-button')) { fecharModal(m); }
        });
    });

    formDocumento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = docId.value;
        const doc = { nome: docNome.value, categoria: docCategoria.value, dataVencimento: docVencimento.value, diasAlerta: docAlerta.value };
        const url = id ? `${DOCS_URL}/${id}` : DOCS_URL;
        const method = id ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method: method, headers: getAuthHeaders(), body: JSON.stringify(doc) });
            if (response.ok) { fecharModal(modalDocumento); fetchDocumentos(); }
            else { alert('Erro ao salvar documento.'); }
        } catch (error) { console.error('Erro ao salvar:', error); }
    });
    
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('register-nome').value;
        const email = document.getElementById('register-email').value;
        const senha = document.getElementById('register-senha').value;
        try {
            const response = await fetch(REGISTER_URL, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ nome, email, senha }) });
            const result = await response.json();
            if (response.ok) { alert(`Usuário "${result.usuario.email}" criado com sucesso!`); formRegister.reset(); fecharModal(modalAdmin); }
            else { alert(`Erro: ${result.message}`); }
        } catch (error) { console.error('Erro ao cadastrar usuário:', error); alert('Erro de conexão.'); }
    });

    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = perfilNome.value;
        try {
            const response = await fetch(PERFIL_URL, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ nome }) });
            if(response.ok) {
                const usuarioAtualizado = await response.json();
                let userInfo = JSON.parse(localStorage.getItem('userInfo'));
                userInfo.usuario = usuarioAtualizado;
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                verificarLogin();
                fecharModal(modalPerfil);
            } else { alert('Erro ao atualizar o nome.'); }
        } catch (error) { console.error('Erro ao atualizar perfil:', error); }
    });

    filtrosContainer.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { document.querySelector('.filtro-btn.active').classList.remove('active'); e.target.classList.add('active'); filtroCategoriaAtual = e.target.dataset.categoria; aplicarFiltrosEBusca(); } });
    inputBusca.addEventListener('input', (e) => { termoDeBusca = e.target.value; aplicarFiltrosEBusca(); });

    verificarLogin();
});
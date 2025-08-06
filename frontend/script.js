document.addEventListener('DOMContentLoaded', () => {
    // --- REFERÊNCIAS DE ELEMENTOS ---
    const API_URL = 'https://www.controle.focodesentupidora.com.br';
    const LOGIN_URL = `${API_URL}/api/login`;
    const DOCS_URL = `${API_URL}/api/documentos`;
    const REGISTER_URL = `${API_URL}/api/register`;
    const PERFIL_URL = `${API_URL}/api/perfil`;
    const ADMIN_EMAIL = 'alexandre@solucoesfoco.com.br';

    // Elementos principais
    const telaLogin = document.getElementById('tela-login');
    const appContainer = document.getElementById('app-container');
    const contentModules = document.querySelectorAll('.content-module');

    // Elementos do Menu Lateral (Desktop)
    const sidebar = document.getElementById('sidebar');
    const navLinks = document.querySelectorAll('#sidebar .nav-link');
    const btnLogout = document.getElementById('btn-logout');
    const btnAdminPanel = document.getElementById('btn-admin-panel');
    const liAdminPanel = document.getElementById('li-admin-panel');
    const btnAbrirPerfil = document.getElementById('btn-abrir-perfil');
    
    // Elementos do Menu de Rodapé (Mobile)
    const bottomBar = document.getElementById('bottom-bar');
    const mobileNavLinks = document.querySelectorAll('#bottom-bar .bottom-bar-link');
    const mobileMoreMenuWrapper = document.getElementById('mobile-more-menu-wrapper');
    const mobileMoreMenu = document.getElementById('mobile-more-menu');
    const mobileBtnPerfil = document.getElementById('mobile-btn-perfil');
    const mobileBtnAdmin = document.getElementById('mobile-btn-admin');
    const mobileBtnLogout = document.getElementById('mobile-btn-logout');

    // Elementos da Tabela de Documentos
    const tbody = document.getElementById('tbody-documentos');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const inputBusca = document.getElementById('input-busca');
    const btnAbrirModalCadastro = document.getElementById('btn-abrir-modal-cadastro');
    const paginationContainer = document.getElementById('pagination-container');
    const pageInfo = document.getElementById('page-info');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProxima = document.getElementById('btn-proxima');
    
    // Elementos dos Modais
    const modalDocumento = document.getElementById('modal-documento');
    const formDocumento = document.getElementById('form-documento');
    const modalTitulo = document.getElementById('modal-titulo');
    const docId = document.getElementById('documento-id');
    const docNome = document.getElementById('documento-nome');
    const docCategoria = document.getElementById('documento-categoria');
    const docVencimento = document.getElementById('documento-vencimento');
    const docAlerta = document.getElementById('documento-alerta');
    const docArquivo = document.getElementById('documento-arquivo');
    const docFileName = document.getElementById('file-name-documento');
    const anexoAtualContainer = document.getElementById('anexo-atual-container');
    const modalAdmin = document.getElementById('modal-admin');
    const formRegister = document.getElementById('form-register');
    const modalPerfil = document.getElementById('modal-perfil');
    const formPerfil = document.getElementById('form-perfil');
    const perfilNome = document.getElementById('perfil-nome');
    const loginErrorMessage = document.getElementById('login-error-message');
    
    // --- ESTADO DA APLICAÇÃO ---
    let todosOsDocumentos = [];
    let documentosFiltrados = [];
    let filtroCategoriaAtual = 'todos';
    let termoDeBusca = '';
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 15;

    // --- FUNÇÕES AUXILIARES ---
    const salvarToken = (token) => localStorage.setItem('authToken', token);
    const obterToken = () => localStorage.getItem('authToken');
    const limparToken = () => { localStorage.removeItem('authToken'); localStorage.removeItem('userInfo'); };
    const getAuthHeaders = (isFormData = false) => {
        const headers = { 'Authorization': `Bearer ${obterToken()}` };
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    };
    const abrirModal = (modalElement) => modalElement.classList.add('visible');
    const fecharModal = (modalElement) => modalElement.classList.remove('visible');

    // --- LÓGICA DE NAVEGAÇÃO ---
    const switchView = (targetId) => {
        contentModules.forEach(module => module.classList.add('hidden'));
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.remove('hidden');
        
        const moduleName = targetId.split('-')[1];
        navLinks.forEach(link => link.classList.toggle('active', link.id === `nav-${moduleName}`));
        mobileNavLinks.forEach(link => link.classList.toggle('active', link.id === `mobile-nav-${moduleName}`));
    };
    
    document.querySelectorAll('.nav-link, .bottom-bar-link').forEach(link => {
        // Ignora o wrapper do menu "Mais" para não tratar o clique nele como uma troca de tela
        if (link.id !== 'mobile-more-menu-wrapper') { 
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Pega o nome do módulo a partir do final do ID
                const moduleName = link.id.split('-')[link.id.split('-').length - 1];
                switchView(`content-${moduleName}`);
            });
        }
    });

    // --- LÓGICA DO MENU DE RODAPÉ (MOBILE) ---
    mobileMoreMenuWrapper.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique no documento feche o menu imediatamente
        mobileMoreMenu.classList.toggle('visible');
    });

    // Fecha o menu "Mais" se clicar em qualquer outro lugar da tela
    document.addEventListener('click', (e) => {
        if (!mobileMoreMenu.contains(e.target) && !mobileMoreMenuWrapper.contains(e.target)) {
            mobileMoreMenu.classList.remove('visible');
        }
    });

    // --- LÓGICA PRINCIPAL ---
    const acoesDeUsuario = {
        abrirPerfil: () => {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            perfilNome.value = userInfo.usuario.nome;
            abrirModal(modalPerfil);
        },
        abrirAdmin: () => {
            formRegister.reset();
            abrirModal(modalAdmin);
        },
        fazerLogout: () => {
            limparToken();
            verificarLogin();
        }
    };

    const verificarLogin = () => {
        const token = obterToken();
        const userInfo = localStorage.getItem('userInfo');
        if (token && userInfo) {
            const { usuario } = JSON.parse(userInfo);
            telaLogin.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            const perfilLinkText = btnAbrirPerfil.querySelector('.nav-text');
            if (perfilLinkText) perfilLinkText.textContent = `${usuario.nome || usuario.email}`;

            // Controla a visibilidade dos botões de admin em ambos os menus
            if (usuario.email === ADMIN_EMAIL) {
                liAdminPanel.classList.remove('hidden');
                mobileBtnAdmin.classList.remove('hidden');
            } else {
                liAdminPanel.classList.add('hidden');
                mobileBtnAdmin.classList.add('hidden');
            }
            fetchDocumentos();
            switchView('content-documentos'); // Inicia na tela de documentos
        } else {
            telaLogin.classList.remove('hidden');
            appContainer.classList.add('hidden');
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
    
    const aplicarFiltrosEBusca = () => {
        let docs = [...todosOsDocumentos];
        if (filtroCategoriaAtual !== 'todos') docs = docs.filter(d => d.categoria === filtroCategoriaAtual);
        if (termoDeBusca.length > 0) docs = docs.filter(d => d.nome.toLowerCase().includes(termoDeBusca.toLowerCase()));
        documentosFiltrados = docs;
        paginaAtual = 1;
        renderizarTabela();
    };
    
    const atualizarControlesPaginacao = () => {
        const totalPaginas = Math.ceil(documentosFiltrados.length / ITENS_POR_PAGINA);
        if (totalPaginas <= 1) {
            paginationContainer.classList.add('hidden');
        } else {
            paginationContainer.classList.remove('hidden');
        }
        pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        btnAnterior.disabled = paginaAtual === 1;
        btnProxima.disabled = paginaAtual === totalPaginas;
    };

    const renderizarTabela = () => {
        tbody.innerHTML = '';
        if (documentosFiltrados.length === 0) {
            paginationContainer.classList.add('hidden');
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum documento encontrado.</td></tr>`;
            return;
        }
        
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const documentosDaPagina = documentosFiltrados.slice(inicio, fim);
        
        atualizarControlesPaginacao();
        
        const formatarDataParaExibicao = (d) => { if (!d) return 'N/A'; const [a, m, dia] = d.split('T')[0].split('-'); return `${dia}/${m}/${a}`; };
        const tdHelper = (tr, c) => { const cell = document.createElement('td'); cell.textContent = c; tr.appendChild(cell); return cell; };
        
        documentosDaPagina.forEach(doc => {
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
            tdHelper(tr, formatarDataParaExibicao(doc.dataVencimento));
            const tdDias = tdHelper(tr, ''); tdDias.classList.add('dias-restantes');
            if (doc.status === 'Renovado') { tdDias.textContent = '-'; }
            else if (diffDays >= 0) { tdDias.textContent = `Faltam ${diffDays} dia(s)`; }
            else { tdDias.textContent = `Vencido há ${Math.abs(diffDays)} dia(s)`; }
            const tdStatus = tdHelper(tr, ''); const spanStatus = document.createElement('span'); spanStatus.className = `status-span status-${statusClasse}`; spanStatus.textContent = statusTexto; tdStatus.appendChild(spanStatus);
            const tdAnexo = tdHelper(tr, '');
            if (doc.nome_arquivo) {
                const linkAnexo = document.createElement('a');
                linkAnexo.href = `${API_URL}/uploads/${doc.nome_arquivo}`;
                linkAnexo.target = '_blank';
                linkAnexo.className = 'btn-anexo';
                linkAnexo.title = 'Ver Anexo';
                linkAnexo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16"><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/></svg>`;
                tdAnexo.appendChild(linkAnexo);
            } else { 
                tdAnexo.textContent = 'N/A'; 
            }
            const tdAcoes = tdHelper(tr, '');
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-editar';
            btnEditar.title = 'Editar Documento';
            btnEditar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/></svg>`;
            btnEditar.onclick = () => {
                formDocumento.reset();
                docId.value = doc.id;
                modalTitulo.textContent = 'Editar Documento';
                docNome.value = doc.nome;
                docCategoria.value = doc.categoria;
                docVencimento.value = doc.dataVencimento ? doc.dataVencimento.split('T')[0] : '';
                docAlerta.value = doc.diasAlerta;
                anexoAtualContainer.textContent = doc.nome_arquivo ? `Anexo atual: ${doc.nome_arquivo}` : '';
                anexoAtualContainer.classList.toggle('hidden', !doc.nome_arquivo);
                docFileName.textContent = 'Nenhum arquivo novo';
                abrirModal(modalDocumento);
            };
            tdAcoes.appendChild(btnEditar);
            tr.appendChild(tdAcoes);
            tbody.appendChild(tr);
        });
    };
    
    // --- EVENT LISTENERS ---
    btnAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarTabela();
        }
    });
    btnProxima.addEventListener('click', () => {
        const totalPaginas = Math.ceil(documentosFiltrados.length / ITENS_POR_PAGINA);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarTabela();
        }
    });
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
    
    btnAbrirModalCadastro.addEventListener('click', () => {
        formDocumento.reset();
        docId.value = '';
        modalTitulo.textContent = 'Cadastrar Novo Documento';
        anexoAtualContainer.classList.add('hidden');
        docFileName.textContent = 'Nenhum arquivo escolhido';
        abrirModal(modalDocumento);
    });
    
    [modalDocumento, modalAdmin, modalPerfil].forEach(m => {
        const closeButton = m.querySelector('.close-button');
        if (closeButton) { closeButton.addEventListener('click', () => fecharModal(m)); }
        m.addEventListener('click', (e) => { if (e.target === m) { fecharModal(m); } });
    });
    formDocumento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = docId.value;
        const formData = new FormData();
        formData.append('nome', docNome.value);
        formData.append('categoria', docCategoria.value);
        formData.append('dataVencimento', docVencimento.value);
        formData.append('diasAlerta', docAlerta.value);
        if (docArquivo.files.length > 0) { formData.append('arquivo', docArquivo.files[0]); }
        const url = id ? `${DOCS_URL}/${id}` : DOCS_URL;
        const method = id ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method: method, headers: getAuthHeaders(true), body: formData });
            if (response.ok) { fecharModal(modalDocumento); fetchDocumentos(); }
            else { alert('Erro ao salvar documento.'); }
        } catch (error) { console.error('Erro ao salvar:', error); }
    });
    docArquivo.addEventListener('change', () => {
        docFileName.textContent = docArquivo.files.length > 0 ? docArquivo.files[0].name : 'Nenhum arquivo';
    });
    const cadastrarUsuario = async (nome, email, senha) => {
        try {
            const response = await fetch(REGISTER_URL, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ nome, email, senha }) });
            const result = await response.json();
            if (response.ok) { alert(`Usuário "${result.usuario.email}" criado com sucesso!`); formRegister.reset(); fecharModal(modalAdmin); }
            else { alert(`Erro: ${result.message}`); }
        } catch (error) { console.error('Erro ao cadastrar usuário:', error); alert('Erro de conexão.'); }
    };
    formRegister.addEventListener('submit', (e) => { e.preventDefault(); const nome = document.getElementById('register-nome').value; const email = document.getElementById('register-email').value; const senha = document.getElementById('register-senha').value; cadastrarUsuario(nome, email, senha); });
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

    // --- INICIALIZAÇÃO ---
    verificarLogin();
});
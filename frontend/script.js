document.addEventListener('DOMContentLoaded', () => {


console.log('--- Verificando Referências dos Elementos ---');

console.log('Botão Solicitação:', document.getElementById('btn-abrir-modal-solicitacao'));

console.log('Botão Manutenção:', document.getElementById('btn-abrir-modal-manutencao'));

console.log('Botão Abastecimento:', document.getElementById('btn-abrir-modal-abastecimento'));

console.log('Painel de Notificações:', document.getElementById('painel-notificacoes')); // <-- ADICIONE/VERIFIQUE ESTA LINHA

console.log('--- Fim da Verificação ---');



    // --- REFERÊNCIAS DE ELEMENTOS ---

    // NOVO: Define a URL da API dinamicamente com base no ambiente

const IS_LOCAL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

const API_URL = IS_LOCAL 

    ? 'http://localhost:3000' // URL para testes locais

    : 'https://www.controle.focodesentupidora.com.br'; // URL para o site online (produção)

    const LOGIN_URL = `${API_URL}/api/login`;

    const DOCS_URL = `${API_URL}/api/documentos`;

    const VEICULOS_URL = `${API_URL}/api/veiculos`;

    const REGISTER_URL = `${API_URL}/api/register`;

    const PERFIL_URL = `${API_URL}/api/perfil`;

    const ADMIN_EMAIL = 'alexandre@solucoesfoco.com.br';



    const telaLogin = document.getElementById('tela-login');

    const appContainer = document.getElementById('app-container');

    const contentModules = document.querySelectorAll('.content-module');

    const sidebar = document.getElementById('sidebar');

    const navLinks = document.querySelectorAll('#sidebar .nav-link');

    const btnLogout = document.getElementById('btn-logout');

    const btnAdminPanel = document.getElementById('btn-admin-panel');

    const liAdminPanel = document.getElementById('li-admin-panel');

    const btnAbrirPerfil = document.getElementById('btn-abrir-perfil');

    const hamburgerBtn = document.getElementById('hamburger-btn');

    const menuOverlay = document.getElementById('menu-overlay');

    const bottomBar = document.getElementById('bottom-bar');

    const mobileNavLinks = document.querySelectorAll('#bottom-bar .bottom-bar-link');

    const mobileMoreMenuWrapper = document.getElementById('mobile-more-menu-wrapper');

    const mobileMoreMenu = document.getElementById('mobile-more-menu');

    const mobileBtnPerfil = document.getElementById('mobile-btn-perfil');

    const mobileBtnAdmin = document.getElementById('mobile-btn-admin');

    const mobileBtnLogout = document.getElementById('mobile-btn-logout');

    const listaContainer = document.querySelector('.lista-container');

    const paginationContainer = document.getElementById('pagination-container');

    const pageInfo = document.getElementById('page-info');

    const btnAnterior = document.getElementById('btn-anterior');

    const btnProxima = document.getElementById('btn-proxima');


    const toggleMobileMenu = () => {

        sidebar.classList.toggle('sidebar-visible');

        menuOverlay.classList.toggle('visible');

    };


    // --- EVENT LISTENERS ---

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleMobileMenu);

    if (menuOverlay) menuOverlay.addEventListener('click', toggleMobileMenu);



    if (btnAnterior) btnAnterior.addEventListener('click', () => {

        if (paginaAtual > 1) {

            paginaAtual--;

            renderizarTabela();

            if (listaContainer) listaContainer.scrollIntoView({ behavior: 'smooth' });

        }

    });
    
    // Painel Admin

    const btnAbrirModalAdminNovo = document.getElementById('btn-abrir-modal-admin-novo');

    const tbodyUsuarios = document.getElementById('tbody-usuarios');

    // Modal Alterar Senha de Usuário

    const modalAlterarSenha = document.getElementById('modal-alterar-senha');

    const formAlterarSenha = document.getElementById('form-alterar-senha');

    const alterarSenhaUserid = document.getElementById('alterar-senha-userid');

    const novaSenhaInput = document.getElementById('nova-senha');

    const modalAlterarSenhaTitulo = document.getElementById('modal-alterar-senha-titulo');

    
    // --- LÓGICA DE CLIQUE PARA O DASHBOARD (FASE 5) ---
const mainContent = document.getElementById('main-content');

// SUBSTITUA TODO O BLOCO if (mainContent) { ... } POR ESTE

if (mainContent) {
    mainContent.addEventListener('click', async (e) => {
        const link = e.target.closest('a'); 
        if (!link) return; 

        // --- Ação para links de Documentos (LÓGICA ATUALIZADA) ---
        if (link.hasAttribute('data-doc-id')) {
            e.preventDefault();
            const docId = link.getAttribute('data-doc-id');
            console.log('Clicou no documento ID:', docId);

            // Tenta encontrar o documento na lista local primeiro
            let documento = todosOsDocumentos.find(d => String(d.id) === docId);

            // ✅ SE NÃO ENCONTRAR, BUSCA NO BACKEND
            if (!documento) {
                console.warn(`Documento ${docId} não encontrado no cache local. Buscando no servidor...`);
                try {
                    const response = await fetch(`${DOCS_URL}/${docId}`, { headers: getAuthHeaders() });
                    if (!response.ok) {
                        throw new Error('Falha ao buscar detalhes do documento.');
                    }
                    documento = await response.json();
                } catch (error) {
                    console.error(error);
                    alert('Não foi possível carregar os detalhes do documento.');
                    return; // Para a execução
                }
            }

            // Se encontrou (localmente ou do backend), abre o modal
            if (documento && modalDocumento) {
                formDocumento.reset();
                docId.value = documento.id;
                modalTitulo.textContent = 'Detalhes do Documento';
                docNome.value = documento.nome;
                docCategoria.value = documento.categoria;
                docVencimento.value = documento.dataVencimento ? documento.dataVencimento.split('T')[0] : '';
                docAlerta.value = documento.diasAlerta;
                anexoAtualContainer.textContent = documento.nome_arquivo ? `Anexo atual: ${documento.nome_arquivo}` : '';
                anexoAtualContainer.classList.toggle('hidden', !documento.nome_arquivo);
                docFileName.textContent = 'Nenhum arquivo novo';
                
                handleDocumentoCategoriaChange(); // Garante que o campo de veículo apareça se for "Caminhões"
                if (documento.veiculo_id) { // Pré-seleciona o veículo se estiver vinculado
                    documentoVeiculoId.value = documento.veiculo_id;
                }

                abrirModal(modalDocumento);
            } else {
                alert('Não foi possível carregar os detalhes do documento.');
            }
        }

        // --- Ação para links de Veículos (LÓGICA ATUALIZADA) ---
        else if (link.hasAttribute('data-veiculo-id')) {
            e.preventDefault(); 
            const veiculoId = parseInt(link.getAttribute('data-veiculo-id'), 10);
            console.log('Clicou no veículo ID:', veiculoId);

            // Tenta encontrar o veículo na lista local primeiro
            let veiculo = todosOsVeiculos.find(v => v.id === veiculoId);

            // ✅ SE NÃO ENCONTRAR, BUSCA NO BACKEND
            if (!veiculo) {
                console.warn(`Veículo ${veiculoId} não encontrado no cache local. Buscando no servidor...`);
                try {
                    // A rota GET /api/veiculos/:id já existe!
                    const response = await fetch(`${VEICULOS_URL}/${veiculoId}`, { headers: getAuthHeaders() }); 
                    if (!response.ok) {
                         throw new Error('Falha ao buscar detalhes do veículo.');
                    }
                    veiculo = await response.json();
                } catch (error) {
                    console.error(error);
                    alert('Não foi possível carregar os detalhes do veículo.');
                    return; // Para a execução
                }
            }

            // Se encontrou (localmente ou do backend), navega para os detalhes
            if (veiculo) {
                exibirDetalhesDoVeiculo(veiculo);
            } else {
                alert('Não foi possível carregar os detalhes do veículo.');
            }
        }
    });
       
}

    // Documentos

    const tbodyDocumentos = document.getElementById('tbody-documentos');

    const filtrosContainer = document.getElementById('filtros-categoria');

    const inputBusca = document.getElementById('input-busca');

    const btnAbrirModalCadastro = document.getElementById('btn-abrir-modal-cadastro');

    const modalDocumento = document.getElementById('modal-documento');

    const formDocumento = document.getElementById('form-documento');

    const modalTitulo = document.getElementById('modal-titulo');

    const docId = document.getElementById('documento-id');

    const docNome = document.getElementById('documento-nome');

    const docCategoria = document.getElementById('documento-categoria');

    const formGroupVeiculoId = document.getElementById('form-group-veiculo-id'); 
    
    const documentoVeiculoId = document.getElementById('documento-veiculo-id');

    const docVencimento = document.getElementById('documento-vencimento');

    const docAlerta = document.getElementById('documento-alerta');

    const docArquivo = document.getElementById('documento-arquivo');

    const docFileName = document.getElementById('file-name-documento');

    const anexoAtualContainer = document.getElementById('anexo-atual-container');

  

    // Frota

    const tbodyVeiculos = document.getElementById('tbody-veiculos');

    const modalVeiculo = document.getElementById('modal-veiculo');

    const btnAbrirModalVeiculo = document.getElementById('btn-abrir-modal-veiculo');

    const formVeiculo = document.getElementById('form-veiculo');

    const modalVeiculoTitulo = document.getElementById('modal-veiculo-titulo');

    const veiculoId = document.getElementById('veiculo-id');

    const veiculoPlaca = document.getElementById('veiculo-placa');

    const veiculoMarca = document.getElementById('veiculo-marca');

    const veiculoModelo = document.getElementById('veiculo-modelo');

    const veiculoAno = document.getElementById('veiculo-ano');

    const veiculoTipo = document.getElementById('veiculo-tipo');

    const inputBuscaVeiculo = document.getElementById('input-busca-veiculo');

    // Notificações

    const btnNotificacoes = document.getElementById('btn-notificacoes');

    const contadorNotificacoes = document.getElementById('contador-notificacoes');

    const painelNotificacoes = document.getElementById('painel-notificacoes');

    const listaNotificacoes = document.getElementById('lista-notificacoes');

    // --- NOVO: Referências para Detalhes do Veículo ---

    const contentVeiculoDetalhes = document.getElementById('content-veiculo-detalhes');

    const detalhesVeiculoTitulo = document.getElementById('detalhes-veiculo-titulo');

    const btnVoltarParaFrota = document.getElementById('btn-voltar-para-frota');

    // --- NOVO: Referências para o Plano de Manutenção ---

    const tbodyPlanos = document.getElementById('tbody-planos');

    const formPlanoManutencao = document.getElementById('form-plano-manutencao');

    const planoDescricao = document.getElementById('plano-descricao');

    const planoKm = document.getElementById('plano-km');

    const planoDias = document.getElementById('plano-dias');



    // --- NOVO: Referências para o Modal de Manutenção ---

    const tbodyManutencoes = document.getElementById('tbody-manutencoes');

    const btnAbrirModalManutencao = document.getElementById('btn-abrir-modal-manutencao');

    const modalManutencao = document.getElementById('modal-manutencao');

    const formManutencao = document.getElementById('form-manutencao');

    const manutencaoId = document.getElementById('manutencao-id');

    const manutencaoData = document.getElementById('manutencao-data');

    const manutencaoKm = document.getElementById('manutencao-km');

    const manutencaoTipo = document.getElementById('manutencao-tipo');

    const listaPecasContainer = document.getElementById('lista-pecas-container');

    const btnAdicionarPeca = document.getElementById('btn-adicionar-peca');

    // --- NOVAS REFERÊNCIAS RELATÓRIO MENSAL ---
    const secaoRelatorioMensal = document.getElementById('secao-relatorio-mensal');
    const formRelatorioMensal = document.getElementById('form-relatorio-mensal');
    const relatorioMes = document.getElementById('relatorio-mes');
    const relatorioAno = document.getElementById('relatorio-ano');

    const formGroupPlanoItem = document.getElementById('form-group-plano-item');
    const manutencaoPlanoItem = document.getElementById('manutencao-plano-item');



        // Solicitações de Manutenção

    const btnAbrirModalSolicitacao = document.getElementById('btn-abrir-modal-solicitacao');

    const tbodySolicitacoes = document.getElementById('tbody-solicitacoes');

    const modalSolicitacao = document.getElementById('modal-solicitacao');

    const formSolicitacao = document.getElementById('form-solicitacao');

    const solicitacaoDescricao = document.getElementById('solicitacao-descricao');



        // --- NOVO: Referências para o Modal de Abastecimento ---

    const tbodyAbastecimentos = document.getElementById('tbody-abastecimentos');

    const btnAbrirModalAbastecimento = document.getElementById('btn-abrir-modal-abastecimento');

    const modalAbastecimento = document.getElementById('modal-abastecimento');

    const formAbastecimento = document.getElementById('form-abastecimento');

    const abastecimentoData = document.getElementById('abastecimento-data');

    const abastecimentoKm = document.getElementById('abastecimento-km');

    const abastecimentoLitros = document.getElementById('abastecimento-litros');

    const abastecimentoValor = document.getElementById('abastecimento-valor');

    const abastecimentoPosto = document.getElementById('abastecimento-posto');



    

    // Admin e Perfil

    const modalAdmin = document.getElementById('modal-admin');

    const formRegister = document.getElementById('form-register');

    const modalPerfil = document.getElementById('modal-perfil');

    const formPerfil = document.getElementById('form-perfil');

    const perfilNome = document.getElementById('perfil-nome');

    const formLogin = document.getElementById('form-login');

    const loginErrorMessage = document.getElementById('login-error-message');

    

    // Variáveis de estado

    let todosOsDocumentos = [];

    let documentosFiltrados = [];

    let todosOsVeiculos = [];

    let veiculosFiltrados = [];

    let veiculoSelecionado = null; // Guarda o veículo que está sendo visualizado nos detalhes

    let filtroCategoriaAtual = 'todos';

    let termoDeBusca = '';

    let termoDeBuscaVeiculo = '';

    let paginaAtual = 1;

    const ITENS_POR_PAGINA = 15;



    const salvarToken = (token) => localStorage.setItem('authToken', token);

    const obterToken = () => localStorage.getItem('authToken');

    const limparToken = () => { localStorage.removeItem('authToken'); localStorage.removeItem('userInfo'); };

    const getAuthHeaders = (isFormData = false) => {

        const headers = { 'Authorization': `Bearer ${obterToken()}` };

        if (!isFormData) { headers['Content-Type'] = 'application/json'; }

        return headers;

    };

   



const abrirModal = (modalElement) => {

    // NOVO: Antes de abrir um novo modal, garante que todos os outros estejam fechados.

    // Isso resolve o bug de sobreposição e de "cliques atrasados".

    document.querySelectorAll('.modal-overlay.visible').forEach(modal => modal.classList.remove('visible'));



    if (modalElement) {

        modalElement.classList.add('visible');

    }

};



const fecharModal = (modalElement) => {

    if (modalElement) {

        modalElement.classList.remove('visible');

    }

};

 
const switchView = (targetId) => {
    console.log(`--- Chamando switchView para: ${targetId} ---`); 

    window.scrollTo(0, 0);

    contentModules.forEach(module => module.classList.add('hidden'));
    const targetContent = document.getElementById(targetId);
    if (targetContent) targetContent.classList.remove('hidden');

    // --- CARREGAMENTO DE DADOS SOB DEMANDA ---
    if (targetId === 'content-notificacoes') {
        carregarPaginaNotificacoes();
    } else if (targetId === 'content-dashboard') { 
        carregarDashboard(); 
    } else if (targetId === 'content-documentos') {
        fetchDocumentos(); // Carrega documentos SÓ quando a página é exibida
    } else if (targetId === 'content-frota') {
        fetchVeiculos(); // Carrega veículos SÓ quando a página é exibida
    }
    // Adicionar 'else if' para Colaboradores e Contratos no futuro

    // --- Lógica de Destaque (permanece a mesma da correção anterior) ---
    let activeModuleName = '';
    // ... (resto da lógica de destaque como antes) ...
     if (targetId.startsWith('content-')) {
        activeModuleName = targetId.split('-')[1];
    }
    if (targetId === 'content-veiculo-detalhes') {
        activeModuleName = 'frota';
    }
    console.log(`Módulo ativo determinado: ${activeModuleName}`); 

    if (activeModuleName) {
        console.log('Limpando classe active de todos os navLinks:', navLinks); 
        navLinks.forEach(link => link.classList.remove('active')); 

        const sidebarLinkId = `nav-${activeModuleName}`;
        const activeSidebarLink = document.getElementById(sidebarLinkId);
        console.log(`Tentando encontrar e ativar link da sidebar: #${sidebarLinkId}`, activeSidebarLink); 

        if (activeSidebarLink) {
            activeSidebarLink.classList.add('active');
            console.log(`Classe 'active' ADICIONADA a:`, activeSidebarLink); 
        } else {
             console.error(`ERRO: Link da sidebar #${sidebarLinkId} não encontrado no DOM!`); 
        }

        mobileNavLinks.forEach(link => link.classList.remove('active'));
        const mobileLinkId = `mobile-nav-${activeModuleName}`;
        const activeMobileLink = document.getElementById(mobileLinkId);
        if (activeMobileLink) activeMobileLink.classList.add('active');

    } else {
        console.warn('Nenhum módulo ativo determinado, pulando destaque.'); 
    }
    console.log(`--- Fim switchView para: ${targetId} ---`); 
};
    

    document.querySelectorAll('.nav-link, .bottom-bar-link').forEach(link => {

        if (link.id !== 'mobile-more-menu-wrapper') { 

            link.addEventListener('click', (e) => {

                e.preventDefault();

                const moduleName = link.id.split('-')[link.id.split('-').length - 1];

                switchView(`content-${moduleName}`);

                if (sidebar.classList.contains('sidebar-visible')) {

                    toggleMobileMenu();

                }

            });

        }

    });



   



    const acoesDeUsuario = {

        abrirPerfil: () => {

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));

            if (userInfo && userInfo.usuario) {

                perfilNome.value = userInfo.usuario.nome;

                abrirModal(modalPerfil);

            }

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



// SUBSTITUA A FUNÇÃO 'verificarLogin' INTEIRA POR ESTA VERSÃO OTIMIZADA
const verificarLogin = () => {
    const token = obterToken();
    const userInfo = localStorage.getItem('userInfo');

    // Esconde todos os itens por padrão
    document.querySelectorAll('.sidebar-nav li, #bottom-bar .bottom-bar-link').forEach(item => {
        // ... (lógica para esconder itens permanece a mesma) ...
         if (!item.querySelector('#btn-abrir-perfil') && !item.querySelector('#btn-logout') && item.id !== 'mobile-more-menu-wrapper' && !item.querySelector('#mobile-btn-perfil') && !item.querySelector('#mobile-btn-logout') && !item.querySelector('#mobile-btn-admin')) {
             item.classList.add('hidden');
        }
    });
    liAdminPanel?.classList.add('hidden');
    mobileBtnAdmin?.classList.add('hidden');
    document.getElementById('li-nav-dashboard')?.classList.add('hidden'); 
    document.getElementById('mobile-nav-dashboard')?.classList.add('hidden'); 


    if (token && userInfo) {
        const { usuario } = JSON.parse(userInfo);
        telaLogin.classList.add('hidden');
        appContainer.classList.remove('hidden');
        bottomBar.classList.remove('hidden');

        fetchNotificacoes(); // Busca notificações (importante manter)

        const perfilLinkText = btnAbrirPerfil.querySelector('.nav-text');
        if (perfilLinkText) perfilLinkText.textContent = `${usuario.nome || usuario.email}`;

        const userRole = usuario.role;
        let defaultView = null; 

        // --- LÓGICA DE VISIBILIDADE ATUALIZADA ---
        if (userRole === 'SUPER_ADMIN' || userRole === 'ESCRITORIO') {
            document.querySelectorAll('#li-nav-dashboard, #nav-documentos, #nav-frota, #nav-colaboradores, #nav-contratos, #nav-notificacoes').forEach(link => link.closest('li')?.classList.remove('hidden'));
            document.querySelectorAll('#mobile-nav-dashboard, #mobile-nav-documentos, #mobile-nav-frota, #mobile-nav-colaboradores, #mobile-nav-contratos, #mobile-nav-notificacoes').forEach(link => link?.classList.remove('hidden'));
            
            defaultView = 'content-dashboard'; // Dashboard é o padrão
            // NÃO chamamos fetchDocumentos() ou fetchVeiculos() aqui mais.

            if (userRole === 'SUPER_ADMIN') {
                liAdminPanel?.classList.remove('hidden');
                mobileBtnAdmin?.classList.remove('hidden');
            }

        } else if (userRole === 'ENCARREGADO' || userRole === 'MECANICO') {
            document.querySelector('#nav-frota')?.closest('li').classList.remove('hidden');
            document.querySelector('#nav-notificacoes')?.closest('li').classList.remove('hidden');
            document.querySelector('#mobile-nav-frota')?.classList.remove('hidden');
            document.querySelector('#mobile-nav-notificacoes')?.classList.remove('hidden');
           
            defaultView = 'content-frota';
            fetchVeiculos(); // Carrega veículos pois é a view padrão deles
        }

        // Define a view inicial
        if (defaultView && document.getElementById(defaultView)) {
            switchView(defaultView); 
            navLinks.forEach(link => link.classList.toggle('active', link.id === `nav-${defaultView.split('-')[1]}`));
            mobileNavLinks.forEach(link => link.classList.toggle('active', link.id === `mobile-nav-${defaultView.split('-')[1]}`));
        } else if (tbodyDocumentos) { 
             switchView('content-documentos');
             // Se o fallback for documentos, carrega os dados aqui
             fetchDocumentos(); 
        }

    } else {
        telaLogin.classList.remove('hidden');
        appContainer.classList.add('hidden');
        bottomBar.classList.add('hidden');
    }
};

// FIM DO CÓDIGO PARA SUBSTITUIR



    // --- LÓGICA DO MÓDULO DE DOCUMENTOS ---

    const fetchDocumentos = async () => {

        try {

            const response = await fetch(DOCS_URL, { headers: getAuthHeaders() });

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

            if(tbodyDocumentos) tbodyDocumentos.innerHTML = `<tr><td colspan="7" style="text-align:center;">Erro ao carregar dados.</td></tr>`;

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

        if (!pageInfo || !paginationContainer) return;

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



    // INÍCIO DO CÓDIGO PARA SUBSTITUIR

const renderizarTabela = () => {

    if(!tbodyDocumentos) return;

    tbodyDocumentos.innerHTML = '';

    if (documentosFiltrados.length === 0) {

        if(paginationContainer) paginationContainer.classList.add('hidden');

        tbodyDocumentos.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum documento encontrado.</td></tr>`;

        return;

    }

    

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;

    const fim = inicio + ITENS_POR_PAGINA;

    const documentosDaPagina = documentosFiltrados.slice(inicio, fim);

    

    atualizarControlesPaginacao();

    

    const formatarDataParaExibicao = (d) => { if (!d) return 'N/A'; const [a, m, dia] = d.split('T')[0].split('-'); return `${dia}/${m}/${a}`; };

    

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

        tr.innerHTML = `

            <td>${doc.nome}</td>

            <td>${doc.categoria || '-'}</td>

            <td>${formatarDataParaExibicao(doc.dataVencimento)}</td>

            <td class="dias-restantes">${doc.status === 'Renovado' ? '-' : (diffDays >= 0 ? `Faltam ${diffDays} dia(s)` : `Vencido há ${Math.abs(diffDays)} dia(s)`)}</td>

            <td><span class="status-span status-${statusClasse}">${statusTexto}</span></td>

            <td></td>

            <td></td>

        `;



        const anexoCell = tr.children[5];

        if (doc.nome_arquivo) {

            const linkAnexo = document.createElement('a');

            linkAnexo.href = `${API_URL}/uploads/${doc.nome_arquivo}`;

            linkAnexo.target = '_blank';

            linkAnexo.className = 'btn-anexo';

            linkAnexo.title = 'Ver Anexo';

            linkAnexo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16"><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/></svg>`;

            anexoCell.appendChild(linkAnexo);

        } else { 

            anexoCell.textContent = 'N/A'; 

        }

        

        const acoesCell = tr.children[6];

        const btnEditar = document.createElement('button');

        btnEditar.className = 'btn-editar';

        btnEditar.title = 'Editar Documento';

        btnEditar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

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

            handleDocumentoCategoriaChange();

            abrirModal(modalDocumento);

        };

        acoesCell.appendChild(btnEditar);



        // --- NOVO: CÓDIGO PARA CRIAR O BOTÃO DE EXCLUIR ---

        const btnDeletar = document.createElement('button');

        btnDeletar.className = 'btn-deletar';

        btnDeletar.title = 'Excluir Documento';

        btnDeletar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;



        btnDeletar.onclick = async () => {

            if (confirm(`Tem certeza que deseja excluir o documento "${doc.nome}"? Esta ação não pode ser desfeita.`)) {

                try {

                    const response = await fetch(`${DOCS_URL}/${doc.id}`, {

                        method: 'DELETE',

                        headers: getAuthHeaders()

                    });



                    if (response.ok) {

                        fetchDocumentos(); // Atualiza a lista de documentos na tela

                    } else {

                        const erro = await response.json();

                        alert(`Erro ao excluir documento: ${erro.message || 'Erro desconhecido'}`);

                    }

                } catch (error) {

                    console.error('Erro ao deletar documento:', error);

                    alert('Ocorreu um erro de conexão ao tentar excluir.');

                }

            }

        };

        acoesCell.appendChild(btnDeletar);

        // --- FIM DO NOVO CÓDIGO ---

        

        tbodyDocumentos.appendChild(tr);

    });

};

/**
 * Busca o PDF da OS no backend e força o download com o nome correto.
 * @param {number} manutencaoId O ID da manutenção.
 */
const gerarEExibirPdfOS = async (manutencaoId) => {
    console.log(`Solicitando PDF para manutenção ID: ${manutencaoId}`);
    try {
        const response = await fetch(`${API_URL}/api/veiculos/manutencoes/${manutencaoId}/os-pdf`, { 
            headers: getAuthHeaders() 
        });

        if (!response.ok) {
            let errorMsg = `Erro ${response.status}: ${response.statusText}`;
            try { const errorData = await response.json(); errorMsg = errorData.error || errorData.message || errorMsg; } catch (e) {}
            throw new Error(errorMsg);
        }

        // Pega o blob (o arquivo PDF)
        const blob = await response.blob();

        // --- LÓGICA DE DOWNLOAD CORRIGIDA ---

        // 1. Tenta extrair o nome do arquivo do header 'Content-Disposition'
        let filename = 'OS.pdf'; // Nome padrão
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        // 2. Cria uma URL temporária para o blob
        const fileURL = URL.createObjectURL(blob);

        // 3. Cria um link <a> invisível para forçar o download com o nome correto
        const downloadLink = document.createElement('a');
        downloadLink.href = fileURL;
        downloadLink.download = filename; // Define o nome do arquivo para o download
        document.body.appendChild(downloadLink); // Adiciona o link ao corpo
        downloadLink.click(); // Simula o clique no link
        document.body.removeChild(downloadLink); // Remove o link

        // 4. Revoga a URL do objeto para liberar memória (não precisa mais do window.open)
        URL.revokeObjectURL(fileURL);

    } catch (error) {
        console.error('Erro ao gerar/exibir PDF da OS:', error);
        alert(`Não foi possível gerar o PDF: ${error.message}`);
    } 
};

// FIM DO CÓDIGO PARA SUBSTITUIR



// INÍCIO DO CÓDIGO PARA SUBSTITUIR (exibirDetalhesDoVeiculo)

const exibirDetalhesDoVeiculo = async (veiculo) => {

    veiculoSelecionado = veiculo;

    detalhesVeiculoTitulo.textContent = `Detalhes: ${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}`;

    switchView('content-veiculo-detalhes');



    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    const userRole = userInfo ? userInfo.usuario.role : null;

    const secaoAbastecimento = document.getElementById('secao-abastecimento');



    if (secaoAbastecimento) {

        if (userRole === 'ENCARREGADO' || userRole === 'MECANICO') {

            secaoAbastecimento.classList.add('hidden');

        } else {

            secaoAbastecimento.classList.remove('hidden');

        }

    }

    
if (secaoRelatorioMensal) {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ESCRITORIO') {
        secaoRelatorioMensal.classList.remove('hidden');

        // Pré-popula os campos com o mês e ano atuais
        const dataAtual = new Date();
        relatorioMes.value = dataAtual.getMonth() + 1; // getMonth() é 0-11
        relatorioAno.value = dataAtual.getFullYear();

    } else {
        secaoRelatorioMensal.classList.add('hidden');
    }
}

    

    // --- NOVO: LÓGICA PARA EXIBIR BOTÃO DE FAZER SOLICITAÇÃO ---

    if(btnAbrirModalSolicitacao) {

        if (userRole === 'SUPER_ADMIN' || userRole === 'ENCARREGADO') {

            btnAbrirModalSolicitacao.classList.remove('hidden');

        } else {

            btnAbrirModalSolicitacao.classList.add('hidden');

        }

    }



    // Busca e renderiza o histórico de MANUTENÇÕES

    try {

        const resManutencoes = await fetch(`${VEICULOS_URL}/${veiculo.id}/manutencoes`, { headers: getAuthHeaders() });

        if (!resManutencoes.ok) throw new Error('Falha ao buscar manutenções');

        const manutencoes = await resManutencoes.json();

        renderizarTabelaManutencoes(manutencoes);

    } catch (error) {

        console.error('Erro ao buscar manutenções:', error);

        tbodyManutencoes.innerHTML = `<tr><td colspan="5" style="text-align:center;">Erro ao carregar histórico.</td></tr>`;

    }



    // Apenas busca o histórico de ABASTECIMENTO se a seção for visível

    if (secaoAbastecimento && !secaoAbastecimento.classList.contains('hidden')) {

        try {

            const resAbastecimentos = await fetch(`${VEICULOS_URL}/${veiculo.id}/abastecimentos`, { headers: getAuthHeaders() });

            if (!resAbastecimentos.ok) throw new Error('Falha ao buscar abastecimentos');

            const abastecimentos = await resAbastecimentos.json();

            renderizarTabelaAbastecimentos(abastecimentos);

        } catch (error) {

            console.error('Erro ao buscar abastecimentos:', error);

            tbodyAbastecimentos.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar histórico.</td></tr>`;

        }

    }



    // Busca e renderiza o PLANO DE MANUTENÇÃO

    try {

        const resPlanos = await fetch(`${VEICULOS_URL}/${veiculo.id}/planos`, { headers: getAuthHeaders() });

        if (!resPlanos.ok) throw new Error('Falha ao buscar plano de manutenção');

        const planos = await resPlanos.json();

        renderizarTabelaPlanos(planos);

    } catch (error) {

        console.error('Erro ao buscar plano de manutenção:', error);

        tbodyPlanos.innerHTML = `<tr><td colspan="5" style="text-align:center;">Erro ao carregar plano.</td></tr>`;

    }



    // --- NOVO: BUSCA E RENDERIZA AS SOLICITAÇÕES DE MANUTENÇÃO ---

    try {

        const resSolicitacoes = await fetch(`${VEICULOS_URL}/${veiculo.id}/solicitacoes`, { headers: getAuthHeaders() });

        if (!resSolicitacoes.ok) throw new Error('Falha ao buscar solicitações');

        const solicitacoes = await resSolicitacoes.json();

        renderizarTabelaSolicitacoes(solicitacoes);

    } catch (error) {

        console.error('Erro ao buscar solicitações:', error);

        tbodySolicitacoes.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar solicitações.</td></tr>`;

    }

};

// Garanta que esta função exista EXATAMENTE assim no seu script.js

/**
 * Controla a visibilidade do campo 'Vincular Veículo' baseado na categoria.
 */
const handleDocumentoCategoriaChange = () => {
    // Verifica se as referências existem antes de usá-las
    if (!docCategoria || !formGroupVeiculoId || !documentoVeiculoId) {
        console.error("Erro: Referências para campos de categoria/veículo não encontradas.");
        return; 
    }

    if (docCategoria.value === 'Caminhões') {
        formGroupVeiculoId.classList.remove('hidden'); // <-- ESTA LINHA DEVE TORNAR O CAMPO VISÍVEL
        documentoVeiculoId.required = true; 
        popularVeiculosSelect(); 
    } else {
        formGroupVeiculoId.classList.add('hidden'); // <-- ESTA LINHA ESCONDE O CAMPO
        documentoVeiculoId.required = false; 
        documentoVeiculoId.value = ''; 
    }
};

    const popularVeiculosSelect = async () => {
        if (!documentoVeiculoId) return;

        // Evita buscar repetidamente se já foi populado e a lista está em memória
        if (todosOsVeiculos && todosOsVeiculos.length > 0 && documentoVeiculoId.options.length > 1) {
             console.log('Select de veículos já populado, usando cache.');
             return; 
        }

        documentoVeiculoId.innerHTML = '<option value="">Carregando...</option>';

        try {
            // Reutiliza a função fetchVeiculos se os dados ainda não foram carregados
            if (!todosOsVeiculos || todosOsVeiculos.length === 0) {
                 await fetchVeiculos(); // Garante que a lista 'todosOsVeiculos' esteja preenchida
            }

            if (!todosOsVeiculos || todosOsVeiculos.length === 0) {
                throw new Error('Nenhum veículo encontrado para listar.');
            }

            documentoVeiculoId.innerHTML = '<option value="" disabled selected>Selecione um veículo...</option>'; // Placeholder

            todosOsVeiculos.forEach(veiculo => {
                const option = document.createElement('option');
                option.value = veiculo.id;
                option.textContent = `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`;
                documentoVeiculoId.appendChild(option);
            });

        } catch (error) {
            console.error('Erro ao popular select de veículos:', error);
            documentoVeiculoId.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    };

// FIM DO CÓDIGO PARA SUBSTITUIR



    // --- LÓGICA DO MÓDULO DE FROTA ---

    // --- NOVO: Funções de Manutenção ---

// INÍCIO DO CÓDIGO PARA SUBSTITUIR

const adicionarLinhaPeca = () => {

    const div = document.createElement('div');

    div.className = 'form-row peca-item';



    // Adiciona o HTML da nova linha, agora com o campo de TIPO

    div.innerHTML = `

        <div class="form-group peca-tipo">

            <label>Tipo</label>

            <div class="select-wrapper">

                <select class="peca-input-tipo" required>

                    <option value="Peca">Peça</option>

                    <option value="Servico">Serviço</option>

                </select>

            </div>

        </div>

        <div class="form-group peca-qtd">

            <label>Qtd</label>

            <input type="number" class="peca-input-qtd" placeholder="Qtd" min="1" value="1" required>

        </div>

        <div class="form-group peca-desc">

            <label>Descrição</label>

            <input type="text" class="peca-input-desc" placeholder="Descrição da peça ou serviço" required>

        </div>

        <div class="form-group peca-marca">

            <label>Marca</label>

            <input type="text" class="peca-input-marca" placeholder="Marca (opcional)">

        </div>

        <div class="form-group peca-acao">

            <label>&nbsp;</label>

            <button type="button" class="btn-remover-item">&times;</button>

        </div>

    `;



    // --- LÓGICA INTELIGENTE PARA ESCONDER/MOSTRAR CAMPOS ---

    const selectTipo = div.querySelector('.peca-input-tipo');

    const grupoQtd = div.querySelector('.peca-qtd');

    const grupoMarca = div.querySelector('.peca-marca');



    const atualizarVisibilidade = () => {

        if (selectTipo.value === 'Servico') {

            grupoQtd.style.display = 'none';

            grupoMarca.style.display = 'none';

        } else { // Se for 'Peca'

            grupoQtd.style.display = 'block';

            grupoMarca.style.display = 'block';

        }

    };



    // Adiciona o evento que dispara a lógica quando o tipo é alterado

    selectTipo.addEventListener('change', atualizarVisibilidade);

    

    // Garante o estado inicial correto da linha

    atualizarVisibilidade(); 

    

    // --- LÓGICA PARA O BOTÃO DE REMOVER A LINHA ---

    const btnRemover = div.querySelector('.btn-remover-item');

    btnRemover.addEventListener('click', () => {

        div.remove();

    });



    listaPecasContainer.appendChild(div);

};

// FIM DO CÓDIGO PARA SUBSTITUIR



    const fetchVeiculos = async () => {

        try {

            const response = await fetch(VEICULOS_URL, { headers: getAuthHeaders() });

            if (!response.ok) throw new Error('Falha na busca de veículos');

            todosOsVeiculos = await response.json();

            aplicarFiltroBuscaVeiculos();

        } catch (error) {

            console.error('Erro ao buscar veículos:', error);

            if(tbodyVeiculos) tbodyVeiculos.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar veículos.</td></tr>`;

        }

    };



    const aplicarFiltroBuscaVeiculos = () => {

        let veiculos = [...todosOsVeiculos];

        const termo = termoDeBuscaVeiculo.toLowerCase();



        if (termo.length > 0) {

            veiculos = veiculos.filter(v => 

                v.placa.toLowerCase().includes(termo) ||

                v.marca.toLowerCase().includes(termo) ||

                v.modelo.toLowerCase().includes(termo)

            );

        }

        veiculosFiltrados = veiculos;

        renderizarTabelaVeiculos();

    };



    const renderizarTabelaVeiculos = () => {

    if (!tbodyVeiculos) return;

    tbodyVeiculos.innerHTML = '';



    if (veiculosFiltrados.length === 0) {

        tbodyVeiculos.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum veículo encontrado.</td></tr>`;

        return;

    }



    veiculosFiltrados.forEach(veiculo => {

        const tr = document.createElement('tr');

        tr.className = 'linha-clicavel'; // Adiciona a classe para o estilo do cursor

        tr.onclick = () => exibirDetalhesDoVeiculo(veiculo); // Adiciona o evento de clique na linha



        tr.innerHTML = `

            <td>${veiculo.placa}</td>

            <td>${veiculo.marca}</td>

            <td>${veiculo.modelo}</td>

            <td>${veiculo.ano}</td>

            <td>${veiculo.tipo}</td>

            <td></td> 

        `;

        

        const acoesCell = tr.children[5];

        acoesCell.onclick = (e) => e.stopPropagation(); // Impede que o clique nos botões ative o clique da linha



        const btnEditar = document.createElement('button');

        btnEditar.className = 'btn-editar';

        btnEditar.title = 'Editar Veículo';

        btnEditar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

        btnEditar.onclick = (e) => {

            e.stopPropagation();

            formVeiculo.reset();

            veiculoId.value = veiculo.id;

            modalVeiculoTitulo.textContent = 'Editar Veículo';

            veiculoPlaca.value = veiculo.placa;

            veiculoMarca.value = veiculo.marca;

            veiculoModelo.value = veiculo.modelo;

            veiculoAno.value = veiculo.ano;

            veiculoTipo.value = veiculo.tipo;

            abrirModal(modalVeiculo);

        };



        const btnDeletar = document.createElement('button');

        btnDeletar.className = 'btn-deletar';

        btnDeletar.title = 'Excluir Veículo';

        btnDeletar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

        btnDeletar.onclick = async (e) => {

            e.stopPropagation();

            if (confirm(`Tem certeza que deseja excluir o veículo de placa ${veiculo.placa}?`)) {

                try {

                    const response = await fetch(`${VEICULOS_URL}/${veiculo.id}`, {

                        method: 'DELETE',

                        headers: getAuthHeaders()

                    });

                    if (response.ok) {

                        fetchVeiculos();

                    } else {

                        const erro = await response.json();

                        alert(`Erro ao excluir veículo: ${erro.error}`);

                    }

                } catch (error) {

                    console.error('Erro ao deletar veículo:', error);

                    alert('Ocorreu um erro de conexão ao tentar excluir.');

                }

            }

        };

        

        acoesCell.appendChild(btnEditar);

        acoesCell.appendChild(btnDeletar);

        tbodyVeiculos.appendChild(tr);

    });

};





// INÍCIO DO CÓDIGO PARA SUBSTITUIR

// SUBSTITUA A FUNÇÃO 'renderizarTabelaManutencoes' INTEIRA
const renderizarTabelaManutencoes = (manutencoes) => {
    if (!tbodyManutencoes) return;
    tbodyManutencoes.innerHTML = '';

    if (!manutencoes || manutencoes.length === 0) {
        tbodyManutencoes.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum registro de manutenção encontrado.</td></tr>`; // Aumenta colspan para 6
        return;
    }

    const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    manutencoes.forEach(m => {
        const tr = document.createElement('tr');
        
        const pecasTexto = Array.isArray(m.pecas) && m.pecas.length > 0
            ? m.pecas.map(p => { /* ... (lógica existente para formatar peças) ... */ 
                if (p.tipo === 'Servico') { return `<span class="item-tipo-servico">[Serviço]</span> ${p.descricao}`; }
                const quantidade = p.quantidade || 1; const marca = p.marca ? `(${p.marca})` : '';
                return `<span class="item-tipo-peca">[Peça]</span> ${quantidade}x ${p.descricao} ${marca}`;
            }).join('<br>')
            : '-';

        // ✅ MODIFICAÇÃO: Adiciona uma nova célula <td> no final para Ações
        //                e ajusta a célula anterior (índice 4) para o número da OS
        tr.innerHTML = `
            <td>${formatarData(m.data)}</td>
            <td>${m.tipo}</td>
            <td>${m.km_atual}</td>
            <td>${pecasTexto}</td>
            <td>${m.numero_os ? `OS-${String(m.numero_os).padStart(6, '0')}` : '-'}</td> 
            <td></td>  
        `; // Colspan na thead precisará ser 6 agora

        // Adiciona a classe 'manutencao-row' e 'data-id' para facilitar a captura do ID no clique
        tr.classList.add('manutencao-row');
        tr.dataset.id = m.id; // Armazena o ID da manutenção na própria linha

        const acoesCell = tr.children[5]; // Ações agora estão na 6ª célula (índice 5)

        // --- BOTÃO GERAR PDF OS ---
        const btnPdf = document.createElement('button');
        btnPdf.className = 'btn-pdf btn-gerar-os'; // Adiciona classes para estilo e identificação
        btnPdf.title = `Gerar PDF da OS-${String(m.numero_os).padStart(6, '0')}`;
        btnPdf.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf" viewBox="0 0 16 16"><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/><path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.658-.889.37-.232.793-.346 1.236-.364.44-.015.86.06 1.225.218.37.16.65.396.865.703.214.306.338.656.338 1.026 0 .447-.135.856-.41 1.215-.273.36-.66.63-1.095.796a5.116 5.116 0 0 1-.607.137c-.504.093-.986.142-1.432.142-.218 0-.395-.02-.556-.064-.16-.043-.288-.1-.381-.174l-.058.119a10.518 10.518 0 0 0 .99 1.408.491.491 0 0 1-.295.152 1.9 1.9 0 0 1-.454-.152l-.15.345a.49.49 0 0 1-.148.153h-.032l-.11.121-.043.041-.015.014-.002.002a.5.5 0 0 1-.252.066.39.39 0 0 1-.061 0l-.142-.014a.33.33 0 0 1-.1-.026l-.1-.038-.075-.041a.243.243 0 0 1-.048-.037l-.03-.03-.014-.015a.031.031 0 0 1 0-.004zM6.8 11.84h.794a1 1 0 0 0 .704-.295l.408-.407a.5.5 0 0 0-.555-.838l-.407.407a.15.15 0 0 1-.106.043H6.8v.6z"/></svg>`;
        // btnPdf.onclick = () => gerarEExibirPdfOS(m.id); // Adicionaremos a lógica depois
        acoesCell.appendChild(btnPdf);
        
        // --- Botão Deletar (existente) ---
        const btnDeletar = document.createElement('button');
        btnDeletar.className = 'btn-deletar';
        btnDeletar.title = 'Excluir Registro de Manutenção';
        btnDeletar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
        btnDeletar.onclick = async () => { /* ... (lógica de deletar existente) ... */ 
             if (confirm(`Tem certeza que deseja excluir o registro de manutenção do dia ${formatarData(m.data)}?`)) {
                try {
                    const response = await fetch(`${VEICULOS_URL}/${veiculoSelecionado.id}/manutencoes/${m.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                    if (response.ok) { exibirDetalhesDoVeiculo(veiculoSelecionado); } 
                    else { const erro = await response.json(); alert(`Erro ao excluir registro: ${erro.error || 'Erro desconhecido'}`); }
                } catch (error) { console.error('Erro ao deletar manutenção:', error); alert('Ocorreu um erro de conexão.'); }
            }
        };
        acoesCell.appendChild(btnDeletar);

        tbodyManutencoes.appendChild(tr);
    });
};

/**
 * (FASE 4) Controla a visibilidade dos campos com base no tipo de manutenção selecionado.
 */
const handleTipoManutencaoChange = () => {
    if (!manutencaoTipo || !formGroupPlanoItem) return;

    if (manutencaoTipo.value === 'Preventiva') {
        formGroupPlanoItem.classList.remove('hidden');
    } else {
        formGroupPlanoItem.classList.add('hidden');
    }
};

/**
 * (FASE 4) Busca os itens do plano de manutenção do veículo e popula o select.
 */
const popularPlanoManutencaoSelect = async () => {
    if (!veiculoSelecionado || !manutencaoPlanoItem) return;

    try {
        const response = await fetch(`${VEICULOS_URL}/${veiculoSelecionado.id}/planos`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Falha ao buscar itens do plano.');
        
        const planos = await response.json();
        
        manutencaoPlanoItem.innerHTML = '<option value="" disabled selected>Selecione o item executado...</option>';
        
        planos.forEach(plano => {
            const option = document.createElement('option');
            option.value = plano.id; // O valor será o ID do item do plano
            option.textContent = plano.descricao; // O texto será a descrição
            manutencaoPlanoItem.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao popular o select de itens do plano:', error);
        manutencaoPlanoItem.innerHTML = '<option value="">Erro ao carregar itens</option>';
    }
};

// FIM DO CÓDIGO PARA SUBSTITUIR



// CÓDIGO ATUALIZADO (SUBSTITUIR A FUNÇÃO EXISTENTE)

// SUBSTITUA A FUNÇÃO 'abrirModalManutencao' INTEIRA POR ESTA VERSÃO
const abrirModalManutencao = (solicitacao = null) => {
    if (!veiculoSelecionado) return;
    if (!formManutencao) return;

    // --- LÓGICA DE RESET E PREPARAÇÃO ---
    formManutencao.reset();
    formManutencao.removeEventListener('submit', handleManutencaoSubmit);
    formManutencao.addEventListener('submit', handleManutencaoSubmit);

    if (listaPecasContainer) {
        listaPecasContainer.innerHTML = '';
        adicionarLinhaPeca();
    }
    
    // --- INÍCIO DAS NOVAS INTEGRAÇÕES (FASE 4) ---

    // 1. Esconde o campo do plano por padrão ao abrir o modal.
    if (formGroupPlanoItem) formGroupPlanoItem.classList.add('hidden');

    // 2. Prepara o listener para o campo "Tipo de Manutenção".
    if (manutencaoTipo) {
        manutencaoTipo.removeEventListener('change', handleTipoManutencaoChange); // Limpa listener antigo
        manutencaoTipo.addEventListener('change', handleTipoManutencaoChange);
    }
    
    // 3. Busca e popula os itens do plano para o novo campo de select.
    popularPlanoManutencaoSelect();

    // --- FIM DAS NOVAS INTEGRAÇÕES ---

    // Lógica para pré-preenchimento SE uma solicitação for passada (continua a mesma)
    const solicitacaoIdInput = document.getElementById('manutencao-solicitacao-id');
    if (solicitacao && solicitacao.id) {
        if (solicitacaoIdInput) solicitacaoIdInput.value = solicitacao.id;
        if (manutencaoTipo) {
            manutencaoTipo.value = 'Corretiva';
            handleTipoManutencaoChange(); // Garante que o campo do plano fique escondido
        }
        
        const primeiraDescricao = document.querySelector('#lista-pecas-container .peca-input-desc');
        if (primeiraDescricao) {
            primeiraDescricao.value = solicitacao.descricao_problema;
        }
    } else {
        if (solicitacaoIdInput) solicitacaoIdInput.value = '';
    }

    abrirModal(modalManutencao);
};



// --- NOVO: Funções de Abastecimento ---

const renderizarTabelaAbastecimentos = (abastecimentos) => {

    if (!tbodyAbastecimentos) return;

    tbodyAbastecimentos.innerHTML = '';



    if (abastecimentos.length === 0) {

        tbodyAbastecimentos.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum abastecimento registrado.</td></tr>`;

        return;

    }

    

    // Ordena os abastecimentos por KM para calcular o consumo corretamente

    const abastecimentosOrdenados = [...abastecimentos].sort((a, b) => a.km_atual - b.km_atual);



    abastecimentosOrdenados.forEach((abastecimento, index) => {

        const tr = document.createElement('tr');

        let consumoKML = '-';



        // Calcula o consumo com base no abastecimento anterior

        if (index > 0) {

            const anterior = abastecimentosOrdenados[index - 1];

            const kmRodados = abastecimento.km_atual - anterior.km_atual;

            const litrosConsumidos = parseFloat(anterior.litros_abastecidos);

            if (litrosConsumidos > 0 && kmRodados > 0) {

                consumoKML = (kmRodados / litrosConsumidos).toFixed(2).replace('.', ',');

            }

        }



        tr.innerHTML = `

            <td>${new Date(abastecimento.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>

            <td>${abastecimento.km_atual}</td>

            <td>${parseFloat(abastecimento.litros_abastecidos).toFixed(2).replace('.', ',')} L</td>

            <td>R$ ${abastecimento.valor_total ? parseFloat(abastecimento.valor_total).toFixed(2).replace('.', ',') : '-'}</td>

            <td>${abastecimento.posto || '-'}</td>

            <td>${consumoKML}</td>

        `;

        tbodyAbastecimentos.appendChild(tr);

    });

};



const abrirModalAbastecimento = () => {

    if (!veiculoSelecionado) return;

    formAbastecimento.reset();

    abrirModal(modalAbastecimento);

};



// INÍCIO DO CÓDIGO PARA SUBSTITUIR (renderizarTabelaPlanos)

const renderizarTabelaPlanos = (planos) => {

    if (!tbodyPlanos) return;

    tbodyPlanos.innerHTML = '';



    if (planos.length === 0) {

        tbodyPlanos.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum item cadastrado no plano.</td></tr>`;

        return;

    }



    const mapaDeStatusParaClasse = {

        'Em Dia': 'em-dia',

        'Alerta': 'vence-breve',

        'Vencido': 'atrasado',

        ' indefinido': 'em-dia'

    };



    planos.forEach(plano => {

        const tr = document.createElement('tr');

        

        const statusTexto = plano.status || ' indefinido';

        const statusClasse = mapaDeStatusParaClasse[statusTexto] || 'em-dia';



        tr.innerHTML = `

            <td>${plano.descricao}</td>

            <td>${plano.intervalo_km || '-'}</td>

            <td>${plano.intervalo_dias || '-'}</td>

            <td><span class="status-span status-${statusClasse}">${statusTexto}</span></td>

            <td></td>

        `;



        const acoesCell = tr.children[4];

        const btnDeletar = document.createElement('button');

        btnDeletar.className = 'btn-deletar';

        btnDeletar.title = 'Excluir Item do Plano';

        btnDeletar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;



        btnDeletar.onclick = async () => {

            if (confirm(`Tem certeza que deseja excluir o item "${plano.descricao}" do plano?`)) {

                try {

                    const response = await fetch(`${VEICULOS_URL}/${veiculoSelecionado.id}/planos/${plano.id}`, {

                        method: 'DELETE',

                        headers: getAuthHeaders()

                    });

                    if (response.ok) {

                        exibirDetalhesDoVeiculo(veiculoSelecionado);

                    } else {

                        const erro = await response.json();

                        alert(`Erro ao excluir item do plano: ${erro.error || 'Erro desconhecido'}`);

                    }

                } catch (error) {

                    console.error('Erro ao deletar item do plano:', error);

                    alert('Ocorreu um erro de conexão ao tentar excluir.');

                }

            }

        };



        acoesCell.appendChild(btnDeletar);

        tbodyPlanos.appendChild(tr);

    });

};

// FIM DO CÓDIGO PARA SUBSTITUIR

    

    // --- NOVO EVENT LISTENER PARA A FASE 4 ---
if (manutencaoPlanoItem) {
    manutencaoPlanoItem.addEventListener('change', () => {
        // Pega o texto do item selecionado no dropdown
        const itemSelecionadoTexto = manutencaoPlanoItem.options[manutencaoPlanoItem.selectedIndex].text;
        
        // Encontra o primeiro campo de descrição na lista de peças
        const primeiraDescricao = document.querySelector('#lista-pecas-container .peca-input-desc');
        
        if (primeiraDescricao) {
            // Preenche o campo de descrição com o nome do item do plano
            primeiraDescricao.value = itemSelecionadoTexto;
        }
    });
}


    if (btnProxima) btnProxima.addEventListener('click', () => {

        const totalPaginas = Math.ceil(documentosFiltrados.length / ITENS_POR_PAGINA);

        if (paginaAtual < totalPaginas) {

            paginaAtual++;

            renderizarTabela();

            if (listaContainer) listaContainer.scrollIntoView({ behavior: 'smooth' });

        }

    });



    if (formLogin) formLogin.addEventListener('submit', async (e) => {

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

if (docCategoria) {
    docCategoria.addEventListener('change', handleDocumentoCategoriaChange);
} else {
    console.error("Erro: Campo de Categoria (docCategoria) não encontrado para adicionar listener.");
}
    

    // SUBSTITUA AS LINHAS ACIMA POR ESTAS:
if (btnLogout) {
    btnLogout.addEventListener('click', acoesDeUsuario.fazerLogout);
} else {
    // Adiciona um log caso o elemento não seja encontrado, para diagnóstico futuro
    console.error("AVISO: Elemento #btn-logout não foi encontrado ao adicionar listener.");
}

if (mobileBtnLogout) {
    mobileBtnLogout.addEventListener('click', acoesDeUsuario.fazerLogout);
} else {
    // Adiciona um log caso o elemento não seja encontrado, para diagnóstico futuro
    console.error("AVISO: Elemento #mobile-btn-logout não foi encontrado ao adicionar listener.");
}

    

    // Dentro do DOMContentLoaded

if (btnAbrirModalCadastro) {
    btnAbrirModalCadastro.addEventListener('click', () => {
        console.log("Botão Cadastrar Novo Documento CLICADO!");
        formDocumento.reset();
        docId.value = '';
        modalTitulo.textContent = 'Cadastrar Novo Documento';
        anexoAtualContainer.classList.add('hidden');
        docFileName.textContent = 'Nenhum arquivo escolhido';
        
        handleDocumentoCategoriaChange(); // <<< VERIFIQUE ESTA LINHA (DEVE ESTAR AQUI)
        
        abrirModal(modalDocumento);
    });
}

if (formRelatorioMensal) {
    formRelatorioMensal.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário

        if (veiculoSelecionado && relatorioMes.value && relatorioAno.value) {
            gerarEExibirPdfRelatorioMensal(veiculoSelecionado.id, relatorioMes.value, relatorioAno.value);
        } else {
            alert('Erro: Não foi possível obter os dados necessários para gerar o relatório.');
        }
    });
}



    btnAdminPanel.addEventListener('click', () => carregarPainelAdmin());

    mobileBtnAdmin.addEventListener('click', () => carregarPainelAdmin());

    

    btnAbrirPerfil.addEventListener('click', acoesDeUsuario.abrirPerfil);

    mobileBtnPerfil.addEventListener('click', acoesDeUsuario.abrirPerfil);



    [modalDocumento, modalAdmin, modalPerfil, modalVeiculo, modalManutencao, modalAbastecimento].forEach(m => {      if(m) {

            const closeButton = m.querySelector('.close-button');

            if (closeButton) { closeButton.addEventListener('click', () => fecharModal(m)); }

            m.addEventListener('click', (e) => { if (e.target === m) { fecharModal(m); } });

        }

    });



    if (formDocumento) formDocumento.addEventListener('submit', async (e) => {

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



    if (btnAbrirModalVeiculo) btnAbrirModalVeiculo.addEventListener('click', () => {

        formVeiculo.reset();

        veiculoId.value = '';

        if(modalVeiculoTitulo) modalVeiculoTitulo.textContent = 'Cadastrar Novo Veículo';

        abrirModal(modalVeiculo);

    });



    if (formVeiculo) formVeiculo.addEventListener('submit', async (e) => {

        e.preventDefault();

        const dadosVeiculo = {

            placa: veiculoPlaca.value,

            marca: veiculoMarca.value,

            modelo: veiculoModelo.value,

            ano: veiculoAno.value,

            tipo: veiculoTipo.value,

        };



        const id = veiculoId.value;

        const url = id ? `${VEICULOS_URL}/${id}` : VEICULOS_URL;

        const method = id ? 'PUT' : 'POST';



        try {

            const response = await fetch(url, {

                method: method,

                headers: getAuthHeaders(),

                body: JSON.stringify(dadosVeiculo)

            });



            if (response.ok) {

                fecharModal(modalVeiculo);

                fetchVeiculos();

            } else {

                const erro = await response.json();

                alert(`Erro ao salvar veículo: ${erro.error}`);

            }

        } catch (error) {

            console.error('Erro ao salvar veículo:', error);

            alert('Ocorreu um erro de conexão. Tente novamente.');

        }

    });



    // --- NOVO: Event Listeners para Manutenção ---

if (btnAbrirModalManutencao) {

    btnAbrirModalManutencao.addEventListener('click', () => {

        formManutencao.reset();

        manutencaoId.value = '';

        

        // Limpa as linhas de peças antigas e adiciona uma nova em branco para começar

        listaPecasContainer.innerHTML = '';

        adicionarLinhaPeca(); 



        abrirModal(modalManutencao);

    });

}

// Dentro do DOMContentLoaded

if (tbodyManutencoes) {
    tbodyManutencoes.addEventListener('click', (e) => {
        // Verifica se o clique foi no botão de PDF (ou dentro dele, como no SVG)
        const pdfButton = e.target.closest('.btn-gerar-os'); 
        
        if (pdfButton) {
            // Encontra a linha da tabela (tr) pai do botão
            const row = pdfButton.closest('.manutencao-row');
            if (row && row.dataset.id) {
                const manutencaoId = parseInt(row.dataset.id, 10);
                gerarEExibirPdfOS(manutencaoId); // Chama a função para gerar o PDF
            } else {
                console.error("Não foi possível encontrar o ID da manutenção na linha da tabela.");
            }
        }
    });
}

/**
 * Busca o PDF do Relatório Mensal no backend e força o download com o nome correto.
 * @param {number} veiculoId O ID do veículo.
 * @param {string} mes O mês (1-12).
 * @param {string} ano O ano (AAAA).
 */
const gerarEExibirPdfRelatorioMensal = async (veiculoId, mes, ano) => {
    console.log(`Solicitando Relatório Mensal para Veículo ID: ${veiculoId}, Período: ${mes}/${ano}`);
    try {
        const response = await fetch(`${API_URL}/api/veiculos/${veiculoId}/relatorio-mensal-pdf?mes=${mes}&ano=${ano}`, { 
            headers: getAuthHeaders() 
        });

        if (!response.ok) {
             let errorMsg = `Erro ${response.status}: ${response.statusText}`;
             try { const errorData = await response.json(); errorMsg = errorData.error || errorData.message || errorMsg; } catch (e) {}
             throw new Error(errorMsg);
        }

        const blob = await response.blob();

        // --- LÓGICA DE DOWNLOAD CORRIGIDA ---
        let filename = 'Relatorio.pdf'; // Nome padrão
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        const fileURL = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = fileURL;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(fileURL);

    } catch (error) {
        console.error('Erro ao gerar/exibir Relatório Mensal:', error);
        alert(`Não foi possível gerar o relatório: ${error.message}`);
    }
};



// CÓDIGO ATUALIZADO (SUBSTITUIR A FUNÇÃO 'handleManutencaoSubmit')

/**
 * Função nomeada para lidar com o salvamento do registro de manutenção.
 * Centralizar a lógica aqui torna o código mais limpo e reutilizável.
 * @param {Event} e - O objeto do evento de submit.
 */
// ARQUIVO: script.js
// Confirme que esta é a sua função `handleManutencaoSubmit`

// SUBSTITUA a função 'handleManutencaoSubmit' inteira por esta versão

const handleManutencaoSubmit = async (e) => {
    e.preventDefault();
    if (!veiculoSelecionado) return;

    // --- CORREÇÃO: Busca as referências aos elementos DENTRO da função ---
    const manutencaoDataInput = document.getElementById('manutencao-data');
    const manutencaoTipoInput = document.getElementById('manutencao-tipo');
    const manutencaoKmInput = document.getElementById('manutencao-km');
    const solicitacaoIdInput = document.getElementById('manutencao-solicitacao-id');
    const manutencaoPlanoItemSelect = document.getElementById('manutencao-plano-item');
    // --- Fim da Correção ---

    // Validação para garantir que os campos principais existem
    if (!manutencaoDataInput || !manutencaoTipoInput || !manutencaoKmInput) {
        console.error("Erro fatal: Campos essenciais do formulário de manutenção não encontrados.");
        alert("Erro ao salvar: Campos do formulário não encontrados. Recarregue a página.");
        return;
    }

    const pecas = [];
    document.querySelectorAll('.peca-item').forEach(item => {
        const tipo = item.querySelector('.peca-input-tipo').value;
        const descricao = item.querySelector('.peca-input-desc').value;
        if (descricao) {
            const itemManutencao = { tipo, descricao, quantidade: null, marca: null };
            if (tipo === 'Peca') {
                itemManutencao.quantidade = item.querySelector('.peca-input-qtd').value;
                itemManutencao.marca = item.querySelector('.peca-input-marca').value || null;
            }
            pecas.push(itemManutencao);
        }
    });

    // Usa as variáveis locais que acabamos de definir
    const dadosManutencao = {
        data: manutencaoDataInput.value,
        tipo: manutencaoTipoInput.value,
        km_atual: manutencaoKmInput.value,
        pecas: pecas,
    };

    if (solicitacaoIdInput && solicitacaoIdInput.value) {
        dadosManutencao.solicitacaoId = solicitacaoIdInput.value;
    }

    if (dadosManutencao.tipo === 'Preventiva' && manutencaoPlanoItemSelect && manutencaoPlanoItemSelect.value) {
        dadosManutencao.planoItemId = manutencaoPlanoItemSelect.value;
    }

    const url = `${VEICULOS_URL}/${veiculoSelecionado.id}/manutencoes`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosManutencao)
        });
        if (response.ok) {
            fecharModal(modalManutencao);
            exibirDetalhesDoVeiculo(veiculoSelecionado);
        } else {
            const erro = await response.json();
            if (erro.error === 'Para manutenção preventiva, é obrigatório selecionar o item do plano executado.') {
                alert(erro.error);
            } else {
                alert(`Erro ao salvar registro: ${erro.error || 'Erro desconhecido.'}`);
            }
        }
    } catch (error) {
        console.error('Erro ao salvar manutenção:', error);
        alert('Ocorreu um erro de conexão. Tente novamente.');
    }
};



// --- NOVO: Event Listeners para Abastecimento ---

if (btnAbrirModalAbastecimento) {

    btnAbrirModalAbastecimento.addEventListener('click', abrirModalAbastecimento);

}



if (formAbastecimento) {

    formAbastecimento.addEventListener('submit', async (e) => {

        e.preventDefault();

        if (!veiculoSelecionado) return;



        const dadosAbastecimento = {

            data: abastecimentoData.value,

            km_atual: abastecimentoKm.value,

            litros_abastecidos: abastecimentoLitros.value,

            valor_total: abastecimentoValor.value || null,

            posto: abastecimentoPosto.value,

        };



        const url = `${VEICULOS_URL}/${veiculoSelecionado.id}/abastecimentos`;



        try {

            const response = await fetch(url, {

                method: 'POST',

                headers: getAuthHeaders(),

                body: JSON.stringify(dadosAbastecimento)

            });



            if (response.ok) {

                fecharModal(modalAbastecimento);

                exibirDetalhesDoVeiculo(veiculoSelecionado); 

            } else {

                const erro = await response.json();

                alert(`Erro ao salvar registro: ${erro.error}`);

            }

        } catch (error) {

            console.error('Erro ao salvar abastecimento:', error);

            alert('Ocorreu um erro de conexão. Tente novamente.');

        }

    });

}



    if (docArquivo) docArquivo.addEventListener('change', () => {

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

    if (formRegister) formRegister.addEventListener('submit', (e) => { e.preventDefault(); const nome = document.getElementById('register-nome').value; const email = document.getElementById('register-email').value; const senha = document.getElementById('register-senha').value; cadastrarUsuario(nome, email, senha); });

    if (formPerfil) formPerfil.addEventListener('submit', async (e) => {

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

    if (filtrosContainer) filtrosContainer.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { document.querySelector('.filtro-btn.active').classList.remove('active'); e.target.classList.add('active'); filtroCategoriaAtual = e.target.dataset.categoria; aplicarFiltrosEBusca(); } });

    

    if (inputBusca) inputBusca.addEventListener('input', (e) => { termoDeBusca = e.target.value; aplicarFiltrosEBusca(); });

    if (inputBuscaVeiculo) inputBuscaVeiculo.addEventListener('input', (e) => { termoDeBuscaVeiculo = e.target.value; aplicarFiltroBuscaVeiculos(); });

    

        

    // --- NOVO: Event Listener para o botão "Voltar" ---

        if (btnVoltarParaFrota) {

            btnVoltarParaFrota.addEventListener('click', () => {

            switchView('content-frota');

            });

        }



        // --- NOVO: Event Listeners para Manutenção ---

        if (btnAbrirModalManutencao) {

            btnAbrirModalManutencao.addEventListener('click', abrirModalManutencao);

        }



        if (btnAdicionarPeca) {

    btnAdicionarPeca.addEventListener('click', adicionarLinhaPeca);

}

    mobileMoreMenuWrapper.addEventListener('click', (e) => {

        e.stopPropagation();

        mobileMoreMenu.classList.toggle('visible');

    });

    document.addEventListener('click', () => {

        if (mobileMoreMenu.classList.contains('visible')) {

            mobileMoreMenu.classList.remove('visible');

        }

    });



// INÍCIO DO CÓDIGO PARA SUBSTITUIR (formPlanoManutencao)

if (formPlanoManutencao) {

    formPlanoManutencao.addEventListener('submit', async (e) => {

        e.preventDefault();

        if (!veiculoSelecionado) return;



        if (!planoKm.value && !planoDias.value) {

            alert('Por favor, preencha pelo menos um intervalo (KM ou Dias).');

            return;

        }



        const dadosPlano = {

            descricao: planoDescricao.value,

            intervalo_km: planoKm.value || null,

            intervalo_dias: planoDias.value || null,

        };



        const url = `${VEICULOS_URL}/${veiculoSelecionado.id}/planos`;



        try {

            const response = await fetch(url, {

                method: 'POST',

                headers: getAuthHeaders(),

                body: JSON.stringify(dadosPlano)

            });



            if (response.ok) {

                formPlanoManutencao.reset();

                exibirDetalhesDoVeiculo(veiculoSelecionado);

            } else {

                const erro = await response.json();

                alert(`Erro ao salvar item do plano: ${erro.error}`);

            }

        } catch (error) {

            console.error('Erro ao salvar item do plano:', error);

            alert('Ocorreu um erro de conexão. Tente novamente.');

        }

    });

}

// FIM DO CÓDIGO PARA SUBSTITUIR



// INÍCIO DO NOVO CÓDIGO (adicionar no final do script.js)



// --- FUNÇÕES DO PAINEL DE ADMINISTRAÇÃO ---



/**

 * Busca a lista de usuários da API e manda renderizar a tabela.

 */

const carregarPainelAdmin = async () => {

    switchView('content-admin-panel'); // Mostra a página do painel admin

    

    if (!tbodyUsuarios) return;

    tbodyUsuarios.innerHTML = '<tr><td colspan="4" style="text-align:center;">Carregando usuários...</td></tr>';



    try {

        const response = await fetch(`${API_URL}/api/usuarios`, {

            headers: getAuthHeaders()

        });



        if (!response.ok) {

            throw new Error('Falha ao buscar usuários. Você tem permissão para acessar esta área?');

        }



        const usuarios = await response.json();

        renderizarTabelaUsuarios(usuarios);



    } catch (error) {

        console.error('Erro ao carregar painel admin:', error);

        tbodyUsuarios.innerHTML = `<tr><td colspan="4" style="text-align:center;">${error.message}</td></tr>`;

    }

}



/**

 * Renderiza a tabela de usuários com os dados recebidos.

 * @param {Array} usuarios - A lista de usuários vinda da API.

 */

const renderizarTabelaUsuarios = (usuarios) => {

    if (!tbodyUsuarios) return;

    tbodyUsuarios.innerHTML = '';



    if (usuarios.length === 0) {

        tbodyUsuarios.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum usuário encontrado.</td></tr>';

        return;

    }



    const rolesDisponiveis = ['SUPER_ADMIN', 'ESCRITORIO', 'ENCARREGADO', 'MECANICO'];



    usuarios.forEach(usuario => {

        const tr = document.createElement('tr');

        

        // Cria o seletor de Papel (Role)

        const selectRoleOptions = rolesDisponiveis.map(role => 

            `<option value="${role}" ${usuario.role === role ? 'selected' : ''}>${role}</option>`

        ).join('');



        const selectRoleHTML = `

            <div class="select-wrapper">

                <select class="select-role-usuario" data-userid="${usuario.id}">

                    ${selectRoleOptions}

                </select>

            </div>

        `;



        tr.innerHTML = `

            <td>${usuario.nome}</td>

            <td>${usuario.email}</td>

            <td>${selectRoleHTML}</td>

            <td>

                <button class="btn-secundario btn-alterar-senha" data-userid="${usuario.id}">Alterar Senha</button>

                <button class="btn-deletar btn-deletar-usuario" data-userid="${usuario.id}" data-username="${usuario.nome}">

                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>

                </button>

            </td>

        `;



        tbodyUsuarios.appendChild(tr);

    });



    // Futuramente, aqui adicionaremos os event listeners para os botões e seletores

}



// FIM DO NOVO CÓDIGO



// INÍCIO DO NOVO CÓDIGO (adicionar no final do script.js)



// --- LÓGICA DE EVENTOS DO PAINEL DE ADMINISTRAÇÃO ---



// Abre o modal de criar usuário a partir do botão no painel

if (btnAbrirModalAdminNovo) {

    btnAbrirModalAdminNovo.addEventListener('click', () => {

        formRegister.reset();

        abrirModal(modalAdmin);

    });

}



// Lida com as ações dentro da tabela de usuários (Alterar Role, Senha, Deletar)

if (tbodyUsuarios) {

    tbodyUsuarios.addEventListener('click', async (e) => {

        const target = e.target;



        // --- LÓGICA PARA DELETAR USUÁRIO ---

        if (target.classList.contains('btn-deletar-usuario') || target.closest('.btn-deletar-usuario')) {

            const button = target.closest('.btn-deletar-usuario');

            const userId = button.dataset.userid;

            const userName = button.dataset.username;



            if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {

                try {

                    const response = await fetch(`${API_URL}/api/usuarios/${userId}`, {

                        method: 'DELETE',

                        headers: getAuthHeaders()

                    });

                    if (response.ok) {

                        alert('Usuário excluído com sucesso!');

                        carregarPainelAdmin(); // Recarrega a lista

                    } else {

                        const erro = await response.json();

                        alert(`Erro: ${erro.error}`);

                    }

                } catch (error) {

                    console.error('Erro ao deletar usuário:', error);

                    alert('Erro de conexão ao tentar deletar usuário.');

                }

            }

        }



        // --- LÓGICA PARA ABRIR O MODAL DE ALTERAR SENHA ---

        if (target.classList.contains('btn-alterar-senha')) {

            const userId = target.dataset.userid;

            alterarSenhaUserid.value = userId;

            formAlterarSenha.reset();

            abrirModal(modalAlterarSenha);

        }

    });



    // --- LÓGICA PARA ALTERAR O PAPEL (ROLE) ---

    tbodyUsuarios.addEventListener('change', async (e) => {

        if (e.target.classList.contains('select-role-usuario')) {

            const select = e.target;

            const userId = select.dataset.userid;

            const newRole = select.value;



            try {

                const response = await fetch(`${API_URL}/api/usuarios/${userId}/role`, {

                    method: 'PUT',

                    headers: getAuthHeaders(),

                    body: JSON.stringify({ role: newRole })

                });



                if (response.ok) {

                    alert('Papel do usuário atualizado com sucesso!');

                    // Opcional: recarregar o painel para garantir consistência

                    carregarPainelAdmin();

                } else {

                    const erro = await response.json();

                    alert(`Erro: ${erro.error}`);

                    carregarPainelAdmin(); // Recarrega para reverter a mudança visual

                }

            } catch (error) {

                console.error('Erro ao alterar role:', error);

                alert('Erro de conexão ao tentar alterar o papel.');

                carregarPainelAdmin();

            }

        }

    });

}



// Lógica para o formulário do modal de alterar senha

if (formAlterarSenha) {

    formAlterarSenha.addEventListener('submit', async (e) => {

        e.preventDefault();

        const userId = alterarSenhaUserid.value;

        const novaSenha = novaSenhaInput.value;



        try {

            const response = await fetch(`${API_URL}/api/usuarios/${userId}/password`, {

                method: 'PUT',

                headers: getAuthHeaders(),

                body: JSON.stringify({ novaSenha: novaSenha })

            });



            if (response.ok) {

                alert('Senha atualizada com sucesso!');

                fecharModal(modalAlterarSenha);

            } else {

                const erro = await response.json();

                alert(`Erro: ${erro.error}`);

            }

        } catch (error) {

            console.error('Erro ao atualizar senha:', error);

            alert('Erro de conexão ao tentar atualizar a senha.');

        }

    });

}



// Fecha o novo modal de senha

if(modalAlterarSenha) {

    const closeButton = modalAlterarSenha.querySelector('.close-button');

    if (closeButton) { closeButton.addEventListener('click', () => fecharModal(modalAlterarSenha)); }

    modalAlterarSenha.addEventListener('click', (e) => { if (e.target === modalAlterarSenha) { fecharModal(modalAlterarSenha); } });

}



// FIM DO NOVO CÓDIGO



// INÍCIO DO NOVO CÓDIGO (adicionar no final do script.js)



/**



/**

/**

 * Renderiza a tabela do Quadro de Solicitações.

 * @param {Array} solicitacoes - A lista de solicitações vinda da API.

 */

// Localize esta função (por volta da linha 1137)

const renderizarTabelaSolicitacoes = (solicitacoes) => {
    if (!tbodySolicitacoes) return;
    tbodySolicitacoes.innerHTML = '';

    if (solicitacoes.length === 0) {
        tbodySolicitacoes.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhuma solicitação em aberto.</td></tr>';
        return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const userRole = userInfo ? userInfo.usuario.role : null;
    const currentUserId = userInfo ? userInfo.usuario.id : null;

    const mapaStatus = {
        'ABERTO': { texto: 'Aberto', classe: 'aberto' },
        'EM_ANDAMENTO': { texto: 'Em Andamento', classe: 'em-andamento' }
    };

    const formatarData = (d) => new Date(d).toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit' 
    });

    solicitacoes.forEach(solicitacao => {
        const tr = document.createElement('tr');
        const statusInfo = mapaStatus[solicitacao.status] || { texto: solicitacao.status, classe: '' };

        tr.innerHTML = `
            <td>${formatarData(solicitacao.data_solicitacao)}</td>
            <td><span class="status-span status-${statusInfo.classe}">${statusInfo.texto}</span></td>
            <td>${solicitacao.solicitado_por_nome || 'N/A'}</td>
            <td>${solicitacao.descricao_problema}</td>
            <td>${solicitacao.mecanico_responsavel_nome || '-'}</td>
            <td></td>
        `;

        const acoesCell = tr.children[5];

    

        // Lógica para botão "Assumir"
        if (solicitacao.status === 'ABERTO' && (userRole === 'MECANICO' || userRole === 'SUPER_ADMIN')) {
            const btnAssumir = document.createElement('button');
            btnAssumir.className = 'btn-secundario';
            btnAssumir.textContent = 'Assumir';
            btnAssumir.title = 'Assumir esta solicitação de manutenção';
            
            btnAssumir.onclick = async () => {
                if (confirm('Tem certeza que deseja assumir este serviço?')) {
                    try {
                        const url = `${VEICULOS_URL}/${veiculoSelecionado.id}/solicitacoes/${solicitacao.id}/assumir`;
                        const response = await fetch(url, { method: 'PATCH', headers: getAuthHeaders() });

                        if (response.ok) {
                            exibirDetalhesDoVeiculo(veiculoSelecionado); 
                        } else {
                            const erro = await response.json();
                            alert(`Erro ao assumir serviço: ${erro.error || 'Erro desconhecido.'}`);
                        }
                    } catch (error) {
                        console.error('Erro ao assumir serviço:', error);
                        alert('Ocorreu um erro de conexão ao tentar assumir o serviço.');
                    }
                }
            };
            acoesCell.appendChild(btnAssumir);
        }

        // Lógica para botão "Finalizar"
        if (solicitacao.status === 'EM_ANDAMENTO' && (userRole === 'SUPER_ADMIN' || currentUserId === solicitacao.mecanico_responsavel_id)) {
            const btnFinalizar = document.createElement('button');
            btnFinalizar.className = 'btn-success';
            btnFinalizar.textContent = 'Finalizar';
            btnFinalizar.title = 'Finalizar e registrar manutenção';
            
            btnFinalizar.onclick = () => {
                abrirModalManutencao(solicitacao); // Chama a função passando os dados da solicitação
            };
            acoesCell.appendChild(btnFinalizar);
        }

        tbodySolicitacoes.appendChild(tr);
    });
};



// INÍCIO DO NOVO CÓDIGO (adicionar no final do script.js)



// --- LÓGICA DE EVENTOS PARA SOLICITAÇÕES DE MANUTENÇÃO ---



// Abre o modal para criar uma nova solicitação

if (btnAbrirModalSolicitacao) {

    btnAbrirModalSolicitacao.addEventListener('click', () => {

        formSolicitacao.reset();

        abrirModal(modalSolicitacao);

    });

}



// Lida com o envio do formulário de nova solicitação

if (formSolicitacao) {

    formSolicitacao.addEventListener('submit', async (e) => {

        e.preventDefault();

        if (!veiculoSelecionado) {

            alert('Erro: Nenhum veículo selecionado.');

            return;

        }



        const dadosSolicitacao = {

            descricao_problema: solicitacaoDescricao.value

        };



        const url = `${VEICULOS_URL}/${veiculoSelecionado.id}/solicitacoes`;



        try {

            const response = await fetch(url, {

                method: 'POST',

                headers: getAuthHeaders(),

                body: JSON.stringify(dadosSolicitacao)

            });



            if (response.ok) {

                fecharModal(modalSolicitacao);

                // Atualiza a página de detalhes para mostrar a nova solicitação na lista

                exibirDetalhesDoVeiculo(veiculoSelecionado); 

                alert('Solicitação criada com sucesso!');

            } else {

                const erro = await response.json();

                alert(`Erro ao criar solicitação: ${erro.error}`);

            }

        } catch (error) {

            console.error('Erro ao criar solicitação:', error);

            alert('Ocorreu um erro de conexão. Tente novamente.');

        }

    });

}



// Lida com o fechamento do modal de solicitação

if (modalSolicitacao) {

    const closeButton = modalSolicitacao.querySelector('.close-button');

    if (closeButton) { closeButton.addEventListener('click', () => fecharModal(modalSolicitacao)); }

    modalSolicitacao.addEventListener('click', (e) => { 

        if (e.target === modalSolicitacao) { fecharModal(modalSolicitacao); } 

    });

}



// --- LÓGICA DO SISTEMA DE NOTIFICAÇÕES ---



/**

 * Busca as notificações não lidas da API.

 */

const fetchNotificacoes = async () => {

    try {

        const response = await fetch(`${API_URL}/api/notificacoes`, { headers: getAuthHeaders() });

        if (!response.ok) {

            console.error('Falha ao buscar notificações.');

            return;

        }

        const notificacoes = await response.json();

        renderizarNotificacoes(notificacoes);

    } catch (error) {

        console.error('Erro de conexão ao buscar notificações:', error);

    }

};



/**

 * Atualiza a UI com as notificações recebidas.

 * @param {Array} notificacoes - A lista de notificações vinda da API.

 */

const renderizarNotificacoes = (notificacoes) => {

    // Atualiza o contador

    if (notificacoes.length > 0) {

        contadorNotificacoes.textContent = notificacoes.length;

        contadorNotificacoes.classList.remove('hidden');

    } else {

        contadorNotificacoes.classList.add('hidden');

    }



    // Limpa a lista atual

    listaNotificacoes.innerHTML = '';



    // Preenche a lista com as novas notificações

    if (notificacoes.length === 0) {

        const li = document.createElement('li');

        li.className = 'no-notifications';

        li.textContent = 'Nenhuma notificação nova.';

        listaNotificacoes.appendChild(li);

    } else {

        notificacoes.forEach(notificacao => {

            const li = document.createElement('li');

            const a = document.createElement('a');

            a.href = '#'; // O link real será tratado no clique

            a.textContent = notificacao.mensagem;

            a.onclick = (e) => {

                e.preventDefault();

                marcarNotificacaoComoLida(notificacao.id, notificacao.link);

            };

            li.appendChild(a);

            listaNotificacoes.appendChild(li);

        });

    }

};



/**

 * Marca uma notificação como lida e lida com o redirecionamento.

 * @param {number} notificacaoId - O ID da notificação a ser marcada como lida.

 * @param {string} link - O link para onde o usuário deve ser redirecionado.

 */

const marcarNotificacaoComoLida = async (notificacaoId, link) => {

    try {

        await fetch(`${API_URL}/api/notificacoes/${notificacaoId}/read`, {

            method: 'PATCH',

            headers: getAuthHeaders()

        });

        

        // Após marcar como lida, busca as notificações restantes para atualizar o contador

        fetchNotificacoes(); 

        

        // Esconde o painel de notificações

        painelNotificacoes.classList.add('hidden');



        // Lógica de redirecionamento futuro (ainda a ser implementada com mais detalhes)

        alert(`Notificação marcada como lida. A navegação para o link (${link}) será implementada a seguir.`);



    } catch (error) {

        console.error('Erro ao marcar notificação como lida:', error);

    }

};



// Event listener para o botão de sino, para abrir/fechar o painel

// Event listener para o botão de sino

if (btnNotificacoes) {

    btnNotificacoes.addEventListener('click', (e) => {

        e.preventDefault();

        e.stopPropagation();

        

        // ALTERAÇÃO: Em vez de usar classes, vamos controlar o estilo diretamente.

        // O CSS para .notifications-panel define 'display: flex', então usamos isso para mostrar.

        if (painelNotificacoes.style.display === 'flex') {

            painelNotificacoes.style.display = 'none';

        } else {

            painelNotificacoes.style.display = 'flex';

        }

    });

}



// Fecha o painel de notificações se clicar fora dele

document.addEventListener('click', (e) => {

    // ALTERAÇÃO: A verificação agora usa o estilo 'display' em vez da classe 'hidden'

    if (painelNotificacoes && painelNotificacoes.style.display === 'flex') {

        if (!painelNotificacoes.contains(e.target) && !btnNotificacoes.contains(e.target)) {

            painelNotificacoes.style.display = 'none';

        }

    }

});



// FIM DO NOVO CÓDIGO


// =================================================================
// --- LÓGICA DA PÁGINA DE NOTIFICAÇÕES (FASE 2) ---
// =================================================================

/**
 * Orquestrador principal: busca os dados e chama a função de renderização.
 */
const carregarPaginaNotificacoes = async () => {
    const container = document.getElementById('container-todas-notificacoes');
    if (!container) return;

    container.innerHTML = '<p>Carregando notificações...</p>';

    try {
        // Faz a chamada para o NOVO endpoint que busca TODAS as notificações
        const response = await fetch(`${API_URL}/api/notificacoes/todas`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Falha ao buscar notificações.');
        }
        const notificacoes = await response.json();
        renderizarPaginaNotificacoes(notificacoes);

    } catch (error) {
        console.error('Erro ao carregar página de notificações:', error);
        container.innerHTML = '<p class="error-message">Não foi possível carregar as notificações. Tente novamente mais tarde.</p>';
    }
};

/**
 * Renderiza a lista de notificações na página.
 * @param {Array} notificacoes - A lista de notificações vinda do backend.
 */
const renderizarPaginaNotificacoes = (notificacoes) => {
    const container = document.getElementById('container-todas-notificacoes');
    if (!container) return;

    container.innerHTML = ''; // Limpa o container

    if (notificacoes.length === 0) {
        container.innerHTML = '<p>Nenhuma notificação encontrada.</p>';
        return;
    }

    notificacoes.forEach(notificacao => {
        const item = document.createElement('div');
        item.className = 'notification-item';
        // Adiciona uma classe especial se a notificação já foi lida
        if (notificacao.lida) {
            item.classList.add('notificacao-lida');
        }

        const dataFormatada = new Date(notificacao.created_at).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        item.innerHTML = `
            <div class="notification-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <div class="notification-content">
                <p class="notification-message">${notificacao.mensagem}</p>
                <span class="notification-timestamp">${dataFormatada}</span>
            </div>
        `;

        // Adiciona o evento de clique para navegar
        item.addEventListener('click', () => navegarParaNotificacao(notificacao));

        container.appendChild(item);
    });
};

/**
 * Lida com o clique em uma notificação: marca como lida e navega.
 * @param {object} notificacao - O objeto da notificação clicada.
 */
const navegarParaNotificacao = async (notificacao) => {
    try {
        // Passo 1: Marca a notificação como lida no backend (mesmo que já esteja)
        await fetch(`${API_URL}/api/notificacoes/${notificacao.id}/read`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        // Atualiza a contagem de notificações no sino em tempo real
        fetchNotificacoes();

        // Passo 2: Analisa o link para extrair o ID do veículo
        const linkParts = notificacao.link.split('/'); // Ex: "/veiculo/2" se torna ["", "veiculo", "2"]
        if (linkParts[1] === 'veiculo' && linkParts[2]) {
            const veiculoId = parseInt(linkParts[2], 10);
            
            // Passo 3: Encontra o objeto completo do veículo na lista que já temos em memória
            const veiculoAlvo = todosOsVeiculos.find(v => v.id === veiculoId);
            
            if (veiculoAlvo) {
                // Passo 4: Usa a função existente para navegar até a página de detalhes
                exibirDetalhesDoVeiculo(veiculoAlvo);
            } else {
                console.error(`Veículo com ID ${veiculoId} não encontrado na lista local.`);
                // Se não encontrar, como fallback, recarregamos a lista e tentamos de novo
                await fetchVeiculos();
                const veiculoAtualizado = todosOsVeiculos.find(v => v.id === veiculoId);
                if(veiculoAtualizado) exibirDetalhesDoVeiculo(veiculoAtualizado);
            }
        }
    } catch (error) {
        console.error('Erro ao processar clique na notificação:', error);
        alert('Ocorreu um erro ao processar a notificação.');
    }
};

// =================================================================
// --- FIM DA LÓGICA DA PÁGINA DE NOTIFICAÇÕES ---
// =================================================================


// =================================================================
// --- LÓGICA DO DASHBOARD (FASE 5) ---
// =================================================================

// SUBSTITUA A FUNÇÃO carregarResumoDocumentos
const carregarResumoDocumentos = async () => {
    const container = document.getElementById('dashboard-documentos-content');
    if (!container) return;
    container.innerHTML = '<p>Carregando resumo...</p>';
    try {
        const response = await fetch(`${API_URL}/api/documentos/resumo`, { headers: getAuthHeaders() });
        if (!response.ok) {
            if (response.status === 403) throw new Error('Acesso não autorizado.');
            throw new Error('Falha ao buscar resumo de documentos.');
        }
        const data = await response.json();

        // --- HTML ESTRUTURADO ---
        container.innerHTML = `
            <div class="dashboard-counts">
                <div><span>Total:</span> <strong>${data.total}</strong></div>
                <div><span>Vencidos:</span> <strong class="text-danger">${data.vencidos}</strong></div>
                <div><span>A Vencer (30d):</span> <strong class="text-warning">${data.aVencer30d}</strong></div>
            </div>
            <h4>Próximos Vencimentos:</h4>
            ${data.proximosVencimentos.length > 0 ? `
                <ul class="dashboard-list clickable-list">
                    ${data.proximosVencimentos.map(doc => `
                        <li>
                            <a href="#" data-doc-id="${doc.id}">
                                ${doc.nome} 
                                <span class="list-date">(${new Date(doc.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})</span>
                            </a>
                        </li>`).join('')}
                </ul>` : '<p>Nenhum documento a vencer nos próximos dias.</p>'}
        `;
    } catch (error) {
        console.error('Erro ao carregar resumo de documentos:', error);
        container.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
};

// SUBSTITUA A FUNÇÃO carregarResumoFrota
const carregarResumoFrota = async () => {
    const container = document.getElementById('dashboard-frota-content');
    if (!container) return;
    container.innerHTML = '<p>Carregando resumo...</p>';
    try {
        const response = await fetch(`${API_URL}/api/veiculos/resumo`, { headers: getAuthHeaders() });
        if (!response.ok) {
            if (response.status === 403) throw new Error('Acesso não autorizado.');
            throw new Error('Falha ao buscar resumo da frota.');
        }
        const data = await response.json();

        // --- HTML ESTRUTURADO ---
        container.innerHTML = `
            <div class="dashboard-counts">
                <div><span>Total:</span> <strong>${data.totalVeiculos}</strong></div>
                <div><span>Alerta Manut.:</span> <strong class="text-warning">${data.manutencaoAlerta}</strong></div>
                <div><span>Vencido Manut.:</span> <strong class="text-danger">${data.manutencaoVencida}</strong></div>
                <div><span>Solic. Abertas:</span> <strong>${data.solicitacoesAbertas}</strong></div>
            </div>
            <h4>Veículos c/ Atenção:</h4>
             ${data.veiculosComAtencao.length > 0 ? `
                <ul class="dashboard-list clickable-list">
                    ${data.veiculosComAtencao.map(v => `
                        <li>
                            <a href="#" data-veiculo-id="${v.id}">
                                ${v.modelo} (${v.placa}) 
                                <span class="list-status ${v.status.toLowerCase().replace(/\s+/g, '-')}"> - ${v.status}</span>
                            </a>
                        </li>`).join('')}
                </ul>` : '<p>Nenhum veículo requer atenção imediata.</p>'}
        `;
    } catch (error) {
        console.error('Erro ao carregar resumo da frota:', error);
        container.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
};

/**
 * Função chamada quando a view do dashboard é ativada.
 */
const carregarDashboard = () => {
    carregarResumoDocumentos();
    carregarResumoFrota();
};


    verificarLogin();

})
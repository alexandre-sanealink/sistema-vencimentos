document.addEventListener('DOMContentLoaded', () => {
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
    
    // Documentos
    const tbodyDocumentos = document.getElementById('tbody-documentos');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const inputBusca = document.getElementById('input-busca');
    const btnAbrirModalCadastro = document.getElementById('btn-abrir-modal-cadastro');
    const listaContainer = document.querySelector('.lista-container');
    const paginationContainer = document.getElementById('pagination-container');
    const pageInfo = document.getElementById('page-info');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProxima = document.getElementById('btn-proxima');
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
    // --- NOVO: Referências para Detalhes do Veículo ---
    const contentVeiculoDetalhes = document.getElementById('content-veiculo-detalhes');
    const detalhesVeiculoTitulo = document.getElementById('detalhes-veiculo-titulo');
    const btnVoltarParaFrota = document.getElementById('btn-voltar-para-frota');
    // --- NOVO: Referências para o Plano de Manutenção ---
    const tbodyPlanos = document.getElementById('tbody-planos');
    const formPlanoManutencao = document.getElementById('form-plano-manutencao');
    const planoDescricao = document.getElementById('plano-descricao');
    const planoKm = document.getElementById('plano-km');
    const planoMeses = document.getElementById('plano-meses');

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
    const abrirModal = (modalElement) => modalElement.classList.add('visible');
    const fecharModal = (modalElement) => modalElement.classList.remove('visible');

    const switchView = (targetId) => {
        contentModules.forEach(module => module.classList.add('hidden'));
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.remove('hidden');
    
        // Lógica para manter o menu principal ativo corretamente
        let activeModuleName = '';
        if (targetId.startsWith('content-')) {
        activeModuleName = targetId.split('-')[1];
        }
        // Caso especial: se estamos na página de detalhes, o módulo ativo ainda é 'frota'
        if (targetId === 'content-veiculo-detalhes') {
        activeModuleName = 'frota';
        }

        if (activeModuleName) {
        navLinks.forEach(link => link.classList.toggle('active', link.id === `nav-${activeModuleName}`));
        mobileNavLinks.forEach(link => link.classList.toggle('active', link.id === `mobile-nav-${activeModuleName}`));
        }
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

    const toggleMobileMenu = () => {
        sidebar.classList.toggle('sidebar-visible');
        menuOverlay.classList.toggle('visible');
    };

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

    const verificarLogin = () => {
        const token = obterToken();
        const userInfo = localStorage.getItem('userInfo');
        if (token && userInfo) {
            const { usuario } = JSON.parse(userInfo);
            telaLogin.classList.add('hidden');
            appContainer.classList.remove('hidden');
            const perfilLinkText = btnAbrirPerfil.querySelector('.nav-text');
            if (perfilLinkText) perfilLinkText.textContent = `${usuario.nome || usuario.email}`;
            if (liAdminPanel) {
                if (usuario.email === ADMIN_EMAIL) {
                    liAdminPanel.classList.remove('hidden');
                    mobileBtnAdmin.classList.remove('hidden');
                } else {
                    liAdminPanel.classList.add('hidden');
                    mobileBtnAdmin.classList.add('hidden');
                }
            }
            fetchDocumentos();
            fetchVeiculos();
            switchView('content-documentos');
        } else {
            telaLogin.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    };

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
                abrirModal(modalDocumento);
            };
            acoesCell.appendChild(btnEditar);
            tbodyDocumentos.appendChild(tr);
        });
    };

    const exibirDetalhesDoVeiculo = async (veiculo) => {
    veiculoSelecionado = veiculo;
    detalhesVeiculoTitulo.textContent = `Detalhes: ${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}`;
    switchView('content-veiculo-detalhes');

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

    // Busca e renderiza o histórico de ABASTECIMENTOS
    try {
        const resAbastecimentos = await fetch(`${VEICULOS_URL}/${veiculo.id}/abastecimentos`, { headers: getAuthHeaders() });
        if (!resAbastecimentos.ok) throw new Error('Falha ao buscar abastecimentos');
        const abastecimentos = await resAbastecimentos.json();
        renderizarTabelaAbastecimentos(abastecimentos);
    } catch (error) {
        console.error('Erro ao buscar abastecimentos:', error);
        tbodyAbastecimentos.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar histórico.</td></tr>`;
    }

    // Busca e renderiza o PLANO DE MANUTENÇÃO
    try {
        const resPlanos = await fetch(`${VEICULOS_URL}/${veiculo.id}/planos`, { headers: getAuthHeaders() });
        if (!resPlanos.ok) throw new Error('Falha ao buscar plano de manutenção');
        const planos = await resPlanos.json();
        renderizarTabelaPlanos(planos);
    } catch (error) {
        console.error('Erro ao buscar plano de manutenção:', error);
        tbodyPlanos.innerHTML = `<tr><td colspan="4" style="text-align:center;">Erro ao carregar plano.</td></tr>`;
    }
};

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
const renderizarTabelaManutencoes = (manutencoes) => {
    if (!tbodyManutencoes) return;
    tbodyManutencoes.innerHTML = '';

    if (!manutencoes || manutencoes.length === 0) {
        tbodyManutencoes.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum registro de manutenção encontrado.</td></tr>`;
        return;
    }

    const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    manutencoes.forEach(m => {
        const tr = document.createElement('tr');
        
        // LÓGICA ATUALIZADA PARA EXIBIR O TIPO (PEÇA/SERVIÇO) DE CADA ITEM
        const pecasTexto = Array.isArray(m.pecas) && m.pecas.length > 0
            ? m.pecas.map(p => {
                // Verifica se o item é um Serviço
                if (p.tipo === 'Servico') {
                    // Retorna um formato mais simples para serviços
                    return `<span class="item-tipo-servico">[Serviço]</span> ${p.descricao}`;
                }
                
                // Se não for serviço, trata como Peça (incluindo dados antigos que não tinham o campo 'tipo')
                const quantidade = p.quantidade || 1;
                const marca = p.marca ? `(${p.marca})` : '';
                return `<span class="item-tipo-peca">[Peça]</span> ${quantidade}x ${p.descricao} ${marca}`;

            }).join('<br>')
            : '-';

        tr.innerHTML = `
            <td>${formatarData(m.data)}</td>
            <td>${m.tipo}</td>
            <td>${m.km_atual}</td>
            <td>${pecasTexto}</td>
            <td></td> 
        `;

        const acoesCell = tr.children[4];

        const btnDeletar = document.createElement('button');
        btnDeletar.className = 'btn-deletar';
        btnDeletar.title = 'Excluir Registro de Manutenção';
        btnDeletar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
        
        btnDeletar.onclick = async () => {
            if (confirm(`Tem certeza que deseja excluir o registro de manutenção do dia ${formatarData(m.data)}?`)) {
                try {
                    const response = await fetch(`${VEICULOS_URL}/${veiculoSelecionado.id}/manutencoes/${m.id}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    if (response.ok) {
                        exibirDetalhesDoVeiculo(veiculoSelecionado); 
                    } else {
                        const erro = await response.json();
                        alert(`Erro ao excluir registro: ${erro.error || 'Erro desconhecido'}`);
                    }
                } catch (error) {
                    console.error('Erro ao deletar manutenção:', error);
                    alert('Ocorreu um erro de conexão ao tentar excluir.');
                }
            }
        };

        acoesCell.appendChild(btnDeletar);
        tbodyManutencoes.appendChild(tr);
    });
};
// FIM DO CÓDIGO PARA SUBSTITUIR

const abrirModalManutencao = () => {
    if (!veiculoSelecionado) return;
    formManutencao.reset();
    manutencaoId.value = '';
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
        ' indefinido': 'em-dia' // Fallback para status não reconhecido
    };

    planos.forEach(plano => {
        const tr = document.createElement('tr');
        
        // --- CORREÇÃO DO STATUS APLICADA AQUI ---
        const statusTexto = plano.status || ' indefinido'; // Garante que não seja "undefined"
        const statusClasse = mapaDeStatusParaClasse[statusTexto] || 'em-dia';

        tr.innerHTML = `
            <td>${plano.descricao}</td>
            <td>${plano.intervalo_km || '-'}</td>
            <td>${plano.intervalo_meses || '-'}</td>
            <td><span class="status-span status-${statusClasse}">${statusTexto}</span></td>
            <td></td>
        `;

        // --- CORREÇÃO DA LIXEIRA APLICADA AQUI ---
        const acoesCell = tr.children[4]; // A célula de ações é a 5ª (índice 4)
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
                        exibirDetalhesDoVeiculo(veiculoSelecionado); // Atualiza a tela de detalhes
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
    
    btnLogout.addEventListener('click', acoesDeUsuario.fazerLogout);
    mobileBtnLogout.addEventListener('click', acoesDeUsuario.fazerLogout);
    
    if (btnAbrirModalCadastro) btnAbrirModalCadastro.addEventListener('click', () => {
        formDocumento.reset();
        docId.value = '';
        modalTitulo.textContent = 'Cadastrar Novo Documento';
        anexoAtualContainer.classList.add('hidden');
        docFileName.textContent = 'Nenhum arquivo escolhido';
        abrirModal(modalDocumento);
    });

    btnAdminPanel.addEventListener('click', acoesDeUsuario.abrirAdmin);
    mobileBtnAdmin.addEventListener('click', acoesDeUsuario.abrirAdmin);
    
    btnAbrirPerfil.addEventListener('click', acoesDeUsuario.abrirPerfil);
    mobileBtnPerfil.addEventListener('click', acoesDeUsuario.abrirPerfil);

    [modalDocumento, modalAdmin, modalPerfil, modalVeiculo, modalManutencao, modalAbastecimento].forEach(m => {        if(m) {
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

// INÍCIO DO CÓDIGO PARA SUBSTITUIR
if (formManutencao) {
    formManutencao.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!veiculoSelecionado) return;

        // Coleta os dados de todas as linhas de peças/serviços dinâmicas
        const pecas = [];
        const pecaItems = document.querySelectorAll('.peca-item');
        
        pecaItems.forEach(item => {
            const tipo = item.querySelector('.peca-input-tipo').value;
            const descricao = item.querySelector('.peca-input-desc').value;

            if (descricao) { // Só adiciona o item se a descrição for preenchida
                const itemManutencao = {
                    tipo: tipo,
                    descricao: descricao,
                    quantidade: null, // Garante que os campos existam
                    marca: null
                };

                // Apenas popula a quantidade e a marca se o tipo for 'Peca'
                if (tipo === 'Peca') {
                    itemManutencao.quantidade = item.querySelector('.peca-input-qtd').value;
                    itemManutencao.marca = item.querySelector('.peca-input-marca').value || null;
                }
                
                pecas.push(itemManutencao);
            }
        });

        const dadosManutencao = {
            data: manutencaoData.value,
            tipo: manutencaoTipo.value,
            km_atual: manutencaoKm.value,
            pecas: pecas, 
        };

        const url = `${VEICULOS_URL}/${veiculoSelecionado.id}/manutencoes`;
        const method = 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(dadosManutencao)
            });

            if (response.ok) {
                fecharModal(modalManutencao);
                exibirDetalhesDoVeiculo(veiculoSelecionado); 
            } else {
                const erro = await response.json();
                alert(`Erro ao salvar registro: ${erro.error}`);
            }
        } catch (error) {
            console.error('Erro ao salvar manutenção:', error);
            alert('Ocorreu um erro de conexão. Tente novamente.');
        }
    });
}
// FIM DO CÓDIGO PARA SUBSTITUIR

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

        if (formManutencao) {
            formManutencao.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!veiculoSelecionado) return;

        const dadosManutencao = {
            data: manutencaoData.value,
            tipo: manutencaoTipo.value,
            km_atual: manutencaoKm.value,
            pecas: manutencaoPecas.value,
            // Campos futuros: tempo_gasto, eficiencia
        };

        const url = `${VEICULOS_URL}/${veiculoSelecionado.id}/manutencoes`;
        const method = 'POST'; // Futuramente teremos 'PUT' para edição

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(dadosManutencao)
            });

            if (response.ok) {
                fecharModal(modalManutencao);
                // Atualiza a lista de manutenções na tela
                exibirDetalhesDoVeiculo(veiculoSelecionado); 
            } else {
                const erro = await response.json();
                alert(`Erro ao salvar registro: ${erro.error}`);
            }
        } catch (error) {
            console.error('Erro ao salvar manutenção:', error);
            alert('Ocorreu um erro de conexão. Tente novamente.');
        }
    });
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

    // --- NOVO: Event Listener para o Formulário do Plano de Manutenção ---
if (formPlanoManutencao) {
    formPlanoManutencao.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!veiculoSelecionado) return;

        // Validação para garantir que pelo menos um intervalo foi preenchido
        if (!planoKm.value && !planoMeses.value) {
            alert('Por favor, preencha pelo menos um intervalo (KM ou Meses).');
            return;
        }

        const dadosPlano = {
            descricao: planoDescricao.value,
            intervalo_km: planoKm.value || null,
            intervalo_meses: planoMeses.value || null,
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
                exibirDetalhesDoVeiculo(veiculoSelecionado); // Atualiza toda a página de detalhes
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

    verificarLogin();
});
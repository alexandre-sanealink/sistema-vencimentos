document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost:3000';
    const DOCS_URL = `${API_URL}/api/documentos`;

    // --- VARIÁVEIS GLOBAIS DE ESTADO ---
    let todosOsDocumentos = [];
    let filtroCategoriaAtual = 'todos';
    let termoDeBusca = '';

    // --- ELEMENTOS DO DOM ---
    const formPrincipal = document.getElementById('form-documento');
    const tbody = document.getElementById('tbody-documentos');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const inputBusca = document.getElementById('input-busca');
    const inputFilePrincipal = document.getElementById('arquivo');
    const fileNamePrincipal = document.getElementById('file-name-principal');

    const modal = document.getElementById('modal-edicao');
    const formEdicao = document.getElementById('form-edicao');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
    const hiddenEditId = document.getElementById('edit-id');
    const editNome = document.getElementById('edit-nome');
    const editCategoria = document.getElementById('edit-categoria');
    const editVencimento = document.getElementById('edit-vencimento');
    const editAlerta = document.getElementById('edit-alerta');
    const editArquivo = document.getElementById('edit-arquivo');
    const spanAnexoAtual = document.getElementById('anexo-atual');
    const fileNameEdicao = document.getElementById('file-name-edicao');

    // --- FUNÇÕES DE LÓGICA E RENDERIZAÇÃO ---
    // ... (todas as funções de renderização e API continuam as mesmas) ...

    // --- EVENT LISTENERS ---
    
    // NOVO: Listeners para exibir nome do arquivo selecionado
    inputFilePrincipal.addEventListener('change', () => {
        fileNamePrincipal.textContent = inputFilePrincipal.files.length > 0 ? inputFilePrincipal.files[0].name : 'Nenhum arquivo escolhido';
    });

    editArquivo.addEventListener('change', () => {
        fileNameEdicao.textContent = editArquivo.files.length > 0 ? editArquivo.files[0].name : 'Nenhum arquivo novo';
    });

    // Listener do formulário principal
    formPrincipal.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        // ... (resto da lógica de submit)
        cadastrarDocumento(formData);
        // Reseta o nome do arquivo após o envio
        fileNamePrincipal.textContent = 'Nenhum arquivo escolhido';
    });

    // Listener do modal
    const fecharModalEdicao = () => {
        modal.classList.remove('visible');
        formEdicao.reset();
        // Reseta o nome do arquivo no modal ao fechar
        fileNameEdicao.textContent = 'Nenhum arquivo novo';
    };

    // ... (Restante dos listeners e funções)
    
    // #region CÓDIGO COMPLETO (sem alterações nas outras funções)
    const formatarDataParaInput = (dataISO) => (dataISO ? dataISO.split('T')[0] : '');
    const formatarDataParaExibicao = (dataISO) => {
        if (!dataISO) return 'N/A';
        const [ano, mes, dia] = dataISO.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    };
    const tdHelper = (tr, content) => {
        const cell = document.createElement('td');
        cell.textContent = content;
        tr.appendChild(cell);
        return cell;
    };
    const aplicarFiltrosEBusca = () => {
        let documentosParaExibir = [...todosOsDocumentos];
        if (filtroCategoriaAtual !== 'todos') {
            documentosParaExibir = documentosParaExibir.filter(doc => doc.categoria === filtroCategoriaAtual);
        }
        if (termoDeBusca.length > 0) {
            documentosParaExibir = documentosParaExibir.filter(doc =>
                doc.nome.toLowerCase().includes(termoDeBusca.toLowerCase())
            );
        }
        renderizarTabela(documentosParaExibir);
    };
    const renderizarTabela = (documentos) => {
        tbody.innerHTML = '';
        if (documentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum documento encontrado.</td></tr>`;
            return;
        }
        documentos.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
        documentos.forEach(doc => {
            const tr = document.createElement('tr');
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
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
            const tdAnexo = tdHelper(tr, '');
            if (doc.nomeArquivo) {
                const linkAnexo = document.createElement('a');
                linkAnexo.href = `${API_URL}/uploads/${doc.nomeArquivo}`;
                linkAnexo.textContent = 'Ver Anexo';
                linkAnexo.target = '_blank';
                tdAnexo.appendChild(linkAnexo);
            } else { tdAnexo.textContent = 'N/A'; }
            const tdAcoes = tdHelper(tr, '');
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'btn-editar';
            btnEditar.onclick = () => abrirModalEdicao(doc);
            tdAcoes.appendChild(btnEditar);
            tbody.appendChild(tr);
        });
    };
    const abrirModalEdicao = (doc) => {
        hiddenEditId.value = doc.id;
        editNome.value = doc.nome;
        editCategoria.value = doc.categoria || '';
        editVencimento.value = formatarDataParaInput(doc.dataVencimento);
        editAlerta.value = doc.diasAlerta;
        spanAnexoAtual.textContent = doc.nomeArquivo ? `Anexo atual: ${doc.nomeArquivo}` : '';
        fileNameEdicao.textContent = 'Nenhum arquivo novo';
        modal.classList.add('visible');
    };
    const fetchDocumentos = async () => {
        try {
            const response = await fetch(DOCS_URL);
            if (!response.ok) throw new Error('Falha na resposta da rede');
            todosOsDocumentos = await response.json();
            aplicarFiltrosEBusca();
        } catch (error) {
            console.error('Erro ao buscar documentos:', error);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Erro ao carregar dados.</td></tr>`;
        }
    };
    const cadastrarDocumento = async (formData) => {
        try {
            const response = await fetch(DOCS_URL, { method: 'POST', body: formData });
            if (response.ok) {
                formPrincipal.reset();
                fetchDocumentos();
            } else { alert('Erro ao cadastrar documento.'); }
        } catch (error) { console.error('Erro ao cadastrar documento:', error); }
    };
    const atualizarDocumento = async (id, formData) => {
        try {
            const response = await fetch(`${DOCS_URL}/${id}`, { method: 'PUT', body: formData });
            if (response.ok) {
                fecharModalEdicao();
                fetchDocumentos();
            } else { alert('Erro ao atualizar documento.'); }
        } catch (error) { console.error('Erro ao atualizar documento:', error); }
    };
    formPrincipal.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('nome', document.getElementById('nome').value);
        formData.append('categoria', document.getElementById('categoria').value);
        formData.append('dataVencimento', document.getElementById('vencimento').value);
        formData.append('diasAlerta', document.getElementById('alerta').value);
        if (inputFilePrincipal.files.length > 0) formData.append('arquivo', inputFilePrincipal.files[0]);
        cadastrarDocumento(formData);
    });
    formEdicao.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = hiddenEditId.value;
        const formData = new FormData();
        formData.append('nome', editNome.value);
        formData.append('categoria', editCategoria.value);
        formData.append('dataVencimento', editVencimento.value);
        formData.append('diasAlerta', editAlerta.value);
        if (editArquivo.files.length > 0) formData.append('arquivo', editArquivo.files[0]);
        atualizarDocumento(id, formData);
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
    fetchDocumentos();
    // #endregion
});
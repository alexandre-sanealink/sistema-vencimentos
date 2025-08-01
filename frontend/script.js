document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '';
    const DOCS_URL = `${API_URL}/api/documentos`;

    let todosOsDocumentos = [];
    let filtroCategoriaAtual = 'todos';
    let termoDeBusca = '';

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

    const formatarDataParaInput = (dataISO) => (dataISO ? dataISO.split('T')[0] : '');
    const formatarDataParaExibicao = (dataISO) => {
        if (!dataISO) return 'N/A';
        const [ano, mes, dia] = dataISO.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    };
    const tdHelper = (tr, content) => {
        const cell = document.createElement('td');
        cell.textContent = content; tr.appendChild(cell); return cell;
    };

    const aplicarFiltrosEBusca = () => {
        let docs = [...todosOsDocumentos];
        if (filtroCategoriaAtual !== 'todos') docs = docs.filter(d => d.categoria === filtroCategoriaAtual);
        if (termoDeBusca.length > 0) docs = docs.filter(d => d.nome.toLowerCase().includes(termoDeBusca.toLowerCase()));
        renderizarTabela(docs);
    };

    const renderizarTabela = (documentos) => {
        tbody.innerHTML = '';
        if (documentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum documento encontrado.</td></tr>`;
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
        modal.classList.add('visible');
    };
    const fecharModalEdicao = () => {
        modal.classList.remove('visible');
        formEdicao.reset();
    };

    const fetchDocumentos = async () => { /* ...código sem alteração... */ };
    const cadastrarDocumento = async (doc) => { /* ...código sem alteração... */ };
    const atualizarDocumento = async (id, doc) => { /* ...código sem alteração... */ };
    // #region Funções API
    fetchDocumentos = async () => {
        try {
            const response = await fetch(DOCS_URL);
            if (!response.ok) throw new Error('Falha na resposta da rede');
            todosOsDocumentos = await response.json();
            aplicarFiltrosEBusca();
        } catch (error) {
            console.error('Erro ao buscar documentos:', error);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar dados.</td></tr>`;
        }
    };
    cadastrarDocumento = async (doc) => {
        try {
            const response = await fetch(DOCS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doc),
            });
            if (response.ok) {
                formPrincipal.reset();
                fetchDocumentos();
            } else { alert('Erro ao cadastrar documento.'); }
        } catch (error) { console.error('Erro ao cadastrar documento:', error); }
    };
    atualizarDocumento = async (id, doc) => {
        try {
            const response = await fetch(`${DOCS_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doc),
            });
            if (response.ok) {
                fecharModalEdicao();
                fetchDocumentos();
            } else { alert('Erro ao atualizar documento.'); }
        } catch (error) { console.error('Erro ao atualizar documento:', error); }
    };
    // #endregion

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

    fetchDocumentos();
});
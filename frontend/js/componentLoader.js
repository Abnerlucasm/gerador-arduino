async function carregarComponente(url, elementId) {
    try {
        console.log(`Tentando carregar ${url} para ${elementId}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = data;
            console.log(`Componente ${url} carregado com sucesso`);
        } else {
            console.error(`Elemento com id ${elementId} não encontrado`);
        }
    } catch (error) {
        console.error(`Erro ao carregar componente ${url}:`, error);
    }
}

async function appendComponente(url) {
    try {
        console.log(`Tentando adicionar ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        document.body.insertAdjacentHTML('beforeend', data);
        console.log(`Componente ${url} adicionado com sucesso`);
    } catch (error) {
        console.error(`Erro ao adicionar componente ${url}:`, error);
    }
}

export async function carregarComponentes() {
    console.log('Iniciando carregamento dos componentes');
    
    // const basePath = getBasePath();
    // console.log('Base path:', basePath);
    
    const componentes = [
        { url: '/frontend/componentes/grid.html', id: 'grid-placeholder' },
        { url: '/frontend/componentes/toggleButton.html', id: 'btnOnOff' },
        { url: '/frontend/componentes/toggleButton.html', id: 'btnReiniciar' },
        { url: '/frontend/componentes/toggleButton.html', id: 'btnManualAuto' }
    ];

    try {
        for (const componente of componentes) {
            const fullUrl = componente.url;
            console.log(`Tentando carregar: ${fullUrl}`);
            if (componente.append) {
                await appendComponente(fullUrl);
            } else {
                await carregarComponente(fullUrl, componente.id);
            }

        }
        console.log('Todos os componentes foram carregados com sucesso');
    } catch (erro) {
        console.error('Erro ao carregar componentes:', erro);
    }
}

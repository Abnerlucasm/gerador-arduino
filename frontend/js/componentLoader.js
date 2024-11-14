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
            if (!element.hasChildNodes()) {
                element.innerHTML = data;
            }
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
    
    const componentes = [
        { url: '/frontend/componentes/grid.html', id: 'grid-placeholder' }
    ];

    try {
        for (const componente of componentes) {
            const fullUrl = componente.url;
            console.log(`Tentando carregar: ${fullUrl}`);
            await carregarComponente(fullUrl, componente.id);
        }
        
        adicionarEventListeners();
        
        console.log('Todos os componentes foram carregados com sucesso');
    } catch (erro) {
        console.error('Erro ao carregar componentes:', erro);
    }
}

function adicionarEventListeners() {
    const toggleOnOff = document.getElementById('toggleOnOff');
    if (toggleOnOff) {
        toggleOnOff.addEventListener('change', function() {
            const comando = this.checked ? 'ligar' : 'desligar';
    
        });
    }

    const toggleReiniciar = document.getElementById('toggleReiniciar');
    if (toggleReiniciar) {
        toggleReiniciar.addEventListener('change', function() {
            if (this.checked) {
                setTimeout(() => {
                    this.checked = false;
                }, 1000);
            }
        });
    }

    const toggleManualAuto = document.getElementById('toggleManualAuto');
    if (toggleManualAuto) {
        toggleManualAuto.addEventListener('change', function() {
            const comando = this.checked ? 'auto' : 'manual';
            enviarModo(comando); 
        });
    }

    const toggleModo = document.getElementById('toggleModo');
    if (toggleModo) {
        toggleModo.addEventListener('change', function() {
            const comando = this.checked ? 'modoAtivo' : 'modoInativo';
            enviarModo(comando); 
        });
    }

    // Listeners para os toggles da grid
    const toggles = {
        'toggleChaveRua': 'chaveRua',
        'toggleChaveGerador': 'chaveGerador',
        'toggleMonitorRua': 'monitorRua',
        'toggleMonitorGerador': 'monitorGerador',
        'toggleChaveCombustivel': 'chaveCombustivel',
        'toggleChavePartida': 'chavePartida'
    };

    Object.entries(toggles).forEach(([toggleId, statusId]) => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.addEventListener('change', function() {
                const comando = this.checked ? 'ligar' : 'desligar';
                atualizarStatus(statusId, this.checked);
                
                // Enviar o contato ou partida conforme o toggle
                if (statusId.startsWith('chave')) {
                    enviarContato(statusId, this.checked);
                } else if (statusId.startsWith('monitor')) {
                    enviarContato(statusId, this.checked);
                }
                
                // Verifica se é a chave de partida e chama a função correspondente
                if (statusId === 'chavePartida') {
                    enviarPartida(statusId, this.checked);
                }
            });
        }
    });
}

// Função genérica para enviar contato
async function enviarContato(statusId, isChecked) {
    let url;
    if (statusId === 'chaveRua') {
        url = `${baseUrl}/contatorua`;
    } else if (statusId === 'chaveGerador') {
        url = `${baseUrl}/contatogerador`;
    } else if (statusId === 'chaveCombustivel') {
        url = `${baseUrl}/contatocombustivel`;
    }

    if (url) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erro ao enviar contato: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`Contato enviado com sucesso: ${result}`);

        } catch (error) {
            console.error('Erro ao enviar contato:', error);
        }
    }
}

// Função genérica para enviar partida
async function enviarPartida(statusId, isChecked) {
    if (statusId === 'chavePartida') {
        const url = `${baseUrl}/partidagerador`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erro ao enviar partida: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`Partida enviada com sucesso: ${result}`);

        } catch (error) {
            console.error('Erro ao enviar partida:', error);
        }
    }
}

// Função para enviar o modo
async function enviarModo(comando) {
    const url = `${baseUrl}/modo`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ modo: comando }), 
        });

        if (!response.ok) {
            throw new Error(`Erro ao enviar modo: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Modo enviado com sucesso: ${result}`);

    } catch (error) {
        console.error('Erro ao enviar modo:', error);
    }
}

// Função para buscar o modo
async function fetchModo() {
    try {
        const response = await fetch(`${baseUrl}/modo`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar modo: ${response.statusText}`);
        }
        const result = await response.json();
        // Atualiza o toggle de auto/manual 
        const toggleManualAuto = document.getElementById('toggleManualAuto');
        if (toggleManualAuto) {
            toggleManualAuto.checked = result.modo === 'auto'; 
        }
    } catch (error) {
        console.error('Erro ao buscar modo:', error);
    }
}

// Chame fetchModo ao carregar a página para definir o estado inicial do toggle
document.addEventListener('DOMContentLoaded', fetchModo);

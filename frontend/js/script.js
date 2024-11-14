// Defina o endereço IP do Arduino e a porta
const baseUrl = 'http://192.168.1.101';  

// Função para atualizar o status visual
function atualizarStatus(elementoId, status) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        const statusText = elemento.querySelector('.status-text');
        const statusCircle = elemento.querySelector('.status-circle');

        if (status) {
            statusText.textContent = 'Ligado';
            statusCircle.style.backgroundColor = '#28a745'; // Verde
        } else {
            statusText.textContent = 'Desligado';
            statusCircle.style.backgroundColor = '#dc3545'; // Vermelho
        }
    } else {
        console.error(`Elemento com id ${elementoId} não encontrado`);
    }
}

// Função para buscar status do servidor
async function fetchStatus() {
    try {
        const response = await fetch(`${baseUrl}/status`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar status: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Atualiza o modo (manual/auto)
        const toggleManualAuto = document.getElementById('toggleManualAuto');
        if (toggleManualAuto) {
            toggleManualAuto.checked = data.modo === 1; // 1 = manual, 0 = auto
        }
        
        // Atualiza os status dos recursos
        atualizarStatus('chaveRua', data.releRua === 1);
        atualizarStatus('chaveGerador', data.releGerador === 1);
        atualizarStatus('monitorRua', data.rua === 1);
        atualizarStatus('monitorGerador', data.gerador === 1);
        
        // Atualiza os toggles para refletir o estado atual
        document.getElementById('toggleChaveRua').checked = data.releRua === 1;
        document.getElementById('toggleChaveGerador').checked = data.releGerador === 1;
        document.getElementById('toggleMonitorRua').checked = data.rua === 1;
        document.getElementById('toggleMonitorGerador').checked = data.gerador === 1;
        
    } catch (error) {
        console.error('Erro ao buscar status:', error);
    }
}

// Função para buscar o modo atual do servidor
async function fetchModo() {
    try {
        const response = await fetch(`${baseUrl}/status`);
        const data = await response.json();
        
        // Atualiza o modo (manual/auto)
        const toggleManualAuto = document.getElementById('toggleManualAuto');
        if (toggleManualAuto) {
            toggleManualAuto.checked = data.modo === 1; // 1 = manual, 0 = auto
        }
        
    } catch (error) {
        console.error('Erro ao buscar modo:', error);
    }
}

// Adiciona event listener para o toggle de modo
document.getElementById('toggleManualAuto').addEventListener('change', function() {
    enviarModo(this.checked); // Envia o estado atual do toggle (true = manual, false = auto)
});

// Inicia a atualização periódica do status (a cada 1 segundo)
setInterval(fetchStatus, 1000);

// Executa a primeira vez imediatamente
document.addEventListener('DOMContentLoaded', () => {
    fetchStatus(); // Busca o status ao carregar a página
    fetchModo();   // Busca o modo ao carregar a página
});

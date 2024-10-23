 // Defina o endereço IP do Arduino e a porta
 const baseUrl = 'http://192.168.1.102:4001';  // Atualize o IP e porta conforme necessário

 // Função para enviar comandos ao backend do Arduino
 async function sendCommand(command) {
   const url = `${baseUrl}/${command}`;
   try {
     const response = await fetch(url);
     const text = await response.text();
     document.getElementById('log').innerHTML = `Comando: ${command} - Resposta: ${text}`;
   } catch (error) {
     document.getElementById('log').innerHTML = `Erro ao enviar comando ${command}`;
   }
 }

 // Função para buscar logs do backend do Arduino
 async function fetchLogs() {
   const url = `${baseUrl}/logs`; // Endpoint para buscar logs
   try {
     const response = await fetch(url);
     const logs = await response.text();
     document.getElementById('log').innerHTML = logs; // Atualiza a área de log com as mensagens recebidas
   } catch (error) {
     console.error("Erro ao buscar logs:", error);
   }
 }

 // Atualiza os logs a cada 5 segundos
 setInterval(fetchLogs, 5000);
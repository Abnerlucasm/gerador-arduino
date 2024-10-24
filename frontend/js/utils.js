// Função para obter o caminho base
export function getBasePath() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/')) {
        // Se estamos em uma subpágina, volte dois níveis
        return '../../arduino/';
    }
    // Se estamos na raiz do projeto
    return './arduino/';
}
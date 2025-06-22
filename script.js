// Elementos do jogo
const dino = document.querySelector(".dino");
const scoreElement = document.querySelector(".score");
const gameOverElement = document.querySelector(".game-over");
const gameContainer = document.querySelector(".game-container");
const loveMessageElement = document.querySelector(".love-message");
const startScreen = document.querySelector(".start-screen");
const ground = document.querySelector(".ground");
const heartsContainer = document.querySelector(".hearts-container"); // Elemento para os corações

// Variáveis do jogo
let isJumping = false;
let isGameOver = true; // Começa como true para mostrar a tela de início
let score = 0;
let gameSpeed = 3; // Velocidade inicial (agora fixa)
let obstacles = []; // Array para armazenar múltiplos obstáculos
let animationFrameId;
let obstacleGenerationInterval;
let gameLoopInterval;

// Configurações do jogo
const DINO_BOTTOM_START = 0;
const JUMP_HEIGHT = 140;
const JUMP_SPEED = 7;

// Dimensões do Cacto
const CACTUS_WIDTH = 50;
const CACTUS_HEIGHT = 50;

// Dimensões e Posição do Pterodáctilo
const PTERODACTYL_WIDTH = 50;
const PTERODACTYL_HEIGHT = 18;
const PTERODACTYL_FLY_HEIGHTS = [20, 60, 100]; // Alturas de voo: Baixa, Média, Alta (em px do chão)

// Dimensões e Pontos do Item Coletável
const COLLECTIBLE_ITEM_WIDTH = 30; // Largura do item coletável
const COLLECTIBLE_ITEM_HEIGHT = 30; // Altura do item coletável
const COLLECTIBLE_POINTS = 50; // Pontos ganhos ao coletar

const OBSTACLE_MIN_GAP = 3000; // AUMENTADO para maior distância
const OBSTACLE_MAX_GAP = 6000; // AUMENTADO para maior distância
const SCORE_TO_WIN = 1000; // ALTERADO DE 600 PARA 1000
const COLLISION_PADDING = 20; // Ajuste este valor conforme necessário.

// Função para fazer o dinossauro pular
function jump() {
    if (isJumping || isGameOver) return;

    isJumping = true;
    let jumpHeight = DINO_BOTTOM_START;
    let jumpUp = true;

    const jumpAnimation = () => {
        if (jumpUp) {
            jumpHeight += JUMP_SPEED;
            if (jumpHeight >= JUMP_HEIGHT) {
                jumpUp = false;
            }
        } else {
            jumpHeight -= JUMP_SPEED;
            if (jumpHeight <= DINO_BOTTOM_START) {
                jumpHeight = DINO_BOTTOM_START;
                isJumping = false;
                cancelAnimationFrame(jumpAnimationId); // Para a animação quando o pulo termina
                return;
            }
        }
        dino.style.bottom = jumpHeight + "px";
        jumpAnimationId = requestAnimationFrame(jumpAnimation);
    };
    let jumpAnimationId = requestAnimationFrame(jumpAnimation);
}

// Função para criar um novo obstáculo (agora inclui item coletável)
function createObstacle() {
    if (isGameOver) return;

    const obstacle = document.createElement("div");
    let obstacleType;
    const randomValue = Math.random();

    if (randomValue < 0.6) { // 60% chance de cacto
        obstacleType = 'cactus';
    } else if (randomValue < 0.9) { // 30% chance de pterodáctilo (0.6 a 0.9)
        obstacleType = 'pterodactyl';
    } else { // 10% chance de item coletável (0.9 a 1.0)
        obstacleType = 'collectible';
    }
    
    let currentObstacleWidth; 

    if (obstacleType === 'cactus') {
        obstacle.classList.add("obstacle"); // Classe para cacto
        obstacle.style.height = CACTUS_HEIGHT + "px";
        obstacle.style.width = CACTUS_WIDTH + "px";
        obstacle.style.bottom = DINO_BOTTOM_START + "px"; // Cacto sempre no chão
        obstacle.dataset.type = 'cactus'; 
        currentObstacleWidth = CACTUS_WIDTH;
    } else if (obstacleType === 'pterodactyl') {
        obstacle.classList.add("pterodactyl"); 
        obstacle.style.height = PTERODACTYL_HEIGHT + "px";
        obstacle.style.width = PTERODACTYL_WIDTH + "px";
        // Escolhe uma altura de voo aleatória para o pterodáctilo
        const randomHeightIndex = Math.floor(Math.random() * PTERODACTYL_FLY_HEIGHTS.length);
        obstacle.style.bottom = PTERODACTYL_FLY_HEIGHTS[randomHeightIndex] + "px"; 
        obstacle.dataset.type = 'pterodactyl'; 
        currentObstacleWidth = PTERODACTYL_WIDTH;
    } else { // collectible
        obstacle.classList.add("collectible-item"); // Nova classe para item coletável
        obstacle.style.height = COLLECTIBLE_ITEM_HEIGHT + "px";
        obstacle.style.width = COLLECTIBLE_ITEM_WIDTH + "px";
        obstacle.style.bottom = DINO_BOTTOM_START + 20 + "px"; // Altura fixa para o item coletável
        obstacle.dataset.type = 'collectible';
        currentObstacleWidth = COLLECTIBLE_ITEM_WIDTH;
    }
    
    obstacle.style.right = -currentObstacleWidth + "px"; 
    gameContainer.appendChild(obstacle);
    obstacles.push({ element: obstacle, position: -currentObstacleWidth }); 
}

// Função para gerar obstáculos em intervalos aleatórios
function startObstacleGeneration() {
    function generate() {
        createObstacle();
        const nextGap = Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP) + OBSTACLE_MIN_GAP;
        obstacleGenerationInterval = setTimeout(generate, nextGap / gameSpeed); 
    }
    generate();
}

// Função para disparar o efeito de explosão de corações
function triggerCollectibleEffect(x, y) {
    const numHearts = 5; // Número de corações na explosão
    for (let i = 0; i < numHearts; i++) {
        const heart = document.createElement("div");
        heart.classList.add("heart-burst"); // Classe para os corações da explosão
        
        // Define as variáveis CSS para a animação
        heart.style.setProperty('--start-x', `${x}px`);
        heart.style.setProperty('--start-y', `${y}px`);
        
        // Posição final aleatória para espalhar os corações
        const finalX = x + (Math.random() - 0.5) * 100; // Espalha horizontalmente
        const finalY = y - (Math.random() * 100 + 50); // Sobe
        heart.style.setProperty('--end-x', `${finalX}px`);
        heart.style.setProperty('--end-y', `${finalY}px`);
        
        heart.style.animation = `burstHeartAnimation 1s ease-out forwards`;
        
        gameContainer.appendChild(heart); // Adiciona ao gameContainer para posicionamento correto

        heart.addEventListener('animationend', () => {
            heart.remove();
        });
    }
}


// Função principal de animação do jogo
function gameLoop() {
    if (isGameOver) {
        cancelAnimationFrame(animationFrameId);
        return;
    }

    // Move os obstáculos existentes
    obstacles.forEach((obstacle, index) => {
        obstacle.position += gameSpeed; // Aumenta a posição (move para a esquerda)
        obstacle.element.style.right = obstacle.position + "px";

        // Verifica colisão
        const dinoRect = dino.getBoundingClientRect();
        const obstacleRect = obstacle.element.getBoundingClientRect();

        // Ajusta a caixa de colisão do dinossauro com o padding
        const adjustedDinoLeft = dinoRect.left + COLLISION_PADDING;
        const adjustedDinoRight = dinoRect.right - COLLISION_PADDING;
        const adjustedDinoTop = dinoRect.top + COLLISION_PADDING;
        const adjustedDinoBottom = dinoRect.bottom - COLLISION_PADDING;

        // Lógica de colisão
        if (
            adjustedDinoLeft < obstacleRect.left + obstacleRect.width &&
            adjustedDinoRight > obstacleRect.left &&
            adjustedDinoTop < obstacleRect.top + obstacleRect.height &&
            adjustedDinoBottom > obstacleRect.top
        ) {
            if (obstacle.element.dataset.type === 'collectible') {
                // Se for um item coletável, adiciona pontos e remove o item
                score += COLLECTIBLE_POINTS;
                scoreElement.textContent = score;
                
                // Dispara o efeito visual no local do item
                const itemCenterX = obstacleRect.left + obstacleRect.width / 2;
                const itemCenterY = obstacleRect.top + obstacleRect.height / 2;
                triggerCollectibleEffect(itemCenterX, itemCenterY);

                obstacle.element.remove();
                obstacles.splice(index, 1); // Remove do array
                return; // Não é game over, continua o jogo
            } else {
                // Se for um cacto ou pterodáctilo, é game over
                gameOver();
                return;
            }
        }

        // Remove obstáculos que saíram da tela e atualiza a pontuação
        if (obstacle.position > gameContainer.offsetWidth + obstacle.element.offsetWidth) {
            obstacle.element.remove();
            obstacles.splice(index, 1); // Remove do array
            if (obstacle.element.dataset.type !== 'collectible') {
                score += 10;
                scoreElement.textContent = score;
            }

            // Verifica se a pontuação atingiu o objetivo
            if (score >= SCORE_TO_WIN) {
                gameOver(); // Chama gameOver para exibir a mensagem de vitória
                return;
            }
        }
    });

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Função de game over
function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    clearTimeout(obstacleGenerationInterval); // Para de gerar novos obstáculos
    clearInterval(gameLoopInterval); // Limpa o intervalo do gameLoop (se estiver usando)
    ground.style.animationPlayState = 'paused'; // Pausa a animação do chão

    // Lógica para exibir a mensagem correta
    if (score >= SCORE_TO_WIN) {
        gameOverElement.style.display = "none"; // Esconde a mensagem de GAME OVER
        loveMessageElement.style.display = "flex"; // Exibe a mensagem de amor (agora como flex)
        startHeartAnimation(); // Inicia a animação dos corações

        // Esconde os elementos do jogo
        dino.style.display = "none";
        scoreElement.style.display = "none";
        ground.style.display = "none";
        // Remove quaisquer obstáculos restantes
        document.querySelectorAll('.obstacle, .pterodactyl, .collectible-item').forEach(o => o.remove());
        obstacles = []; // Limpa o array de obstáculos

        // Deixa o game-container transparente e sem borda
        gameContainer.style.backgroundColor = "transparent";
        gameContainer.style.borderBottom = "none";
        
    } else {
        gameOverElement.style.display = "block"; // Exibe a mensagem de GAME OVER
        loveMessageElement.style.display = "none"; // Garante que a mensagem de amor esteja escondida
        stopHeartAnimation(); // Garante que os corações parem se for um game over normal
        
        // Garante que o game-container volte ao normal em um game over "normal"
        gameContainer.style.backgroundColor = "#fff";
        gameContainer.style.borderBottom = "2px solid #333";
    }
}

// Função para criar um único coração (para a mensagem final)
function createHeart() {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    
    // Tamanho aleatório para os corações
    const size = Math.random() * 20 + 10; // Tamanho entre 10px e 30px
    heart.style.width = size + "px";
    heart.style.height = size + "px";
    
    // Posição horizontal aleatória (do centro da mensagem)
    const startX = Math.random() * 80 + 10; // Entre 10% e 90% da largura do contêiner
    heart.style.left = startX + "%";
    
    // Duração da animação aleatória para variedade
    heart.style.animationDuration = (Math.random() * 2 + 3) + "s"; // 3 a 5 segundos
    
    heartsContainer.appendChild(heart);

    // Remove o coração após a animação terminar para evitar acúmulo no DOM
    heart.addEventListener('animationend', () => {
        heart.remove();
    });
}

let heartGenerationInterval;

// Função para iniciar a geração de corações (para a mensagem final)
function startHeartAnimation() {
    // Limpa qualquer intervalo existente primeiro
    if (heartGenerationInterval) {
        clearInterval(heartGenerationInterval);
    }
    // Gera um coração a cada 200ms
    heartGenerationInterval = setInterval(createHeart, 200);
}

// Função para parar a geração de corações (para a mensagem final)
function stopHeartAnimation() {
    if (heartGenerationInterval) {
        clearInterval(heartGenerationInterval);
        heartGenerationInterval = null;
    }
    // Remove todos os corações existentes
    document.querySelectorAll('.heart').forEach(h => h.remove());
}


// Função para iniciar o jogo
function startGame() {
    isGameOver = false;
    isJumping = false;
    score = 0;
    gameSpeed = 3; // Reseta a velocidade para o valor inicial fixo
    obstacles = []; // Limpa os obstáculos existentes
    
    scoreElement.textContent = score;
    gameOverElement.style.display = "none";
    loveMessageElement.style.display = "none"; // Garante que a mensagem de amor esteja escondida ao iniciar
    startScreen.style.display = "none"; // Esconde a tela de início
    
    // Garante que os elementos do jogo estejam visíveis ao iniciar
    dino.style.display = "block";
    scoreElement.style.display = "block";
    ground.style.display = "block";

    // Garante que o game-container volte ao normal ao iniciar um novo jogo
    gameContainer.style.backgroundColor = "#fff";
    gameContainer.style.borderBottom = "2px solid #333";

    // Garante que o dinossauro esteja em seu estado normal no início
    // As dimensões do dino são controladas pelo CSS .dino
    dino.style.bottom = DINO_BOTTOM_START + "px";

    ground.style.animationPlayState = 'running'; // Inicia a animação do chão
    ground.style.animationDuration = "5s"; // Reseta a velocidade do chão

    // Remove todos os obstáculos antigos do DOM
    document.querySelectorAll('.obstacle, .pterodactyl, .collectible-item').forEach(o => o.remove()); 
    stopHeartAnimation(); // Para a animação dos corações se o jogo for reiniciado

    startObstacleGeneration(); // Começa a gerar obstáculos
    gameLoop(); // Inicia o loop principal do jogo
}

// Event listeners
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        if (isGameOver) {
            startGame();
        } else {
            jump();
        }
    } 
});

// Suporte para dispositivos móveis (e clique no PC)
gameContainer.addEventListener("click", () => {
    if (isGameOver) {
        startGame();
    } else {
        jump(); 
    }
});

// Inicializa a tela de início
startScreen.style.display = "block"; // Exibe a tela de início ao carregar a página
ground.style.animationPlayState = 'paused'; // Pausa a animação do chão no início

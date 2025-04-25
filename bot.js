require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { HLTV } = require('hltv');
const axios = require('axios');

// Carregar o quiz
const quiz = require('./data/quiz.js');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const redditClientId = process.env.REDDIT_CLIENT_ID;
const redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
const redditUsername = process.env.REDDIT_USERNAME;
const redditPassword = process.env.REDDIT_PASSWORD;



// Carregar arquivos JSON
let jogadores, partidas;
try {
  jogadores = JSON.parse(fs.readFileSync('./data/jogadores.json'));
  partidas = JSON.parse(fs.readFileSync('./data/partidas.json'));
} catch (error) {
  console.error('Erro ao carregar arquivos JSON:', error);
}

// Dados estáticos para notícias, estatísticas, títulos e próximas partidas
const noticiasEstaticas = [
  {
    titulo: 'FURIA Vence Virtus.pro na BetBoom Dacha 2024',
    data: '2024-08-28',
    descricao: 'A FURIA teve uma estreia impressionante nos playoffs da BetBoom Dacha, derrotando a Virtus.pro por 2-0, com destaque para skullz.'
  },
  {
    titulo: 'FURIA Conquista a Elisa Masters Espoo 2023',
    data: '2023-12-03',
    descricao: 'A FURIA venceu a Elisa Masters Espoo 2023, derrotando times top 3 e 5 do mundo, marcando o início de uma nova era no CS2.'
  },
  {
    titulo: 'Skullz Chega à FURIA vindo da Team Liquid',
    data: '2024-06-17',
    descricao: 'FURIA contratou Felipe "skullz" Medeiros, ex-Team Liquid, para reforçar o elenco de CS2, substituindo kye.'
  }
];

const proximasPartidasEstaticas = [
  {
    torneio: 'PGL Astana 2025',
    adversario: 'TBD',
    data: '10/05/2025',
    evento: 'PGL Astana'
  },
  {
    torneio: 'IEM Dallas 2025',
    adversario: 'TBD',
    data: 'TBD',
    evento: 'IEM Dallas'
  },
  {
    torneio: 'BLAST Austin Major 2025',
    adversario: 'TBD',
    data: 'TBD',
    evento: 'BLAST Austin Major'
  }
];

const estatisticas = {
  resumo: [
    '🏆 *Melhores Colocações em Majors*: Semifinais no Rio Major 2022, Quartas de Final no Antwerp Major 2022.',
    '🥈 *Top 4 em Torneios*: ESL Pro League S15 (2022), IEM Dallas (2022).',
    '🔥 *Destaque em 2024*: Vitória por 2-0 contra Virtus.pro na BetBoom Dacha, mostrando grande potencial.',
    '🌟 *Jogador Estrela*: KSCERATO, que recusou oferta da Team Liquid para permanecer na FURIA.'
  ],
  fonte: 'Para estatísticas completas, confira o HLTV.org!'
};

const titulos = [
  {
    torneio: 'Elisa Masters Espoo',
    ano: '2023',
    descricao: 'A FURIA venceu este torneio Tier-A, derrotando times top 3 e 5 do mundo, marcando um marco no CS2.'
  },
  {
    torneio: 'Ascension League',
    ano: '2022',
    descricao: 'O time Academy da FURIA conquistou o título, vencendo a Stars Horizon por 2-0 na final.'
  }
];

// Estado do quiz para cada usuário
const quizState = {};

// Função para obter o token de acesso do Reddit
async function getRedditAccessToken() {
  try {
    const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
      `grant_type=password&username=${redditUsername}&password=${redditPassword}`, {
      auth: {
        username: redditClientId,
        password: redditClientSecret
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Erro ao obter token do Reddit:', error.response?.data || error.message);
    throw new Error('Falha na autenticação do Reddit');
  }
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Bem-vindo ao bot da FURIA! 🐾 Use os comandos:\n/quiz - Quiz interativo\n/jogadores - Lista de jogadores\n/ultimas - Últimas partidas\n/proximos - Próximas partidas\n/noticias - Notícias recentes\n/estatisticas - Estatísticas da equipe\n/titulos - Títulos conquistados');
});

// Comando /jogadores
bot.onText(/\/jogadores/, (msg) => {
  const chatId = msg.chat.id;
  let response = '*Jogadores da FURIA* 🐾\n\n';

  // Titulares
  response += '*Titulares*\n';
  if (jogadores.titulares && Array.isArray(jogadores.titulares)) {
    jogadores.titulares.forEach(jogador => {
      response += `🔫 *${jogador.nick}*\nNome: ${jogador.nomeCompleto}\nNacionalidade: ${jogador.nacionalidade}\nFunção: ${jogador.função}\n\n`;
    });
  }

  // Reservas
  response += '*Reservas*\n';
  if (jogadores.reservas && Array.isArray(jogadores.reservas)) {
    jogadores.reservas.forEach(jogador => {
      response += `🔫 *${jogador.nick}*\nNome: ${jogador.nomeCompleto}\nNacionalidade: ${jogador.nacionalidade}\nFunção: ${jogador.função}\n\n`;
    });
  }

  // Coaches
  response += '*Coaches*\n';
  if (jogadores.coaches && Array.isArray(jogadores.coaches)) {
    jogadores.coaches.forEach(coach => {
      response += `🎮 *${coach.nick}*\nNome: ${coach.nomeCompleto}\nNacionalidade: ${coach.nacionalidade}\nFunção: ${coach.função}\n\n`;
    });
  }

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Comando /ultimas
bot.onText(/\/ultimas/, (msg) => {
  const chatId = msg.chat.id;
  let response = '*Últimas Partidas da FURIA* 🐾\n\n';
  if (partidas && Array.isArray(partidas)) {
    partidas.forEach(partida => {
      response += `🏆 *${partida.torneio}*\nAdversário: ${partida.adversario}\nResultado: ${partida.resultado}\nData: ${partida.data}\n\n`;
    });
  } else {
    response += 'Nenhuma partida encontrada. 😿';
  }
  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Comando /proximos
bot.onText(/\/proximos/, async (msg) => {
  const chatId = msg.chat.id;
  let response = '*Próximas Partidas da FURIA* 🐾\n\n';

  try {
    // Buscar partidas futuras da FURIA
    const matches = await HLTV.getMatches();
    if (!Array.isArray(matches)) {
      throw new Error('Dados de partidas inválidos');
    }

    const furiaMatches = matches.filter(match => 
      match.teams && Array.isArray(match.teams) && 
      match.teams.some(team => team && team.name === 'FURIA')
    );

    if (furiaMatches.length === 0) {
      response += 'Nenhuma partida futura confirmada no momento. 😿\n';
      response += 'Mas a FURIA está escalada para:\n';
      proximasPartidasEstaticas.forEach(partida => {
        response += `🏆 *${partida.evento}*\nAdversário: ${partida.adversario}\nData: ${partida.data}\n\n`;
      });
      response += 'Fique ligado para mais detalhes! 🔥';
    } else {
      furiaMatches.forEach(match => {
        const opponent = match.teams && Array.isArray(match.teams) 
          ? (match.teams.find(team => team && team.name !== 'FURIA')?.name || 'TBD')
          : 'TBD';
        const date = match.date ? new Date(match.date).toLocaleDateString('pt-BR') : 'Data TBD';
        const event = match.event && match.event.name ? match.event.name : 'Evento TBD';
        response += `🏆 *${event}*\nAdversário: ${opponent}\nData: ${date}\n\n`;
      });
    }
  } catch (error) {
    console.error('Erro ao buscar partidas da HLTV:', error);
    // Fallback para partidas estáticas
    response += 'Não foi possível buscar partidas em tempo real. 😿 Confira as próximas partidas previstas:\n\n';
    proximasPartidasEstaticas.forEach(partida => {
      response += `🏆 *${partida.evento}*\nAdversário: ${partida.adversario}\nData: ${partida.data}\n\n`;
    });
    response += 'Fique ligado no HLTV.org e nas redes da FURIA para mais detalhes! 🔥';
  }

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Comando /noticias
bot.onText(/\/noticias/, async (msg) => {
  const chatId = msg.chat.id;
  let response = '*Notícias da FURIA* 🐾\n\n';

  try {
    // Obter token de acesso do Reddit
    const accessToken = await getRedditAccessToken();

    // Buscar posts no subreddit r/GlobalOffensive com a palavra-chave "FURIA"
    const url = 'https://oauth.reddit.com/r/GlobalOffensive/search?q=FURIA&restrict_sr=on&sort=new&limit=5';
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'FURIA Bot by /u/seu_usuario'
      }
    });

    // Filtrar posts válidos
    const posts = data.data.children
      .filter(child => child.data.title && child.data.selftext && !child.data.stickied)
      .slice(0, 3); // Limitar a 3 posts

    if (posts.length === 0) {
      throw new Error('Nenhum post recente encontrado');
    }

    posts.forEach(post => {
      const date = new Date(post.data.created_utc * 1000).toLocaleDateString('pt-BR');
      const title = post.data.title.length > 100 ? post.data.title.substring(0, 97) + '...' : post.data.title;
      const text = post.data.selftext.length > 100 ? post.data.selftext.substring(0, 97) + '...' : post.data.selftext;
      response += `📰 *${title}* (${date})\n${text}\nFonte: Reddit (u/${post.data.author})\n\n`;
    });
    response += 'Fonte: r/GlobalOffensive | Fique ligado para mais notícias! 🔥';
  } catch (error) {
    console.error('Erro ao buscar notícias do Reddit:', error);
    // Fallback para notícias estáticas
    response += 'Não foi possível buscar notícias em tempo real. 😿 Confira as últimas notícias disponíveis:\n\n';
    if (noticiasEstaticas && Array.isArray(noticiasEstaticas)) {
      noticiasEstaticas.forEach(noticia => {
        response += `📰 *${noticia.titulo}* (${noticia.data})\n${noticia.descricao}\n\n`;
      });
      response += 'Fique ligado no HLTV.org e nas redes da FURIA para mais notícias! 🔥';
    } else {
      response += 'Nenhuma notícia disponível no momento. 😿';
    }
  }

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Comando /estatisticas
bot.onText(/\/estatisticas/, (msg) => {
  const chatId = msg.chat.id;
  let response = '*Estatísticas da FURIA* 🐾\n\n';
  if (estatisticas.resumo && Array.isArray(estatisticas.resumo)) {
    estatisticas.resumo.forEach(stat => {
      response += `${stat}\n\n`;
    });
    response += estatisticas.fonte;
  } else {
    response += 'Nenhuma estatística disponível no momento. 😿';
  }
  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Comando /titulos
bot.onText(/\/titulos/, (msg) => {
  const chatId = msg.chat.id;
  let response = '*Títulos da FURIA no Counter-Strike* 🐾\n\n';
  if (titulos && Array.isArray(titulos)) {
    titulos.forEach(titulo => {
      response += `🏆 *${titulo.torneio} (${titulo.ano})*\n${titulo.descricao}\n\n`;
    });
    response += 'Nota: Outros títulos menores podem ter sido conquistados. Confira a Liquipedia para uma lista completa! 🔥';
  } else {
    response += 'Nenhum título disponível no momento. 😿';
  }
  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Comando /quiz
bot.onText(/\/quiz/, (msg) => {
  const chatId = msg.chat.id;
  quizState[chatId] = {
    currentQuestion: 0,
    score: 0
  };
  sendQuizQuestion(chatId);
});

// Função para enviar uma pergunta do quiz
function sendQuizQuestion(chatId) {
  const state = quizState[chatId];
  if (!state || state.currentQuestion >= quiz.length) {
    const score = state ? state.score : 0;
    const total = quiz.length;
    let finalMessage = `Quiz finalizado! 🐾 Sua pontuação: ${score}/${total} 🎉\n`;
    if (score === total) {
      finalMessage += 'Perfeito! Você é um verdadeiro fã da FURIA! 🔥';
    } else if (score >= total / 2) {
      finalMessage += 'Muito bom! Você conhece bem a FURIA! 💪';
    } else {
      finalMessage += 'Não foi dessa vez, mas continue acompanhando a FURIA! 🖤';
    }
    bot.sendMessage(chatId, finalMessage);
    delete quizState[chatId];
    return;
  }

  const question = quiz[state.currentQuestion];
  let optionsText = '';
  if (question.opcoes && Array.isArray(question.opcoes)) {
    question.opcoes.forEach((opcao, index) => {
      optionsText += `${index + 1}. ${opcao}\n`;
    });
  } else {
    bot.sendMessage(chatId, 'Erro ao carregar a pergunta do quiz. 😿 Tente novamente!');
    delete quizState[chatId];
    return;
  }

  bot.sendMessage(chatId, `${question.pergunta}\n${optionsText}`, {
    reply_markup: {
      force_reply: true
    }
  });
}

// Lidar com respostas do quiz
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (!quizState[chatId] || msg.text.startsWith('/')) return;

  const state = quizState[chatId];
  const question = quiz[state.currentQuestion];
  const userAnswer = msg.text.trim();
  let correctAnswerIndex;

  // Verificar se a resposta é um número (índice da opção)
  if (/^[1-4]$/.test(userAnswer)) {
    if (question.opcoes && Array.isArray(question.opcoes) && question.resposta) {
      correctAnswerIndex = question.opcoes.indexOf(question.resposta) + 1;
      if (parseInt(userAnswer) === correctAnswerIndex) {
        state.score++;
        bot.sendMessage(chatId, 'Correto! 🎉');
      } else {
        bot.sendMessage(chatId, `Errado! A resposta correta era: ${question.resposta} 😢`);
      }
    } else {
      bot.sendMessage(chatId, 'Erro ao processar a resposta do quiz. 😿 Tente novamente!');
      delete quizState[chatId];
      return;
    }
  } else {
    bot.sendMessage(chatId, 'Por favor, responda com o número da opção (1-4).');
    return;
  }

  state.currentQuestion++;
  sendQuizQuestion(chatId);
});

console.log('Bot iniciado...');
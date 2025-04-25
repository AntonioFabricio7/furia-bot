// test.js
const { getDadosFuria } = require('./data/partidas');

(async () => {
  console.log('🕵️♂️ Iniciando teste local...');
  
  try {
    // Teste a busca de dados
    const { recentMatches } = await getDadosFuria();
    
    console.log('✅ Dados brutos da API:', recentMatches);
    
    // Simule o formato do Telegram
    if (recentMatches.length > 0) {
      console.log('\n📜 Mensagem que seria enviada no Telegram:');
      recentMatches.forEach((match, i) => {
        console.log(`${i + 1}. 🏁 ${match.time1} ${match.placar} ${match.time2}`);
      });
    } else {
      console.log('🔍 Nenhuma partida encontrada (teste local)');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste local:', error);
  }
})();
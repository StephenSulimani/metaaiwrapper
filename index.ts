import PromptSync from 'prompt-sync';
import MetaAI from './metaai';

const metaai = new MetaAI();

const prompt = PromptSync();

(async () => {
  while (true) {
    const message = prompt('Ask me anything: ');
    if (message.toUpperCase() == 'SOURCES') {
      const sources = await metaai.sources();
      if (!sources) {
        console.log('There was an error grabbing sources.');
        continue;
      }
      console.log(
        `Search Engine: ${sources.search_engine} | Query: ${sources.search_query}`
      );
      for (const reference of sources.references) {
        console.log(`${reference.title} - ${reference.link}`);
      }
      continue;
    }
    console.log();
    const resp = await metaai.prompt(message);
    console.log(resp);
    console.log();
    console.log();
  }
})();

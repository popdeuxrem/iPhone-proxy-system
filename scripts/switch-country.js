import fs from 'fs-extra';

const countryCodes = { US:'United States', GB:'United Kingdom', DE:'Germany', FR:'France', JP:'Japan', CA:'Canada', AU:'Australia', SG:'Singapore', NL:'Netherlands', SE:'Sweden' };

async function switchCountry(code){
  if(!countryCodes[code]){console.log(`❌ Invalid code: ${code}`); return;}
  console.log(`🔄 Switching to ${countryCodes[code]} (${code})`);
  const cfg = await fs.readJson('config.json').catch(()=>({}));
  cfg.targetCountry = code;
  await fs.writeJson('config.json', cfg, {spaces:2});
  console.log(`✅ Switched to ${countryCodes[code]}! Run 'npm run build' next.`);
}

const code = process.argv[2]?.toUpperCase();
if(code) switchCountry(code); else console.log('Usage: node scripts/switch-country.js [COUNTRY_CODE]');


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Tenta ler o .env manualmente já que o script falhou antes
const envContent = fs.readFileSync('.env', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateDeal() {
  const deal = {
    empresa: 'EMPRESA TESTE REGRESSÃO',
    nomeNegocacao: 'TESTE 400',
    etapaid: 'etapa-1',
    valorunico: 0,
    vendedor: 'Sistema'
  };

  console.log('Inserting deal:', deal);
  const { data, error } = await supabase.from('deals').insert([deal]).select();
  
  if (error) {
    console.error('Error Details:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success:', data);
  }
}

testCreateDeal();

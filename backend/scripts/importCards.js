const axios = require('axios');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://apitcg.com/api/one-piece/cards';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const transformarCarta = (carta) => ({
  id: carta.id,
  code: carta.code,
  rarity: carta.rarity,
  type: carta.type,
  name: carta.name,
  images_small: carta.images?.small || null,
  images_large: carta.images?.large || null,
  cost: carta.cost,
  attribute_name: carta.attribute?.name || null,
  attribute_image: carta.attribute?.image || null,
  power: carta.power,
  counter: carta.counter,
  color: carta.color,
  family: carta.family,
  ability: carta.ability,
  trigger: carta.trigger,
  set_name: carta.set?.name || null,
  notes: carta.notes
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function importarCartas() {
  let page = 1;
  let totalPages = 1;
  let totalImportadas = 0;

  try {
    const res = await axios.get(BASE_URL, {
      headers: { 'x-api-key': API_KEY },
      params: { page, limit: 25 },
      timeout: 10000
    });

    const { totalPages: tp, data } = res.data;
    totalPages = tp;
    console.log(`Total de páginas: ${totalPages}`);

    const cartasTransformadas = data.map(transformarCarta);
    let { error } = await supabase.from('cards').upsert(cartasTransformadas);
    if (error) {
      console.error('Error al insertar la página 1:', error);
    } else {
      totalImportadas += cartasTransformadas.length;
      console.log(`Página 1: ${cartasTransformadas.length} cartas importadas.`);
    }
  } catch (error) {
    console.error('Error al obtener la página 1:', error);
    return;
  }

  for (page = 2; page <= totalPages; page++) {
    await delay(2000); // Espera 2 segundos antes de la siguiente petición
    try {
      const res = await axios.get(BASE_URL, {
        headers: { 'x-api-key': API_KEY },
        params: { page, limit: 25 },
        timeout: 10000
      });

      const { data } = res.data;
      const cartasTransformadas = data.map(transformarCarta);
      const { error } = await supabase.from('cards').upsert(cartasTransformadas);
      if (error) {
        console.error(`Error al insertar la página ${page}:`, error);
      } else {
        totalImportadas += cartasTransformadas.length;
        console.log(`Página ${page}: ${cartasTransformadas.length} cartas importadas.`);
      }
    } catch (error) {
      console.error(`Error al obtener la página ${page}:`, error);
    }
  }

  console.log(`Importación completada. Total de cartas importadas: ${totalImportadas}`);
}

module.exports = { importarCartas };

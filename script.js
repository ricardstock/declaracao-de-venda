'use strict';

const SUPABASE_URL = 'https://pwvjitzyxqxvvpmkfnlo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dmppdHp5eHF4dnZwbWtmbmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDYxNTAsImV4cCI6MjEwNzI4MjE1MH0.ctDJAzTRlzyBtSlmP8XiXTJjEOKEIUAHVnD9h8xQuuA';

const form = document.getElementById('declaracao-form');
const alertBox = document.getElementById('form-alert');

function showMessage(message, success = false) {
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = 'form-alert' + (success ? ' success' : '');
  alertBox.focus();
}

const sbClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
if (!sbClient) showMessage('Não foi possível carregar a ligação ao servidor. Atualize a página.');

const dateInput = document.getElementById('data_declaracao');
function todayInPortugal() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
if (dateInput) dateInput.value = todayInPortugal();

const container = document.getElementById('produtos-container');
let productIndex = 0;

function criarLinhaProduto(removable = true) {
  const id = ++productIndex;
  const box = document.createElement('div');
  box.className = 'produto-box product-item';
  box.innerHTML = `
    <div class="product-row">
      <div>
        <label class="field-label" for="qtd-${id}">Qtd. *</label>
        <input id="qtd-${id}" type="number" class="p-qtd" placeholder="1" value="1" min="1" required>
      </div>
      <div>
        <label class="field-label" for="sku-${id}">SKU / Ref</label>
        <input id="sku-${id}" type="text" class="p-sku" placeholder="SKU / Ref">
      </div>
      <div class="product-modelo">
        <label class="field-label" for="modelo-${id}">Marca, Modelo e Cor *</label>
        <input id="modelo-${id}" type="text" class="p-modelo" placeholder="Marca, Modelo e Cor" required>
      </div>
      <div>
        <label class="field-label" for="tamanho-${id}">Tamanho</label>
        <input id="tamanho-${id}" type="text" class="p-tamanho" placeholder="Tamanho">
      </div>
      <div>
        <label class="field-label" for="valor-${id}">Valor (€) *</label>
        <input id="valor-${id}" type="number" step="0.01" class="p-valor" placeholder="Valor (€)" required>
      </div>
    </div>
    ${removable ? `<div class="product-actions"><button type="button" class="btn-small btn-remover">Remover Produto</button></div>` : ''}
  `;

  if (removable) {
    box.querySelector('.btn-remover').addEventListener('click', () => box.remove());
  }

  container.appendChild(box);
}

// Inicializa com 1 produto por defeito
criarLinhaProduto(false);

const btnAdd = document.getElementById('btn-adicionar-produto');
if (btnAdd) btnAdd.addEventListener('click', () => criarLinhaProduto(true));

// CANVAS DE ASSINATURA
const canvas = document.getElementById('signature-pad');
const ctx = canvas ? canvas.getContext('2d') : null;
let desenhando = false;
let assinou = false;

if (canvas) {
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function iniciarDesenho(e) {
    desenhando = true;
    assinou = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    if (e.type === 'touchstart') e.preventDefault();
  }

  function desenhar(e) {
    if (!desenhando) return;
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (e.type === 'touchmove') e.preventDefault();
  }

  function pararDesenho() {
    desenhando = false;
  }

  canvas.addEventListener('mousedown', iniciarDesenho);
  canvas.addEventListener('mousemove', desenhar);
  canvas.addEventListener('mouseup', pararDesenho);
  canvas.addEventListener('mouseleave', pararDesenho);

  canvas.addEventListener('touchstart', iniciarDesenho, { passive: false });
  canvas.addEventListener('touchmove', desenhar, { passive: false });
  canvas.addEventListener('touchend', pararDesenho);

  document.getElementById('btn-limpar-assinatura').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    assinou = false;
  });
}

// SUBMISSÃO
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!assinou) {
      showMessage("Por favor, desenhe a sua assinatura antes de submeter.");
      return;
    }

    const btnSubmeter = document.getElementById('btn-submeter');
    btnSubmeter.disabled = true;
    btnSubmeter.textContent = "A submeter declaração...";

    try {
      const dataURL = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataURL)).blob();
      const filename = `assinaturas/ass_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

      const { error: uploadError } = await sbClient.storage
        .from('declaracoes_docs')
        .upload(filename, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = sbClient.storage
        .from('declaracoes_docs')
        .getPublicUrl(filename);

      const produtos = [];
      document.querySelectorAll('.produto-box').forEach(box => {
        produtos.push({
          qtd: box.querySelector('.p-qtd').value,
          sku: box.querySelector('.p-sku').value,
          modelo: box.querySelector('.p-modelo').value,
          tamanho: box.querySelector('.p-tamanho').value,
          valor: box.querySelector('.p-valor').value
        });
      });

      const payload = {
        nome: document.getElementById('nome').value,
        nif: document.getElementById('nif').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        morada: document.getElementById('morada').value,
        codigo_postal: document.getElementById('codigo_postal').value,
        cidade: document.getElementById('cidade').value,
        pais: document.getElementById('pais').value,
        produtos: produtos,
        assinatura_url: urlData.publicUrl,
        data_declaracao: document.getElementById('data_declaracao').value
      };

      const { error: insertError } = await sbClient
        .from('declaracoes')
        .insert([payload]);

      if (insertError) throw insertError;

      showMessage("Declaração submetida com sucesso!", true);
      setTimeout(() => window.location.reload(), 2000);

    } catch (err) {
      console.error(err);
      showMessage("Erro ao submeter declaração: " + err.message);
      btnSubmeter.disabled = false;
      btnSubmeter.textContent = "Submeter Declaração Oficial";
    }
  });
}
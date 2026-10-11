const SUPABASE_URL = "https://pwvjitzyxqxvvpmkfnlo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dmppdHp5eHF4dnZwbWtmbmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDYxNTAsImV4cCI6MjEwNzI4MjE1MH0.ctDJAzTRlzyBtSlmP8XiXTJjEOKEIUAHVnD9h8xQuuA";

const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Definir a data atual por defeito no campo de data
window.addEventListener('DOMContentLoaded', () => {
  const dataInput = document.getElementById('data_declaracao');
  if (dataInput) {
    const hoje = new Date().toISOString().split('T')[0];
    dataInput.value = hoje;
  }
});

// ASSINATURA CANVAS
const canvas = document.getElementById('signature-pad');
const ctx = canvas ? canvas.getContext('2d') : null;
let desenhando = false;
let assinou = false;

if (canvas) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  ctx.scale(ratio, ratio);

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

// GESTÃO DOS PRODUTOS ADICIONAIS
const produtosContainer = document.getElementById('produtos-container');
const btnAdicionarProduto = document.getElementById('btn-adicionar-produto');

function criarLinhaProduto() {
  const div = document.createElement('div');
  div.className = 'product-item';
  
  div.innerHTML = `
    <div class="product-row">
      <input type="number" class="p-qtd" placeholder="1" value="1" min="1" required>
      <input type="text" class="p-sku" placeholder="SKU / Ref">
      <input type="text" class="p-modelo" placeholder="Marca, Modelo e Cor" required>
      <input type="text" class="p-tamanho" placeholder="Tamanho">
      <input type="number" step="0.01" class="p-valor" placeholder="Valor (€)" required>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <label class="checkbox-label" style="margin-top: 0;">
        <input type="checkbox" class="p-declaracao" required style="width: 16px; height: 16px;">
        <span>Declaro que sou um vendedor particular e que os produtos vendidos são bens usados, não tendo sido liquidado IVA nesta venda</span>
      </label>
      <button type="button" class="btn-small btn-remover" style="margin-left: 10px;">Remover</button>
    </div>
  `;

  div.querySelector('.btn-remover').addEventListener('click', () => {
    div.remove();
  });

  produtosContainer.appendChild(div);
}

if (btnAdicionarProduto) {
  btnAdicionarProduto.addEventListener('click', () => {
    criarLinhaProduto();
  });
}

// SUBMISSÃO DO FORMULÁRIO
const form = document.getElementById('declaracao-form');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!assinou) {
      alert("Por favor, assine a declaração antes de submeter.");
      return;
    }

    const btnSubmeter = document.getElementById('btn-submeter');
    btnSubmeter.disabled = true;
    btnSubmeter.innerText = "A guardar declaração...";

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

      const assinatura_url = urlData.publicUrl;

      const produtos = [];
      document.querySelectorAll('.product-item').forEach(box => {
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
        assinatura_url: assinatura_url,
        data_declaracao: document.getElementById('data_declaracao').value
      };

      const { error: insertError } = await sbClient
        .from('declaracoes')
        .insert([payload]);

      if (insertError) throw insertError;

      alert("Declaração submetida com sucesso! Obrigado.");
      window.location.reload();

    } catch (err) {
      console.error(err);
      alert("Erro ao submeter declaração: " + err.message);
      btnSubmeter.disabled = false;
      btnSubmeter.innerText = "Submeter Declaração Oficial";
    }
  });
}
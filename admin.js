const SUPABASE_URL = "https://pwvjitzyxqxvvpmkfnlo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dmppdHp5eHF4dnZwbWtmbmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDYxNTAsImV4cCI6MjEwNzI4MjE1MH0.ctDJAzTRlzyBtSlmP8XiXTJjEOKEIUAHVnD9h8xQuuA";

const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONFIGURAÇÃO DE SEGURANÇA ---
const ADMIN_PASSWORD = "asMCIm12229MCJSnmzncw"; // Podes alterar aqui a palavra-passe quando quiseres
const STORAGE_KEY_AUTH = "admin_auth_token_v2";
const STORAGE_KEY_BLOCKED = "admin_blocked_device_v2";

function verificarAcessoAdmin() {
  const tokenSalvo = localStorage.getItem(STORAGE_KEY_AUTH);
  const estaBloqueado = localStorage.getItem(STORAGE_KEY_BLOCKED);
  
  // Se já tiveres entrado com sucesso neste dispositivo
  if (tokenSalvo === ADMIN_PASSWORD) {
    carregarDeclaracoes();
    return;
  }

  // Se o dispositivo estava bloqueado por uma palavra-passe antiga, limpa o bloqueio
  if (estaBloqueado) {
    localStorage.removeItem(STORAGE_KEY_BLOCKED);
  }

  const pass = prompt("Acesso Restrito ao Administrador.\nIntroduza a palavra-passe:");

  if (pass === ADMIN_PASSWORD) {
    // Autentica e confia neste dispositivo
    localStorage.setItem(STORAGE_KEY_AUTH, ADMIN_PASSWORD);
    carregarDeclaracoes();
  } else {
    // Guarda o bloqueio para esta sessão
    localStorage.setItem(STORAGE_KEY_BLOCKED, "true");
    alert("Palavra-passe incorreta! Acesso negado.");
    mostrarEcraBloqueado("Acesso negado. Palavra-passe incorreta.");
  }
}

function mostrarEcraBloqueado(mensagem) {
  document.body.innerHTML = `
    <div style="text-align: center; margin-top: 120px; font-family: sans-serif; padding: 20px;">
      <h1 style="color: #ef4444; font-size: 28px;">Acesso Negado</h1>
      <p style="color: #475569; font-size: 16px; margin-top: 10px;">${mensagem}</p>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 30px;">Para tentar novamente, atualize a página ou altere a palavra-passe no código.</p>
    </div>
  `;
}

async function carregarDeclaracoes() {
  const tbody = document.getElementById('admin-table-body');
  if (!tbody) return;
  
  const { data, error } = await sbClient.from('declaracoes').select('*').order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Erro ao carregar dados: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">Nenhuma declaração submetida até ao momento.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  data.forEach(item => {
    let dataFormatada = item.data_declaracao;
    if (dataFormatada && dataFormatada.includes('-')) {
      const partes = dataFormatada.split('-');
      if (partes.length === 3) {
        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dataFormatada || 'N/D'}</td>
      <td><strong>${item.nome}</strong></td>
      <td>${item.nif}</td>
      <td>${item.telefone || 'N/D'}</td>
      <td><button class="btn-pdf" onclick='gerarPDF(${JSON.stringify(item)})'>Descarregar PDF</button></td>
    `;
    tbody.appendChild(tr);
  });
}

async function gerarPDF(item) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let dataFormatada = item.data_declaracao;
  if (dataFormatada && dataFormatada.includes('-')) {
    const partes = dataFormatada.split('-');
    if (partes.length === 3) {
      dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }

  const nifLimpo = item.nif ? item.nif.replace(/^PT/i, '') : '';

  // --- CABEÇALHO ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DECLARAÇÃO DE VENDA", 20, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${dataFormatada}`, 150, 22);

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 28, 190, 28);

  let cursorY = 40;

  // --- IDENTIFICAÇÃO DO VENDEDOR ---
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Eu, ${item.nome}, NIF ${nifLimpo}, residente em:`, 20, cursorY);
  cursorY += 6;
  doc.text(`${item.morada}`, 25, cursorY);
  cursorY += 6;
  doc.text(`${item.codigo_postal} ${item.cidade}, ${item.pais}`, 25, cursorY);

  cursorY += 14;

  // --- DECLARAÇÃO DE VENDA ---
  doc.setFont("helvetica", "normal");
  doc.text("Declaro que vendi a Ricardo Filipe Oliveira Pinho, NIF 260429651, os seguintes artigos:", 20, cursorY);

  cursorY += 12;

  // --- LISTA DE PRODUTOS VENDIDOS ---
  if (item.produtos && Array.isArray(item.produtos)) {
    item.produtos.forEach((p, index) => {
      doc.setFont("helvetica", "normal");
      const skuTexto = p.sku ? p.sku : 'N/A';
      const linhaProd = `${index + 1}.  ${p.qtd} - ${skuTexto} - ${p.modelo} - ${p.tamanho} - ${p.valor}€`;
      doc.text(linhaProd, 25, cursorY);
      cursorY += 8;
    });
  }

  cursorY += 10;

  // --- DECLARAÇÃO LEGAL DE BENS USADOS ---
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  const declaracaoIVA = "Declaro que sou um vendedor particular e que os produtos vendidos são bens usados, não tendo sido liquidado IVA nesta venda.";
  const linhasIVA = doc.splitTextToSize(declaracaoIVA, 170);
  doc.text(linhasIVA, 20, cursorY);

  cursorY += (linhasIVA.length * 6) + 30;

  // --- SECÇÃO DE ASSINATURAS ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  const xComprador = 20;
  doc.text("Comprador:", xComprador, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text("___________________________________", xComprador, cursorY + 25);

  const xVendedor = 120;
  doc.setFont("helvetica", "bold");
  doc.text("O Vendedor:", xVendedor, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text("___________________________________", xVendedor, cursorY + 25);

  if (item.assinatura_url) {
    try {
      const imgData = await getDataUrlFromImage(item.assinatura_url);
      if (imgData) {
        doc.addImage(imgData, 'PNG', xVendedor, cursorY + 2, 55, 20);
      }
    } catch (err) {
      console.log("Erro ao carregar imagem da assinatura no PDF:", err);
    }
  }

  doc.save(`Declaracao_${nifLimpo}_${dataFormatada.replace(/\//g, '-')}.pdf`);
}

function getDataUrlFromImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

document.addEventListener('DOMContentLoaded', verificarAcessoAdmin);
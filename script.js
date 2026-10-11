const SUPABASE_URL = "https://pwvjitzyxqxvvpmkfnlo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dmppdHp5eHF4dnZwbWtmbmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDYxNTAsImV4cCI6MjEwNzI4MjE1MH0.ctDJAzTRlzyBtSlmP8XiXTJjEOKEIUAHVnD9h8xQuuA"; 

const sbClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function showError(msg) {
  const alertBox = document.getElementById('form-alert');
  alertBox.innerText = msg;
  alertBox.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideError() {
  const alertBox = document.getElementById('form-alert');
  alertBox.innerText = '';
  alertBox.classList.add('hidden');
}

let phoneInput;

$(document).ready(function() {
  const phoneInputField = document.querySelector("#telefone");
  phoneInput = window.intlTelInput(phoneInputField, {
    initialCountry: "pt",
    preferredCountries: ["pt", "es", "fr", "gb", "us"],
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
  });

  $("#pais").countrySelect({
    defaultCountry: "pt",
    preferredCountries: ["pt", "es", "fr", "gb", "us"]
  });

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('data-declaracao').value = today;
});

const dict = {
  pt: {
    title: "Declaração de Venda",
    personal: "Informações Pessoais",
    products: "Produto(s) Vendido(s)",
    consignment: "Declaro que sou um vendedor particular e que os produtos vendidos são bens usados, não tendo sido liquidado IVA nesta venda (Obrigatório).",
    addProd: "+ Adicionar Outro Produto",
    sigTitle: "Assinatura Digital",
    sigDesc: "Desenhe a sua assinatura no espaço abaixo:",
    lblDate: "Data da Declaração:",
    lblPhone: "Contacto Telefónico",
    lblCountry: "País de Residência",
    clear: "Limpar Assinatura",
    submit: "Submeter Declaração Oficial",
    p_nome: "Nome Completo",
    p_nif: "NIF",
    p_email: "Endereço de Email",
    p_morada: "Morada Completa",
    p_cp: "Código Postal",
    p_cidade: "Cidade",
    p_qtd: "Qtd",
    p_sku: "SKU / Ref",
    p_modelo: "Marca, Modelo e Cor",
    p_tamanho: "Tamanho",
    p_valor: "Valor (€)",
    errPhone: "Por favor, introduza um número de telemóvel válido com o indicativo correto.",
    errSig: "Por favor, desenhe a sua assinatura no espaço indicado antes de enviar."
  },
  en: {
    title: "Declaration of Sale",
    personal: "Personal Information",
    products: "Sold Item(s)",
    consignment: "I declare that I am a private seller and that the items sold are used goods, with no VAT charged on this sale (Mandatory).",
    addProd: "+ Add Another Product",
    sigTitle: "Digital Signature",
    sigDesc: "Draw your signature in the box below:",
    lblDate: "Declaration Date:",
    lblPhone: "Phone Number",
    lblCountry: "Country of Residence",
    clear: "Clear Signature",
    submit: "Submit Official Declaration",
    p_nome: "Full Name",
    p_nif: "Tax ID",
    p_email: "Email Address",
    p_morada: "Full Address",
    p_cp: "Postal Code",
    p_cidade: "City",
    p_qtd: "Qty",
    p_sku: "SKU / Ref",
    p_modelo: "Brand, Model and Color",
    p_tamanho: "Size",
    p_valor: "Price (€)",
    errPhone: "Please enter a valid phone number with the correct country code.",
    errSig: "Please draw your signature in the box provided before submitting."
  }
};

document.getElementById('lang-select').addEventListener('change', (e) => {
  const lang = e.target.value;
  const t = dict[lang];

  document.getElementById('txt-title').innerText = t.title;
  document.getElementById('txt-personal').innerText = t.personal;
  document.getElementById('txt-products').innerText = t.products;
  document.getElementById('add-product-btn').innerText = t.addProd;
  document.getElementById('txt-sig-title').innerText = t.sigTitle;
  document.getElementById('txt-sig-desc').innerText = t.sigDesc;
  document.getElementById('lbl-date').innerText = t.lblDate;
  document.getElementById('lbl-phone').innerText = t.lblPhone;
  document.getElementById('lbl-country').innerText = t.lblCountry;
  document.getElementById('clear-sig-btn').innerText = t.clear;
  document.getElementById('btn-submit').innerText = t.submit;
  
  document.querySelectorAll('.txt-consignment').forEach(el => el.innerText = t.consignment);

  document.getElementById('nome').placeholder = t.p_nome;
  document.getElementById('nif').placeholder = t.p_nif;
  document.getElementById('email').placeholder = t.p_email;
  document.getElementById('morada').placeholder = t.p_morada;
  document.getElementById('codigo_postal').placeholder = t.p_cp;
  document.getElementById('cidade').placeholder = t.p_cidade;

  document.querySelectorAll('.product-item').forEach(item => {
    item.querySelector('.p-qtd').placeholder = t.p_qtd;
    item.querySelector('.p-sku').placeholder = t.p_sku;
    item.querySelector('.p-modelo').placeholder = t.p_modelo;
    item.querySelector('.p-tamanho').placeholder = t.p_tamanho;
    item.querySelector('.p-valor').placeholder = t.p_valor;
  });
});

const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
let painting = false;

function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function startPosition(e) {
  painting = true;
  const coords = getCoordinates(e);
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
  draw(e);
}

function finishedPosition() {
  painting = false;
  ctx.beginPath();
}

function draw(e) {
  if (!painting) return;
  e.preventDefault();
  const coords = getCoordinates(e);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0f172a';
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchstart', startPosition, { passive: false });
canvas.addEventListener('touchend', finishedPosition);
canvas.addEventListener('touchmove', draw, { passive: false });

document.getElementById('clear-sig-btn').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  hideError();
});

document.getElementById('add-product-btn').addEventListener('click', () => {
  const container = document.getElementById('products-list');
  const firstItem = container.firstElementChild;
  const clone = firstItem.cloneNode(true);

  clone.querySelectorAll('input').forEach(i => {
    if (i.type === 'checkbox') i.checked = false;
    else i.value = '';
  });

  container.appendChild(clone);
  
  const currentLang = document.getElementById('lang-select').value;
  const t = dict[currentLang];
  const lastItem = container.lastElementChild;
  lastItem.querySelector('.p-qtd').placeholder = t.p_qtd;
  lastItem.querySelector('.p-sku').placeholder = t.p_sku;
  lastItem.querySelector('.p-modelo').placeholder = t.p_modelo;
  lastItem.querySelector('.p-tamanho').placeholder = t.p_tamanho;
  lastItem.querySelector('.p-valor').placeholder = t.p_valor;
  lastItem.querySelector('.txt-consignment').innerText = t.consignment;
});

// SUBMISSÃO SEM DESCARREGAR PDF PARA O CLIENTE
document.getElementById('sale-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const currentLang = document.getElementById('lang-select').value;
  const t = dict[currentLang];

  if (!phoneInput || !phoneInput.isValidNumber()) {
    showError(t.errPhone);
    return;
  }

  const blankCanvas = document.createElement('canvas');
  blankCanvas.width = canvas.width;
  blankCanvas.height = canvas.height;
  if (canvas.toDataURL() === blankCanvas.toDataURL()) {
    showError(t.errSig);
    return;
  }

  const saleId = 'SALE-' + Math.floor(100000 + Math.random() * 900000);
  const dataURL = canvas.toDataURL('image/png');
  const blob = await (await fetch(dataURL)).blob();
  const fileName = `${saleId}.png`;

  const { error: uploadErr } = await sbClient.storage.from('assinaturas').upload(fileName, blob);
  if (uploadErr) {
    showError("Erro no upload da assinatura: " + uploadErr.message);
    return;
  }

  const sigUrl = `${SUPABASE_URL}/storage/v1/object/public/assinaturas/${fileName}`;

  const nome = document.getElementById('nome').value;
  const nif = document.getElementById('nif').value;
  const telefoneCompleto = phoneInput.getNumber();
  const email = document.getElementById('email').value;
  const morada = document.getElementById('morada').value;
  const paisSelecionado = $("#pais").val();
  const codigoPostal = document.getElementById('codigo_postal').value;
  const cidade = document.getElementById('cidade').value;
  const dataDeclaracao = document.getElementById('data-declaracao').value;

  const produtos = [];
  document.querySelectorAll('.product-item').forEach(item => {
    produtos.push({
      qtd: item.querySelector('.p-qtd').value,
      sku: item.querySelector('.p-sku').value,
      modelo: item.querySelector('.p-modelo').value,
      tamanho: item.querySelector('.p-tamanho').value,
      valor: item.querySelector('.p-valor').value,
      consignacao: item.querySelector('.p-consignacao').checked
    });
  });

  const { error: dbErr } = await sbClient.from('declaracoes').insert([{
    sale_id: saleId,
    nome: nome,
    nif: nif,
    telefone: telefoneCompleto,
    email: email,
    morada: morada,
    pais: paisSelecionado,
    codigo_postal: codigoPostal,
    cidade: cidade,
    data_declaracao: dataDeclaracao,
    produtos: produtos,
    assinatura_url: sigUrl
  }]);

  if (dbErr) {
    showError("Erro ao gravar na base de dados: " + dbErr.message);
    return;
  }

  alert(currentLang === 'pt' ? "Declaração submetida com sucesso!" : "Declaration successfully submitted!");
  location.reload();
});
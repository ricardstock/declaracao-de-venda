'use strict';
const SUPABASE_URL = 'https://pwvjitzyxqxvvpmkfnlo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dmppdHp5eHF4dnZwbWtmbmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDYxNTAsImV4cCI6MjEwNzI4MjE1MH0.ctDJAzTRlzyBtSlmP8XiXTJjEOKEIUAHVnD9h8xQuuA';
const form = document.getElementById('declaracao-form');
const alertBox = document.getElementById('form-alert');
function showMessage(message, success = false) {
  alertBox.textContent = message;
  alertBox.className = 'form-alert' + (success ? ' success' : '');
  alertBox.focus();
}
const sbClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
if (!sbClient) showMessage('Não foi possível carregar a ligação ao servidor. Atualize a página e verifique a ligação à Internet.');
const dateInput = document.getElementById('data_declaracao');
function todayInPortugal() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
dateInput.value = todayInPortugal();
const container = document.getElementById('produtos-container');
let productIndex = 0;
function criarLinhaProduto(removable = true) {
  const id = ++productIndex;
  const box = document.createElement('div');
  box.className = 'produto-box product-item';
  box.innerHTML = `<div class="product-row">
    <div><label class="field-label" for="qtd-${id}">Qtd. *</label><input id="
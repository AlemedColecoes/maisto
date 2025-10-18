
// Importa as funções do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { 
  getAuth, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Configuração do Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyAy4aWx-DO6pVeiCq37t-PcwMvr7lhRIzw",
    authDomain: "maisto-fresh-metal.firebaseapp.com",
    projectId: "maisto-fresh-metal",
    storageBucket: "maisto-fresh-metal.firebasestorage.app",
    messagingSenderId: "237854342909",
    appId: "1:237854342909:web:0bef57068b33194ab00894",
    measurementId: "G-35FH494LSF"
};

// --- Inicialização do Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// --- Referências do DOM ---
const itemList = document.getElementById('itemList');
const itemNameInput = document.getElementById('itemName');
const itemImageInput = document.getElementById('itemImage');
const itemBrandInput = document.getElementById('itemBrand');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');
const formTitle = document.getElementById('form-title');
const container = document.querySelector('.container');

let currentEditingId = null;

// --- Autenticação ---
onAuthStateChanged(auth, user => {
  if (user) {
    // Usuário está logado, mostra o painel
    container.style.display = 'block';
    loadItems();
  } else {
    // Usuário não está logado, esconde o painel e pede login
    container.style.display = 'none';
    alert('Você precisa estar logado para acessar o painel de controle.');
    window.location.href = 'index.html'; // Redireciona para a página principal
  }
});

// --- Funções ---

// Carrega os itens da coleção
const loadItems = () => {
  const itemsCollection = collection(db, 'cars');
  onSnapshot(itemsCollection, (snapshot) => {
    itemList.innerHTML = '<h2>Coleção Existente</h2>'; // Limpa a lista
    snapshot.forEach(doc => {
      const item = doc.data();
      const itemId = doc.id;
      
      const itemElement = document.createElement('div');
      itemElement.classList.add('item');
      itemElement.innerHTML = `
        <img src="${item.imageUrl}" alt="${item.name}">
        <span>${item.name}</span>
        <div class="item-actions">
          <button class="btn-edit" data-id="${itemId}">Editar</button>
          <button class="btn-delete" data-id="${itemId}">Excluir</button>
        </div>
      `;
      itemList.appendChild(itemElement);
    });

    // Adiciona os event listeners para os botões de editar e excluir
    addEventListeners();
  });
};

// Adiciona listeners para os botões de ação
const addEventListeners = () => {
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', handleEdit);
  });
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', handleDelete);
  });
};

// Lida com o clique no botão Salvar (Adicionar ou Atualizar)
saveButton.addEventListener('click', async () => {
  const name = itemNameInput.value.trim();
  const brand = itemBrandInput.value.trim() || 'geral';
  const file = itemImageInput.files[0];

  if (!name) {
    alert('Por favor, insira o nome da miniatura.');
    return;
  }

  // Se não estiver editando, o arquivo de imagem é obrigatório
  if (!currentEditingId && !file) {
    alert('Por favor, selecione uma imagem.');
    return;
  }
  
  saveButton.disabled = true;
  saveButton.textContent = 'Salvando...';

  try {
    let imageUrl = null;
    let imagePath = null;

    // Se uma nova imagem foi selecionada, faz o upload
    if (file) {
      imagePath = `${brand}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, imagePath);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    let docToSave;
    // Se estiver editando...
    if (currentEditingId) {
      docToSave = doc(db, 'cars', currentEditingId);
      const updatedData = { name };
      // Se uma nova imagem foi enviada, atualiza a URL e o caminho
      if (imageUrl) {
        updatedData.imageUrl = imageUrl;
        updatedData.imagePath = imagePath;
      }
       await setDoc(docToSave, updatedData, { merge: true });
    } else { // Se estiver adicionando...
      docToSave = doc(collection(db, 'cars'));
      await setDoc(docToSave, {
        id: docToSave.id,
        name: name,
        imageUrl: imageUrl,
        imagePath: imagePath,
        brand: brand
      });
    }

    resetForm();
    
  } catch (error) {
    console.error("Erro ao salvar: ", error);
    alert('Ocorreu um erro ao salvar. Tente novamente.');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Salvar';
  }
});


// Lida com o clique no botão Editar
const handleEdit = async (e) => {
  currentEditingId = e.target.dataset.id;
  const carDoc = doc(db, 'cars', currentEditingId);
  const carSnap = await getDocs(carDoc);

  // A forma de pegar o doc mudou um pouco, o ideal é usar `getDoc` (singular)
  // Mas como já temos o `onSnapshot`, vamos pegar da lista para simplificar.
  // Esta é uma maneira de contornar isso sem `getDoc`
  const itemsCollection = collection(db, 'cars');
  const snapshot = await getDocs(itemsCollection);
  const carData = snapshot.docs.find(d => d.id === currentEditingId).data();

  itemNameInput.value = carData.name;
  itemBrandInput.value = carData.brand || '';
  
  formTitle.textContent = 'Editar Miniatura';
  saveButton.textContent = 'Atualizar';
  cancelButton.style.display = 'inline-block';
  
  window.scrollTo(0, 0); // Rola a página para o topo
};

// Lida com o clique no botão Excluir
const handleDelete = async (e) => {
  const id = e.target.dataset.id;
  if (!confirm('Tem certeza que deseja excluir esta miniatura?')) {
    return;
  }

  try {
    const itemsCollection = collection(db, 'cars');
    const snapshot = await getDocs(itemsCollection);
    const carData = snapshot.docs.find(d => d.id === id).data();

    // 1. Excluir a imagem do Storage
    if (carData.imagePath) {
      const imageRef = ref(storage, carData.imagePath);
      await deleteObject(imageRef);
    }

    // 2. Excluir o documento do Firestore
    await deleteDoc(doc(db, 'cars', id));

  } catch (error) {
    console.error("Erro ao excluir: ", error);
    alert('Erro ao excluir. Tente novamente.');
  }
};

// Cancela a edição e reseta o formulário
cancelButton.addEventListener('click', resetForm);

function resetForm() {
  currentEditingId = null;
  itemNameInput.value = '';
  itemImageInput.value = '';
  itemBrandInput.value = '';
  
  formTitle.textContent = 'Adicionar Nova Miniatura';
  saveButton.textContent = 'Salvar';
  cancelButton.style.display = 'none';
}

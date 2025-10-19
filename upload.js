
// Importa as funções do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject 
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
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');

let currentEditingId = null;

// --- Autenticação ---
onAuthStateChanged(auth, user => {
  if (user) {
    container.style.display = 'block';
    loadItems();
  } else {
    container.style.display = 'none';
    alert('Você precisa estar logado para acessar o painel de controle.');
    window.location.href = 'index.html';
  }
});

// --- Funções ---

// Carrega os itens da coleção
const loadItems = () => {
  const itemsCollection = collection(db, 'cars');
  onSnapshot(itemsCollection, (snapshot) => {
    itemList.innerHTML = '<h2>Coleção Existente</h2>';
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
saveButton.addEventListener('click', () => {
  const name = itemNameInput.value.trim();
  const brand = itemBrandInput.value.trim() || 'geral';
  const file = itemImageInput.files[0];

  if (!name) {
    alert('Por favor, insira o nome da miniatura.');
    return;
  }

  if (!currentEditingId && !file) {
    alert('Por favor, selecione uma imagem.');
    return;
  }
  
  saveButton.disabled = true;
  saveButton.textContent = 'Salvando...';

  // Se um arquivo foi selecionado, faz o upload primeiro
  if (file) {
    const imagePath = `${brand}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, imagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Mostra a barra de progresso
    progressContainer.style.display = 'block';

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBar.style.width = progress + '%';
        progressBar.textContent = Math.round(progress) + '%';
      },
      (error) => {
        console.error("Erro no upload: ", error);
        alert('Ocorreu um erro ao enviar a imagem.');
        resetSaveButton();
      },
      async () => {
        // Upload concluído, pega a URL e salva o item
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
        saveItem(name, brand, imageUrl, imagePath);
      }
    );
  } else {
    // Se não há nova imagem, apenas salva os dados de texto
    saveItem(name, brand, null, null);
  }
});

// Função para salvar (ou atualizar) o item no Firestore
const saveItem = async (name, brand, imageUrl, imagePath) => {
  try {
    if (currentEditingId) {
      // Atualizando item existente
      const docRef = doc(db, 'cars', currentEditingId);
      const updatedData = { name, brand };
      if (imageUrl) {
        updatedData.imageUrl = imageUrl;
        updatedData.imagePath = imagePath;
      }
      await setDoc(docRef, updatedData, { merge: true });
    } else {
      // Adicionando novo item
      const docRef = doc(collection(db, 'cars'));
      await setDoc(docRef, {
        id: docRef.id,
        name: name,
        brand: brand,
        imageUrl: imageUrl,
        imagePath: imagePath,
      });
    }
    resetForm();
  } catch (error) {
    console.error("Erro ao salvar no Firestore: ", error);
    alert('Ocorreu um erro ao salvar os dados.');
  } finally {
    resetSaveButton();
  }
}

// Lida com o clique no botão Editar
const handleEdit = async (e) => {
  currentEditingId = e.target.dataset.id;
  const itemsCollection = collection(db, 'cars');
  const snapshot = await getDocs(itemsCollection);
  const carData = snapshot.docs.find(d => d.id === currentEditingId).data();

  itemNameInput.value = carData.name;
  itemBrandInput.value = carData.brand || '';
  
  formTitle.textContent = 'Editar Miniatura';
  saveButton.textContent = 'Atualizar';
  cancelButton.style.display = 'inline-block';
  window.scrollTo(0, 0);
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

    if (carData.imagePath) {
      const imageRef = ref(storage, carData.imagePath);
      await deleteObject(imageRef);
    }
    await deleteDoc(doc(db, 'cars', id));

  } catch (error) {
    console.error("Erro ao excluir: ", error);
    alert('Erro ao excluir. Tente novamente.');
  }
};

// Reseta o estado do botão de salvar
function resetSaveButton() {
  saveButton.disabled = false;
  saveButton.textContent = 'Salvar';
  progressContainer.style.display = 'none';
  progressBar.style.width = '0%';
  progressBar.textContent = '';
}

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
  resetSaveButton();
}
